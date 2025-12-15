import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3001;

// Fichier d'exclusions
// Utiliser /tmp/ sur Vercel (lecture seule sinon), __dirname en local
const EXCLUSIONS_FILE = process.env.VERCEL
    ? '/tmp/exclusions.json'
    : path.join(__dirname, 'exclusions.json');

// Charger les exclusions
function loadExclusions(): string[] {
    try {
        if (fs.existsSync(EXCLUSIONS_FILE)) {
            const data = JSON.parse(fs.readFileSync(EXCLUSIONS_FILE, 'utf-8'));
            return data.exclusions || [];
        }
    } catch (error) {
        console.error('Erreur chargement exclusions:', error);
    }
    return [];
}

// Sauvegarder les exclusions
function saveExclusions(exclusions: string[]) {
    const data = {
        version: '1.0',
        date_modification: new Date().toISOString(),
        count: exclusions.length,
        exclusions: exclusions
    };
    fs.writeFileSync(EXCLUSIONS_FILE, JSON.stringify(data, null, 2));
}

// Extraire le pattern commun d'une transaction
function extractPattern(details: string): string {
    let pattern = details;

    // Retirer préfixes avec dates variables
    pattern = pattern.replace(/^ACHAT EN LIGNE \d+[A-Z]+\d+\s*/gi, '');
    pattern = pattern.replace(/^PAIEM PERIODIQ \d+[A-Z]+\d+\s*/gi, '');
    pattern = pattern.replace(/^VIR INTERAC (ENVOYE|RECU|DEP AUTO REC) /gi, '');
    pattern = pattern.replace(/^VIR INTERAC ANNULE /gi, '');

    // Electronic Funds Transfer avec ou sans numéro
    pattern = pattern.replace(/^Electronic Funds Transfer (PAY|DEPOSIT) \d+\s+/gi, '');
    pattern = pattern.replace(/^Electronic Funds Transfer PREAUTHORIZED DEBIT\s+/gi, '');

    pattern = pattern.replace(/^Internet Banking (E-TRANSFER|FULFILL REQUEST|INTERNET BILL PAY) \d+\s+/gi, '');
    pattern = pattern.replace(/^Point of Sale - (INTERAC|Visa Debit) (RETAIL PURCHASE|VISA DEBIT RETAIL PURCH)\s*\d*\s*/gi, '');
    pattern = pattern.replace(/^TransfersInterac e-Transfer (to|from) \//gi, '');
    pattern = pattern.replace(/^SalaryPayroll \//gi, '');

    // Retirer codes numériques en fin (type: 2025343165329 ou 20253440610RUKR)
    pattern = pattern.replace(/\s*\d{10,}[A-Z]*$/gi, '');
    pattern = pattern.replace(/\s*\d{4,}[A-Z]{3,}$/gi, '');
    pattern = pattern.replace(/\s*\d{8,}$/gi, '');

    // Retirer slashes en fin
    pattern = pattern.replace(/\/$/g, '');
    pattern = pattern.replace(/\s+$/g, '');

    // Trim
    pattern = pattern.trim();

    // Si le pattern est trop court (< 5 caractères), garder l'original
    if (pattern.length < 5) {
        return details;
    }

    console.log(`📝 Pattern extraction:`);
    console.log(`   Original: ${details}`);
    console.log(`   Pattern:  ${pattern}`);

    return pattern;
}

// Configuration
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuration Multer pour l'upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ============================================================
// INTERFACES
// ============================================================

interface Transaction {
    date: string;
    details: string;
    category: string;
    credit: string;
    debit: string;
    flags?: string[];
    balance: string;
}

interface Account {
    bank: string;
    institution: string;
    type: string;
    account: string;
    transit: string;
    current_balance: string;
    transactions: Transaction[];
    statistics: any;
}

interface InveriteData {
    name: string;
    referenceid: string;
    request: string;
    status: string;
    type: string;
    complete_datetime: string;
    accounts: Account[];
}

// ============================================================
// ANALYSE DU JSON INVERITE
// ============================================================

function isExcluded(details: string, exclusions: string[]): boolean {
    const detailsLower = details.toLowerCase();
    return exclusions.some(excl => detailsLower.includes(excl.toLowerCase()));
}

function analyseInverite(data: InveriteData, exclusions: string[] = []) {
    const allAccounts = data.accounts;

    // Créer une map des transactions avec leur compte associé
    const transactionsAvecCompte: Array<Transaction & { compteInfo: { numero: number; type: string; institution: string; account: string; transit: string; banque: string } }> = [];
    allAccounts.forEach((account, idx) => {
        account.transactions.forEach(transaction => {
            transactionsAvecCompte.push({
                ...transaction,
                compteInfo: {
                    numero: idx + 1,
                    type: account.type,
                    institution: account.institution,
                    account: account.account,
                    transit: account.transit,
                    banque: account.bank
                }
            });
        });
    });

    const allTransactions = allAccounts.flatMap(account => account.transactions);

    // Dates de référence
    const all_dates = allTransactions.map(t => t.date).filter(d => d);
    const latest_date = new Date(Math.max(...all_dates.map(d => new Date(d).getTime())));
    const date_30_ago = new Date(latest_date);
    date_30_ago.setDate(date_30_ago.getDate() - 30);
    const date_90_ago = new Date(latest_date);
    date_90_ago.setDate(date_90_ago.getDate() - 90);

    // SECTION 1: Identité
    const identite = {
        nom: data.name,
        reference_id: data.referenceid,
        statut: data.status,
        date_verification: data.complete_datetime,
        nombre_comptes: allAccounts.length
    };

    // SECTION 2: Comptes bancaires
    const comptes = allAccounts.map((account, idx) => {
        const stats = account.statistics;
        return {
            numero: idx + 1,
            type: account.type,
            banque: account.bank,
            institution: account.institution,
            numero_compte: account.account,
            transit: account.transit,
            balance_actuelle: parseFloat(account.current_balance),
            balance_moyenne_30j: parseFloat(stats.mean_closing_balance_30 || '0'),
            balance_moyenne_90j: parseFloat(stats.mean_closing_balance_90 || '0'),
            jours_historique: parseInt(stats.days_of_history || '0')
        };
    });

    const balance_totale = comptes.reduce((sum, c) => sum + c.balance_actuelle, 0);

    // SECTION 3: Revenus
    const payrollTransactions = allTransactions.filter(t => t.flags?.includes('is_payroll'));
    const payrollAvecCompte = transactionsAvecCompte.filter(t => t.flags?.includes('is_payroll'));

    let nom_employeur = 'Aucune paie trouvée';
    if (payrollTransactions.length > 0) {
        const firstPayroll = payrollTransactions[0];
        const ligne = firstPayroll.details;
        if (ligne.includes('Payroll /')) {
            nom_employeur = ligne.split('Payroll /')[1];
        } else if (ligne.includes('PAY ')) {
            const parts = ligne.split(' ');
            const index = parts.indexOf('PAY');
            nom_employeur = parts.slice(index + 3).join(' ');
        } else if (ligne.includes('DEPOSIT ')) {
            const parts = ligne.split(' ');
            const index = parts.indexOf('DEPOSIT');
            nom_employeur = parts.slice(index + 2).join(' ');
        } else {
            nom_employeur = ligne;
        }
    }

    const nombre_paies_90j = payrollTransactions.length;

    let revenu_moyen_par_paie = 0;
    if (payrollTransactions.length > 0) {
        const total = payrollTransactions.reduce((sum, t) => sum + parseFloat(t.credit || '0'), 0);
        revenu_moyen_par_paie = total / payrollTransactions.length;
    }

    // Les 4 dernières paies avec information du compte
    const dernieres_paies = payrollAvecCompte
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4)
        .map(t => ({
            date: t.date,
            montant: parseFloat(t.credit || '0'),
            compte_numero: t.compteInfo.numero,
            compte_type: t.compteInfo.type,
            compte_institution: t.compteInfo.institution,
            compte_account: t.compteInfo.account,
            compte_transit: t.compteInfo.transit,
            compte_banque: t.compteInfo.banque
        }));

    // SECTION 4: Dépenses
    const debits_30 = allTransactions.filter(t => {
        return t.debit && t.debit !== '' && new Date(t.date) >= date_30_ago;
    });

    const debits_30_avec_compte = transactionsAvecCompte.filter(t => {
        return t.debit && t.debit !== '' && new Date(t.date) >= date_30_ago;
    });

    const debits_90 = allTransactions.filter(t => {
        return t.debit && t.debit !== '' && new Date(t.date) >= date_90_ago;
    });

    const ESSENTIELLES = ['food_and_dining/groceries', 'bills_and_utilities',
                          'auto_and_transport', 'insurance', 'health_and_fitness'];

    const NON_ESSENTIELLES = ['entertainment', 'food_and_dining/cafes_and_restaurants',
                              'shopping', 'travel'];

    const essentielles_30 = debits_30.filter(t => {
        const cat = t.category || '';
        return ESSENTIELLES.some(ess => cat.includes(ess));
    });
    const total_essentielles_30 = essentielles_30.reduce((sum, t) => sum + parseFloat(t.debit || '0'), 0);

    // Top 5 dépenses essentielles avec info compte
    const top_essentielles = debits_30_avec_compte
        .filter(t => {
            const cat = t.category || '';
            return ESSENTIELLES.some(ess => cat.includes(ess));
        })
        .sort((a, b) => parseFloat(b.debit || '0') - parseFloat(a.debit || '0'))
        .slice(0, 5)
        .map(t => ({
            date: t.date,
            montant: parseFloat(t.debit || '0'),
            details: t.details,
            category: t.category,
            compte_numero: t.compteInfo.numero,
            compte_type: t.compteInfo.type,
            compte_institution: t.compteInfo.institution,
            compte_account: t.compteInfo.account,
            compte_transit: t.compteInfo.transit,
            compte_banque: t.compteInfo.banque
        }));

    const essentielles_90 = debits_90.filter(t => {
        const cat = t.category || '';
        return ESSENTIELLES.some(ess => cat.includes(ess));
    });
    const total_essentielles_90 = essentielles_90.reduce((sum, t) => sum + parseFloat(t.debit || '0'), 0);

    const non_essentielles_30 = debits_30.filter(t => {
        const cat = t.category || '';
        return NON_ESSENTIELLES.some(non_ess => cat.includes(non_ess));
    });
    const total_non_essentielles_30 = non_essentielles_30.reduce((sum, t) => sum + parseFloat(t.debit || '0'), 0);

    // Top 5 dépenses non-essentielles avec info compte
    const top_non_essentielles = debits_30_avec_compte
        .filter(t => {
            const cat = t.category || '';
            return NON_ESSENTIELLES.some(non_ess => cat.includes(non_ess));
        })
        .sort((a, b) => parseFloat(b.debit || '0') - parseFloat(a.debit || '0'))
        .slice(0, 5)
        .map(t => ({
            date: t.date,
            montant: parseFloat(t.debit || '0'),
            details: t.details,
            category: t.category,
            compte_numero: t.compteInfo.numero,
            compte_type: t.compteInfo.type,
            compte_institution: t.compteInfo.institution,
            compte_account: t.compteInfo.account,
            compte_transit: t.compteInfo.transit,
            compte_banque: t.compteInfo.banque
        }));

    const non_essentielles_90 = debits_90.filter(t => {
        const cat = t.category || '';
        return NON_ESSENTIELLES.some(non_ess => cat.includes(non_ess));
    });
    const total_non_essentielles_90 = non_essentielles_90.reduce((sum, t) => sum + parseFloat(t.debit || '0'), 0);

    // SECTION 5: Gambling
    const gambling_transactions_avec_compte = debits_30_avec_compte
        .filter(t => {
            const cat = t.category || '';
            return cat.includes('gambling');
        })
        .map(t => ({
            date: t.date,
            montant: parseFloat(t.debit || '0'),
            details: t.details,
            compte_numero: t.compteInfo.numero,
            compte_type: t.compteInfo.type,
            compte_institution: t.compteInfo.institution,
            compte_account: t.compteInfo.account,
            compte_transit: t.compteInfo.transit,
            compte_banque: t.compteInfo.banque
        }));
    const total_gambling = gambling_transactions_avec_compte.reduce((sum, t) => sum + t.montant, 0);

    // SECTION 6: NSF
    const transactions_90_avec_compte = transactionsAvecCompte.filter(t => new Date(t.date) >= date_90_ago);
    const nsf_transactions_avec_compte = transactions_90_avec_compte
        .filter(t => {
            if (t.category !== 'fees_and_charges/provider_fee/penalty/nsf') {
                return false;
            }
            return true;
        })
        .map(t => ({
            date: t.date,
            frais: parseFloat(t.debit || '0'),
            details: t.details,
            compte_numero: t.compteInfo.numero,
            compte_type: t.compteInfo.type,
            compte_institution: t.compteInfo.institution,
            compte_account: t.compteInfo.account,
            compte_transit: t.compteInfo.transit,
            compte_banque: t.compteInfo.banque
        }));
    const nsf_count = nsf_transactions_avec_compte.length;
    const nsf_total = nsf_transactions_avec_compte.reduce((sum, t) => sum + t.frais, 0);

    // SECTION 7: Prêteurs
    const PRETEURS_CONNUS = [
        'zum rails', 'zumrail', 'vopay', 'money mart', 'cash money',
        'prêt rapide', 'pret rapide', 'pret olympique', 'gmf', 'avenawise',
        'gestion kronos', 'gestion prp', 'gestion k2', 'gestion',
        'credit secours', 'alterfina', 'mdg', 'koho', 'klarna',
        'neo capital', 'donovan finance', 'credit yamaska', 'scotiabank auto loan',
        'freedomrepair', 'oxbridge', 'credit resources', 'easyfinancial',
        'fairstone', 'cash store', 'money direct', 'progressive', 'rifco'
    ];

    const preteurs_transactions = transactions_90_avec_compte.filter(t => {
        // Vérifier si la transaction est exclue
        if (isExcluded(t.details, exclusions)) {
            return false;
        }

        const details = t.details.toLowerCase();
        const category = (t.category || '').toLowerCase();
        return PRETEURS_CONNUS.some(p => details.includes(p)) || category.includes('loan');
    });

    // Séparer les paiements et les reçus
    const preteurs_paiements = preteurs_transactions
        .filter(t => t.debit && t.debit !== '')
        .map(t => ({
            date: t.date,
            montant: parseFloat(t.debit || '0'),
            details: t.details,
            type: 'Paiement',
            compte_numero: t.compteInfo.numero,
            compte_type: t.compteInfo.type,
            compte_institution: t.compteInfo.institution,
            compte_account: t.compteInfo.account,
            compte_transit: t.compteInfo.transit,
            compte_banque: t.compteInfo.banque
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const preteurs_recus = preteurs_transactions
        .filter(t => t.credit && t.credit !== '')
        .map(t => ({
            date: t.date,
            montant: parseFloat(t.credit || '0'),
            details: t.details,
            type: 'Reçu',
            compte_numero: t.compteInfo.numero,
            compte_type: t.compteInfo.type,
            compte_institution: t.compteInfo.institution,
            compte_account: t.compteInfo.account,
            compte_transit: t.compteInfo.transit,
            compte_banque: t.compteInfo.banque
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total_preteurs_paiements = preteurs_paiements.reduce((sum, t) => sum + t.montant, 0);
    const total_preteurs_recus = preteurs_recus.reduce((sum, t) => sum + t.montant, 0);

    // SECTION 8: Catégories de dépenses par période (30 et 90 jours)
    const categoriesMap: { [key: string]: { libelle: string; icone: string; type: 'essentielle' | 'non-essentielle' | 'autre' } } = {
        'bills_and_utilities': { libelle: 'Factures & Services publics', icone: '⚡', type: 'essentielle' },
        'auto_and_transport': { libelle: 'Transport & Automobile', icone: '🚗', type: 'essentielle' },
        'insurance': { libelle: 'Assurances', icone: '🛡️', type: 'essentielle' },
        'health_and_fitness': { libelle: 'Santé & Fitness', icone: '💪', type: 'essentielle' },
        'food_and_dining': { libelle: 'Alimentation & Restaurants', icone: '🍔', type: 'essentielle' },
        'home': { libelle: 'Maison', icone: '🏠', type: 'essentielle' },
        'entertainment': { libelle: 'Divertissement', icone: '🎬', type: 'non-essentielle' },
        'shopping': { libelle: 'Achats', icone: '🛍️', type: 'non-essentielle' },
        'travel': { libelle: 'Voyages', icone: '✈️', type: 'non-essentielle' },
        'business_services': { libelle: 'Services professionnels', icone: '💼', type: 'autre' },
        'fees_and_charges': { libelle: 'Frais bancaires', icone: '💳', type: 'autre' },
        'transfer': { libelle: 'Transferts', icone: '💸', type: 'autre' },
        'education': { libelle: 'Éducation', icone: '📚', type: 'autre' },
        'income': { libelle: 'Revenus', icone: '💰', type: 'autre' },
        'gambling': { libelle: 'Gambling', icone: '🎰', type: 'autre' }
    };

    // Calculer les totaux par catégorie pour 30 et 90 jours
    const categories_depenses: Array<{
        nom: string;
        libelle: string;
        icone: string;
        type: 'essentielle' | 'non-essentielle' | 'autre';
        total_30j: number;
        total_90j: number;
    }> = [];

    // Parcourir toutes les transactions et les grouper par catégorie
    const transactions_30 = allTransactions.filter(t => new Date(t.date) >= date_30_ago);
    const transactions_90 = allTransactions.filter(t => new Date(t.date) >= date_90_ago);

    Object.keys(categoriesMap).forEach(catKey => {
        // Filtrer les transactions de cette catégorie (débits seulement pour les dépenses)
        const trans_30_cat = transactions_30.filter(t => {
            const category = t.category || '';
            return category.toLowerCase().includes(catKey.replace(/_/g, '_').toLowerCase()) && t.debit && t.debit !== '';
        });

        const trans_90_cat = transactions_90.filter(t => {
            const category = t.category || '';
            return category.toLowerCase().includes(catKey.replace(/_/g, '_').toLowerCase()) && t.debit && t.debit !== '';
        });

        const total_30j = trans_30_cat.reduce((sum, t) => sum + parseFloat(t.debit || '0'), 0);
        const total_90j = trans_90_cat.reduce((sum, t) => sum + parseFloat(t.debit || '0'), 0);

        if (total_30j > 0 || total_90j > 0) {
            categories_depenses.push({
                nom: catKey,
                libelle: categoriesMap[catKey].libelle,
                icone: categoriesMap[catKey].icone,
                type: categoriesMap[catKey].type,
                total_30j,
                total_90j
            });
        }
    });

    // Trier par total 30 jours (dépenses les plus récentes en premier)
    categories_depenses.sort((a, b) => b.total_30j - a.total_30j);

    // SECTION 9: Toutes les transactions groupées par catégorie
    const transactionsParCategorie: { [key: string]: any[] } = {};

    transactionsAvecCompte.forEach(transaction => {
        const category = transaction.category || 'non_classifie';

        // Extraire la catégorie principale (avant le "/")
        const mainCategory = category.split('/')[0];

        if (!transactionsParCategorie[mainCategory]) {
            transactionsParCategorie[mainCategory] = [];
        }

        transactionsParCategorie[mainCategory].push({
            date: transaction.date,
            details: transaction.details,
            category: transaction.category,
            debit: transaction.debit,
            credit: transaction.credit,
            balance: transaction.balance,
            compte_numero: transaction.compteInfo.numero,
            compte_type: transaction.compteInfo.type,
            compte_banque: transaction.compteInfo.banque,
            compte_institution: transaction.compteInfo.institution,
            compte_account: transaction.compteInfo.account,
            compte_transit: transaction.compteInfo.transit
        });
    });

    // Trier les transactions par date (plus récentes en premier) dans chaque catégorie
    Object.keys(transactionsParCategorie).forEach(cat => {
        transactionsParCategorie[cat].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return {
        identite,
        comptes,
        balance_totale,
        revenus: {
            nom_employeur,
            nombre_paies_90j,
            revenu_moyen_par_paie,
            dernieres_paies
        },
        depenses: {
            total_essentielles_30,
            total_essentielles_90,
            moyenne_mensuelle_essentielles: total_essentielles_90 / 3,
            top_essentielles,
            total_non_essentielles_30,
            total_non_essentielles_90,
            moyenne_mensuelle_non_essentielles: total_non_essentielles_90 / 3,
            top_non_essentielles
        },
        gambling: {
            transactions: gambling_transactions_avec_compte,
            count: gambling_transactions_avec_compte.length,
            total: total_gambling
        },
        nsf: {
            transactions: nsf_transactions_avec_compte,
            count: nsf_count,
            total: nsf_total
        },
        preteurs: {
            paiements: preteurs_paiements,
            recus: preteurs_recus,
            total_paiements: total_preteurs_paiements,
            total_recus: total_preteurs_recus,
            count_total: preteurs_transactions.length
        },
        categories: categories_depenses,
        toutes_transactions: transactionsParCategorie
    };
}

// ============================================================
// GÉNÉRATION DU RAPPORT HTML SIMPLE
// ============================================================

function genererRapportSimple(analyse: any, serverURL: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Inverite - ${analyse.identite.nom}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            background: white;
            padding: 40px;
            line-height: 1.6;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 30px;
            color: #000;
        }
        .section {
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #000;
        }
        .section:last-child {
            border-bottom: none;
        }
        .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #000;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            padding: 10px 15px;
            border-bottom: 1px solid #e0e0e0;
            background: #fafafa;
            margin: 2px 0;
            border-radius: 4px;
        }
        .metric-label {
            font-weight: 600;
            color: #333;
            flex: 1;
        }
        .metric-value {
            color: #000;
            font-weight: 500;
            text-align: right;
        }
        .grid-2col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .grid-3col {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .card {
            background: #fafafa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        .card-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #667eea;
            font-size: 14px;
        }
        .card-value {
            font-size: 24px;
            font-weight: bold;
            color: #000;
        }
        .card-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        .compte-item {
            margin: 15px 0;
            padding: 15px;
            background: #f9f9f9;
            border-left: 3px solid #000;
        }
        .alert-red {
            color: #d32f2f;
            font-weight: bold;
        }
        .alert-green {
            color: #388e3c;
            font-weight: bold;
        }
        .paie-item {
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        .back-button {
            display: inline-block;
            margin-top: 30px;
            padding: 10px 20px;
            background: #000;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
        .back-button:hover {
            background: #333;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Rapport d'Analyse Inverite</h1>

        <!-- SECTION 1: IDENTITÉ -->
        <div class="section">
            <div class="section-title">1. IDENTITÉ DU CLIENT</div>
            <div class="grid-2col">
                <div class="card">
                    <div class="card-title">Nom complet</div>
                    <div class="card-value" style="font-size: 18px;">${analyse.identite.nom}</div>
                </div>
                <div class="card">
                    <div class="card-title">ID de référence</div>
                    <div class="card-value" style="font-size: 18px;">${analyse.identite.reference_id}</div>
                </div>
                <div class="card">
                    <div class="card-title">Statut</div>
                    <div class="card-value" style="font-size: 18px; color: #388e3c;">✅ ${analyse.identite.statut}</div>
                </div>
                <div class="card">
                    <div class="card-title">Nombre de comptes</div>
                    <div class="card-value" style="color: ${analyse.identite.nombre_comptes > 1 ? '#667eea' : '#666'};">${analyse.identite.nombre_comptes}</div>
                </div>
            </div>
            <div style="text-align: center; padding: 10px; background: #f0f0f0; border-radius: 5px; margin-top: 10px;">
                <small style="color: #666;">Date de vérification: ${analyse.identite.date_verification}</small>
            </div>
        </div>

        <!-- SECTION 2: COMPTES BANCAIRES -->
        <div class="section">
            <div class="section-title">2. COMPTES BANCAIRES (${analyse.comptes.length} compte${analyse.comptes.length > 1 ? 's' : ''})</div>
            ${analyse.comptes.map((compte: any, index: number) => `
                <div class="compte-item">
                    <h3 style="margin: 0 0 15px 0; padding: 10px; background: #000; color: white; font-size: 16px;">
                        ⚫ COMPTE ${compte.numero} sur ${analyse.comptes.length} - ${compte.type}
                    </h3>
                    <div class="metric">
                        <span class="metric-label">Type de compte:</span>
                        <span class="metric-value">${compte.type}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Banque:</span>
                        <span class="metric-value">${compte.banque} (${compte.institution})</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Numéro de compte:</span>
                        <span class="metric-value">${compte.numero_compte}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Transit:</span>
                        <span class="metric-value">${compte.transit}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Balance actuelle:</span>
                        <span class="metric-value ${compte.balance_actuelle < 50 ? 'alert-red' : 'alert-green'}">
                            ${compte.balance_actuelle.toFixed(2)}$
                        </span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Balance moyenne (30 jours):</span>
                        <span class="metric-value">${compte.balance_moyenne_30j.toFixed(2)}$</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Balance moyenne (90 jours):</span>
                        <span class="metric-value">${compte.balance_moyenne_90j.toFixed(2)}$</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Jours d'historique:</span>
                        <span class="metric-value">${compte.jours_historique} jours</span>
                    </div>
                </div>
            `).join('')}
            <div class="metric" style="margin-top: 20px; font-size: 18px;">
                <span class="metric-label">BALANCE TOTALE (tous comptes):</span>
                <span class="metric-value ${analyse.balance_totale < 100 ? 'alert-red' : 'alert-green'}">
                    ${analyse.balance_totale.toFixed(2)}$
                </span>
            </div>
        </div>

        <!-- SECTION 3: REVENUS -->
        <div class="section">
            <div class="section-title">3. REVENUS DE L'EMPLOYEUR</div>

            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #388e3c;">
                <strong style="font-size: 16px; color: #2e7d32;">👔 Employeur:</strong>
                <div style="font-size: 18px; font-weight: bold; margin-top: 5px;">${analyse.revenus.nom_employeur}</div>
            </div>

            <div class="grid-3col">
                <div class="card">
                    <div class="card-title">Nombre de paies (90j)</div>
                    <div class="card-value">${analyse.revenus.nombre_paies_90j}</div>
                    <div class="card-label">paies détectées</div>
                </div>
                <div class="card">
                    <div class="card-title">Revenu moyen par paie</div>
                    <div class="card-value" style="color: #388e3c;">${analyse.revenus.revenu_moyen_par_paie.toFixed(2)}$</div>
                    <div class="card-label">par paie</div>
                </div>
                <div class="card">
                    <div class="card-title">Estimation mensuelle</div>
                    <div class="card-value" style="color: #388e3c;">~${(analyse.revenus.revenu_moyen_par_paie * 2.17).toFixed(0)}$</div>
                    <div class="card-label">si bi-hebdo</div>
                </div>
            </div>

            <div style="margin-top: 25px;">
                <strong style="font-size: 16px; display: block; margin-bottom: 10px;">
                    💰 LES 4 DERNIÈRES PAIES:
                </strong>
                ${analyse.revenus.dernieres_paies.length === 0 ?
                    '<p>Aucune paie trouvée</p>' :
                    `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        ${analyse.revenus.dernieres_paies.map((paie: any, index: number) => `
                            <div style="padding: 12px; background: #e8f5e9; border-left: 4px solid #388e3c; border-radius: 4px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <strong style="color: #2e7d32;">Paie #${index + 1}</strong>
                                    <strong style="color: #2e7d32; font-size: 16px;">${paie.montant.toFixed(2)}$</strong>
                                </div>
                                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                                    📅 ${paie.date}
                                </div>
                                <div style="font-size: 11px; color: #555; margin-top: 5px; padding-top: 5px; border-top: 1px solid #c8e6c9;">
                                    📂 Compte ${paie.compte_numero} - ${paie.compte_type}
                                </div>
                                <div style="font-size: 10px; color: #666; margin-top: 3px;">
                                    🏦 ${paie.compte_banque} (${paie.compte_institution})
                                </div>
                                <div style="font-size: 10px; color: #666;">
                                    No: ${paie.compte_account} | Transit: ${paie.compte_transit}
                                </div>
                            </div>
                        `).join('')}
                    </div>`
                }
            </div>
        </div>

        <!-- SECTION 4: DÉPENSES -->
        <div class="section">
            <div class="section-title">4. DÉPENSES (30 et 90 JOURS)</div>

            <!-- Tableau des totaux -->
            <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">
                <thead>
                    <tr style="background: #f5f5f5; border-bottom: 2px solid #333;">
                        <th style="padding: 12px; text-align: left; font-size: 14px; font-weight: bold; color: #333; border-right: 1px solid #e0e0e0;">
                            TYPE DE DÉPENSE
                        </th>
                        <th style="padding: 12px; text-align: right; font-size: 14px; font-weight: bold; color: #333; border-right: 1px solid #e0e0e0;">
                            30 DERNIERS JOURS
                        </th>
                        <th style="padding: 12px; text-align: right; font-size: 14px; font-weight: bold; color: #333;">
                            90 DERNIERS JOURS
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background: #fff3e0; border-bottom: 1px solid #ffe0b2;">
                        <td style="padding: 15px; font-size: 16px; color: #e65100; border-right: 1px solid #ffe0b2;">
                            <strong>📊 ESSENTIELLES</strong>
                        </td>
                        <td style="padding: 15px; text-align: right; font-size: 18px; font-weight: bold; color: #f57c00; border-right: 1px solid #ffe0b2;">
                            ${analyse.depenses.total_essentielles_30.toFixed(2)}$
                        </td>
                        <td style="padding: 15px; text-align: right; font-size: 18px; font-weight: bold; color: #f57c00;">
                            ${analyse.depenses.total_essentielles_90.toFixed(2)}$
                        </td>
                    </tr>
                    <tr style="background: white; border-bottom: 1px solid #e0e0e0;">
                        <td style="padding: 8px 15px; font-size: 12px; color: #666; border-right: 1px solid #e0e0e0;">
                            Moyenne mensuelle
                        </td>
                        <td style="padding: 8px 15px; text-align: right; font-size: 13px; color: #666; border-right: 1px solid #e0e0e0;">
                            ${analyse.depenses.moyenne_mensuelle_essentielles.toFixed(2)}$/mois
                        </td>
                        <td style="padding: 8px 15px; text-align: right; font-size: 13px; color: #666;">
                            ${analyse.depenses.moyenne_mensuelle_essentielles.toFixed(2)}$/mois
                        </td>
                    </tr>

                    <tr style="background: #e3f2fd; border-bottom: 1px solid #bbdefb;">
                        <td style="padding: 15px; font-size: 16px; color: #0d47a1; border-right: 1px solid #bbdefb;">
                            <strong>🛍️ NON-ESSENTIELLES</strong>
                        </td>
                        <td style="padding: 15px; text-align: right; font-size: 18px; font-weight: bold; color: #1976d2; border-right: 1px solid #bbdefb;">
                            ${analyse.depenses.total_non_essentielles_30.toFixed(2)}$
                        </td>
                        <td style="padding: 15px; text-align: right; font-size: 18px; font-weight: bold; color: #1976d2;">
                            ${analyse.depenses.total_non_essentielles_90.toFixed(2)}$
                        </td>
                    </tr>
                    <tr style="background: white; border-bottom: 2px solid #333;">
                        <td style="padding: 8px 15px; font-size: 12px; color: #666; border-right: 1px solid #e0e0e0;">
                            Moyenne mensuelle
                        </td>
                        <td style="padding: 8px 15px; text-align: right; font-size: 13px; color: #666; border-right: 1px solid #e0e0e0;">
                            ${analyse.depenses.moyenne_mensuelle_non_essentielles.toFixed(2)}$/mois
                        </td>
                        <td style="padding: 8px 15px; text-align: right; font-size: 13px; color: #666;">
                            ${analyse.depenses.moyenne_mensuelle_non_essentielles.toFixed(2)}$/mois
                        </td>
                    </tr>

                    <!-- TOTAL GÉNÉRAL -->
                    <tr style="background: #333; color: white; font-weight: bold;">
                        <td style="padding: 15px; font-size: 16px;">
                            💰 TOTAL GÉNÉRAL
                        </td>
                        <td style="padding: 15px; text-align: right; font-size: 20px;">
                            ${(analyse.depenses.total_essentielles_30 + analyse.depenses.total_non_essentielles_30).toFixed(2)}$
                        </td>
                        <td style="padding: 15px; text-align: right; font-size: 20px;">
                            ${(analyse.depenses.total_essentielles_90 + analyse.depenses.total_non_essentielles_90).toFixed(2)}$
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- SECTION 4B: CATÉGORIES DE DÉPENSES -->
        <div class="section">
            <div class="section-title">4B. CATÉGORIES DE DÉPENSES PAR PÉRIODE</div>

            ${analyse.categories && analyse.categories.length > 0 ? `
                <!-- DÉPENSES ESSENTIELLES -->
                <div style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; padding: 12px; background: #fff3e0; border-left: 5px solid #f57c00; font-size: 18px; color: #e65100;">
                        🏪 DÉPENSES ESSENTIELLES
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <thead>
                            <tr style="background: #fff3e0; border-bottom: 2px solid #f57c00;">
                                <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: bold; color: #e65100; border-right: 1px solid #ffe0b2;">
                                    CATÉGORIE
                                </th>
                                <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: bold; color: #e65100; border-right: 1px solid #ffe0b2;">
                                    30 DERNIERS JOURS
                                </th>
                                <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: bold; color: #e65100;">
                                    90 DERNIERS JOURS
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${analyse.categories.filter((c: any) => c.type === 'essentielle').map((cat: any, index: number) => {
                                const rowBg = index % 2 === 0 ? '#fffaf0' : 'white';
                                return `
                                    <tr style="background: ${rowBg}; border-bottom: 1px solid #ffe0b2;">
                                        <td style="padding: 12px; font-size: 14px; color: #333; border-right: 1px solid #ffe0b2;">
                                            <strong>${cat.icone} ${cat.libelle}</strong>
                                        </td>
                                        <td style="padding: 12px; text-align: right; font-size: 15px; font-weight: bold; color: ${cat.total_30j > 0 ? '#d32f2f' : '#999'}; border-right: 1px solid #ffe0b2;">
                                            ${cat.total_30j > 0 ? cat.total_30j.toFixed(2) + '$' : '-'}
                                        </td>
                                        <td style="padding: 12px; text-align: right; font-size: 15px; font-weight: bold; color: ${cat.total_90j > 0 ? '#d32f2f' : '#999'};">
                                            ${cat.total_90j > 0 ? cat.total_90j.toFixed(2) + '$' : '-'}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}

                            <!-- Ligne de total essentielles -->
                            <tr style="background: #f57c00; color: white; font-weight: bold; border-top: 3px solid #e65100;">
                                <td style="padding: 15px; font-size: 15px;">
                                    📊 TOTAL ESSENTIELLES
                                </td>
                                <td style="padding: 15px; text-align: right; font-size: 16px;">
                                    ${analyse.categories.filter((c: any) => c.type === 'essentielle').reduce((sum: number, c: any) => sum + c.total_30j, 0).toFixed(2)}$
                                </td>
                                <td style="padding: 15px; text-align: right; font-size: 16px;">
                                    ${analyse.categories.filter((c: any) => c.type === 'essentielle').reduce((sum: number, c: any) => sum + c.total_90j, 0).toFixed(2)}$
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- DÉPENSES NON-ESSENTIELLES -->
                <div style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; padding: 12px; background: #e3f2fd; border-left: 5px solid #1976d2; font-size: 18px; color: #0d47a1;">
                        🎉 DÉPENSES NON-ESSENTIELLES
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <thead>
                            <tr style="background: #e3f2fd; border-bottom: 2px solid #1976d2;">
                                <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: bold; color: #0d47a1; border-right: 1px solid #bbdefb;">
                                    CATÉGORIE
                                </th>
                                <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: bold; color: #0d47a1; border-right: 1px solid #bbdefb;">
                                    30 DERNIERS JOURS
                                </th>
                                <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: bold; color: #0d47a1;">
                                    90 DERNIERS JOURS
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${analyse.categories.filter((c: any) => c.type === 'non-essentielle').map((cat: any, index: number) => {
                                const rowBg = index % 2 === 0 ? '#f0f8ff' : 'white';
                                return `
                                    <tr style="background: ${rowBg}; border-bottom: 1px solid #bbdefb;">
                                        <td style="padding: 12px; font-size: 14px; color: #333; border-right: 1px solid #bbdefb;">
                                            <strong>${cat.icone} ${cat.libelle}</strong>
                                        </td>
                                        <td style="padding: 12px; text-align: right; font-size: 15px; font-weight: bold; color: ${cat.total_30j > 0 ? '#d32f2f' : '#999'}; border-right: 1px solid #bbdefb;">
                                            ${cat.total_30j > 0 ? cat.total_30j.toFixed(2) + '$' : '-'}
                                        </td>
                                        <td style="padding: 12px; text-align: right; font-size: 15px; font-weight: bold; color: ${cat.total_90j > 0 ? '#d32f2f' : '#999'};">
                                            ${cat.total_90j > 0 ? cat.total_90j.toFixed(2) + '$' : '-'}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}

                            <!-- Ligne de total non-essentielles -->
                            <tr style="background: #1976d2; color: white; font-weight: bold; border-top: 3px solid #0d47a1;">
                                <td style="padding: 15px; font-size: 15px;">
                                    📊 TOTAL NON-ESSENTIELLES
                                </td>
                                <td style="padding: 15px; text-align: right; font-size: 16px;">
                                    ${analyse.categories.filter((c: any) => c.type === 'non-essentielle').reduce((sum: number, c: any) => sum + c.total_30j, 0).toFixed(2)}$
                                </td>
                                <td style="padding: 15px; text-align: right; font-size: 16px;">
                                    ${analyse.categories.filter((c: any) => c.type === 'non-essentielle').reduce((sum: number, c: any) => sum + c.total_90j, 0).toFixed(2)}$
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- AUTRES DÉPENSES (Business, Transferts, etc.) -->
                ${analyse.categories.filter((c: any) => c.type === 'autre').length > 0 ? `
                    <div style="margin-bottom: 30px;">
                        <h3 style="margin: 0 0 15px 0; padding: 12px; background: #f5f5f5; border-left: 5px solid #666; font-size: 18px; color: #333;">
                            📋 AUTRES DÉPENSES
                        </h3>
                        <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <thead>
                                <tr style="background: #f5f5f5; border-bottom: 2px solid #666;">
                                    <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: bold; color: #333; border-right: 1px solid #e0e0e0;">
                                        CATÉGORIE
                                    </th>
                                    <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: bold; color: #333; border-right: 1px solid #e0e0e0;">
                                        30 DERNIERS JOURS
                                    </th>
                                    <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: bold; color: #333;">
                                        90 DERNIERS JOURS
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                ${analyse.categories.filter((c: any) => c.type === 'autre').map((cat: any, index: number) => {
                                    const rowBg = index % 2 === 0 ? '#fafafa' : 'white';
                                    return `
                                        <tr style="background: ${rowBg}; border-bottom: 1px solid #e0e0e0;">
                                            <td style="padding: 12px; font-size: 14px; color: #333; border-right: 1px solid #e0e0e0;">
                                                <strong>${cat.icone} ${cat.libelle}</strong>
                                            </td>
                                            <td style="padding: 12px; text-align: right; font-size: 15px; font-weight: bold; color: ${cat.total_30j > 0 ? '#d32f2f' : '#999'}; border-right: 1px solid #e0e0e0;">
                                                ${cat.total_30j > 0 ? cat.total_30j.toFixed(2) + '$' : '-'}
                                            </td>
                                            <td style="padding: 12px; text-align: right; font-size: 15px; font-weight: bold; color: ${cat.total_90j > 0 ? '#d32f2f' : '#999'};">
                                                ${cat.total_90j > 0 ? cat.total_90j.toFixed(2) + '$' : '-'}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}

                                <!-- Ligne de total autres -->
                                <tr style="background: #666; color: white; font-weight: bold; border-top: 3px solid #333;">
                                    <td style="padding: 15px; font-size: 15px;">
                                        📊 TOTAL AUTRES
                                    </td>
                                    <td style="padding: 15px; text-align: right; font-size: 16px;">
                                        ${analyse.categories.filter((c: any) => c.type === 'autre').reduce((sum: number, c: any) => sum + c.total_30j, 0).toFixed(2)}$
                                    </td>
                                    <td style="padding: 15px; text-align: right; font-size: 16px;">
                                        ${analyse.categories.filter((c: any) => c.type === 'autre').reduce((sum: number, c: any) => sum + c.total_90j, 0).toFixed(2)}$
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ` : ''}

                <!-- RÉSUMÉ GLOBAL -->
                <div style="margin-top: 30px; padding: 20px; background: #000; color: white; border-radius: 8px;">
                    <h3 style="margin: 0 0 15px 0; color: white; font-size: 18px;">📈 RÉSUMÉ GLOBAL (Toutes catégories)</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                        <div style="background: #1a1a1a; padding: 15px; border-radius: 6px; border-left: 4px solid #ff5252;">
                            <div style="font-size: 12px; color: #ccc;">Total 30 jours</div>
                            <div style="font-size: 28px; font-weight: bold; color: #ff5252;">
                                ${analyse.categories.reduce((sum: number, c: any) => sum + c.total_30j, 0).toFixed(2)}$
                            </div>
                        </div>
                        <div style="background: #1a1a1a; padding: 15px; border-radius: 6px; border-left: 4px solid #ff5252;">
                            <div style="font-size: 12px; color: #ccc;">Total 90 jours</div>
                            <div style="font-size: 28px; font-weight: bold; color: #ff5252;">
                                ${analyse.categories.reduce((sum: number, c: any) => sum + c.total_90j, 0).toFixed(2)}$
                            </div>
                        </div>
                    </div>
                </div>
            ` : '<p>Aucune donnée de catégories disponible</p>'}
        </div>

        <!-- SECTION 5: GAMBLING -->
        <div class="section">
            <div class="section-title">5. GAMBLING (30 JOURS)</div>

            <div class="grid-2col">
                <div class="card" style="background: ${analyse.gambling.count > 0 ? '#ffebee' : '#e8f5e9'}; border-color: ${analyse.gambling.count > 0 ? '#d32f2f' : '#388e3c'};">
                    <div class="card-title">Transactions</div>
                    <div class="card-value" style="color: ${analyse.gambling.count > 0 ? '#d32f2f' : '#388e3c'};">${analyse.gambling.count}</div>
                    <div class="card-label">${analyse.gambling.count > 0 ? '🚨 Gambling détecté!' : '✅ Aucun gambling'}</div>
                </div>
                <div class="card" style="background: ${analyse.gambling.total > 0 ? '#ffebee' : '#e8f5e9'}; border-color: ${analyse.gambling.total > 0 ? '#d32f2f' : '#388e3c'};">
                    <div class="card-title">Total dépensé</div>
                    <div class="card-value" style="color: ${analyse.gambling.total > 0 ? '#d32f2f' : '#388e3c'};">${analyse.gambling.total.toFixed(2)}$</div>
                    <div class="card-label">en 30 jours</div>
                </div>
            </div>

            ${analyse.gambling.transactions.length > 0 ? `
                <div style="margin-top: 25px;">
                    <strong style="font-size: 16px; display: block; margin-bottom: 10px; color: #d32f2f;">
                        🎰 TOUTES LES TRANSACTIONS GAMBLING (${analyse.gambling.transactions.length}):
                    </strong>
                    ${analyse.gambling.transactions.map((trans: any, index: number) => `
                        <div style="padding: 12px; margin: 8px 0; background: #ffebee; border-left: 4px solid #d32f2f;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <strong style="color: #d32f2f;">#${index + 1} - ${trans.date}</strong>
                                <strong style="color: #d32f2f; font-size: 16px;">${trans.montant.toFixed(2)}$</strong>
                            </div>
                            <div style="font-size: 12px; color: #666; margin-top: 3px;">
                                ${trans.details}
                            </div>
                            <div style="font-size: 11px; color: #777; margin-top: 5px; padding-top: 5px; border-top: 1px solid #ffcdd2;">
                                💳 Compte ${trans.compte_numero} (${trans.compte_type}) | ${trans.compte_banque} (${trans.compte_institution}) | No: ${trans.compte_account} | Transit: ${trans.compte_transit}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>

        <!-- SECTION 6: NSF -->
        <div class="section">
            <div class="section-title">6. NSF - FONDS INSUFFISANTS (90 JOURS)</div>

            <div class="grid-2col">
                <div class="card" style="background: ${analyse.nsf.count > 0 ? '#ffebee' : '#e8f5e9'}; border-color: ${analyse.nsf.count > 0 ? '#d32f2f' : '#388e3c'};">
                    <div class="card-title">Nombre de NSF</div>
                    <div class="card-value" style="color: ${analyse.nsf.count > 0 ? '#d32f2f' : '#388e3c'};">${analyse.nsf.count}</div>
                    <div class="card-label">${analyse.nsf.count > 0 ? '🚨 NSF détectés!' : '✅ Aucun NSF'}</div>
                </div>
                <div class="card" style="background: ${analyse.nsf.total > 0 ? '#ffebee' : '#e8f5e9'}; border-color: ${analyse.nsf.total > 0 ? '#d32f2f' : '#388e3c'};">
                    <div class="card-title">Total frais NSF</div>
                    <div class="card-value" style="color: ${analyse.nsf.total > 0 ? '#d32f2f' : '#388e3c'};">${analyse.nsf.total.toFixed(2)}$</div>
                    <div class="card-label">en 90 jours</div>
                </div>
            </div>

            ${analyse.nsf.transactions.length > 0 ? `
                <div style="margin-top: 25px;">
                    <strong style="font-size: 16px; display: block; margin-bottom: 10px; color: #d32f2f;">
                        ⚠️ TOUS LES NSF (${analyse.nsf.transactions.length}):
                    </strong>
                    ${analyse.nsf.transactions.map((trans: any, index: number) => `
                        <div style="padding: 12px; margin: 8px 0; background: #ffebee; border-left: 4px solid #d32f2f;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <strong style="color: #d32f2f;">NSF #${index + 1} - ${trans.date}</strong>
                                <strong style="color: #d32f2f; font-size: 16px;">Frais: ${trans.frais.toFixed(2)}$</strong>
                            </div>
                            <div style="font-size: 12px; color: #666; margin-top: 3px;">
                                ${trans.details}
                            </div>
                            <div style="font-size: 11px; color: #777; margin-top: 5px; padding-top: 5px; border-top: 1px solid #ffcdd2;">
                                💳 Compte ${trans.compte_numero} (${trans.compte_type}) | ${trans.compte_banque} (${trans.compte_institution}) | No: ${trans.compte_account} | Transit: ${trans.compte_transit}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>

        <!-- SECTION 7: PRÊTEURS -->
        <div class="section">
            <div class="section-title">7. PRÊTEURS ACTIFS (90 JOURS)</div>

            <div class="grid-3col">
                <div class="card" style="background: ${analyse.preteurs.count_total > 0 ? '#ffebee' : '#e8f5e9'}; border-color: ${analyse.preteurs.count_total > 0 ? '#d32f2f' : '#388e3c'};">
                    <div class="card-title">Transactions totales</div>
                    <div class="card-value" style="color: ${analyse.preteurs.count_total > 0 ? '#d32f2f' : '#388e3c'};">${analyse.preteurs.count_total}</div>
                    <div class="card-label">${analyse.preteurs.count_total > 0 ? '🚨 Prêteurs actifs' : '✅ Aucun prêteur'}</div>
                </div>
                <div class="card" style="background: ${analyse.preteurs.total_paiements > 0 ? '#ffebee' : '#fafafa'}; border-color: ${analyse.preteurs.total_paiements > 0 ? '#d32f2f' : '#e0e0e0'};">
                    <div class="card-title">💸 Payé aux prêteurs</div>
                    <div class="card-value" style="color: #d32f2f;">${analyse.preteurs.total_paiements.toFixed(2)}$</div>
                    <div class="card-label">${analyse.preteurs.paiements.length} paiements</div>
                </div>
                <div class="card" style="background: ${analyse.preteurs.total_recus > 0 ? '#fff3e0' : '#fafafa'}; border-color: ${analyse.preteurs.total_recus > 0 ? '#f57c00' : '#e0e0e0'};">
                    <div class="card-title">💰 Reçu des prêteurs</div>
                    <div class="card-value" style="color: #f57c00;">${analyse.preteurs.total_recus.toFixed(2)}$</div>
                    <div class="card-label">${analyse.preteurs.recus.length} prêts reçus</div>
                </div>
            </div>

            ${analyse.preteurs.paiements.length > 0 ? `
                <div style="margin-top: 25px;">
                    <strong style="font-size: 16px; display: block; margin-bottom: 10px; color: #d32f2f;">
                        💸 PAIEMENTS AUX PRÊTEURS (${analyse.preteurs.paiements.length} transactions):
                    </strong>
                    ${analyse.preteurs.paiements.map((trans: any, index: number) => {
                        const detailsEncoded = Buffer.from(trans.details).toString('base64');
                        return `
                        <div class="preteur-item" style="padding: 12px; margin: 8px 0; background: #ffebee; border-left: 4px solid #d32f2f; position: relative;">
                            <button class="exclude-btn" data-details="${detailsEncoded}"
                                    style="position: absolute; top: 10px; right: 10px; background: #d32f2f; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">
                                ❌ Enlever
                            </button>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; padding-right: 90px;">
                                <strong style="color: #d32f2f;">#${index + 1} - ${trans.date}</strong>
                                <strong style="color: #d32f2f; font-size: 16px;">${trans.montant.toFixed(2)}$</strong>
                            </div>
                            <div style="font-size: 13px; color: #333; word-break: break-word; margin-top: 5px;">
                                ${trans.details}
                            </div>
                            <div style="font-size: 11px; color: #777; margin-top: 5px; padding-top: 5px; border-top: 1px solid #ffcdd2;">
                                💳 Compte ${trans.compte_numero} (${trans.compte_type}) | ${trans.compte_banque} (${trans.compte_institution}) | No: ${trans.compte_account} | Transit: ${trans.compte_transit}
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}

            ${analyse.preteurs.recus.length > 0 ? `
                <div style="margin-top: 25px;">
                    <strong style="font-size: 16px; display: block; margin-bottom: 10px; color: #f57c00;">
                        💰 PRÊTS REÇUS DES PRÊTEURS (${analyse.preteurs.recus.length} transactions):
                    </strong>
                    ${analyse.preteurs.recus.map((trans: any, index: number) => {
                        const detailsEncoded = Buffer.from(trans.details).toString('base64');
                        return `
                        <div class="preteur-item" style="padding: 12px; margin: 8px 0; background: #fff3e0; border-left: 4px solid #f57c00; position: relative;">
                            <button class="exclude-btn" data-details="${detailsEncoded}"
                                    style="position: absolute; top: 10px; right: 10px; background: #f57c00; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold;">
                                ❌ Enlever
                            </button>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; padding-right: 90px;">
                                <strong style="color: #f57c00;">#${index + 1} - ${trans.date}</strong>
                                <strong style="color: #f57c00; font-size: 16px;">${trans.montant.toFixed(2)}$</strong>
                            </div>
                            <div style="font-size: 13px; color: #333; word-break: break-word; margin-top: 5px;">
                                ${trans.details}
                            </div>
                            <div style="font-size: 11px; color: #777; margin-top: 5px; padding-top: 5px; border-top: 1px solid #ffe0b2;">
                                💳 Compte ${trans.compte_numero} (${trans.compte_type}) | ${trans.compte_banque} (${trans.compte_institution}) | No: ${trans.compte_account} | Transit: ${trans.compte_transit}
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}
        </div>

        <!-- SECTION 8: TOUTES LES TRANSACTIONS PAR CATÉGORIE -->
        <div class="section">
            <div class="section-title">8. TOUTES LES TRANSACTIONS PAR CATÉGORIE</div>

            <div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                <strong style="color: #1976d2;">📋 Cliquez sur une catégorie pour voir toutes les transactions</strong>
            </div>

            ${analyse.toutes_transactions ? Object.keys(analyse.toutes_transactions).sort((a, b) => {
                const totalA = analyse.toutes_transactions[a].reduce((sum: number, t: any) => sum + parseFloat(t.debit || '0'), 0);
                const totalB = analyse.toutes_transactions[b].reduce((sum: number, t: any) => sum + parseFloat(t.debit || '0'), 0);
                return totalB - totalA;
            }).map((categoryKey: string) => {
                const transactions = analyse.toutes_transactions[categoryKey];
                const totalDebits = transactions.reduce((sum: number, t: any) => sum + parseFloat(t.debit || '0'), 0);
                const totalCredits = transactions.reduce((sum: number, t: any) => sum + parseFloat(t.credit || '0'), 0);
                const count = transactions.length;

                // Mapper les catégories aux icônes et labels
                const categoryInfo: any = {
                    'bills_and_utilities': { icone: '⚡', libelle: 'Factures & Services publics', type: 'essentielle' },
                    'auto_and_transport': { icone: '🚗', libelle: 'Transport & Automobile', type: 'essentielle' },
                    'insurance': { icone: '🛡️', libelle: 'Assurances', type: 'essentielle' },
                    'health_and_fitness': { icone: '💪', libelle: 'Santé & Fitness', type: 'essentielle' },
                    'food_and_dining': { icone: '🍔', libelle: 'Alimentation & Restaurants', type: 'essentielle' },
                    'home': { icone: '🏠', libelle: 'Maison', type: 'essentielle' },
                    'entertainment': { icone: '🎬', libelle: 'Divertissement', type: 'non-essentielle' },
                    'shopping': { icone: '🛍️', libelle: 'Achats', type: 'non-essentielle' },
                    'travel': { icone: '✈️', libelle: 'Voyages', type: 'non-essentielle' },
                    'business_services': { icone: '💼', libelle: 'Services professionnels', type: 'autre' },
                    'fees_and_charges': { icone: '💳', libelle: 'Frais bancaires', type: 'autre' },
                    'transfer': { icone: '💸', libelle: 'Transferts', type: 'autre' },
                    'education': { icone: '📚', libelle: 'Éducation', type: 'autre' },
                    'income': { icone: '💰', libelle: 'Revenus', type: 'autre' },
                    'gambling': { icone: '🎰', libelle: 'Gambling', type: 'autre' },
                    'non_classifie': { icone: '❓', libelle: 'Non classifié', type: 'autre' }
                };

                const catInfo = categoryInfo[categoryKey] || { icone: '📂', libelle: categoryKey, type: 'autre' };
                const bgColor = catInfo.type === 'essentielle' ? '#fff3e0' : catInfo.type === 'non-essentielle' ? '#e3f2fd' : '#f5f5f5';
                const borderColor = catInfo.type === 'essentielle' ? '#f57c00' : catInfo.type === 'non-essentielle' ? '#1976d2' : '#666';

                return `
                    <details style="margin-bottom: 15px; border: 1px solid ${borderColor}; border-radius: 8px; overflow: hidden;">
                        <summary style="
                            padding: 15px;
                            background: ${bgColor};
                            cursor: pointer;
                            font-weight: bold;
                            font-size: 16px;
                            color: #333;
                            user-select: none;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            transition: background 0.2s;
                        " onmouseover="this.style.background='${bgColor === '#fff3e0' ? '#ffe0b2' : bgColor === '#e3f2fd' ? '#bbdefb' : '#e0e0e0'}'" onmouseout="this.style.background='${bgColor}'">
                            <span>${catInfo.icone} ${catInfo.libelle}</span>
                            <span style="font-size: 14px; color: #666;">
                                ${count} transaction${count > 1 ? 's' : ''} |
                                ${totalDebits > 0 ? '<span style="color: #d32f2f;">-' + totalDebits.toFixed(2) + '$</span>' : ''}
                                ${totalCredits > 0 ? '<span style="color: #388e3c;">+' + totalCredits.toFixed(2) + '$</span>' : ''}
                            </span>
                        </summary>

                        <div style="padding: 15px; background: white;">
                            ${transactions.map((trans: any, idx: number) => {
                                const isDebit = trans.debit && trans.debit !== '';
                                const montant = isDebit ? parseFloat(trans.debit) : parseFloat(trans.credit || '0');
                                const typeColor = isDebit ? '#d32f2f' : '#388e3c';
                                const typeBg = isDebit ? '#ffebee' : '#e8f5e9';

                                return `
                                    <div style="padding: 10px; margin: 8px 0; background: ${typeBg}; border-left: 3px solid ${typeColor}; border-radius: 4px;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                            <strong style="color: ${typeColor}; font-size: 13px;">
                                                #${idx + 1} - ${trans.date}
                                            </strong>
                                            <strong style="color: ${typeColor}; font-size: 15px;">
                                                ${isDebit ? '-' : '+'}${montant.toFixed(2)}$
                                            </strong>
                                        </div>
                                        <div style="font-size: 12px; color: #333; margin: 5px 0;">
                                            ${trans.details}
                                        </div>
                                        <div style="font-size: 10px; color: #888; margin-top: 5px; padding-top: 5px; border-top: 1px solid #e0e0e0;">
                                            📂 ${trans.category || 'Non classifié'}
                                        </div>
                                        <div style="font-size: 10px; color: #666; margin-top: 3px;">
                                            💳 Compte ${trans.compte_numero} (${trans.compte_type}) | ${trans.compte_banque} | No: ${trans.compte_account} | Transit: ${trans.compte_transit}
                                        </div>
                                        ${trans.balance ? '<div style="font-size: 10px; color: #999; margin-top: 2px;">💰 Balance après: ' + parseFloat(trans.balance).toFixed(2) + '$</div>' : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </details>
                `;
            }).join('') : '<p>Aucune transaction disponible</p>'}
        </div>

        <a href="/" class="back-button">← Analyser un autre fichier</a>

        <!-- Bouton pour voir les exclusions -->
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
            <button id="show-exclusions-btn" style="background: #333; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                📋 Voir les exclusions (${loadExclusions().length})
            </button>
        </div>
    </div>

    <script>
        // URL du serveur (injectée depuis le backend)
        const SERVER_URL = '${serverURL}';

        // Fonction pour exclure une transaction
        async function excludeTransaction(detailsEncoded, button) {
            const details = atob(detailsEncoded);

            // Message de confirmation plus clair
            const message = 'ATTENTION: Toutes les transactions contenant ce pattern seront exclues!\\n\\n' +
                          'Ligne sélectionnée:\\n' + details + '\\n\\n' +
                          'Voulez-vous continuer?';

            if (!confirm(message)) {
                return;
            }

            button.disabled = true;
            button.textContent = '⏳ Ajout...';

            try {
                const response = await fetch(SERVER_URL + '/exclusion/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ details })
                });

                const result = await response.json();

                if (result.success) {
                    // Masquer l'élément
                    button.closest('.preteur-item').style.opacity = '0.3';
                    button.textContent = '✅ Exclu';
                    button.style.background = '#666';

                    // Message détaillé
                    const successMessage = '✅ EXCLUSION AJOUTÉE!\\n\\n' +
                                         'Pattern exclu: ' + result.pattern + '\\n\\n' +
                                         '⚠️ TOUTES les transactions contenant "' + result.pattern + '" seront ignorées lors du prochain scan.\\n\\n' +
                                         'Total exclusions: ' + result.total;

                    alert(successMessage);
                } else {
                    alert('Erreur: ' + (result.message || 'Erreur inconnue'));
                    button.disabled = false;
                    button.textContent = '❌ Enlever';
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors de l\\'ajout de l\\'exclusion');
                button.disabled = false;
                button.textContent = '❌ Enlever';
            }
        }

        // Fonction pour voir les exclusions
        async function showExclusions() {
            try {
                const response = await fetch(SERVER_URL + '/exclusion/list');
                const result = await response.json();

                if (result.count === 0) {
                    alert('📋 Aucune exclusion enregistrée');
                    return;
                }

                let message = \`📋 EXCLUSIONS ENREGISTRÉES (\${result.count}):\\n\\n\`;
                result.exclusions.forEach((excl, idx) => {
                    message += \`\${idx + 1}. \${excl.substring(0, 100)}\${excl.length > 100 ? '...' : ''}\\n\\n\`;
                });

                alert(message);
            } catch (error) {
                console.error('Erreur:', error);
                alert('Erreur lors du chargement des exclusions');
            }
        }

        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Boutons "Enlever"
            const excludeButtons = document.querySelectorAll('.exclude-btn');
            excludeButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const detailsEncoded = this.getAttribute('data-details');
                    excludeTransaction(detailsEncoded, this);
                });

                // Hover effect
                btn.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.05)';
                });
                btn.addEventListener('mouseleave', function() {
                    this.style.transform = 'scale(1)';
                });
            });

            // Bouton "Voir les exclusions"
            const showExclusionsBtn = document.getElementById('show-exclusions-btn');
            if (showExclusionsBtn) {
                showExclusionsBtn.addEventListener('click', showExclusions);
            }
        });
    </script>
</body>
</html>`;
}

// ============================================================
// ROUTES
// ============================================================

// Route principale
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route proxy pour Inverite API
app.post('/api/proxy/inverite', async (req: Request, res: Response) => {
    try {
        const { guid } = req.body;

        if (!guid) {
            return res.status(400).json({ error: 'GUID manquant' });
        }

        const INVERITE_API_KEY = '09a4b8554857d353fd007d29feca423f446';

        // Endpoint correct selon la documentation Inverite : /api/v2/fetch/{guid}
        const apiUrl = `https://www.inverite.com/api/v2/fetch/${guid}`;

        console.log(`\n📡 Appel API Inverite pour GUID: ${guid}`);
        console.log(`   URL: ${apiUrl}`);

        let response: any = null;

        try {
            response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Auth': INVERITE_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`   Status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.log(`   ❌ Erreur API: ${errorText}`);
                return res.json({
                    success: false,
                    error: `API Inverite error (${response.status}): ${errorText}`,
                    status: response.status
                });
            }
        } catch (error) {
            console.log(`   ❌ Erreur réseau: ${error}`);
            return res.json({
                success: false,
                error: `Network error: ${error}`
            });
        }

        const data = await response.json();
        console.log(`   ✅ Données reçues (${JSON.stringify(data).length} bytes)`);

        res.json({ success: true, data });

    } catch (error: any) {
        console.error('Erreur proxy Inverite:', error);
        res.json({ success: false, error: error.message });
    }
});

// Route pour ajouter une exclusion
app.post('/exclusion/add', (req: Request, res: Response) => {
    try {
        const { details } = req.body;

        if (!details || details.trim() === '') {
            return res.status(400).json({ error: 'Details manquants' });
        }

        // Extraire le pattern général
        const pattern = extractPattern(details);

        // Charger les exclusions actuelles
        const exclusions = loadExclusions();

        // Vérifier si déjà exclu
        if (exclusions.includes(pattern)) {
            return res.json({ message: 'Déjà exclu', pattern, exclusions });
        }

        // Ajouter l'exclusion (le pattern, pas la ligne complète)
        exclusions.push(pattern);
        saveExclusions(exclusions);

        console.log(`✅ Exclusion ajoutée:`);
        console.log(`   Ligne originale: ${details}`);
        console.log(`   Pattern extrait: ${pattern}`);
        console.log(`   Total exclusions: ${exclusions.length}`);

        res.json({
            success: true,
            message: 'Exclusion ajoutée',
            pattern: pattern,
            original: details,
            total: exclusions.length
        });

    } catch (error: any) {
        console.error('Erreur ajout exclusion:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour voir les exclusions
app.get('/exclusion/list', (req: Request, res: Response) => {
    const exclusions = loadExclusions();
    res.json({ count: exclusions.length, exclusions });
});

// Route pour supprimer une exclusion
app.post('/exclusion/remove', (req: Request, res: Response) => {
    try {
        const { details } = req.body;
        let exclusions = loadExclusions();
        exclusions = exclusions.filter(e => e !== details);
        saveExclusions(exclusions);
        res.json({ success: true, message: 'Exclusion retirée', total: exclusions.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Route pour traiter le fichier JSON
app.post('/upload', upload.single('jsonFile'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).send('Aucun fichier uploadé');
        }

        // Lire et parser le JSON
        const jsonContent = req.file.buffer.toString('utf-8');
        const inveriteData: InveriteData = JSON.parse(jsonContent);

        // Charger les exclusions
        const exclusions = loadExclusions();

        // Analyser le JSON
        const analyse = analyseInverite(inveriteData, exclusions);

        // Construire l'URL du serveur (forcer HTTPS sur Vercel)
        const protocol = process.env.VERCEL ? 'https' : req.protocol;
        const serverURL = `${protocol}://${req.get('host')}`;

        // Générer le rapport HTML
        const rapportHTML = genererRapportSimple(analyse, serverURL);

        // Retourner le rapport
        res.send(rapportHTML);

    } catch (error: any) {
        console.error('Erreur lors du traitement:', error);
        res.status(500).send(`Erreur lors du traitement du fichier: ${error.message}`);
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`\n🚀 Serveur démarré avec succès!`);
    console.log(`\n📊 Module Rapport Simple Inverite`);
    console.log(`➜  Local: http://localhost:${PORT}`);
    console.log(`\n✅ Prêt à analyser des fichiers JSON Inverite\n`);
});
