// ==UserScript==
// @name         Poziomki DB v1.6
// @namespace    https://poziomki.info
// @version      1.6
// @description  Recumbent bikes database (Fixed Avatar, Added dynamic Ad Slots)
// @author       MBFeniks — Michał Berliński (phenix29@gmail.com)
// @match        *://*/*
// @exclude      *://raw.githubusercontent.com/*
// @exclude      *://github.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // --- DATABASE URL ---
  const JSON_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/data/db.json';
  
  // --- IMAGES ---
  const LOGO_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/logo.png';
  const AVATAR_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/me.png';
  const KOFI_URL = 'https://ko-fi.com/mbfeniks';

  let COLLAB = {};
  let DB = [];
  let CONFIG = { version: "1.6" };

  const SK = 'poziomki_state_v1_5';
  let state = GM_getValue(SK, { 
      collapsed: false, 
      minKg: 0, 
      filterType: 'all', 
      filterProd: 'all', 
      sortCol: 'p', 
      sortDir: 1,   
      searchStr: '' 
  });
  function save() { GM_setValue(SK, state); }

  const host = document.createElement('div');
  host.id = 'poziomki-host';
  host.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 2147483647;';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    #pdb-wrap {
      position: fixed; top: 54px; right: 12px; width: 620px; height: 85vh; max-height: 800px;
      font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13px; color: #1a1a2e;
      display: flex; flex-direction: column; background: #fff; border: 1px solid #c0cce0;
      border-radius: 12px; box-shadow: 0 10px 40px rgba(0,30,80,.15); overflow: hidden;
      resize: horizontal; min-width: 450px; max-width: 95vw;
    }
    #pdb-wrap.col { height: 50px; min-height: 50px; max-height: 50px; }
    #pdb-hdr { 
      background: linear-gradient(135deg, #162b45 0%, #2a6090 100%); color: #fff; 
      padding: 8px 14px; display: flex; align-items: center; gap: 10px; 
      cursor: grab; user-select: none; flex-shrink: 0; height: 34px;
    }
    #pdb-hdr:active { cursor: grabbing; }
    .hdr-logo { height: 26px; width: 26px; border-radius: 6px; background: #fff; padding: 2px; object-fit: contain; pointer-events: none; }
    .hdr-avatar { height: 30px; width: 30px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.8); object-fit: cover; pointer-events: none; background: #fff; }
    #pdb-hdr .title { font-weight: 700; font-size: 14px; white-space: nowrap; pointer-events: none; }
    
    #pdb-search {
      flex: 1; padding: 5px 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.3); 
      font-size: 12px; background: rgba(0,0,0,0.2); color: #fff; outline: none; transition: 0.2s;
    }
    #pdb-search::placeholder { color: rgba(255,255,255,0.6); }
    #pdb-search:focus { background: #fff; color: #000; border-color: #fff; }
    
    #pdb-hdr .badge { background: rgba(255,255,255,.2); border-radius: 10px; padding: 2px 8px; font-size: 11px; font-weight: 700; pointer-events: none; }
    #pdb-hdr .xbtn { background: none; border: none; color: rgba(255,255,255,.6); font-size: 16px; cursor: pointer; padding: 0 4px; }
    #pdb-hdr .xbtn:hover { color: #fff; }
    
    #pdb-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    #pdb-wrap.col #pdb-body { display: none; }
    
    .pdb-ctrl { padding: 8px 12px; display: flex; gap: 8px; background: #f4f7fb; border-bottom: 1px solid #e0e8f0; flex-shrink: 0; }
    .pdb-ctrl select, .pdb-ctrl input { padding: 5px 8px; border: 1px solid #c4d0e0; border-radius: 6px; min-width: 100px; font-size: 12px; }
    
    /* Sekcje Reklamowe */
    .pdb-ad { text-align: center; background: #f8fafc; display: none; flex-shrink: 0; padding: 5px; }
    .pdb-ad img { max-width: 100%; max-height: 70px; border-radius: 4px; display: inline-block; }
    #pdb-ad-top { border-bottom: 1px solid #e0e8f0; }
    #pdb-ad-bottom { border-top: 1px solid #e0e8f0; }
    
    #pdb-tbl-wrap { flex: 1; overflow-y: auto; background: #fff; }
    #pdb-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
    #pdb-tbl thead th { 
      position: sticky; top: 0; background: #eef3fa; font-size: 11px; font-weight: 700; 
      padding: 8px 10px; text-align: left; cursor: pointer; z-index: 10;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05); color: #2a6090; text-transform: uppercase;
    }
    #pdb-tbl tbody tr { border-bottom: 1px solid #f0f4f8; }
    #pdb-tbl tbody tr:hover td { background: #f8fafc; }
    #pdb-tbl tbody tr.row-collab-yes td { background: #f0fdf4; }
    #pdb-tbl tbody tr.row-collab-yes:hover td { background: #e6fceb; }
    #pdb-tbl tbody tr.row-collab-yes td.pdb-prod { border-left: 3px solid #22c55e; }
    #pdb-tbl tbody tr.row-collab-closed td { background: #fff5f5; }
    #pdb-tbl tbody tr.row-collab-closed:hover td { background: #ffeaea; }
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
  shadow.appendChild(style);

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

    const headers = { p: 'Producer', m: 'Model', type: 'Type', kg: 'Max Load' };
    ['p', 'm', 'type', 'kg'].forEach(col => {
      const th = shadow.getElementById('sort-' + (col === 'type' ? 't' : col === 'kg' ? 'k' : col));
      if (!th) return;
      let text = headers[col];
      if (state.sortCol === col) {
          text += state.sortDir === 1 ? ' ↑' : ' ↓';
      }
      th.textContent = text;
    });

    const tbody = shadow.getElementById('pdb-tbody');
    if (!tbody) return;

    tbody.innerHTML = rows.map(r => {
      const collab = COLLAB[r.p] || '';
      let kgClass = 'kg-none';
      let kgText = 'N/A';
      if (r.kg > 0) {
        kgText = r.kg + ' kg';
        if (r.kg < 120) kgClass = 'kg-low';
        else if (r.kg < 150) kgClass = 'kg-120plus';
        else if (r.kg < 200) kgClass = 'kg-150plus';
        else kgClass = 'kg-200plus';
      }
      let linkClass = '';
      let linkText = '↗ Link';
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

  function buildUI() {
    const wrap = document.createElement('div');
    wrap.id = 'pdb-wrap';
    if (state.collapsed) wrap.classList.add('col');
    
    const producers = ['all', ...new Set(DB.map(r => r.p))].sort((a,b) => a === 'all' ? -1 : a.localeCompare(b,'en'));
    
    wrap.innerHTML = `
      <div id="pdb-hdr">
        <img src="${LOGO_URL}" class="hdr-logo" alt="Logo">
        <span class="title">Poziomki DB</span>
        <input type="text" id="pdb-search" placeholder="Search..." value="${state.searchStr || ''}">
        <span class="badge" id="pdb-cnt" title="Models found">0</span>
        <img src="${AVATAR_URL}" class="hdr-avatar" alt="Author">
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
        
        <div id="pdb-ad-top" class="pdb-ad"></div>

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
        
        <div id="pdb-ad-bottom" class="pdb-ad"></div>

        <div class="pdb-foot">
          <span>Author: <strong>${CONFIG.author || 'phenix1'}</strong></span>
          <a href="${CONFIG.supportBtnLink || KOFI_URL}" target="_blank" style="color:${CONFIG.supportBtnColor || '#ff813f'}; font-weight:bold; text-decoration:none; border:1px solid currentColor; padding:4px 10px; border-radius:6px; background:#fff;">${CONFIG.supportBtnText || '☕ Support via Ko-fi'}</a>
        </div>
      </div>`;

    shadow.appendChild(wrap);
    shadow.getElementById('pdb-type').value = state.filterType;

    // --- ŁADOWANIE REKLAM Z JSON ---
    if (CONFIG.adTop) {
        const adTopEl = shadow.getElementById('pdb-ad-top');
        adTopEl.innerHTML = CONFIG.adTop;
        adTopEl.style.display = 'block';
    }
    if (CONFIG.adBottom) {
        const adBotEl = shadow.getElementById('pdb-ad-bottom');
        adBotEl.innerHTML = CONFIG.adBottom;
        adBotEl.style.display = 'block';
    }

    // --- DRAG & DROP ---
    const header = shadow.getElementById('pdb-hdr');
    let isDragging = false;
    let hasDragged = false;
    let startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', (e) => {
      if(e.target.id === 'pdb-x' || e.target.id === 'pdb-search') return;
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
      if(e.target.id === 'pdb-x' || e.target.id === 'pdb-search' || hasDragged) return;
      state.collapsed = !state.collapsed; wrap.classList.toggle('col'); 
      shadow.getElementById('pdb-arr').textContent = state.collapsed ? '▲' : '▼'; save();
    });

    shadow.getElementById('pdb-x').addEventListener('click', () => host.remove());

    shadow.getElementById('pdb-search').addEventListener('input', e => {
        state.searchStr = e.target.value; save(); render();
    });

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

  async function loadData() {
    const loadingWrap = document.createElement('div');
    loadingWrap.id = 'pdb-wrap';
    loadingWrap.innerHTML = `<div id="pdb-hdr"><span class="title">Poziomki DB</span></div><div class="pdb-loading" id="load-msg">Initializing...</div>`;
    shadow.appendChild(loadingWrap);

    try {
      shadow.getElementById('load-msg').textContent = "Fetching database...";
      const response = await fetch(JSON_URL);
      
      if (!response.ok) throw new Error(`Server returned ${response.status}. File not found.`);
      
      const data = await response.json();
      if (Array.isArray(data)) { DB = data; } 
      else { COLLAB = data.COLLAB || {}; DB = data.DB || []; CONFIG = data.CONFIG || CONFIG; }

      loadingWrap.remove();
      buildUI();
    } catch (error) {
      console.error("Poziomki DB Error:", error);
      loadingWrap.innerHTML = `<div id="pdb-hdr"><span class="title">Poziomki DB Error</span></div><div class="error-msg"><strong>Database not found!</strong><br>Please verify the URL:<br><i>${JSON_URL}</i></div>`;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadData); else loadData();
})();
