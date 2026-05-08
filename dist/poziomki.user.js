// ==UserScript==
// @name         Poziomki DB v2.7
// @namespace    https://poziomki.info
// @version      2.7
// @description  Recumbent bikes database (English UI, Defunct Status, Global Legend)
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
  let CONFIG = { version: "2.7" };
  let ADS = {};

  const SK = 'poziomki_state_v2_7';
  let state = GM_getValue(SK, { collapsed: false, minKg: 0, filterType: 'all', filterProd: 'all', sortCol: 'p', sortDir: 1, searchStr: '' });
  function save() { GM_setValue(SK, state); }

  let host, shadow;

  function getSeasonTheme() {
      const month = new Date().getMonth();
      if (month >= 2 && month <= 4) return { g1: '#1b4d3e', g2: '#2a7c63', thBg: '#eefcf5', thTxt: '#1b4d3e' }; // Spring
      if (month >= 5 && month <= 7) return { g1: '#0f5b78', g2: '#1ba1d3', thBg: '#eef8fc', thTxt: '#0f5b78' }; // Summer
      if (month >= 8 && month <= 10) return { g1: '#5c3a21', g2: '#a46533', thBg: '#fdf7f2', thTxt: '#5c3a21' }; // Autumn
      return { g1: '#162b45', g2: '#2a6090', thBg: '#eef3fa', thTxt: '#162b45' }; // Winter
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
                      } catch (e) { reject(new Error('JSON Parse Error')); }
                  } else { reject(new Error('HTTP Error: ' + res.status)); }
              },
              onerror: () => reject(new Error('Network Error')), ontimeout: () => reject(new Error('Timeout'))
          });
      });
  }

  function getStyles(theme) {
    return `
      :host {
        --c-main: ${theme.g1};
        --c-grad: ${theme.g2};
        --c-th-bg: ${theme.thBg};
        --c-th-txt: ${theme.thTxt};
      }
      #pzk-container { position: fixed; top: 54px; right: 12px; width: 620px; height: 85vh; max-height: 800px; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13px; color: #1a1a2e; display: flex; flex-direction: column; background: transparent; filter: drop-shadow(0 10px 30px rgba(0,30,80,.2)); resize: horizontal; min-width: 450px; max-width: 95vw; }
      #pzk-container.col { height: 50px; min-height: 50px; max-height: 50px; }

      #pzk-titlebar { background: linear-gradient(135deg, var(--c-main) 0%, var(--c-grad) 100%); color: #fff; padding: 8px 14px; display: flex; align-items: center; gap: 10px; cursor: grab; user-select: none; flex-shrink: 0; height: 34px; border-radius: 12px 12px 0 0; border: 1px solid var(--c-main); border-bottom: none; transition: background 0.5s; }
      #pzk-container.col #pzk-titlebar { border-radius: 12px; border-bottom: 1px solid var(--c-main); }
      #pzk-titlebar:active { cursor: grabbing; }

      .logo-wrap { width: 26px; height: 26px; position: relative; flex-shrink: 0; }
      .hdr-logo { width: 65px; height: 65px; position: absolute; top: 0; left: 0; transform: scale(0.4); transform-origin: top left; border-radius: 15px; background: #fff; padding: 5px; object-fit: contain; transition: transform 0.2s; box-sizing: border-box; cursor: pointer; }
      .hdr-logo:hover { transform: scale(1); z-index: 9999; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }

      .avatar-wrap { width: 30px; height: 30px; position: relative; flex-shrink: 0; }
      .hdr-avatar { width: 75px; height: 75px; position: absolute; top: 0; right: 0; transform: scale(0.4); transform-origin: top right; border-radius: 50%; border: 5px solid rgba(255,255,255,0.9); object-fit: cover; background: #fff; transition: transform 0.2s; box-sizing: border-box; cursor: pointer; }
      .hdr-avatar:hover { transform: scale(1); z-index: 9999; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }

      #pzk-titlebar .title { font-weight: 700; font-size: 14px; white-space: nowrap; pointer-events: none; }
      #pzk-find-input { flex: 1; padding: 5px 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.3); font-size: 12px; background: rgba(0,0,0,0.2); color: #fff; outline: none; transition: 0.2s; }
      #pzk-find-input::placeholder { color: rgba(255,255,255,0.6); }
      #pzk-find-input:focus { background: #fff; color: #000; border-color: #fff; }
      #pzk-titlebar .badge { background: rgba(255,255,255,.2); border-radius: 10px; padding: 2px 8px; font-size: 11px; font-weight: 700; pointer-events: none; }
      #pzk-titlebar .xbtn { background: none; border: none; color: rgba(255,255,255,.6); font-size: 16px; cursor: pointer; padding: 0 4px; }
      #pzk-titlebar .xbtn:hover { color: #fff; }

      #pzk-mainframe { display: flex; flex-direction: column; flex: 1; overflow: hidden; background: #fff; border: 1px solid #c0cce0; border-top: none; border-radius: 0 0 12px 12px; }
      #pzk-container.col #pzk-mainframe { display: none; }

      .pzk-ctrl { padding: 8px 12px; display: flex; gap: 8px; background: #f4f7fb; border-bottom: 1px solid #e0e8f0; flex-shrink: 0; }
      .pzk-ctrl select, .pzk-ctrl input { padding: 5px 8px; border: 1px solid #c4d0e0; border-radius: 6px; min-width: 100px; font-size: 12px; }

      /* LEGEND (ENGLISH) */
      #pzk-legend-wrap { padding: 6px 12px; background: #fff; border-bottom: 1px solid #e0e8f0; flex-shrink: 0; font-size: 11px; }
      #pzk-legend-wrap summary { cursor: pointer; font-weight: 700; color: var(--c-main); user-select: none; outline: none; }
      .pzk-legend-grid { display: flex; flex-wrap: wrap; gap: 10px 15px; margin-top: 8px; padding: 8px; background: #f8fafc; border-radius: 6px; border: 1px dashed #c4d0e0; }
      .l-item { display: flex; align-items: center; gap: 6px; color: #445566; }
      .l-box { width: 12px; height: 12px; border-radius: 3px; border: 1px solid rgba(0,0,0,0.15); }

      .pzk-sys-card { background: #f8fafc; flex-shrink: 0; padding: 6px 12px; display: none; justify-content: center; align-items: center; }
      .pzk-sys-card img { max-width: 100%; max-height: 90px; object-fit: contain; border-radius: 6px; display: block; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: opacity 0.2s; }
      .pzk-sys-card a { display: block; width: 100%; transition: opacity 0.2s, transform 0.1s; text-decoration: none; }
      .pzk-sys-card a:hover { opacity: 0.9; transform: translateY(-1px); }
      #pzk-slot-alpha { border-bottom: 1px solid #e0e8f0; }
      #pzk-slot-beta { border-top: 1px solid #e0e8f0; }

      #pzk-grid-wrapper { flex: 1; overflow-y: auto; background: #fff; }
      #pzk-data-grid { width: 100%; border-collapse: collapse; table-layout: fixed; }
      #pzk-data-grid thead th { position: sticky; top: 0; background: var(--c-th-bg); font-size: 11px; font-weight: 700; padding: 8px 10px; text-align: left; cursor: pointer; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.05); color: var(--c-th-txt); text-transform: uppercase; transition: background 0.5s, color 0.5s; }
      #pzk-data-grid tbody tr { border-bottom: 1px solid #f0f4f8; }
      #pzk-data-grid tbody tr:hover td { background: #f8fafc; }
      #pzk-data-grid tbody tr.row-collab-yes td { background: #f0fdf4; }
      #pzk-data-grid tbody tr.row-collab-yes td.pdb-prod { border-left: 3px solid #22c55e; }
      #pzk-data-grid tbody tr.row-collab-closed td { background: #fff5f5; }
      #pzk-data-grid tbody tr.row-collab-closed td.pdb-prod { border-left: 3px solid #f87171; }
      #pzk-data-grid td { padding: 7px 10px; }

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
      .kg-e-badge { font-size: 10px; color: #64748b; font-weight: 700; margin-left: 4px; white-space: nowrap; }

      .pdb-link a { font-size: 11px; padding: 3px 8px; border: 1px solid #c0d0e4; border-radius: 5px; text-decoration: none; background: #f0f6ff; color: #1a4494; display: inline-block; text-align: center; min-width: 45px; font-weight: 600; }
      .pdb-link.arch a { background: #fdf5d8; border-color: #e4d498; color: #8a6a1c; }
      .pdb-link.check a { background: #f0e0fe; border-color: #d0b0f0; color: #6a10a0; }
      .f-offroad { font-size: 9px; background: #e0d0b0; padding: 2px 5px; border-radius: 4px; margin-left: 6px; color: #5a4010; font-weight: bold; }

      .pdb-foot { padding: 10px 14px; font-size: 11px; text-align: center; border-top: 1px solid #e8eef4; background: #f8fafc; flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; }
      .pdb-loading { padding: 30px; text-align: center; font-size: 14px; font-weight: bold; color: var(--c-main); }
      .error-msg { font-size: 12px; color: #cc0000; padding: 15px; background: #fff0f0; border: 1px solid #ffcccc; margin: 15px; border-radius: 8px; line-height: 1.5; }
    `;
  }

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
    const cntEl = shadow.getElementById('pzk-badge-num');
    if (cntEl) cntEl.textContent = rows.length;

    ['p', 'm', 'type', 'kg'].forEach(col => {
      const th = shadow.getElementById('pzk-s-' + (col === 'type' ? 't' : col === 'kg' ? 'k' : col));
      if (!th) return;
      let text = { p: 'Producer', m: 'Model', type: 'Type', kg: 'Max Load' }[col];
      if (state.sortCol === col) text += state.sortDir === 1 ? ' ↑' : ' ↓';
      th.textContent = text;
    });

    const tbody = shadow.getElementById('pzk-data-body');
    if (!tbody) return;

    tbody.innerHTML = rows.map(r => {
      const collab = COLLAB[r.p] || '';
      let kgClass = 'kg-none'; let kgText = 'N/A';
      if (r.kg > 0) {
        if (r.kg < 120) kgClass = 'kg-low'; else if (r.kg < 150) kgClass = 'kg-120plus'; else if (r.kg < 200) kgClass = 'kg-150plus'; else kgClass = 'kg-200plus';
        kgText = r.kg + ' kg';
        if (r.kg_e > 0) kgText += `<span class="kg-e-badge" title="E-assist load limit">(E: ${r.kg_e} kg)</span>`;
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
          if (defaultHTML) { el.innerHTML = defaultHTML; el.style.display = 'flex'; }
          else { el.style.display = 'none'; }
          return;
      }
      el.style.display = 'flex';
      if (adData.type === 'html') { el.innerHTML = adData.content || ''; }
      else if (adData.type === 'image') { el.innerHTML = `<a href="${adData.link}" target="_blank"><img src="${adData.image}" alt="Info"></a>`; }
  }

  function buildUI() {
    const wrap = document.createElement('div');
    wrap.id = 'pzk-container';
    if (state.collapsed) wrap.classList.add('col');

    const producers = ['all', ...new Set(DB.map(r => r.p))].sort((a,b) => a === 'all' ? -1 : a.localeCompare(b,'en'));

    wrap.innerHTML = `
      <div id="pzk-titlebar">
        <div class="logo-wrap"><img src="${LOGO_URL}" class="hdr-logo" alt="Logo"></div>
        <span class="title">Poziomki DB</span>
        <input type="text" id="pzk-find-input" placeholder="Search..." value="${state.searchStr || ''}">
        <span class="badge" id="pzk-badge-num" title="Models found">0</span>
        <div class="avatar-wrap"><img src="${AVATAR_URL}" class="hdr-avatar" alt="Author" onerror="if(this.src.includes('.jpg')){this.src=this.src.replace('.jpg','.png');}"></div>
        <span id="pzk-toggle-icon">${state.collapsed?'▲':'▼'}</span>
        <button class="xbtn" id="pzk-close-btn">✕</button>
      </div>
      <div id="pzk-mainframe">
        <div class="pzk-ctrl">
          <select id="pzk-sel-prod">${producers.map(p => `<option value="${p}"${p===state.filterProd?' selected':''}>${p==='all'?'All producers':p}</option>`).join('')}</select>
          <select id="pzk-sel-type">
            <option value="all">All types</option><option value="tadpole">Tadpole</option><option value="delta">Delta</option><option value="bike">Bike (2-wheel)</option><option value="quad">Quad</option><option value="velomobile">Velomobile</option><option value="handcycle">Handcycle</option>
          </select>
          <input type="number" id="pzk-inp-kg" placeholder="Min load (kg)" min="0" step="5" value="${state.minKg || ''}">
        </div>

        <details id="pzk-legend-wrap">
          <summary>📖 Legend & Symbols</summary>
          <div class="pzk-legend-grid">
             <div class="l-item"><div class="l-box" style="background:#e6fceb; border-color:#22c55e;"></div> Active Collaboration</div>
             <div class="l-item"><div class="l-box" style="background:#ffeaea; border-color:#f87171;"></div> Defunct / Inactive Producer</div>
             <div class="l-item"><span style="background:#fdf5d8; color:#8a6a1c; padding:2px 4px; border-radius:3px; border:1px solid #e4d498;">🗄 Arch</span> Archived Model (Discontinued)</div>
             <div class="l-item"><span style="background:#f0e0fe; color:#6a10a0; padding:2px 4px; border-radius:3px; border:1px solid #d0b0f0;">❓ Check</span> To be verified</div>
             <div class="l-item"><span style="background:#e0d0b0; color:#5a4010; padding:2px 4px; border-radius:3px; font-weight:bold;">OFFROAD</span> Off-road / Fatbike version</div>
             <div class="l-item"><strong>(E: 115 kg)</strong> E-assist load limit</div>
          </div>
        </details>

        <div id="pzk-slot-alpha" class="pzk-sys-card"></div>
        <div id="pzk-grid-wrapper"><table id="pzk-data-grid"><thead><tr><th id="pzk-s-p" style="width:25%;">Producer</th><th id="pzk-s-m" style="width:35%;">Model</th><th id="pzk-s-t" style="width:15%;">Type</th><th id="pzk-s-k" style="width:15%;">Max Load</th><th style="width:10%;">Link</th></tr></thead><tbody id="pzk-data-body"></tbody></table></div>
        <div id="pzk-slot-beta" class="pzk-sys-card"></div>

        <div class="pdb-foot">
          <span>Author: <strong>${CONFIG.author || 'phenix1'}</strong></span>
          <a href="${CONFIG.supportBtnLink || KOFI_URL}" target="_blank" style="color:${CONFIG.supportBtnColor || '#ff813f'}; font-weight:bold; text-decoration:none; border:1px solid currentColor; padding:4px 10px; border-radius:6px; background:#fff;">${CONFIG.supportBtnText || '☕ Support via Ko-fi'}</a>
        </div>
      </div>`;

    shadow.appendChild(wrap);
    shadow.getElementById('pzk-sel-type').value = state.filterType;
    const defaultHTMLTop = `<a href="https://sites.google.com/view/rzucamy-nozem/warsztaty-z-podstaw-rzucania-no%C5%BCem?pli=1" target="_blank" style="display:flex; justify-content:center; align-items:center; background:linear-gradient(90deg, #162b45 0%, #2a6090 100%); color:#fff; padding:12px; border-radius:6px; font-weight:bold; font-size:14px; text-shadow:0 1px 2px rgba(0,0,0,0.4); box-shadow:0 2px 8px rgba(0,0,0,0.15);">🎯 Warsztaty z podstaw rzucania nożem - Kliknij i sprawdź!</a>`;
    renderAdBlock(ADS.top, 'pzk-slot-alpha', defaultHTMLTop);
    renderAdBlock(ADS.bottom, 'pzk-slot-beta', '');

    const header = shadow.getElementById('pzk-titlebar');
    let isDragging = false; let hasDragged = false; let startX, startY, initialLeft, initialTop;
    header.addEventListener('mousedown', (e) => {
      if(e.target.closest('.logo-wrap') || e.target.closest('.avatar-wrap') || e.target.id === 'pzk-close-btn' || e.target.id === 'pzk-find-input') return;
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
      if(e.target.closest('.logo-wrap') || e.target.closest('.avatar-wrap') || e.target.id === 'pzk-close-btn' || e.target.id === 'pzk-find-input' || hasDragged) return;
      state.collapsed = !state.collapsed; wrap.classList.toggle('col');
      shadow.getElementById('pzk-toggle-icon').textContent = state.collapsed ? '▲' : '▼'; save();
    });
    shadow.getElementById('pzk-close-btn').addEventListener('click', () => host.remove());
    shadow.getElementById('pzk-find-input').addEventListener('input', e => { state.searchStr = e.target.value; save(); render(); });
    ['pzk-sel-prod','pzk-sel-type','pzk-inp-kg'].forEach(id => {
      shadow.getElementById(id).addEventListener('change', () => {
        state.filterProd = shadow.getElementById('pzk-sel-prod').value;
        state.filterType = shadow.getElementById('pzk-sel-type').value;
        state.minKg = parseInt(shadow.getElementById('pzk-inp-kg').value) || 0;
        save(); render();
      });
    });
    const doSort = (col) => {
      if (state.sortCol === col) state.sortDir *= -1; else { state.sortCol = col; state.sortDir = col==='kg' ? -1 : 1; }
      save(); render();
    };
    shadow.getElementById('pzk-s-p').addEventListener('click', () => doSort('p'));
    shadow.getElementById('pzk-s-m').addEventListener('click', () => doSort('m'));
    shadow.getElementById('pzk-s-t').addEventListener('click', () => doSort('type'));
    shadow.getElementById('pzk-s-k').addEventListener('click', () => doSort('kg'));
    render();
  }

  async function initApp() {
    if (!document.body) { setTimeout(initApp, 50); return; }
    if (document.getElementById('pzk-widget-host')) return;
    host = document.createElement('div');
    host.id = 'pzk-widget-host';
    host.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 2147483647;';
    document.body.appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });
    const theme = getSeasonTheme();
    const style = document.createElement('style');
    style.textContent = getStyles(theme);
    shadow.appendChild(style);
    const loadingWrap = document.createElement('div');
    loadingWrap.id = 'pzk-container';
    loadingWrap.innerHTML = `<div id="pzk-titlebar"><span class="title">Poziomki DB</span></div><div class="pdb-loading" style="color: var(--c-main);">Fetching data...</div>`;
    shadow.appendChild(loadingWrap);
    try {
      const [dbResponse, adsResponse] = await Promise.all([fetchJSON(JSON_URL), fetchJSON(ADS_URL).catch(e => { return {}; })]);
      if (Array.isArray(dbResponse)) { DB = dbResponse; }
      else { COLLAB = dbResponse.COLLAB || {}; DB = dbResponse.DB || []; CONFIG = dbResponse.CONFIG || CONFIG; }
      ADS = adsResponse || {};
      loadingWrap.remove(); buildUI();
    } catch (error) {
      loadingWrap.innerHTML = `<div id="pzk-titlebar"><span class="title">Poziomki DB Error</span></div><div class="error-msg"><strong>Critical Error:</strong><br>${error.message}</div>`;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp); else initApp();
})();
