(function () {
  console.log("Overwatch v7 - PRODUCTION");

  // ============================================
  // CONFIGURATION DES URLS
  // ============================================
  var RAILWAY_API = 'http://localhost:3000';
  var VERCEL_APP = 'http://localhost:3000';

  // ============================================
  // TERMINAL COMPONENT
  // ============================================

  // Injecter les styles CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }

    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.3); }
      50% { box-shadow: 0 0 30px rgba(0, 255, 0, 0.6); }
    }

    #overwatch-terminal {
      animation: glowPulse 2s infinite;
    }

    #terminal-logs::-webkit-scrollbar {
      width: 8px;
    }

    #terminal-logs::-webkit-scrollbar-track {
      background: #0a0a0a;
    }

    #terminal-logs::-webkit-scrollbar-thumb {
      background: #00ff00;
      border-radius: 4px;
    }

    #terminal-logs::-webkit-scrollbar-thumb:hover {
      background: #00cc00;
    }
  `;
  document.head.appendChild(style);

  // Creer le terminal
  const terminal = document.createElement('div');
  terminal.id = 'overwatch-terminal';
  terminal.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 450px;
    max-height: 350px;
    background: #0a0a0a;
    border: 2px solid #00ff00;
    border-radius: 8px;
    padding: 12px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #00ff00;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
    z-index: 999998;
    display: none;
  `;

  terminal.innerHTML = `
    <div id="terminal-header" style="
      color: #00ff00;
      font-weight: bold;
      margin-bottom: 8px;
      border-bottom: 1px solid #00ff00;
      padding-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    ">
      <span>[*] OVERWATCH v7 PRODUCTION</span>
      <button id="terminal-close" style="
        background: transparent;
        border: 1px solid #00ff00;
        color: #00ff00;
        padding: 2px 8px;
        cursor: pointer;
        font-size: 10px;
        font-family: 'Courier New', monospace;
        border-radius: 3px;
      ">[X]</button>
    </div>
    <div id="terminal-logs" style="
      max-height: 300px;
      overflow-y: auto;
      overflow-x: hidden;
    "></div>
  `;

  document.body.appendChild(terminal);

  // Bouton close
  document.getElementById('terminal-close').onclick = function() {
    terminal.style.display = 'none';
  };

  // Fonction de log universelle
  function logToTerminal(message, type) {
    type = type || 'info';
    var terminalEl = document.getElementById('overwatch-terminal');
    var logs = document.getElementById('terminal-logs');

    if (!terminalEl || !logs) return;

    // Afficher le terminal
    terminalEl.style.display = 'block';

    var timestamp = new Date().toLocaleTimeString();
    var colors = {
      'info': '#00ff00',
      'success': '#00ff00',
      'error': '#ff0000',
      'warning': '#ffff00',
      'data': '#00aaff',
      'system': '#ff00ff'
    };

    var logLine = document.createElement('div');
    logLine.style.cssText = 'color: ' + (colors[type] || '#00ff00') + '; margin: 2px 0; animation: fadeIn 0.3s; word-wrap: break-word;';
    logLine.innerHTML = '[' + timestamp + '] ' + message;

    logs.appendChild(logLine);

    // Auto-scroll vers le bas
    logs.scrollTop = logs.scrollHeight;

    // Limiter a 50 lignes max
    while (logs.children.length > 50) {
      logs.removeChild(logs.children[0]);
    }

    // Log dans console aussi
    console.log('[TERMINAL] ' + message);
  }

  // ============================================
  // DETECTION DU DOMAINE
  // ============================================
  var isInverite = window.location.hostname.indexOf('inverite.com') !== -1;
  var isFlinks = window.location.hostname.indexOf('flinks.com') !== -1;
  var isMargill = window.location.hostname.indexOf('margill.com') !== -1;

  logToTerminal('[+] Overwatch v6.3 VERCEL initialise', 'success');
  logToTerminal('[>] URL: ' + window.location.hostname, 'info');
  logToTerminal('[>] Mode: ' + (isMargill ? 'MARGILL' : isInverite ? 'INVERITE' : isFlinks ? 'FLINKS' : 'INCONNU'), 'data');

  // ============================================
  // MODE MARGILL - POINT D'ENTREE PRINCIPAL
  // ============================================
  function setupMargillMode() {
    logToTerminal('[*] Mode MARGILL FIRST active', 'system');

    // Extraire le numero de demande de l'URL
    var urlParams = new URLSearchParams(window.location.search);
    var demandeNumber = urlParams.get('demande');

    if (!demandeNumber) {
      logToTerminal('[!] Pas de numero de demande dans URL', 'warning');
      return;
    }

    logToTerminal('[>] Reference: ' + demandeNumber, 'data');

    // Fonction pour scraper toutes les infos de la page Margill
    function scrapeMargillData() {
      var margillData = {
        reference: demandeNumber,
        scraped_at: new Date().toISOString(),
        url: window.location.href,
        client: {},
        fields: {},
        raw_text: ''
      };

      // Methode 1: Chercher les champs de formulaire
      document.querySelectorAll('input, select, textarea').forEach(function(el) {
        var name = el.name || el.id || el.getAttribute('data-field');
        if (name && el.value) {
          margillData.fields[name] = el.value;
        }
      });

      // Methode 2: Chercher les labels et leurs valeurs
      document.querySelectorAll('label').forEach(function(label) {
        var labelText = label.innerText ? label.innerText.trim() : '';
        if (labelText) {
          var forId = label.getAttribute('for');
          var value = null;

          if (forId) {
            var input = document.getElementById(forId);
            if (input) value = input.value;
          } else {
            var container = label.closest('tr, div, .form-group');
            if (container) {
              var input = container.querySelector('input, select, textarea, span.value, .field-value');
              if (input) value = input.value || input.innerText;
            }
          }

          if (value) {
            margillData.fields[labelText] = value;
          }
        }
      });

      // Methode 3: Chercher les tableaux de donnees
      document.querySelectorAll('table tr').forEach(function(row) {
        var cells = row.querySelectorAll('td, th');
        if (cells.length >= 2) {
          var label = cells[0].innerText ? cells[0].innerText.trim() : '';
          var valueEl = cells[1].querySelector('input, select');
          var value = cells[1].innerText ? cells[1].innerText.trim() : (valueEl ? valueEl.value : '');
          if (label && value && label.length < 100) {
            margillData.fields[label] = value;
          }
        }
      });

      // Methode 4: Chercher les spans ASP.NET
      document.querySelectorAll('span[id*="lbl"], span[id*="txt"], span[id*="Label"]').forEach(function(span) {
        var id = span.id;
        var value = span.innerText ? span.innerText.trim() : '';
        if (id && value) {
          margillData.fields[id] = value;
        }
      });

      // Methode 5: Recuperer tout le texte visible
      margillData.raw_text = document.body.innerText;

      // Extraire nom/prenom du client depuis les champs
      var possibleNameFields = ['Prenom', 'prenom', 'FirstName', 'first_name', 'txtPrenom', 'lblPrenom'];
      var possibleLastNameFields = ['Nom', 'nom', 'LastName', 'last_name', 'txtNom', 'lblNom', 'Nom de famille'];

      for (var i = 0; i < possibleNameFields.length; i++) {
        var field = possibleNameFields[i];
        var entries = Object.entries(margillData.fields);
        for (var j = 0; j < entries.length; j++) {
          var key = entries[j][0];
          var value = entries[j][1];
          if (key.toLowerCase().indexOf(field.toLowerCase()) !== -1 && value) {
            margillData.client.prenom = value;
            break;
          }
        }
        if (margillData.client.prenom) break;
      }

      for (var i = 0; i < possibleLastNameFields.length; i++) {
        var field = possibleLastNameFields[i];
        var entries = Object.entries(margillData.fields);
        for (var j = 0; j < entries.length; j++) {
          var key = entries[j][0];
          var value = entries[j][1];
          if (key.toLowerCase().indexOf(field.toLowerCase()) !== -1 && value && key.toLowerCase().indexOf('prenom') === -1) {
            margillData.client.nom = value;
            break;
          }
        }
        if (margillData.client.nom) break;
      }

      // Fallback: chercher dans le raw text
      if (!margillData.client.prenom || !margillData.client.nom) {
        var rawText = margillData.raw_text;

        // Pattern pour chercher "Prenom: XXX" ou "Nom: XXX"
        var prenomMatch = rawText.match(/Pr[e]nom\s*[:]\s*([A-Za-z-]+)/i);
        var nomMatch = rawText.match(/Nom(?:\s+de\s+famille)?\s*[:]\s*([A-Za-z-]+)/i);

        if (prenomMatch && !margillData.client.prenom) {
          margillData.client.prenom = prenomMatch[1].trim();
        }
        if (nomMatch && !margillData.client.nom) {
          margillData.client.nom = nomMatch[1].trim();
        }
      }

      var fieldCount = Object.keys(margillData.fields).length;
      logToTerminal('[>] ' + fieldCount + ' champ(s) detecte(s)', 'data');

      if (margillData.client.prenom) {
        logToTerminal('[>] Prenom: ' + margillData.client.prenom, 'data');
      }
      if (margillData.client.nom) {
        logToTerminal('[>] Nom: ' + margillData.client.nom, 'data');
      }

      return margillData;
    }

    // Fonction pour detecter le lien Inverite sur la page
    function findInveriteLink() {
      // Chercher tous les liens
      var links = document.querySelectorAll('a[href*="inverite.com"]');

      for (var i = 0; i < links.length; i++) {
        var href = links[i].href;
        // Pattern: https://www.inverite.com/merchant/request/view/GUID
        var guidMatch = href.match(/inverite\.com\/merchant\/request\/view\/([A-Fa-f0-9-]+)/i);
        if (guidMatch) {
          return {
            url: href,
            guid: guidMatch[1]
          };
        }
      }

      // Chercher aussi dans le texte de la page (parfois le lien n'est pas cliquable)
      var pageText = document.body.innerHTML;
      var textMatch = pageText.match(/inverite\.com\/merchant\/request\/view\/([A-Fa-f0-9-]+)/i);
      if (textMatch) {
        return {
          url: 'https://www.inverite.com/merchant/request/view/' + textMatch[1],
          guid: textMatch[1]
        };
      }

      // Chercher le GUID seul dans des champs caches ou spans
      var guidPattern = /[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{12}/g;
      var allGuids = pageText.match(guidPattern);

      if (allGuids && allGuids.length > 0) {
        // Prendre le premier GUID trouve
        return {
          url: 'https://www.inverite.com/merchant/request/view/' + allGuids[0],
          guid: allGuids[0]
        };
      }

      return null;
    }

    // Fonction principale d'execution
    async function executeFullScrape() {
      var btn = document.getElementById("overwatch-margill-btn");

      try {
        logToTerminal('[*] DEBUT EXTRACTION COMPLETE...', 'system');

        if (btn) {
          btn.innerText = "[...] SCRAPING...";
          btn.disabled = true;
          btn.style.background = "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)";
        }

        // ETAPE 1: Scraper Margill
        logToTerminal('[1] Etape 1: Scraping Margill...', 'info');
        var margillData = scrapeMargillData();
        logToTerminal('[+] Margill: ' + Object.keys(margillData.fields).length + ' champs', 'success');

        // ETAPE 2: Detecter le lien Inverite
        logToTerminal('[2] Etape 2: Recherche lien Inverite...', 'info');
        var inveriteInfo = findInveriteLink();

        if (!inveriteInfo) {
          logToTerminal('[!] Lien Inverite non trouve sur la page', 'warning');
          logToTerminal('[X] Analyse impossible sans donnees Inverite', 'error');

          if (btn) {
            btn.innerText = "[X] PAS D'INVERITE";
            btn.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
            btn.disabled = false;
          }
          return;
        }

        logToTerminal('[+] Inverite trouve: ' + inveriteInfo.guid.substring(0, 8) + '...', 'success');

        // ETAPE 3: Recuperer les donnees Inverite via proxy
        logToTerminal('[3] Etape 3: Recuperation Inverite...', 'info');

        var proxyResponse = await fetch(VERCEL_APP + '/api/proxy/inverite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guid: inveriteInfo.guid })
        });

        if (!proxyResponse.ok) {
          throw new Error('Erreur proxy Inverite: ' + proxyResponse.status);
        }

        var proxyResult = await proxyResponse.json();
        var inveriteData = proxyResult.data;

        if (!inveriteData) {
          throw new Error('Aucune donnee Inverite recue');
        }

        var accountsCount = inveriteData.accounts ? inveriteData.accounts.length : 0;
        var totalTransactions = 0;
        if (inveriteData.accounts) {
          for (var i = 0; i < inveriteData.accounts.length; i++) {
            var acc = inveriteData.accounts[i];
            totalTransactions += acc.transactions ? acc.transactions.length : 0;
          }
        }

        logToTerminal('[+] Inverite: ' + accountsCount + ' compte(s), ' + totalTransactions + ' transactions', 'success');

        // ETAPE 4: Lancer l'analyse automatique
        logToTerminal('[4] Etape 4: Analyse automatique...', 'info');

        // Appeler Vercel qui enrichit les données (pas Railway direct)
        var analyzeResponse = await fetch(VERCEL_APP + '/api/analyze-inverite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inveriteData)
        });

        if (analyzeResponse.ok) {
          var analyzeResult = await analyzeResponse.json();
          if (analyzeResult.success) {
            logToTerminal('[+] Analyse terminee - Score: ' + analyzeResult.score + '/100', 'success');
            logToTerminal('[>] Client: ' + analyzeResult.client, 'data');

            if (analyzeResult.knockOuts > 0) {
              logToTerminal('[X] ' + analyzeResult.knockOuts + ' knock-out(s)', 'error');
            }

            // ETAPE 5: Sauvegarder sur Vercel avant d'ouvrir (inclure margillData!)
            logToTerminal('[5] Etape 5: Sauvegarde rapport...', 'info');
            var saveData = {
              ...analyzeResult.data,
              id: analyzeResult.id,
              created_at: new Date().toISOString(),
              margill_data: margillData,
              margill_id: demandeNumber
            };
            await fetch(VERCEL_APP + '/api/save-temp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(saveData)
            });
            logToTerminal('[+] Rapport sauvegarde dans Supabase', 'success');

            // ETAPE 6: Ouvrir le rapport
            logToTerminal('[6] Etape 6: Ouverture rapport...', 'info');
            window.open(VERCEL_APP + '/rapport-simple/' + analyzeResult.id, '_blank');
          }
        }

        logToTerminal('[+++] PROCESSUS COMPLET TERMINE!', 'success');

        if (btn) {
          btn.innerText = "[OK] TERMINE";
          btn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
          btn.disabled = false;

          setTimeout(function() {
            btn.innerText = "[*] OVERWATCH";
            btn.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
          }, 3000);
        }

      } catch (error) {
        logToTerminal('[X] ERREUR: ' + error.message, 'error');
        console.error('Erreur complete:', error);

        if (btn) {
          btn.innerText = "[*] OVERWATCH";
          btn.disabled = false;
          btn.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";

          setTimeout(function() {
            btn.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
          }, 3000);
        }
      }
    }

    // Creer le bouton principal
    var btn = document.createElement("button");
    btn.id = "overwatch-margill-btn";
    btn.innerText = "[*] OVERWATCH";
    btn.style.cssText = 'position: fixed; top: 140px; right: 20px; z-index: 999999; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; border: none; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.2s ease;';

    btn.onmouseover = function() {
      btn.style.transform = "translateY(-2px)";
      btn.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.6)";
    };

    btn.onmouseout = function() {
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
    };

    btn.onclick = executeFullScrape;
    document.body.appendChild(btn);

    logToTerminal('[+] Bouton OVERWATCH injecte', 'success');
    logToTerminal('[>] Cliquez pour lancer extraction', 'info');
  }

  // ============================================
  // NOUVEAU: GENERER RAPPORT SIMPLE
  // ============================================
  async function genererRapportSimple(guid) {
    try {
      logToTerminal('[*] Recuperation des donnees Inverite...', 'system');
      logToTerminal('[>] GUID: ' + guid.substring(0, 8) + '...', 'data');

      // Utiliser l'API proxy pour recuperer les donnees Inverite
      var proxyResponse = await fetch(CONFIG.RAPPORT_SERVER + '/api/proxy/inverite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guid: guid })
      });

      if (!proxyResponse.ok) {
        throw new Error('Erreur proxy Inverite: ' + proxyResponse.status);
      }

      var proxyResult = await proxyResponse.json();

      if (!proxyResult.success) {
        throw new Error(proxyResult.error || 'Erreur inconnue lors de la recuperation des donnees');
      }

      var inveriteData = proxyResult.data;

      if (!inveriteData) {
        throw new Error('Aucune donnee Inverite recue du serveur');
      }

      var accountsCount = inveriteData.accounts ? inveriteData.accounts.length : 0;
      logToTerminal('[+] Donnees recues: ' + accountsCount + ' compte(s)', 'success');

      // Envoyer au serveur rapport_simple pour generation
      logToTerminal('[*] Generation du rapport...', 'system');

      var blob = new Blob([JSON.stringify(inveriteData)], { type: 'application/json' });
      var formData = new FormData();
      formData.append('jsonFile', blob, 'inverite-' + guid.substring(0, 8) + '.json');

      var uploadResponse = await fetch(CONFIG.RAPPORT_SERVER + '/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Erreur generation rapport: ' + uploadResponse.status);
      }

      var rapportHTML = await uploadResponse.text();
      logToTerminal('[+] Rapport genere!', 'success');

      // Ouvrir le rapport dans un nouvel onglet
      var newWindow = window.open('', '_blank');
      newWindow.document.write(rapportHTML);
      newWindow.document.close();

      logToTerminal('[+] Rapport ouvert dans nouvel onglet', 'success');
      return true;

    } catch (error) {
      logToTerminal('[X] Erreur: ' + error.message, 'error');
      return false;
    }
  }

  // ============================================
  // MODE INVERITE (backup si besoin)
  // ============================================
  function setupInveriteMode() {
    var guidMatch = window.location.pathname.match(/\/view\/([A-Fa-f0-9-]+)/);
    if (!guidMatch) {
      logToTerminal('[!] Pas de GUID dans URL', 'warning');
      return;
    }

    var guid = guidMatch[1];
    logToTerminal('[>] GUID: ' + guid.substring(0, 8) + '...', 'data');

    // NOUVEAU BOUTON: Rapport Simple
    var btnRapport = document.createElement("button");
    btnRapport.id = "rapport-simple-btn";
    btnRapport.innerText = "📊 RAPPORT SIMPLE";
    btnRapport.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 999999; background: linear-gradient(135deg, #00c853 0%, #64dd17 100%); color: white; padding: 12px 24px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(0, 200, 83, 0.4); font-size: 14px;';

    btnRapport.onclick = async function() {
      btnRapport.innerText = "⏳ GENERATION...";
      btnRapport.disabled = true;

      var success = await genererRapportSimple(guid);

      if (success) {
        btnRapport.innerText = "✅ RAPPORT GENERE";
        setTimeout(function() {
          btnRapport.innerText = "📊 RAPPORT SIMPLE";
          btnRapport.disabled = false;
        }, 3000);
      } else {
        btnRapport.innerText = "❌ ERREUR";
        setTimeout(function() {
          btnRapport.innerText = "📊 RAPPORT SIMPLE";
          btnRapport.disabled = false;
        }, 3000);
      }
    };

    document.body.appendChild(btnRapport);
    logToTerminal('[+] Bouton RAPPORT SIMPLE injecte', 'success');
  }

  // ============================================
  // MODE FLINKS
  // ============================================
  function setupFlinksMode() {
    function openAllAccordions() {
      document.querySelectorAll("button.print\\:hidden").forEach(function(b) {
        try { b.click(); } catch (e) {}
      });
      document.querySelectorAll("button[aria-expanded='false']").forEach(function(b) {
        try { b.click(); } catch (e) {}
      });
    }

    var btn = document.createElement("button");
    btn.id = "overwatch-btn";
    btn.innerText = "[*] OVERWATCH";
    btn.style.cssText = 'position: fixed; top: 140px; right: 20px; padding: 12px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer; z-index: 999999; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);';

    btn.onclick = async function() {
      try {
        logToTerminal('[*] Capture Flinks...', 'system');
        btn.innerText = "[...] CAPTURE...";
        btn.disabled = true;

        openAllAccordions();
        await new Promise(function(r) { setTimeout(r, 1000); });
        var overviewText = document.body.innerText;

        var allElements = document.querySelectorAll("*");
        var lendingTab = null;
        for (var i = 0; i < allElements.length; i++) {
          if (allElements[i].innerText && allElements[i].innerText.trim() === "Lending") {
            lendingTab = allElements[i];
            break;
          }
        }

        if (lendingTab) {
          lendingTab.click();
          await new Promise(function(r) { setTimeout(r, 2000); });
          openAllAccordions();
          await new Promise(function(r) { setTimeout(r, 1000); });
        }

        var lendingText = document.body.innerText;

        var response = await fetch(VERCEL_APP + '/api/flinks-extension', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ overviewText: overviewText, lendingText: lendingText })
        });

        var result = await response.json();

        if (result.success && result.id) {
          logToTerminal('[+] Dossier: ' + result.id, 'success');

          // Sauvegarder sur Vercel avant d'ouvrir
          if (result.data) {
            var saveData = {
              ...result.data,
              id: result.id,
              created_at: new Date().toISOString()
            };
            await fetch(VERCEL_APP + '/api/save-temp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(saveData)
            });
          }

          window.open(VERCEL_APP + '/rapport-simple/' + result.id, '_blank');
        }

        btn.innerText = "[OK] TERMINE";
        btn.disabled = false;

      } catch (error) {
        logToTerminal('[X] ' + error.message, 'error');
        btn.innerText = "[*] OVERWATCH";
        btn.disabled = false;
      }
    };

    document.body.appendChild(btn);
    logToTerminal('[+] Bouton OVERWATCH injecte', 'success');
  }

  // ============================================
  // SELECTION DU MODE
  // ============================================
  if (isMargill) {
    logToTerminal('[*] Mode MARGILL FIRST active', 'system');
    setupMargillMode();
  } else if (isInverite) {
    logToTerminal('[*] Mode INVERITE active', 'system');
    setupInveriteMode();
  } else if (isFlinks) {
    logToTerminal('[*] Mode FLINKS active', 'system');
    setupFlinksMode();
  } else {
    logToTerminal('[!] Domaine non reconnu', 'warning');
  }
})();
