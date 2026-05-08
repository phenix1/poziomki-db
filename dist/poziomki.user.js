// ==UserScript==
// @name         Poziomki DB v3.0 (Fleet Edition)
// @namespace    https://poziomki.info
// @version      3.0
// @description  Recumbent bikes database (Stealth Ads, Async Engine, Google Only)
// @author       MBFeniks — Michał Berliński (phenix29@gmail.com)
// @license      MIT
// @match        *://www.google.com/*
// @match        *://www.google.pl/*
// @exclude      *://raw.githubusercontent.com/*
// @exclude      *://github.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ==========================================
  // 1. KONFIGURACJA ZASOBÓW
  // ==========================================
  const manifestBaseUrl = "https://raw.githubusercontent.com/phenix1/poziomki-db/main/producers/";
  const ADS_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/data/ads.json?t=' + Date.now();

  const LOGO_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/logo.png';
  const AVATAR_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/me.jpg';
  const KOFI_URL = 'https://ko-fi.com/mbfeniks';

  let CONFIG = { version: "3.0", author: "MBFeniks" };
  let ADS = {};
  let DB = [];

  // Odtworzona lista współprac z oryginalnego pliku (do kolorowania wierszy)
  const COLLAB = {
    "Azub": "yes", "Birk": "closed", "Blackbird Bikes": "closed", "Challenge": "closed",
    "Flevobike": "closed", "Flux": "closed", "Go-One": "closed", "KMX": "closed",
    "Lightfoot Cycles": "closed", "Matix Bike": "yes", "Optima": "closed",
    "Pacific Cycles": "closed", "Podbike": "closed", "Zockra": "closed"
  };

  // Pełna lista 91 producentów z GitHuba
  // Pełna lista 92 producentów z GitHuba
  cconst fleetMakers = [
    "Aerorider", "Alligt", "Avatar 2000", "Avenue Trikes", "Azub", "Bacchetta", "BamBuk", "Barcroft",
    "BerkelBike", "BikeE", "Birk", "Birkenstock Bicycles", "Blackbird Bikes", "Burley", "Carbontrikes", "Catrike", "Challenge",
    "Counterpoint", "Cruzbike", "Cycle Genius", "Cycles JV Fenioux", "Dekers Bike", "Drymer", "ENVO",
    "Easy Racers", "Elan", "Flevobike", "Flux", "Freedom Ryder", "Go-One", "GreenSpeed", "HP Velotechnik",
    "Haluzak", "Hase Bikes", "ICE Trikes", "IN Trikes", "InterCityBike", "KMX", "Kamrad", "Katanga",
    "Kingcycle", "Lasher Sport", "Leiba", "Leitra", "Lightfoot Cycles", "Lightning", "Linear", "Longbikes",
    "M5", "Matix Bike", "Maxarya", "MetaBikes", "MoTrike", "Nazca", "ORSA Cycles", "Optima", "Pacific Cycles",
    "Pelso", "Performer", "Podbike", "PonyFour", "Quatrotech", "RAD-Innovations", "RANS", "Radius",
    "RaptoBike", "ReActive Adaptation", "Rotator", "Ryan Recumbents", "Räderwerk", "Sinner", "Slyway",
    "Snoek", "SpecBikeTechnics", "Sport-On", "Steintrikes", "SunSeeker", "TerraTrike", "Top End", "Toxy", "Trice",
    "Trident", "TrikExplor", "Trisled", "Utah Trikes", "Varibike", "Velokraft", "Velomobiel.nl",
    "Velomobile World", "Velomtek", "Vision", "Windcheetah", "Windwrap", "Wolf & Wolf", "Zockra"
  ];

  const fleetSources = fleetMakers.map(maker => `${manifestBaseUrl}${encodeURIComponent(maker)}.json`);

  // Słownik flag państwowych
  const originMap = {
    // Polska
    "Matix Bike": { c: "PL", f: "🇵🇱" }, "Dekers Bike": { c: "PL", f: "🇵🇱" }, "Kamrad": { c: "PL", f: "🇵🇱" },
    "Sport-On": { c: "PL", f: "🇵🇱" }, "Velokraft": { c: "PL", f: "🇵🇱" }, "IN Trikes": { c: "PL", f: "🇵🇱" },

    // USA
    "Avatar 2000": { c: "US", f: "🇺🇸" }, "Avenue Trikes": { c: "US", f: "🇺🇸" }, "Bacchetta": { c: "US", f: "🇺🇸" },
    "Barcroft": { c: "US", f: "🇺🇸" }, "BikeE": { c: "US", f: "🇺🇸" }, "Blackbird Bikes": { c: "US", f: "🇺🇸" },
    "Burley": { c: "US", f: "🇺🇸" }, "Catrike": { c: "US", f: "🇺🇸" }, "Counterpoint": { c: "US", f: "🇺🇸" },
    "Cruzbike": { c: "US", f: "🇺🇸" }, "Cycle Genius": { c: "US", f: "🇺🇸" }, "Easy Racers": { c: "US", f: "🇺🇸" },
    "Freedom Ryder": { c: "US", f: "🇺🇸" }, "Haluzak": { c: "US", f: "🇺🇸" }, "Lasher Sport": { c: "US", f: "🇺🇸" },
    "Lightfoot Cycles": { c: "US", f: "🇺🇸" }, "Lightning": { c: "US", f: "🇺🇸" }, "Linear": { c: "US", f: "🇺🇸" },
    "Longbikes": { c: "US", f: "🇺🇸" }, "RAD-Innovations": { c: "US", f: "🇺🇸" }, "ReActive Adaptation": { c: "US", f: "🇺🇸" },
    "Rotator": { c: "US", f: "🇺🇸" }, "Ryan Recumbents": { c: "US", f: "🇺🇸" }, "TerraTrike": { c: "US", f: "🇺🇸" },
    "Top End": { c: "US", f: "🇺🇸" }, "Trident": { c: "US", f: "🇺🇸" }, "Utah Trikes": { c: "US", f: "🇺🇸" },
    "Vision": { c: "US", f: "🇺🇸" }, "Windwrap": { c: "US", f: "🇺🇸" }, "RANS": { c: "US", f: "🇺🇸" },

    // Holandia
    "Aerorider": { c: "NL", f: "🇳🇱" }, "Alligt": { c: "NL", f: "🇳🇱" }, "BerkelBike": { c: "NL", f: "🇳🇱" },
    "Challenge": { c: "NL", f: "🇳🇱" }, "Drymer": { c: "NL", f: "🇳🇱" }, "Elan": { c: "NL", f: "🇳🇱" },
    "Flevobike": { c: "NL", f: "🇳🇱" }, "InterCityBike": { c: "NL", f: "🇳🇱" }, "M5": { c: "NL", f: "🇳🇱" },
    "Nazca": { c: "NL", f: "🇳🇱" }, "Optima": { c: "NL", f: "🇳🇱" }, "Quatrotech": { c: "NL", f: "🇳🇱" },
    "RaptoBike": { c: "NL", f: "🇳🇱" }, "Sinner": { c: "NL", f: "🇳🇱" }, "Snoek": { c: "NL", f: "🇳🇱" },
    "Velomobiel.nl": { c: "NL", f: "🇳🇱" },

    // Niemcy
    "BamBuk": { c: "DE", f: "🇩🇪" }, "Flux": { c: "DE", f: "🇩🇪" }, "Go-One": { c: "DE", f: "🇩🇪" },
    "Hase Bikes": { c: "DE", f: "🇩🇪" }, "HP Velotechnik": { c: "DE", f: "🇩🇪" }, "Leiba": { c: "DE", f: "🇩🇪" },
    "Räderwerk": { c: "DE", f: "🇩🇪" }, "Radius": { c: "DE", f: "🇩🇪" }, "Toxy": { c: "DE", f: "🇩🇪" },
    "Varibike": { c: "DE", f: "🇩🇪" },

    // Wielka Brytania
    "ICE Trikes": { c: "GB", f: "🇬🇧" }, "Kingcycle": { c: "GB", f: "🇬🇧" }, "KMX": { c: "GB", f: "🇬🇧" },
    "Trice": { c: "GB", f: "🇬🇧" }, "Windcheetah": { c: "GB", f: "🇬🇧" },

    // Szwajcaria
    "Birk": { c: "CH", f: "🇨🇭" }, "ORSA Cycles": { c: "CH", f: "🇨🇭" }, "Wolf & Wolf": { c: "CH", f: "🇨🇭" },

    // Czechy
    "Azub": { c: "CZ", f: "🇨🇿" }, "Katanga": { c: "CZ", f: "🇨🇿" },

    // Kanada
    "ENVO": { c: "CA", f: "🇨🇦" }, "Maxarya": { c: "CA", f: "🇨🇦" },

    // Australia
    "GreenSpeed": { c: "AU", f: "🇦🇺" }, "Trisled": { c: "AU", f: "🇦🇺" },

    // Chiny
    "MoTrike": { c: "CN", f: "🇨🇳" }, "TrikExplor": { c: "CN", f: "🇨🇳" },

      // Francja
    "Cycles JV Fenioux": { c: "FR", f: "🇫🇷" }, "Zockra": { c: "FR", f: "🇫🇷" },

    // Pozostałe Kraje
    "Leitra": { c: "DK", f: "🇩🇰" }, // Dania
    "MetaBikes": { c: "ES", f: "🇪🇸" }, // Hiszpania
    "Slyway": { c: "IT", f: "🇮🇹" }, // Włochy
    "SpecBikeTechnics": { c: "LV", f: "🇱🇻" }, // Łotwa
    "Pelso": { c: "HU", f: "🇭🇺" }, // Węgry
    "Pacific Cycles": { c: "TW", f: "🇹🇼" }, // Tajwan
    "Performer": { c: "TW", f: "🇹🇼" }, // Tajwan
    "PonyFour": { c: "BE", f: "🇧🇪" }, // Belgia (Velamo)
    "Podbike": { c: "NO", f: "🇳🇴" }, // Norwegia
    "Steintrikes": { c: "RS", f: "🇷🇸" }, // Serbia
    "Velomobile World": { c: "RO", f: "🇷🇴" }, // Rumunia
    "Carbontrikes": { c: "SE", f: "🇸🇪" }, // Szwecja
    "SunSeeker": { c: "US", f: "🇺🇸" },
    "Velomtek": { c: "CA", f: "🇨🇦" },
    "Birkenstock Bicycles": { c: "CH", f: "🇨🇭" },
    
    // Domyślna flaga dla ew. przyszłych braków
    "default": { c: "UN", f: "🏳️" }
  };

  const SK = 'poziomki_state_v3_0';
  let state = GM_getValue(SK, { collapsed: false, minKg: 0, filterType: 'all', filterProd: 'all', sortCol: 'p', sortDir: 1, searchStr: '' });
  function save() { GM_setValue(SK, state); }

  let host, shadow;

  // ==========================================
  // 2. SILNIK POBIERANIA (Z ODKURZACZEM JSON)
  // ==========================================
  function fetchJSON(url) {
      return new Promise((resolve, reject) => {
          GM_xmlhttpRequest({
              method: 'GET', url: url,
              onload: (res) => {
                  if (res.status >= 200 && res.status < 300) {
                      try {
                          const cleanedText = res.responseText.replace(/[\u00A0\u200B]/g, ' ');
                          resolve(JSON.parse(cleanedText));
                      } catch (e) {
                          reject(new Error('Błąd JSON'));
                      }
                  } else { reject(new Error('Błąd HTTP: ' + res.status)); }
              },
              onerror: () => reject(new Error('Błąd sieci.')), ontimeout: () => reject(new Error('Przekroczono czas.'))
          });
      });
  }

  // ==========================================
  // 3. STYLE CSS (Twoje oryginalne)
  // ==========================================
  const styleCSS = `
    #pdb-wrap { position: fixed; top: 54px; right: 12px; width: 620px; height: 85vh; max-height: 800px; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13px; color: #1a1a2e; display: flex; flex-direction: column; background: transparent; filter: drop-shadow(0 10px 30px rgba(0,30,80,.2)); resize: horizontal; min-width: 450px; max-width: 95vw; }
    #pdb-wrap.col { height: 50px; min-height: 50px; max-height: 50px; }
    #pdb-hdr { background: linear-gradient(135deg, #162b45 0%, #2a6090 100%); color: #fff; padding: 8px 14px; display: flex; align-items: center; gap: 10px; cursor: grab; user-select: none; flex-shrink: 0; height: 34px; border-radius: 12px 12px 0 0; border: 1px solid #162b45; border-bottom: none; }
    #pdb-wrap.col #pdb-hdr { border-radius: 12px; border-bottom: 1px solid #162b45; }
    #pdb-hdr:active { cursor: grabbing; }

    .logo-wrap { width: 26px; height: 26px; position: relative; flex-shrink: 0; }
    .hdr-logo { width: 65px; height: 65px; position: absolute; top: 0; left: 0; transform: scale(0.4); transform-origin: top left; border-radius: 15px; background: #fff; padding: 5px; object-fit: contain; transition: transform 0.2s; box-sizing: border-box; cursor: pointer; }
    .hdr-logo:hover { transform: scale(1); z-index: 9999; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }

    .avatar-wrap { width: 30px; height: 30px; position: relative; flex-shrink: 0; }
    .hdr-avatar { width: 75px; height: 75px; position: absolute; top: 0; right: 0; transform: scale(0.4); transform-origin: top right; border-radius: 50%; border: 5px solid rgba(255,255,255,0.9); object-fit: cover; background: #fff; transition: transform 0.2s; box-sizing: border-box; cursor: pointer; }
    .hdr-avatar:hover { transform: scale(1); z-index: 9999; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }

    #pdb-hdr .title { font-weight: 700; font-size: 14px; white-space: nowrap; pointer-events: none; }
    #pdb-search { flex: 1; padding: 5px 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.3); font-size: 12px; background: rgba(0,0,0,0.2); color: #fff; outline: none; transition: 0.2s; }
    #pdb-search::placeholder { color: rgba(255,255,255,0.6); }
    #pdb-search:focus { background: #fff; color: #000; border-color: #fff; }
    #pdb-hdr .badge { background: rgba(255,255,255,.2); border-radius: 10px; padding: 2px 8px; font-size: 11px; font-weight: 700; pointer-events: none; }
    #pdb-hdr .xbtn { background: none; border: none; color: rgba(255,255,255,.6); font-size: 16px; cursor: pointer; padding: 0 4px; }
    #pdb-hdr .xbtn:hover { color: #fff; }

    #pdb-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; background: #fff; border: 1px solid #c0cce0; border-top: none; border-radius: 0 0 12px 12px; }
    #pdb-wrap.col #pdb-body { display: none; }

    .pdb-ctrl { padding: 8px 12px; display: flex; gap: 8px; background: #f4f7fb; border-bottom: 1px solid #e0e8f0; flex-shrink: 0; }
    .pdb-ctrl select, .pdb-ctrl input { padding: 5px 8px; border: 1px solid #c4d0e0; border-radius: 6px; min-width: 100px; font-size: 12px; }

    .pdb-sys-card { background: #f8fafc; flex-shrink: 0; padding: 6px 12px; display: none; justify-content: center; align-items: center; }
    .pdb-sys-card img { max-width: 100%; max-height: 90px; object-fit: contain; border-radius: 6px; display: block; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: opacity 0.2s; }
    .pdb-sys-card a { display: block; width: 100%; transition: opacity 0.2s, transform 0.1s; text-decoration: none; }
    .pdb-sys-card a:hover { opacity: 0.9; transform: translateY(-1px); }
    .pdb-sys-card a:active { transform: translateY(1px); }
    #pdb-sys-inf1 { border-bottom: 1px solid #e0e8f0; }
    #pdb-sys-inf2 { border-top: 1px solid #e0e8f0; }

    #pdb-tbl-wrap { flex: 1; overflow-y: auto; background: #fff; }
    #pdb-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
    #pdb-tbl thead th { position: sticky; top: 0; background: #eef3fa; font-size: 11px; font-weight: 700; padding: 8px 10px; text-align: left; cursor: pointer; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.05); color: #2a6090; text-transform: uppercase; }
    #pdb-tbl tbody tr { border-bottom: 1px solid #f0f4f8; }
    #pdb-tbl tbody tr:hover td { background: #f8fafc; }
    #pdb-tbl tbody tr.row-collab-yes td { background: #f0fdf4; }
    #pdb-tbl tbody tr.row-collab-yes td.pdb-prod { border-left: 3px solid #22c55e; }
    #pdb-tbl tbody tr.row-collab-closed td { background: #fff5f5; }
    #pdb-tbl tbody tr.row-collab-closed td.pdb-prod { border-left: 3px solid #f87171; }
    #pdb-tbl td { padding: 7px 10px; }

    .pdb-prod { font-weight: 600; font-size: 12px; color: #1a3a5c; }
    .pdb-model { font-size: 13px; font-weight: 500; }
    .pdb-type { font-size: 10px; padding: 2px 6px; border-radius: 8px; font-weight: 600; }
    .t-tadpole { background: #e0eeff; color: #1a4494; } .t-delta { background: #fde8e0; color: #993020; }
    .t-bike { background: #e0f4e8; color: #1a6e40; } .t-quad { background: #f0e0fe; color: #6a10a0; }

    .pdb-kg { font-weight: 700; font-size: 12px; }
    .kg-none { color: #aaa; font-weight: normal; font-style: italic; }
    .kg-low { color: #994020; }
    .kg-120plus { color: #1a6e40; }
    .kg-150plus { color: #1a4494; }
    .kg-200plus { color: #6a10a0; }

    .pdb-link a { font-size: 11px; padding: 3px 8px; border: 1px solid #c0d0e4; border-radius: 5px; text-decoration: none; background: #f0f6ff; color: #1a4494; display: inline-block; text-align: center; min-width: 45px; font-weight: 600; }
    .pdb-link.arch a { background: #fdf5d8; border-color: #e4d498; color: #8a6a1c; }
    .pdb-link.check a { background: #f0e0fe; border-color: #d0b0f0; color: #6a10a0; }
    .f-offroad { font-size: 9px; background: #e0d0b0; padding: 2px 5px; border-radius: 4px; margin-left: 6px; color: #5a4010; font-weight: bold; }

    .pdb-foot { padding: 10px 14px; font-size: 11px; text-align: center; border-top: 1px solid #e8eef4; background: #f8fafc; flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; }
    .pdb-loading { padding: 30px; text-align: center; font-size: 14px; font-weight: bold; color: #2a6090; }
    .error-msg { font-size: 12px; color: #cc0000; padding: 15px; background: #fff0f0; border: 1px solid #ffcccc; margin: 15px; border-radius: 8px; line-height: 1.5; }
  `;

  const TYPE_LABEL = { tadpole: 'Tadpole', delta: 'Delta', bike: '2-wheel', quad: 'Quad', velomobile: 'Velomobile', handcycle: 'Handcycle' };
  const TYPE_CLASS = { tadpole: 't-tadpole', delta: 't-delta', bike: 't-bike', quad: 't-quad' };

  function getFiltered() {
    return DB.filter(r => {
      if (state.filterType !== 'all' && r.type !== state.filterType) return false;
      if (state.filterProd !== 'all' && r.p !== state.filterProd) return false;
      if (state.minKg > 0 && r.kg < state.minKg) return false;
      if (state.searchStr) {
          const s = state.searchStr.toLowerCase();
          if (!r.p.toLowerCase().includes(s) && !r.m.toLowerCase().includes(s)) return false;
      }
      return true;
    }).sort((a, b) => {
      let primary = state.sortDir * ((state.sortCol === 'kg') ? ((a.kg||0) - (b.kg||0)) : ((a[state.sortCol]||'').localeCompare(b[state.sortCol]||'', 'en')));
      return primary !== 0 ? primary : a.p.localeCompare(b.p, 'en') || a.m.localeCompare(b.m, 'en');
    });
  }

  function render() {
    const rows = getFiltered();
    const cntEl = shadow.getElementById('pdb-cnt');
    if (cntEl) cntEl.textContent = rows.length;

    ['p', 'm', 'type', 'kg'].forEach(col => {
      const th = shadow.getElementById('sort-' + (col === 'type' ? 't' : col === 'kg' ? 'k' : col));
      if (!th) return;
      let text = { p: 'Producer', m: 'Model', type: 'Type', kg: 'Max Load' }[col];
      if (state.sortCol === col) text += state.sortDir === 1 ? ' ↑' : ' ↓';
      th.textContent = text;
    });

    const tbody = shadow.getElementById('pdb-tbody');
    if (!tbody) return;

    tbody.innerHTML = rows.map(r => {
      const collab = COLLAB[r.p] || '';
      let kgClass = 'kg-none'; let kgText = 'N/A';
      if (r.kg > 0) {
        kgText = r.kg + ' kg';
        if (r.kg < 120) kgClass = 'kg-low'; else if (r.kg < 150) kgClass = 'kg-120plus'; else if (r.kg < 200) kgClass = 'kg-150plus'; else kgClass = 'kg-200plus';
      }
      let linkClass = ''; let linkText = '↗ Link';
      if (r.arch) { linkClass = 'arch'; linkText = '🗄 Arch'; }
      if (r.check) { linkClass = 'check'; linkText = '❓ Check'; }
      const offroadHtml = r.offroad ? `<span class="f-offroad">OFFROAD</span>` : '';

      // Dodana flaga kraju
      let origin = originMap[r.p] || originMap["default"];

      return `
      <tr class="${collab === 'yes' ? 'row-collab-yes' : collab === 'closed' ? 'row-collab-closed' : ''}">
        <td class="pdb-prod" title="${origin.c}">${origin.f} ${r.p}</td>
        <td class="pdb-model">${r.m} ${offroadHtml}</td>
        <td><span class="pdb-type ${TYPE_CLASS[r.type]||''}">${TYPE_LABEL[r.type]||r.type}</span></td>
        <td><span class="pdb-kg ${kgClass}">${kgText}</span></td>
        <td class="pdb-link ${linkClass}"><a href="${r.url}" target="_blank" title="${r.url}">${linkText}</a></td>
      </tr>`;
    }).join('');
  }

  function renderAdBlock(adData, elementId, defaultHTML = '') {
      const el = shadow.getElementById(elementId);
      if (!el) return;

      if (!adData || !adData.active) {
          if (defaultHTML) {
              el.innerHTML = defaultHTML;
              el.style.display = 'flex';
          } else {
              el.style.display = 'none';
          }
          return;
      }

      el.style.display = 'flex';
      if (adData.type === 'html') {
          el.innerHTML = adData.content || '';
      } else if (adData.type === 'image') {
          el.innerHTML = `<a href="${adData.link}" target="_blank"><img src="${adData.image}" alt="Info"></a>`;
      }
  }

  function buildUI() {
    const wrap = document.createElement('div');
    wrap.id = 'pdb-wrap';
    if (state.collapsed) wrap.classList.add('col');

    const producers = ['all', ...new Set(DB.map(r => r.p))].sort((a,b) => a === 'all' ? -1 : a.localeCompare(b,'en'));

    wrap.innerHTML = `
      <div id="pdb-hdr">
        <div class="logo-wrap"><img src="${LOGO_URL}" class="hdr-logo" alt="Logo"></div>
        <span class="title">Poziomki DB</span>
        <input type="text" id="pdb-search" placeholder="Search..." value="${state.searchStr || ''}">
        <span class="badge" id="pdb-cnt" title="Models found">0</span>
        <div class="avatar-wrap"><img src="${AVATAR_URL}" class="hdr-avatar" alt="Author" onerror="if(this.src.includes('.jpg')){this.src=this.src.replace('.jpg','.png');}"></div>
        <span id="pdb-arr">${state.collapsed?'▲':'▼'}</span>
        <button class="xbtn" id="pdb-x">✕</button>
      </div>
      <div id="pdb-body">
        <div class="pdb-ctrl">
          <select id="pdb-prod">${producers.map(p => `<option value="${p}"${p===state.filterProd?' selected':''}>${p==='all'?'All producers':p}</option>`).join('')}</select>
          <select id="pdb-type">
            <option value="all">All types</option><option value="tadpole">Tadpole</option><option value="delta">Delta</option><option value="bike">Bike (2-wheel)</option><option value="quad">Quad</option><option value="velomobile">Velomobile</option><option value="handcycle">Handcycle</option>
          </select>
          <input type="number" id="pdb-kg" placeholder="Min load (kg)" min="0" step="5" value="${state.minKg || ''}">
        </div>

        <div id="pdb-sys-inf1" class="pdb-sys-card"></div>

        <div id="pdb-tbl-wrap">
          <table id="pdb-tbl">
            <thead><tr>
              <th id="sort-p" style="width:25%;">Producer</th>
              <th id="sort-m" style="width:35%;">Model</th>
              <th id="sort-t" style="width:15%;">Type</th>
              <th id="sort-k" style="width:15%;">Max Load</th>
              <th style="width:10%;">Link</th>
            </tr></thead>
            <tbody id="pdb-tbody"></tbody>
          </table>
        </div>

        <div id="pdb-sys-inf2" class="pdb-sys-card"></div>

        <div class="pdb-foot">
          <span>Author: <strong>${CONFIG.author || 'MBFeniks'}</strong></span>
          <a href="${CONFIG.supportBtnLink || KOFI_URL}" target="_blank" style="color:${CONFIG.supportBtnColor || '#ff813f'}; font-weight:bold; text-decoration:none; border:1px solid currentColor; padding:4px 10px; border-radius:6px; background:#fff;">${CONFIG.supportBtnText || '☕ Support via Ko-fi'}</a>
        </div>
      </div>`;

    shadow.appendChild(wrap);
    shadow.getElementById('pdb-type').value = state.filterType;

    const defaultHTMLTop = `
       <a href="https://sites.google.com/view/rzucamy-nozem/warsztaty-z-podstaw-rzucania-no%C5%BCem?pli=1" target="_blank" style="display:flex; justify-content:center; align-items:center; background:linear-gradient(90deg, #162b45 0%, #2a6090 100%); color:#fff; padding:12px; border-radius:6px; font-weight:bold; font-size:14px; text-shadow:0 1px 2px rgba(0,0,0,0.4); box-shadow:0 2px 8px rgba(0,0,0,0.15);">
          🎯 Warsztaty z podstaw rzucania nożem - Kliknij i sprawdź!
       </a>
    `;

    renderAdBlock(ADS.top, 'pdb-sys-inf1', defaultHTMLTop);
    renderAdBlock(ADS.bottom, 'pdb-sys-inf2', '');

    const header = shadow.getElementById('pdb-hdr');
    let isDragging = false; let hasDragged = false; let startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', (e) => {
      if(e.target.closest('.logo-wrap') || e.target.closest('.avatar-wrap') || e.target.id === 'pdb-x' || e.target.id === 'pdb-search') return;
      isDragging = true; hasDragged = false; startX = e.clientX; startY = e.clientY;
      const rect = wrap.getBoundingClientRect();
      initialLeft = rect.left; initialTop = rect.top;
      wrap.style.right = 'auto'; wrap.style.left = initialLeft + 'px'; wrap.style.top = initialTop + 'px';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX; const dy = e.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;
      if (hasDragged) { wrap.style.left = (initialLeft + dx) + 'px'; wrap.style.top = (initialTop + dy) + 'px'; }
    });
    document.addEventListener('mouseup', () => { isDragging = false; });
    header.addEventListener('click', e => {
      if(e.target.closest('.logo-wrap') || e.target.closest('.avatar-wrap') || e.target.id === 'pdb-x' || e.target.id === 'pdb-search' || hasDragged) return;
      state.collapsed = !state.collapsed; wrap.classList.toggle('col');
      shadow.getElementById('pdb-arr').textContent = state.collapsed ? '▲' : '▼'; save();
    });
    shadow.getElementById('pdb-x').addEventListener('click', () => host.remove());
    shadow.getElementById('pdb-search').addEventListener('input', e => { state.searchStr = e.target.value; save(); render(); });

    ['pdb-prod','pdb-type','pdb-kg'].forEach(id => {
      shadow.getElementById(id).addEventListener('change', () => {
        state.filterProd = shadow.getElementById('pdb-prod').value;
        state.filterType = shadow.getElementById('pdb-type').value;
        state.minKg = parseInt(shadow.getElementById('pdb-kg').value) || 0;
        save(); render();
      });
    });

    const doSort = (col) => {
      if (state.sortCol === col) state.sortDir *= -1; else { state.sortCol = col; state.sortDir = col==='kg' ? -1 : 1; }
      save(); render();
    };
    shadow.getElementById('sort-p').addEventListener('click', () => doSort('p'));
    shadow.getElementById('sort-m').addEventListener('click', () => doSort('m'));
    shadow.getElementById('sort-t').addEventListener('click', () => doSort('type'));
    shadow.getElementById('sort-k').addEventListener('click', () => doSort('kg'));

    render();
  }

  // ==========================================
  // 4. INICJALIZACJA APLIKACJI (Główna Zmiana)
  // ==========================================
  async function initApp() {
    if (!document.body) { setTimeout(initApp, 50); return; }
    if (document.getElementById('poziomki-host')) return;

    host = document.createElement('div');
    host.id = 'poziomki-host';
    host.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 2147483647;';
    document.body.appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = styleCSS;
    shadow.appendChild(style);

    const loadingWrap = document.createElement('div');
    loadingWrap.id = 'pdb-wrap';
    loadingWrap.innerHTML = `<div id="pdb-hdr"><span class="title">Poziomki DB</span></div><div class="pdb-loading" id="load-msg">Inicjalizacja i pobieranie danych floty...</div>`;
    shadow.appendChild(loadingWrap);

    try {
      // Pobieranie ads.json jako pierwszego elementu
      const adPromise = fetchJSON(ADS_URL).catch(() => ({}));

      // Tworzenie promise'ów dla wszystkich plików floty
      const fleetPromises = fleetSources.map(url => fetchJSON(url).catch(() => []));

      // Uruchomienie JEDNOCZEŚNIE wszystkich zapytań (91 firm + reklamy)
      const [adsResponse, ...fleetResponses] = await Promise.all([adPromise, ...fleetPromises]);

      ADS = adsResponse || {};

      // Łączenie rozbitych plików w jedną bazę DB
      DB = [];
      fleetResponses.forEach(part => {
          if (Array.isArray(part)) {
              DB = DB.concat(part);
          }
      });

      loadingWrap.remove();
      buildUI();
    } catch (error) {
      console.error("Poziomki DB Error:", error);
      loadingWrap.innerHTML = `<div id="pdb-hdr"><span class="title">Poziomki DB Error</span></div><div class="error-msg"><strong>Błąd krytyczny bazy:</strong><br>${error.message}</div>`;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp); else initApp();
})();
