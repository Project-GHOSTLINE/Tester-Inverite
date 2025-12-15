(function () {
  console.log("Inverite Rapport Simple v9.0");

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

    #inverite-terminal {
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
  terminal.id = 'inverite-terminal';
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
      <span>[*] INVERITE RAPPORT v9.0</span>
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
    var terminalEl = document.getElementById('inverite-terminal');
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
    console.log('[INVERITE] ' + message);
  }

  // ============================================
  // DETECTION DU DOMAINE
  // ============================================
  var isInverite = window.location.hostname.indexOf('inverite.com') !== -1;

  if (!isInverite) {
    console.log('[INVERITE] Extension active uniquement sur inverite.com');
    return;
  }

  logToTerminal('[+] Extension Inverite v9.0 initialisee', 'success');
  logToTerminal('[>] URL: ' + window.location.hostname, 'info');

  // ============================================
  // MODE INVERITE - GENERATION DE RAPPORT
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

      // Ouvrir le rapport dans un nouvel onglet via Blob URL (évite les problèmes CSP)
      var blob = new Blob([rapportHTML], { type: 'text/html' });
      var blobURL = URL.createObjectURL(blob);
      window.open(blobURL, '_blank');

      // Révoquer l'URL après ouverture
      setTimeout(function() { URL.revokeObjectURL(blobURL); }, 1000);

      logToTerminal('[+] Rapport ouvert dans nouvel onglet', 'success');
      return true;

    } catch (error) {
      logToTerminal('[X] Erreur: ' + error.message, 'error');
      return false;
    }
  }

  // ============================================
  // SETUP BOUTON INVERITE
  // ============================================
  function setupInveriteMode() {
    var guidMatch = window.location.pathname.match(/\/view\/([A-Fa-f0-9-]+)/);
    if (!guidMatch) {
      logToTerminal('[!] Pas de GUID dans URL', 'warning');
      return;
    }

    var guid = guidMatch[1];
    logToTerminal('[>] GUID detecte: ' + guid.substring(0, 8) + '...', 'data');

    // BOUTON: Rapport Simple
    var btnRapport = document.createElement("button");
    btnRapport.id = "rapport-simple-btn";
    btnRapport.innerText = "📊 RAPPORT SIMPLE";
    btnRapport.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 999999; background: linear-gradient(135deg, #00c853 0%, #64dd17 100%); color: white; padding: 12px 24px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(0, 200, 83, 0.4); font-size: 14px; transition: all 0.2s ease;';

    btnRapport.onmouseover = function() {
      btnRapport.style.transform = "translateY(-2px)";
      btnRapport.style.boxShadow = "0 6px 20px rgba(0, 200, 83, 0.6)";
    };

    btnRapport.onmouseout = function() {
      btnRapport.style.transform = "translateY(0)";
      btnRapport.style.boxShadow = "0 4px 15px rgba(0, 200, 83, 0.4)";
    };

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
    logToTerminal('[>] Cliquez pour generer le rapport', 'info');
  }

  // ============================================
  // INITIALISATION
  // ============================================
  setupInveriteMode();
})();
