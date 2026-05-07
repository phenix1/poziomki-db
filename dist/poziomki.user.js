// ==UserScript==
// @name         Poziomki DB v2.4
// @namespace    https://poziomki.info
// @version      2.4
// @description  Recumbent bikes database (Seasons Themes, Stealth Ads, JSON Sanitizer)
// @author       MBFeniks — Michał Berliński (phenix29@gmail.com)
// @match        *://*/*
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

  const JSON_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/data/db.json';
  const ADS_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/data/ads.json?t=' + Date.now();
  
  const LOGO_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/logo.png';
  const AVATAR_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/me.jpg';
  const KOFI_URL = 'https://ko-fi.com/mbfeniks';

  let COLLAB = {};
  let DB = [];
  let CONFIG = { version: "2.4" };
  let ADS = {}; 

  const SK = 'poziomki_state_v2_3';
  let state = GM_getValue(SK, { collapsed: false, minKg: 0, filterType: 'all', filterProd: 'all', sortCol: 'p', sortDir: 1, searchStr: '' });
  function save() { GM_setValue(SK, state); }

  let host, shadow;

  // --- LOGIKA PÓR ROKU ---
  function getSeasonTheme() {
      const month = new Date().getMonth(); // 0 = Styczeń, 11 = Grudzień
      if (month >= 2 && month <= 4) {
          // Wiosna (Marzec - Maj)
          return { g1: '#1b4d3e', g2: '#2a7c63', thBg: '#eefcf5', thTxt: '#1b4d3e' };
      } else if (month >= 5 && month <= 7) {
          // Lato (Czerwiec - Sierpień)
          return { g1: '#0f5b78', g2: '#1ba1d3', thBg: '#eef8fc', thTxt: '#0f5b78' };
      } else if (month >= 8 && month <= 10) {
          // Jesień (Wrzesień - Listopad)
          return { g1: '#5c3a21', g2: '#a46533', thBg: '#fdf7f2', thTxt: '#5c3a21' };
      } else {
          // Zima (Grudzień - Luty)
          return { g1: '#162b45', g2: '#2a6090', thBg: '#eef3fa', thTxt: '#162b45' };
      }
  }

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

  // Wstrzykujemy zmienne CSS var(--g1) itp., które ustawimy dynamicznie
  const styleCSS = `
    #pdb-wrap { position: fixed; top: 54px; right: 12px; width: 620px; height: 85vh; max-height: 800px; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13px; color: #1a1a2e; display: flex; flex-direction: column; background: transparent; filter: drop-shadow(0 10px 30px rgba(0,30,80,.2)); resize: horizontal; min-width: 450px; max-width: 95vw; }
    #pdb-wrap.col { height: 50px; min-height: 50px; max-height: 50px; }
    
    /* Motyw napędzany zmiennymi CSS */
    #pdb-hdr { background: linear-gradient(135deg, var(--g1) 0%, var(--g2) 100%); color: #fff; padding: 8px 14px; display: flex; align-items: center; gap: 10px; cursor: grab; user-select: none; flex-shrink: 0; height: 34px; border-radius: 12px 12px 0 0; border: 1px solid var(--g1); border-bottom: none; transition: background 0.5s; }
    #pdb-wrap.col #pdb-hdr { border-radius: 12px; border-bottom: 1px solid var(--g1); }
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
    
    /* PANCERNY KAMUFLAŻ PRZED ADBLOCKIEM */
    .pdb-sys-card { background: #f8fafc; flex-shrink: 0; padding: 6px 12px; display: none; justify-content: center; align-items: center; }
    .pdb-sys-card img { max-width: 100%; max-height: 90px; object-fit: contain; border-radius: 6px; display: block; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: opacity 0.2s; }
    .pdb-sys-card a { display: block; width: 100%; transition: opacity 0.2s, transform 0.1s; text-decoration: none; }
    .pdb-sys-card a:hover { opacity: 0.9; transform: translateY(-1px); }
    .pdb-sys-card a:active { transform: translateY(1px); }
    #pdb-sys-inf1 { border-bottom: 1px solid #e0e8f0; }
    #pdb-sys-inf2 { border-top: 1px solid #e0e8f0; }
    
    #pdb-tbl-wrap { flex: 1; overflow-y: auto; background: #fff; }
    #pdb-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
    
    /* Nagłówki tabeli również dopasowują się do pory roku */
    #pdb-tbl thead th { position: sticky; top: 0; background: var(--thBg); font-size: 11px; font-weight: 700; padding: 8px 10px; text-align: left; cursor: pointer; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.05); color: var(--thTxt); text-transform: uppercase; transition: background 0.5s, color 0.5s; }
    
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
    .pdb-loading { padding: 30px; text-align: center; font-size: 14px; font-weight: bold; color: var(--g1); }
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

      return `
      <tr class="${collab === 'yes' ? 'row-collab-yes' : collab === 'closed' ? 'row-collab-closed' : ''}">
        <td class="pdb-prod">${r.p}</td>
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
