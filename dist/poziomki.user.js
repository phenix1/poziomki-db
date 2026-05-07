// ==UserScript==
// @name         Poziomki — baza rowerów leżą v1.3.3
// @namespace    https://poziomki.info
// @version      1.3.3
// @description  Baza rowerów poziomych (Poprawny użytkownik: phenix1)
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

  // --- POPRAWIONA ŚCIEŻKA (phenix1/poziomki-db) ---
  const JSON_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/data/db.json';

  let COLLAB = {};
  let DB = [];
  let CONFIG = { version: "1.3.3" };

  const SK = 'poziomki_v1';
  let state = GM_getValue(SK, { collapsed: false, minKg: 0, filterType: 'all', filterProd: 'all', sortCol: 'kg', sortDir: -1 });
  function save() { GM_setValue(SK, state); }

  const host = document.createElement('div');
  host.id = 'poziomki-host';
  host.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 2147483647;';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    #pdb-wrap {
      position: fixed; top: 54px; right: 12px; width: 560px; max-height: 90vh;
      font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13px; color: #1a1a2e;
      display: flex; flex-direction: column; background: #fff; border: 1.5px solid #c0cce0;
      border-radius: 12px; box-shadow: 0 8px 32px rgba(0,40,100,.14); overflow: hidden;
      resize: horizontal; min-width: 360px; max-width: 90vw;
    }
    #pdb-wrap.col { max-height: 48px; }
    #pdb-hdr { background: linear-gradient(135deg, #1a3a5c 0%, #2a6090 100%); color: #fff; padding: 10px 14px; display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; flex-shrink: 0; }
    #pdb-hdr .icon { font-size: 18px; line-height: 1; }
    #pdb-hdr .title { flex: 1; font-weight: 700; font-size: 13.5px; }
    #pdb-hdr .badge { background: rgba(255,255,255,.2); border-radius: 10px; padding: 1px 9px; font-size: 11px; font-weight: 700; }
    #pdb-hdr .xbtn { background: none; border: none; color: rgba(255,255,255,.6); font-size: 16px; cursor: pointer; padding: 0 2px; }
    #pdb-hdr .xbtn:hover { color: #fff; }
    #pdb-wrap.col #pdb-body { display: none; }
    #pdb-body { overflow-y: auto; overflow-x: hidden; flex: 1; }
    .pdb-ctrl { padding: 8px 12px; display: flex; gap: 5px; background: #f4f7fb; border-bottom: 1px solid #e0e8f0; }
    .pdb-ctrl select, .pdb-ctrl input { padding: 4px 7px; border: 1px solid #c4d0e0; border-radius: 6px; min-width: 90px; }
    .pdb-stat { padding: 5px 12px; font-size: 11px; color: #666; background: #f4f7fb; border-bottom: 1px solid #e0e8f0; }
    #pdb-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
    #pdb-tbl thead th { background: #eef3fa; font-size: 10px; font-weight: 700; padding: 6px 10px; text-align: left; cursor: pointer; position: sticky; top: 0; }
    #pdb-tbl tbody tr { border-bottom: 1px solid #f0f4f8; }
    #pdb-tbl tbody tr.row-collab-yes td { background: #f0fdf4; }
    #pdb-tbl tbody tr.row-collab-yes td.pdb-prod { border-left: 3px solid #22c55e; }
    #pdb-tbl tbody tr.row-collab-closed td { background: #fff5f5; }
    #pdb-tbl tbody tr.row-collab-closed td.pdb-prod { border-left: 3px solid #f87171; }
    #pdb-tbl td { padding: 6px 10px; }
    .pdb-prod { font-weight: 600; font-size: 12px; color: #1a3a5c; }
    .pdb-model { font-size: 13px; }
    .pdb-type { font-size: 10px; padding: 1px 6px; border-radius: 8px; font-weight: 600; }
    .t-tadpole { background: #e0eeff; color: #1a4494; } .t-delta { background: #fde8e0; color: #993020; }
    .t-bike { background: #e0f4e8; color: #1a6e40; } .t-quad { background: #f0e0fe; color: #6a10a0; }
    .pdb-kg { font-weight: 700; font-size: 12px; }
    .kg-none { color: #aaa; font-weight: normal; font-style: italic; }
    .kg-low { color: #994020; }
    .kg-120plus { color: #1a6e40; }
    .kg-150plus { color: #1a4494; }
    .kg-200plus { color: #6a10a0; }
    .pdb-link a { font-size: 11px; padding: 2px 8px; border: 1px solid #c0d0e4; border-radius: 5px; text-decoration: none; background: #f0f6ff; color: #1a4494; display: inline-block; text-align: center; width: 50px; }
    .pdb-link.arch a { background: #fdf5d8; border-color: #e4d498; color: #8a6a1c; }
    .pdb-link.check a { background: #f0e0fe; border-color: #d0b0f0; color: #6a10a0; }
    .f-offroad { font-size: 9px; background: #e0d0b0; padding: 1px 4px; border-radius: 4px; margin-left: 4px; color: #5a4010; font-weight: bold; }
    .pdb-foot { padding: 8px 12px; font-size: 11px; text-align: center; border-top: 1px solid #e8eef4; background: #f8fafc; }
    .pdb-loading { padding: 20px; text-align: center; font-size: 13px; font-weight: bold; color: #2a6090; }
    .error-msg { font-size: 11px; color: #cc0000; padding: 10px; background: #fff0f0; border: 1px solid #ffcccc; margin: 10px; border-radius: 6px; line-height: 1.4; }
    .url-debug { font-family: monospace; font-size: 10px; word-break: break-all; background: #eee; padding: 4px; display: block; margin-top: 5px; }
  `;
  shadow.appendChild(style);

  const TYPE_LABEL = { tadpole: 'Tadpole', delta: 'Delta', bike: '2-wheel', quad: 'Quad', velomobile: 'Velomobile', handcycle: 'Handcycle' };
  const TYPE_CLASS = { tadpole: 't-tadpole', delta: 't-delta', bike: 't-bike', quad: 't-quad' };

  function getFiltered() {
    return DB.filter(r => {
      if (state.filterType !== 'all' && r.type !== state.filterType) return false;
      if (state.filterProd !== 'all' && r.p !== state.filterProd) return false;
      if (state.minKg > 0 && r.kg < state.minKg) return false;
      return true;
    }).sort((a, b) => {
      let primary = state.sortDir * ((state.sortCol === 'kg') ? ((a.kg||0) - (b.kg||0)) : ((a[state.sortCol]||'').localeCompare(b[state.sortCol]||'', 'pl')));
      return primary !== 0 ? primary : a.p.localeCompare(b.p, 'pl') || a.m.localeCompare(b.m, 'pl');
    });
  }

  function render() {
    const rows = getFiltered();
    const cntEl = shadow.getElementById('pdb-cnt');
    const statEl = shadow.getElementById('pdb-stat');
    if (cntEl) cntEl.textContent = rows.length;
    if (statEl) statEl.textContent = `${rows.length} modeli · ${new Set(rows.map(r=>r.p)).size} marek`;

    const tbody = shadow.getElementById('pdb-tbody');
    if (!tbody) return;

    tbody.innerHTML = rows.map(r => {
      const collab = COLLAB[r.p] || '';
      let kgClass = 'kg-none';
      let kgText = 'no data';
      if (r.kg > 0) {
        kgText = r.kg + ' kg';
        if (r.kg < 120) kgClass = 'kg-low';
        else if (r.kg < 150) kgClass = 'kg-120plus';
        else if (r.kg < 200) kgClass = 'kg-150plus';
        else kgClass = 'kg-200plus';
      }
      let linkClass = '';
      let linkText = '↗ page';
      if (r.arch) { linkClass = 'arch'; linkText = '🗄 arch'; }
      if (r.check) { linkClass = 'check'; linkText = '❓ check'; }
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
    
    const producers = ['all', ...new Set(DB.map(r => r.p))].sort((a,b) => a === 'all' ? -1 : a.localeCompare(b,'pl'));
    
    wrap.innerHTML = `
      <div id="pdb-hdr"><span class="icon">🚴</span><span class="title">Poziomki — baza v${CONFIG.version}</span><span class="badge" id="pdb-cnt">0</span><span id="pdb-arr">${state.collapsed?'▲':'▼'}</span><button class="xbtn" id="pdb-x">✕</button></div>
      <div id="pdb-body">
        <div class="pdb-ctrl">
          <select id="pdb-prod">${producers.map(p => `<option value="${p}"${p===state.filterProd?' selected':''}>${p==='all'?'Wszyscy producenci':p}</option>`).join('')}</select>
          <select id="pdb-type">
            <option value="all">Wszystkie typy</option><option value="tadpole">Tadpole</option><option value="delta">Delta</option><option value="bike">Rower</option><option value="quad">Quad / inne</option><option value="velomobile">Velomobile</option><option value="handcycle">Handcycle</option>
          </select>
          <input type="number" id="pdb-kg" placeholder="Min. kg" min="0" step="5" value="${state.minKg || ''}">
        </div>
        <div class="pdb-stat" id="pdb-stat"></div>
        <table id="pdb-tbl">
          <thead><tr><th id="sort-p">Producent</th><th id="sort-m">Model</th><th id="sort-t">Typ</th><th id="sort-k">Nośność ↓</th><th>Link</th></tr></thead>
          <tbody id="pdb-tbody"></tbody>
        </table>
        <div class="pdb-foot">
          Autor: <strong>${CONFIG.author || 'MBFeniks'}</strong> · <a href="mailto:${CONFIG.contact || 'phenix29@gmail.com'}">Kontakt</a>
        </div>
      </div>`;

    shadow.appendChild(wrap);
    shadow.getElementById('pdb-type').value = state.filterType;

    shadow.getElementById('pdb-hdr').addEventListener('click', e => {
      if(e.target.id === 'pdb-x') return;
      state.collapsed = !state.collapsed; wrap.classList.toggle('col'); shadow.getElementById('pdb-arr').textContent = state.collapsed ? '▲' : '▼'; save();
    });
    shadow.getElementById('pdb-x').addEventListener('click', () => host.remove());

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
    loadingWrap.innerHTML = `<div id="pdb-hdr"><span class="icon">⏳</span><span class="title">Baza Poziomki</span></div><div class="pdb-loading" id="load-msg">Inicjalizacja...</div>`;
    shadow.appendChild(loadingWrap);

    try {
      shadow.getElementById('load-msg').textContent = "Pobieranie danych...";
      const response = await fetch(JSON_URL);
      
      if (!response.ok) {
          throw new Error(`Serwer zwrócił błąd ${response.status}. Plik nie istnieje pod tym adresem.`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) { DB = data; } 
      else { COLLAB = data.COLLAB || {}; DB = data.DB || []; CONFIG = data.CONFIG || CONFIG; }

      loadingWrap.remove();
      buildUI();
    } catch (error) {
      console.error("Błąd projektu Poziomki:", error);
      loadingWrap.innerHTML = `
        <div id="pdb-hdr"><span class="icon">❌</span><span class="title">Błąd ładowania</span></div>
        <div class="error-msg">
            <strong>Nie znaleziono bazy danych!</strong><br>
            Sprawdzany adres:<br>
            <span class="url-debug">${JSON_URL}</span>
        </div>
      `;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadData); else loadData();
})();
