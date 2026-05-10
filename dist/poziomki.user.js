// ==UserScript==
// @name         Poziomki DB v3.5.13 (Ultimate Edition + Ads + Offline Cache)
// @namespace    https://poziomki.info
// @version      3.5.13
// @description  Recumbent bikes database with Google Sheets Backend, Ads and Offline Anti-Ban Cache
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
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ==========================================
  // 1. KONFIGURACJA API BACKENDU
  // ==========================================
  const MODERATION_URL = "https://script.google.com/macros/s/AKfycbyrdgmIVwD2rM3W-pf3CXo1zx924Ibyg5mJrjXwkMyO20kGU7XVxWZyq5he38iJ3s7meQ/exec";
  
  // ==========================================
  // 2. DYNAMICZNA SZATA GRAFICZNA
  // ==========================================
  const currentMonth = new Date().getMonth();
  let theme = { hdrBg: 'linear-gradient(135deg, #162b45 0%, #2a6090 100%)', thColor: '#2a6090', thBg: '#eef3fa', btnBg: '#f0f6ff', btnColor: '#1a4494', btnBorder: '#c0d0e4' };

  if (currentMonth === 11 || currentMonth === 0 || currentMonth === 1) { 
    theme = { hdrBg: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', thColor: '#203a43', thBg: '#f0f4f8', btnBg: '#f0f4f8', btnColor: '#2c5364', btnBorder: '#cbd5e1' };
  } else if (currentMonth === 2 || currentMonth === 3 || currentMonth === 4) { 
    theme = { hdrBg: 'linear-gradient(135deg, #1b4d3e 0%, #57b85d 100%)', thColor: '#1b4d3e', thBg: '#eef9f1', btnBg: '#eef9f1', btnColor: '#1b4d3e', btnBorder: '#c2e9cb' };
  } else if (currentMonth === 8 || currentMonth === 9 || currentMonth === 10) { 
    theme = { hdrBg: 'linear-gradient(135deg, #870f0f 0%, #d35400 100%)', thColor: '#870f0f', thBg: '#fff5f5', btnBg: '#fffbf0', btnColor: '#b33939', btnBorder: '#ebd07f' };
  }

  // ==========================================
  // 3. ZASOBY I FLOTA
  // ==========================================
  const manifestBaseUrl = "https://raw.githubusercontent.com/phenix1/poziomki-db/main/producers/";
  const LOGO_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/logo.png';
  const AVATAR_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/me.jpg';
  const KOFI_URL = 'https://ko-fi.com/mbfeniks';

  let CONFIG = { version: "3.5.13", author: "MBFeniks" };
  let ADS = [];
  let DB = [];

  const COLLAB = {
    "Azub": "yes", "Birk": "closed", "Blackbird Bikes": "closed", "Challenge": "closed",
    "Flevobike": "closed", "Flux": "closed", "Go-One": "closed", "KMX": "closed",
    "Lightfoot Cycles": "closed", "Matix Bike": "yes", "Optima": "closed",
    "Pacific Cycles": "closed", "Podbike": "closed", "Zockra": "closed"
  };

  const fleetMakers = [
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

  const originMap = {
    "Matix Bike": { c: "PL", f: "🇵🇱" }, "Dekers Bike": { c: "PL", f: "🇵🇱" }, "Kamrad": { c: "PL", f: "🇵🇱" },
    "Sport-On": { c: "PL", f: "🇵🇱" }, "Velokraft": { c: "PL", f: "🇵🇱" }, "IN Trikes": { c: "PL", f: "🇵🇱" },
    "Azub": { c: "CZ", f: "🇨🇿" }, "Katanga": { c: "CZ", f: "🇨🇿" },
    "default": { c: "UN", f: "🏳️" }
  };

  const TYPE_LABEL = { tadpole: 'Tadpole', delta: 'Delta', bike: '2-wheel', quad: 'Quad', velomobile: 'Velomobile', handcycle: 'Handcycle' };
  const TYPE_CLASS = { tadpole: 't-tadpole', delta: 't-delta', bike: 't-bike', quad: 't-quad' };

  const SK = 'poziomki_state_v3_5_13';
  let state = GM_getValue(SK, { 
    collapsed: false, minKg: 0, filterType: 'all', filterProd: 'all', 
    sortCol: 'p', sortDir: 1, searchStr: '', modToken: '', modProducer: ''
  });
  function save() { GM_setValue(SK, state); }

  let host, shadow;

  // ==========================================
  // FETCHERS (Zabezpieczone)
  // ==========================================
  function fetchAPI(action, method = "GET", body = null) {
    return new Promise((resolve) => {
      const url = method === "GET" ? `${MODERATION_URL}?action=${action}` : MODERATION_URL;
      GM_xmlhttpRequest({
        method: method, url: url,
        data: body ? JSON.stringify({ action, ...body }) : null,
        headers: { "Content-Type": "application/json" },
        onload: (res) => { try { resolve(JSON.parse(res.responseText)); } catch(e) { resolve([]); } },
        onerror: () => resolve([])
      });
    });
  }

  function fetchJSON(url) {
      return new Promise((resolve, reject) => {
          GM_xmlhttpRequest({
              method: 'GET', url: url,
              onload: (res) => {
                  if (res.status >= 200 && res.status < 300) {
                      try { resolve(JSON.parse(res.responseText.replace(/[\u00A0\u200B]/g, ' '))); } catch (e) { reject(new Error('JSON Error')); }
                  } else { reject(new Error('HTTP Error: ' + res.status)); }
              },
              onerror: () => reject(new Error('Network Error'))
          });
      });
  }

  // ==========================================
  // STYL CSS
  // ==========================================
  const styleCSS = `
    #pdb-wrap { position: fixed; top: 54px; right: 12px; width: 620px; height: 85vh; max-height: 800px; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13px; color: #1a1a2e; display: flex; flex-direction: column; background: transparent; filter: drop-shadow(0 10px 30px rgba(0,30,80,.2)); resize: horizontal; min-width: 450px; max-width: 95vw; --pz-hdr-bg: ${theme.hdrBg}; --pz-th-color: ${theme.thColor}; --pz-th-bg: ${theme.thBg}; --pz-btn-bg: ${theme.btnBg}; --pz-btn-color: ${theme.btnColor}; --pz-btn-border: ${theme.btnBorder}; }
    #pdb-wrap.col { height: 50px; min-height: 50px; max-height: 50px; }
    #pdb-hdr { background: var(--pz-hdr-bg); color: #fff; padding: 8px 14px; display: flex; align-items: center; gap: 10px; cursor: grab; user-select: none; flex-shrink: 0; height: 34px; border-radius: 12px 12px 0 0; border: 1px solid rgba(0,0,0,0.15); border-bottom: none; }
    #pdb-wrap.col #pdb-hdr { border-radius: 12px; border-bottom: 1px solid rgba(0,0,0,0.15); }
    #pdb-hdr:active { cursor: grabbing; }
    .logo-wrap { width: 26px; height: 26px; position: relative; flex-shrink: 0; }
    .hdr-logo { width: 65px; height: 65px; position: absolute; top: 0; left: 0; transform: scale(0.4); transform-origin: top left; border-radius: 15px; background: #fff; padding: 5px; object-fit: contain; transition: transform 0.2s; box-sizing: border-box; cursor: pointer; }
    .hdr-logo:hover { transform: scale(1); z-index: 9999; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
    #pdb-hdr .title { font-weight: 700; font-size: 14px; white-space: nowrap; pointer-events: none; }
    #pdb-search { flex: 1; padding: 5px 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.3); font-size: 12px; background: rgba(0,0,0,0.2); color: #fff; outline: none; transition: 0.2s; }
    #pdb-search:focus { background: #fff; color: #000; border-color: #fff; }
    #pdb-hdr .badge { background: rgba(255,255,255,.2); border-radius: 10px; padding: 2px 8px; font-size: 11px; font-weight: 700; pointer-events: none; }
    .hdr-btn { background: rgba(255,255,255,0.15); border: none; border-radius: 4px; color: #fff; cursor: pointer; padding: 4px 6px; font-size: 14px; transition: 0.2s; margin-left: 5px; }
    .hdr-btn:hover { background: rgba(255,255,255,0.3); }
    .hdr-btn.pending { background: #ef4444; font-weight: bold; animation: pulse 2s infinite; font-size: 12px; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
    #pdb-hdr .xbtn { background: none; border: none; color: rgba(255,255,255,.6); font-size: 16px; cursor: pointer; padding: 0 4px; }
    #pdb-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; background: #fff; border: 1px solid #c0cce0; border-top: none; border-radius: 0 0 12px 12px; }
    #pdb-wrap.col #pdb-body { display: none; }
    .pdb-ctrl { padding: 8px 12px; display: flex; gap: 8px; background: #f4f7fb; border-bottom: 1px solid #e0e8f0; flex-shrink: 0; }
    .pdb-ctrl select, .pdb-ctrl input { padding: 5px 8px; border: 1px solid #c4d0e0; border-radius: 6px; min-width: 100px; font-size: 12px; }
    .pdb-ad-box { margin: 10px 12px 0 12px; border-radius: 8px; overflow: hidden; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 6px rgba(0,0,0,0.1); flex-shrink: 0; }
    .pdb-ad-box img { max-width: 100%; max-height: 90px; object-fit: contain; display: block; }
    .pdb-ad-box a { display: block; width: 100%; text-decoration: none; }
    #pdb-tbl-wrap { flex: 1; overflow-y: auto; background: #fff; margin-top: 10px; }
    #pdb-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
    #pdb-tbl thead th { position: sticky; top: 0; background: var(--pz-th-bg); font-size: 11px; font-weight: 700; padding: 8px 10px; text-align: left; cursor: pointer; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.05); color: var(--pz-th-color); text-transform: uppercase; }
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
    .kg-low { color: #994020; } .kg-120plus { color: #1a6e40; } .kg-150plus { color: #1a4494; } .kg-200plus { color: #6a10a0; }
    .pdb-link a { font-size: 11px; padding: 3px 8px; border-radius: 5px; text-decoration: none; background: var(--pz-btn-bg); color: var(--pz-btn-color); border: 1px solid var(--pz-btn-border); display: inline-block; text-align: center; min-width: 45px; font-weight: 600; }
    .pdb-link.arch a { background: #fdf5d8; border-color: #e4d498; color: #8a6a1c; }
    .pdb-link.check a { background: #f0e0fe; border-color: #d0b0f0; color: #6a10a0; }
    .btn-edit { font-size: 9px; text-transform: uppercase; padding: 2px 5px; border-radius: 4px; background: #e2e8f0; color: #475569; border: 1px solid #cbd5e1; cursor: pointer; font-weight: bold; margin-left: 5px; transition: 0.2s; }
    .btn-edit:hover { background: var(--pz-th-color); color: #fff; }
    .pdb-modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(2px); border-radius: 12px; }
    .pdb-modal { background: #fff; width: 400px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); padding: 20px; position: relative; max-height: 85%; overflow-y: auto; }
    .pdb-modal h3 { margin: 0 0 15px 0; font-size: 16px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    .pdb-form-group { margin-bottom: 12px; }
    .pdb-form-group label { display: block; font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 4px; }
    .pdb-form-group input, .pdb-form-group select { width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; }
    .pdb-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .btn-save { background: #10b981; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .btn-cancel { background: #f1f5f9; color: #64748b; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    .pending-row { font-size: 11px; border-bottom: 1px solid #e2e8f0; padding: 10px 0; }
    .pending-row strong { color: #1e293b; font-size: 12px; }
    .pdb-foot { padding: 10px 14px; font-size: 11px; text-align: center; border-top: 1px solid #e8eef4; background: #f8fafc; flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; }
    .foot-avatar-wrap { width: 26px; height: 26px; position: relative; flex-shrink: 0; margin-right: 6px; }
    .foot-avatar { width: 65px; height: 65px; position: absolute; bottom: 0; left: 0; transform: scale(0.4); transform-origin: bottom left; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.15); object-fit: cover; background: #fff; transition: transform 0.2s; box-sizing: border-box; cursor: pointer; z-index: 100; }
    .foot-avatar:hover { transform: scale(1); box-shadow: 0 5px 25px rgba(0,0,0,0.3); z-index: 9999; border-color: var(--pz-th-color); }
    .pdb-loading { padding: 40px 20px; text-align: center; font-size: 13px; font-weight: bold; color: var(--pz-th-color); background: #fff; border: 1px solid #c0cce0; border-top: none; border-radius: 0 0 12px 12px; }
    .error-msg { font-size: 12px; color: #cc0000; padding: 15px; background: #fff0f0; border: 1px solid #ffcccc; margin: 15px; border-radius: 8px; line-height: 1.5; }
    .spinner { display: inline-block; width: 24px; height: 24px; border: 3px solid rgba(42,96,144,0.3); border-radius: 50%; border-top-color: var(--pz-th-color); animation: spin 1s ease-in-out infinite; margin-bottom: 10px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  // ==========================================
  // PANELE ADMINA
  // ==========================================
  function showAdminDashboard(pendingData) {
    const overlay = document.createElement('div');
    overlay.className = 'pdb-modal-overlay';
    
    let listHtml = pendingData.filter(d => d.Status === "Pending").map(d => `
      <div class="pending-row" id="pending-row-${d.rowId}">
        <div><strong>${d.Producent}</strong> — ${d.Model}</div>
        <div style="color: #1a4494; margin: 4px 0; background: #f0f6ff; padding: 4px; border-radius: 4px;">${d["Proponowane zmiany"] || d["Proposed changes"] || "No changes specified"}</div>
        <div style="font-size: 9px; color: #94a3b8;">Date: ${new Date(d["Data zgłoszenia"] || d["Timestamp"]).toLocaleString()}</div>
        <div style="margin-top:8px;">
           <button style="background:#10b981; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:10px; cursor:pointer;" onclick="alert('Next stage: GitHub Integration!')">Accept</button>
           <button class="btn-reject-pending" data-row="${d.rowId}" style="background:#f1f5f9; color:#ef4444; border:1px solid #ef4444; padding:3px 10px; border-radius:4px; font-size:10px; cursor:pointer; margin-left:5px; font-weight:bold;">Reject (Delete)</button>
        </div>
      </div>
    `).join('') || '<div style="text-align:center; padding:20px; color:#94a3b8;">No pending changes. Database is clean!</div>';

    overlay.innerHTML = `
      <div class="pdb-modal">
        <h3>🔔 Pending Changes (Admin)</h3>
        <div style="max-height: 400px; overflow-y: auto;">${listHtml}</div>
        <div style="text-align:right; margin-top:20px;">
          <button class="btn-cancel" id="admin-close">Close</button>
        </div>
      </div>
    `;
    shadow.getElementById('pdb-body').appendChild(overlay);

    overlay.addEventListener('click', async (e) => {
      if(e.target.classList.contains('btn-reject-pending')) {
        const rowId = e.target.dataset.row;
        e.target.textContent = "Deleting..."; e.target.disabled = true;
        const res = await fetchAPI("reject_edit", "POST", { rowId });
        if (res.status === "success") {
          const rowElement = shadow.getElementById(`pending-row-${rowId}`);
          rowElement.style.background = "#fff0f0"; rowElement.innerHTML = "<div style='color:#ef4444; text-align:center; padding:10px;'>Deleted!</div>";
          setTimeout(() => rowElement.remove(), 1000);
        } else {
          alert("Delete error. Please check connection."); e.target.textContent = "Reject (Delete)"; e.target.disabled = false;
        }
      }
    });
    shadow.getElementById('admin-close').onclick = () => overlay.remove();
  }

  function showTokenDashboard(tokensData) {
    const overlay = document.createElement('div');
    overlay.className = 'pdb-modal-overlay';
    
    let listHtml = tokensData.map(d => `
      <div class="pending-row" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><strong>${d.producer}</strong></div>
        <input type="text" class="tok-input" data-prod="${d.producer}" value="${d.token}" placeholder="No token" style="width:90px; padding:4px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px;">
        <select class="tok-stat" data-prod="${d.producer}" style="width:80px; padding:4px; font-size:11px; border:1px solid #cbd5e1; border-radius:4px; margin: 0 5px;">
          <option value="Aktywny" ${d.status==='Aktywny'?'selected':''}>Active</option>
          <option value="Blokada" ${d.status==='Blokada'?'selected':''}>Blocked</option>
        </select>
        <button class="btn-save-tok" data-prod="${d.producer}" style="background:#10b981; color:#fff; border:none; padding:5px 8px; border-radius:4px; font-size:10px; cursor:pointer; font-weight:bold;">Save</button>
      </div>
    `).join('');

    overlay.innerHTML = `
      <div class="pdb-modal" style="width: 480px;">
        <h3>🔑 Token Manager</h3>
        <div style="max-height: 400px; overflow-y: auto; padding-right:5px;">${listHtml}</div>
        <div style="text-align:right; margin-top:15px; padding-top:10px; border-top: 1px solid #e2e8f0;">
          <button class="btn-cancel" id="tok-close">Close</button>
        </div>
      </div>
    `;
    shadow.getElementById('pdb-body').appendChild(overlay);

    overlay.addEventListener('click', async (e) => {
      if(e.target.classList.contains('btn-save-tok')) {
        const prod = e.target.dataset.prod;
        const nt = overlay.querySelector(`.tok-input[data-prod="${prod}"]`).value;
        const ns = overlay.querySelector(`.tok-stat[data-prod="${prod}"]`).value;
        e.target.textContent = "...";
        const res = await fetchAPI("update_token", "POST", { producer: prod, newToken: nt, newStatus: ns });
        const ok = res.status === "success";
        e.target.textContent = ok ? "✔ OK" : "Error"; e.target.style.background = ok ? "#3b82f6" : "#ef4444";
        if(ok) setTimeout(() => { e.target.textContent = "Save"; e.target.style.background = "#10b981"; }, 2000);
      }
    });
    shadow.getElementById('tok-close').onclick = () => overlay.remove();
  }

  function showAdsDashboard() {
    const overlay = document.createElement('div');
    overlay.className = 'pdb-modal-overlay';
    
    let listHtml = ADS.map(ad => `
      <div class="pending-row" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="flex:1">
          <div style="font-weight:bold; font-size:11px;">[${ad.placement.toUpperCase()}] ${ad.type}</div>
          <div style="font-size:10px; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:280px;">${ad.content}</div>
        </div>
        <div style="display:flex; gap:5px;">
          <button class="hdr-btn" style="background:#3b82f6; color:#fff;" onclick="this.parentElement.dataset.ad='${JSON.stringify(ad).replace(/'/g,"&apos;")}'; window.editAd(JSON.parse(this.parentElement.dataset.ad))">Edit</button>
          <button class="hdr-btn" style="background:#ef4444; color:#fff;" onclick="window.deleteAd(${ad.rowId})">Del</button>
        </div>
      </div>
    `).join('') || '<div style="text-align:center; padding:20px; color:#94a3b8;">No ads in database.</div>';

    overlay.innerHTML = `
      <div class="pdb-modal" style="width: 480px;">
        <h3>📢 Ads Manager</h3>
        <button class="hdr-btn" style="background:#10b981; margin-bottom:15px; padding:8px 15px;" id="btn-new-ad">+ Add New Ad</button>
        <div style="max-height:300px; overflow-y:auto;">${listHtml}</div>
        <div style="text-align:right; margin-top:20px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          <button class="btn-cancel" id="ads-close">Close</button>
        </div>
      </div>
    `;
    shadow.getElementById('pdb-body').appendChild(overlay);

    window.editAd = (ad) => {
       const content = prompt("Ad Content (HTML string or Image URL):", ad ? ad.content : "");
       if (content === null) return;
       const link = prompt("Target Link URL:", ad ? ad.link : "");
       const placement = prompt("Placement (top / bottom):", ad ? ad.placement : "top");
       const type = prompt("Type (html / image):", ad ? ad.type : "html");
       const active = confirm("Should this ad be Active?") ? "Tak" : "Nie";
       
       fetchAPI("save_ad", "POST", { rowId: ad ? ad.rowId : null, placement, type, content, link, active }).then(async () => {
         alert("Saved!"); ADS = await fetchAPI("get_ads"); overlay.remove(); showAdsDashboard();
       });
    };

    window.deleteAd = (rowId) => {
      if(confirm("Delete this ad forever?")) {
        fetchAPI("delete_ad", "POST", { rowId }).then(async () => {
          ADS = await fetchAPI("get_ads"); overlay.remove(); showAdsDashboard();
        });
      }
    };

    shadow.getElementById('btn-new-ad').onclick = () => window.editAd(null);
    shadow.getElementById('ads-close').onclick = () => { overlay.remove(); renderAds(); };
  }

  function showLoginModal() {
    const overlay = document.createElement('div');
    overlay.className = 'pdb-modal-overlay';
    overlay.innerHTML = `
      <div class="pdb-modal">
        <h3>Moderator Login</h3>
        <div class="pdb-form-group">
          <label>Access Token</label>
          <input type="password" id="mod-token-input" placeholder="Enter your secret token...">
        </div>
        <div id="login-error" style="color:red; font-size:11px; margin-bottom:10px; display:none;"></div>
        <div class="pdb-modal-actions">
          <button class="btn-cancel" id="login-close">Cancel</button>
          <button class="btn-save" id="login-submit">Login</button>
        </div>
      </div>
    `;
    shadow.getElementById('pdb-body').appendChild(overlay);
    shadow.getElementById('login-close').onclick = () => overlay.remove();
    
    shadow.getElementById('login-submit').onclick = async () => {
      const btn = shadow.getElementById('login-submit');
      const val = shadow.getElementById('mod-token-input').value;
      if (!val) return;
      
      btn.textContent = "Checking..."; btn.disabled = true;
      const res = await fetchAPI("verify_token", "POST", { token: val });
      
      if (res.status === "success") {
        state.modToken = val; state.modProducer = res.producer; save(); overlay.remove(); buildUI(); 
      } else {
        shadow.getElementById('login-error').textContent = res.message || "Invalid token!";
        shadow.getElementById('login-error').style.display = 'block';
        btn.textContent = "Login"; btn.disabled = false;
      }
    };
  }

  function showEditModal(row) {
    const overlay = document.createElement('div');
    overlay.className = 'pdb-modal-overlay';
    overlay.innerHTML = `
      <div class="pdb-modal">
        <h3>Edit: ${row.m}</h3>
        <div class="pdb-form-group"><label>Model Name</label><input type="text" id="edit-name" value="${row.m}"></div>
        <div class="pdb-form-group"><label>Max Load (kg)</label><input type="number" id="edit-kg" value="${row.kg || ''}"></div>
        <div class="pdb-form-group"><label>Website URL</label><input type="text" id="edit-url" value="${row.url}"></div>
        <div class="pdb-modal-actions">
          <button class="btn-cancel" id="edit-close">Cancel</button>
          <button class="btn-save" id="edit-save">Submit to Admin</button>
        </div>
      </div>
    `;
    shadow.getElementById('pdb-body').appendChild(overlay);
    shadow.getElementById('edit-close').onclick = () => overlay.remove();
    shadow.getElementById('edit-save').onclick = async () => {
      const btn = shadow.getElementById('edit-save'); btn.textContent = "Sending..."; btn.disabled = true;
      const changes = `Name: ${shadow.getElementById('edit-name').value}, KG: ${shadow.getElementById('edit-kg').value}, URL: ${shadow.getElementById('edit-url').value}`;
      const res = await fetchAPI("submit_edit", "POST", { producer: row.p, model: row.m, changes: changes, userToken: state.modToken });
      if (res.status === "success") { alert("Submission sent for approval!"); overlay.remove(); } else { alert("Connection error."); btn.textContent = "Submit to Admin"; btn.disabled = false; }
    };
  }

  // ==========================================
  // RENDEROWANIE TABELI
  // ==========================================
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

  function renderTable() {
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

    tbody.innerHTML = rows.map((r, idx) => {
      const collab = COLLAB[r.p] || '';
      let kgClass = 'kg-none'; let kgText = 'N/A';
      if (r.kg > 0) {
        kgText = r.kg + ' kg';
        if (r.kg < 120) kgClass = 'kg-low'; else if (r.kg < 150) kgClass = 'kg-120plus'; else if (r.kg < 200) kgClass = 'kg-150plus'; else kgClass = 'kg-200plus';
      }
      let linkClass = ''; let linkText = '↗ Link';
      if (r.arch) { linkClass = 'arch'; linkText = '🗄 Arch'; }
      if (r.check) { linkClass = 'check'; linkText = '❓ Check'; }
      
      let origin = originMap[r.p] || originMap["default"];

      const canEdit = state.modProducer === 'ALL' || state.modProducer === r.p;
      const editBtnHtml = canEdit ? `<button class="btn-edit" data-idx="${idx}">Edit</button>` : '';

      return `
      <tr class="${collab === 'yes' ? 'row-collab-yes' : collab === 'closed' ? 'row-collab-closed' : ''}">
        <td class="pdb-prod" title="${origin.c}">${origin.f} ${r.p}</td>
        <td class="pdb-model">${r.m} ${editBtnHtml}</td>
        <td><span class="pdb-type ${TYPE_CLASS[r.type]||''} ">${TYPE_LABEL[r.type]||r.type}</span></td>
        <td><span class="pdb-kg ${kgClass}">${kgText}</span></td>
        <td class="pdb-link ${linkClass}"><a href="${r.url}" target="_blank" title="${r.url}">${linkText}</a></td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.onclick = () => showEditModal(rows[btn.dataset.idx]);
    });
  }

  // ==========================================
  // RENDEROWANIE REKLAM
  // ==========================================
  function renderAds() {
    const topAd = ADS.find(a => a.placement === "top" && a.active === "Tak");
    const botAd = ADS.find(a => a.placement === "bottom" && a.active === "Tak");

    const injectAd = (ad, elId) => {
      const el = shadow.getElementById(elId);
      if(!el) return;
      if(!ad) { el.style.display = 'none'; return; }
      
      el.style.display = 'flex';
      if(ad.type === 'html') {
        el.innerHTML = `<a href="${ad.link}" target="_blank" style="width:100%; display:block; background:var(--pz-hdr-bg); color:#fff; padding:12px; text-align:center; font-weight:bold; font-size:13px; text-decoration:none;">${ad.content}</a>`;
      } else {
        el.innerHTML = `<a href="${ad.link}" target="_blank" style="width:100%; display:block;"><img src="${ad.content}" style="width:100%; height:auto;"></a>`;
      }
    };

    injectAd(topAd, 'pdb-ad-top');
    injectAd(botAd, 'pdb-ad-bot');
  }

  // ==========================================
  // INICJALIZACJA UI
  // ==========================================
  async function buildUI() {
    const existing = shadow.getElementById('pdb-wrap'); if (existing) existing.remove();
    const wrap = document.createElement('div'); wrap.id = 'pdb-wrap';
    if (state.collapsed) wrap.classList.add('col');

    const producers = ['all', ...new Set(DB.map(r => r.p))].sort((a,b) => a === 'all' ? -1 : a.localeCompare(b,'en'));
    const loginIcon = state.modToken ? '🔓' : '🔐';
    const isAdmin = state.modProducer === 'ALL';

    const pzTopMetaHTML = `
      <div class="pz-top-meta" style="background-color: #fff3cd; color: #856404; padding: 10px 15px; border: 1px solid #ffeeba; border-radius: 4px; font-size: 11px; line-height: 1.4; margin: 10px 12px 0 12px; text-align: center; font-family: sans-serif; box-sizing: border-box;">
        <strong>Notice:</strong> This database is for reference only and may contain errors. Please verify directly on the manufacturer's official website.
      </div>`;

    wrap.innerHTML = `
      <div id="pdb-hdr">
        <div class="logo-wrap"><img src="${LOGO_URL}" class="hdr-logo" alt="Logo"></div>
        <span class="title">Poziomki DB</span>
        <input type="text" id="pdb-search" placeholder="Search..." value="${state.searchStr || ''}">
        <span class="badge" id="pdb-cnt">0</span>
        ${isAdmin ? `
          <button class="hdr-btn pending" id="admin-dash-btn" title="Pending Queue">🔔 Pending</button>
          <button class="hdr-btn" id="admin-tok-btn" style="background:#f59e0b;" title="Token Manager">🔑 Tokens</button>
          <button class="hdr-btn" id="admin-ads-btn" style="background:#8b5cf6;" title="Ads Manager">📢 Ads</button>
        ` : ''}
        <button class="hdr-btn" id="cms-login-btn" title="Moderator Login">${loginIcon}</button>
        <span id="pdb-arr" style="cursor:pointer; margin-left:5px;">${state.collapsed?'▲':'▼'}</span>
        <button class="xbtn" id="pdb-x">✕</button>
      </div>
      <div id="pdb-body">
        ${pzTopMetaHTML}
        <div class="pdb-ad-box" id="pdb-ad-top" style="display:none"></div>
        <div class="pdb-ctrl">
          <select id="pdb-prod">${producers.map(p => `<option value="${p}"${p===state.filterProd?' selected':''}>${p==='all'?'All producers':p}</option>`).join('')}</select>
          <select id="pdb-type">
            <option value="all">All types</option><option value="tadpole">Tadpole</option><option value="delta">Delta</option><option value="bike">Bike (2-wheel)</option><option value="quad">Quad</option><option value="velomobile">Velomobile</option><option value="handcycle">Handcycle</option>
          </select>
          <input type="number" id="pdb-kg" placeholder="Min load (kg)" min="0" step="5" value="${state.minKg || ''}">
        </div>
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
        <div class="pdb-ad-box" id="pdb-ad-bot" style="display:none"></div>
        
        <div class="pdb-foot">
          <div style="display: flex; align-items: center;">
            <div class="foot-avatar-wrap"><img src="${AVATAR_URL}" class="foot-avatar" alt="Author" onerror="if(this.src.includes('.jpg')){this.src=this.src.replace('.jpg','.png');}"></div>
            <span>Author: <strong>${CONFIG.author}</strong> | Mode: <strong>${state.modProducer || 'Viewer'}</strong></span>
          </div>
          <a href="${KOFI_URL}" target="_blank" style="color:var(--pz-btn-color); font-weight:bold; text-decoration:none; border:1px solid currentColor; padding:4px 10px; border-radius:6px; background:#fff;">☕ Support</a>
        </div>
      </div>`;

    shadow.appendChild(wrap);
    shadow.getElementById('pdb-type').value = state.filterType;

    renderAds();

    if (isAdmin) {
      shadow.getElementById('admin-dash-btn').onclick = async () => {
        const btn = shadow.getElementById('admin-dash-btn'); btn.textContent = "...";
        const data = await fetchAPI("get_pending"); btn.textContent = "🔔 Pending"; showAdminDashboard(data);
      };
      shadow.getElementById('admin-tok-btn').onclick = async () => {
        const btn = shadow.getElementById('admin-tok-btn'); btn.textContent = "...";
        const data = await fetchAPI("get_tokens"); btn.textContent = "🔑 Tokens"; showTokenDashboard(data);
      };
      shadow.getElementById('admin-ads-btn').onclick = () => showAdsDashboard();
    }

    const header = shadow.getElementById('pdb-hdr');
    let isDragging = false, hasDragged = false, startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', (e) => {
      if(e.target.closest('.logo-wrap') || e.target.closest('.hdr-btn') || e.target.id === 'pdb-x' || e.target.id === 'pdb-search') return;
      isDragging = true; hasDragged = false; startX = e.clientX; startY = e.clientY;
      const rect = wrap.getBoundingClientRect(); initialLeft = rect.left; initialTop = rect.top;
      wrap.style.right = 'auto'; wrap.style.left = initialLeft + 'px'; wrap.style.top = initialTop + 'px'; e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX; const dy = e.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;
      if (hasDragged) { wrap.style.left = (initialLeft + dx) + 'px'; wrap.style.top = (initialTop + dy) + 'px'; }
    });
    document.addEventListener('mouseup', () => { isDragging = false; });
    header.addEventListener('click', e => {
      if(e.target.closest('.logo-wrap') || e.target.closest('.hdr-btn') || e.target.id === 'pdb-x' || e.target.id === 'pdb-search' || hasDragged) return;
      state.collapsed = !state.collapsed; wrap.classList.toggle('col');
      shadow.getElementById('pdb-arr').textContent = state.collapsed ? '▲' : '▼'; save();
    });

    shadow.getElementById('cms-login-btn').onclick = () => {
      if (state.modToken) {
        if (confirm("Logout from Moderator mode?")) { state.modToken = ''; state.modProducer = ''; save(); buildUI(); }
      } else { showLoginModal(); }
    };

    shadow.getElementById('pdb-x').onclick = () => host.remove();
    shadow.getElementById('pdb-search').oninput = (e) => { state.searchStr = e.target.value; save(); renderTable(); };
    ['pdb-prod','pdb-type','pdb-kg'].forEach(id => {
      shadow.getElementById(id).onchange = () => {
        state.filterProd = shadow.getElementById('pdb-prod').value;
        state.filterType = shadow.getElementById('pdb-type').value;
        state.minKg = parseInt(shadow.getElementById('pdb-kg').value) || 0;
        save(); renderTable();
      };
    });

    const doSort = (col) => {
      if (state.sortCol === col) state.sortDir *= -1; else { state.sortCol = col; state.sortDir = col==='kg' ? -1 : 1; }
      save(); renderTable();
    };
    shadow.getElementById('sort-p').onclick = () => doSort('p');
    shadow.getElementById('sort-m').onclick = () => doSort('m');
    shadow.getElementById('sort-t').onclick = () => doSort('type');
    shadow.getElementById('sort-k').onclick = () => doSort('kg');

    renderTable();
  }

  // ==========================================
  // INICJALIZACJA Z CACHEM!
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
    loadingWrap.innerHTML = `
      <div id="pdb-hdr">
        <div class="logo-wrap"><img src="${LOGO_URL}" class="hdr-logo" alt="Logo"></div>
        <span class="title">Poziomki DB</span>
        <button class="xbtn" style="margin-left:auto;" onclick="document.getElementById('poziomki-host').remove()">✕</button>
      </div>
      <div class="pdb-loading" id="load-msg">
        <div class="spinner"></div><br>
        Fetching fleet and checking cache...
      </div>
    `;
    shadow.appendChild(loadingWrap);

    try {
      const adsPromise = fetchAPI("get_ads");
      const fleetPromises = fleetSources.map(url => fetchJSON(url).catch(() => []));
      
      const [adsResponse, ...fleetResponses] = await Promise.all([adsPromise, ...fleetPromises]);

      ADS = adsResponse || [];
      DB = [];
      fleetResponses.forEach(part => { if (Array.isArray(part)) DB = DB.concat(part); });

      // NOWY SYSTEM CACHE!
      const cachedDB = GM_getValue('pdb_offline_fleet', []);

      if (DB.length > 0) {
        GM_setValue('pdb_offline_fleet', DB); // Aktualizujemy lokalny magazyn
      } else if (cachedDB.length > 0) {
        DB = cachedDB; // Ratuje nas offline cache!
        console.warn("Wczytano bazę z pamięci podręcznej z powodu limitu GitHuba!");
      } else {
        throw new Error("GitHub zablokował na chwilę Twój adres IP za zbyt dużo odświeżeń (Rate Limit). Zrób sobie kawkę, odczekaj 5-10 minut i odśwież stronę, a skrypt zbuduje cache!");
      }

      loadingWrap.remove();
      buildUI();
    } catch (error) {
      console.error("Poziomki DB Error:", error);
      loadingWrap.innerHTML = `
        <div id="pdb-hdr">
          <div class="logo-wrap"><img src="${LOGO_URL}" class="hdr-logo" alt="Logo"></div>
          <span class="title">Poziomki DB Error</span>
          <button class="xbtn" style="margin-left:auto;" onclick="document.getElementById('poziomki-host').remove()">✕</button>
        </div>
        <div class="error-msg" style="background:#fff;"><strong>Wykryto problem:</strong><br>${error.message}</div>
      `;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp); else initApp();
})();
