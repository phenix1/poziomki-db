// ==UserScript==
// @name         Poziomki DB v4.2.3
// @namespace    https://poziomki.info
// @version      4.2.3
// @description  Recumbent bikes database with fixed header alignment and optimized space.
// @author       MBFeniks — Michał Berliński
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
// @connect      get.geojs.io
// @connect      api.open-meteo.com
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ==========================================
  // DATABASE SECURE API URL
  // ==========================================
  const MODERATION_URL = "https://script.google.com/macros/s/AKfycbyrdgmIVwD2rM3W-pf3CXo1zx924Ibyg5mJrjXwkMyO20kGU7XVxWZyq5he38iJ3s7meQ/exec";

  // ==========================================
  // SEASONAL VISUAL THEME
  // ==========================================
  const currentMonth = new Date().getMonth();
  let theme = { hdrBg: 'linear-gradient(135deg, #162b45 0%, #2a6090 100%)', thColor: '#2a6090', thBg: '#eef3fa', btnBg: '#f0f6ff', btnColor: '#1a4494', btnBorder: '#c0d0e4' };

  if ([11, 0, 1].includes(currentMonth)) {
    theme = { hdrBg: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', thColor: '#203a43', thBg: '#f0f4f8', btnBg: '#f0f4f8', btnColor: '#2c5364', btnBorder: '#cbd5e1' };
  } else if ([2, 3, 4].includes(currentMonth)) {
    theme = { hdrBg: 'linear-gradient(135deg, #1b4d3e 0%, #57b85d 100%)', thColor: '#1b4d3e', thBg: '#eef9f1', btnBg: '#eef9f1', btnColor: '#1b4d3e', btnBorder: '#c2e9cb' };
  } else if ([8, 9, 10].includes(currentMonth)) {
    theme = { hdrBg: 'linear-gradient(135deg, #870f0f 0%, #d35400 100%)', thColor: '#870f0f', thBg: '#fff5f5', btnBg: '#fffbf0', btnColor: '#b33939', btnBorder: '#ebd07f' };
  }

  const LOGO_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/logo.png';
  const AVATAR_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/me.jpg';
  const KOFI_URL = 'https://ko-fi.com/mbfeniks';

  let CONFIG = { version: "4.2.3", author: "MBFeniks" };
  let ADS = [];
  let DB = [];
  let PENDING_ITEMS = []; // Global store for active pending proposals to block multiple edits
  let BRANDS_STATUS = {}; // Dynamic database mapping loaded from Google Sheets (yes, closed, none)
  let carouselIntervals = [];
  let pendingCountCached = null;

  const originMap = {
    "Aerorider": { c: "NL", f: "🇳🇱" }, "Alligt": { c: "NL", f: "🇳🇱" }, "Avatar 2000": { c: "US", f: "🇺🇸" },
    "Avenue Trikes": { c: "US", f: "🇺🇸" }, "Azub": { c: "CZ", f: "🇨🇿" }, "Bacchetta": { c: "US", f: "🇺🇸" },
    "BamBuk": { c: "DE", f: "🇩🇪" }, "Barcroft": { c: "US", f: "🇺🇸" }, "BerkelBike": { c: "NL", f: "🇳🇱" },
    "BikeE": { c: "US", f: "🇺🇸" }, "Birk": { c: "CH", f: "🇨🇭" }, "Birkenstock Bicycles": { c: "CH", f: "🇨🇭" },
    "Blackbird Bikes": { c: "US", f: "🇺🇸" }, "Burley": { c: "US", f: "🇺🇸" }, "Carbontrikes": { c: "SE", f: "🇸🇪" },
    "Catrike": { c: "US", f: "🇺🇸" }, "Challenge": { c: "NL", f: "🇳🇱" }, "Counterpoint": { c: "US", f: "🇺🇸" },
    "Cruzbike": { c: "US", f: "🇺🇸" }, "Cycle Genius": { c: "US", f: "🇺🇸" }, "Cycles JV Fenioux": { c: "FR", f: "🇫🇷" },
    "Dekers Bike": { c: "PL", f: "🇵🇱" }, "Drymer": { c: "NL", f: "🇳🇱" }, "ENVO": { c: "CA", f: "🇨🇦" },
    "Easy Racers": { c: "US", f: "🇺🇸" }, "Elan": { c: "NL", f: "🇳🇱" }, "Flevobike": { c: "NL", f: "🇳🇱" },
    "Flux": { c: "DE", f: "🇩🇪" }, "Freedom Ryder": { c: "US", f: "🇺🇸" }, "Go-One": { c: "DE", f: "🇩🇪" },
    "GreenSpeed": { c: "AU", f: "🇦🇺" }, "HP Velotechnik": { c: "DE", f: "🇩🇪" }, "Haluzak": { c: "US", f: "🇺🇸" },
    "Hase Bikes": { c: "DE", f: "🇩🇪" }, "ICE Trikes": { c: "GB", f: "🇬🇧" }, "IN Trikes": { c: "PL", f: "🇵🇱" },
    "InterCityBike": { c: "NL", f: "🇳🇱" }, "KMX": { c: "GB", f: "🇬🇧" }, "Kamrad": { c: "PL", f: "🇵🇱" },
    "Katanga": { c: "CZ", f: "🇨🇿" }, "Kingcycle": { c: "GB", f: "🇬🇧" }, "Lasher Sport": { c: "US", f: "🇺🇸" },
    "Leiba": { c: "DE", f: "🇩🇪" }, "Leitra": { c: "DK", f: "🇩🇰" }, "Lightfoot Cycles": { c: "US", f: "🇺🇸" },
    "Lightning": { c: "US", f: "🇺🇸" }, "Linear": { c: "US", f: "🇺🇸" }, "Longbikes": { c: "US", f: "🇺🇸" },
    "M5": { c: "NL", f: "🇳🇱" }, "Matix Bike": { c: "PL", f: "🇵🇱" }, "Maxarya": { c: "CA", f: "🇨🇦" },
    "MetaBikes": { c: "ES", f: "🇪🇸" }, "MoTrike": { c: "CN", f: "🇨🇳" }, "Nazca": { c: "NL", f: "🇳🇱" },
    "ORSA Cycles": { c: "FR", f: "🇫🇷" }, "Optima": { c: "NL", f: "🇳🇱" }, "Pacific Cycles": { c: "TW", f: "🇹🇼" },
    "Pelso": { c: "HU", f: "🇭🇺" }, "Performer": { c: "TW", f: "🇹🇼" }, "Podbike": { c: "NO", f: "🇳🇴" },
    "PonyFour": { c: "CZ", f: "🇨🇿" }, "Quatrotech": { c: "UN", f: "🏳️" }, "RAD-Innovations": { c: "US", f: "🇺🇸" },
    "RANS": { c: "US", f: "🇺🇸" }, "Radius": { c: "DE", f: "🇩🇪" }, "RaptoBike": { c: "NL", f: "🇳🇱" },
    "ReActive Adaptation": { c: "US", f: "🇺🇸" }, "Rotator": { c: "US", f: "🇺🇸" }, "Ryan Recumbents": { c: "US", f: "🇺🇸" },
    "Räderwerk": { c: "DE", f: "🇩🇪" }, "Sinner": { c: "NL", f: "🇳🇱" }, "Slyway": { c: "IT", f: "🇮🇹" },
    "Snoek": { c: "NL", f: "🇳🇱" }, "SpecBikeTechnics": { c: "LV", f: "🇱🇻" }, "Sport-On": { c: "PL", f: "🇵🇱" },
    "Steintrikes": { c: "RS", f: "🇷🇸" }, "SunSeeker": { c: "US", f: "🇺🇸" }, "TerraTrike": { c: "US", f: "🇺🇸" },
    "Top End": { c: "US", f: "🇺🇸" }, "Toxy": { c: "DE", f: "🇩🇪" }, "Trice": { c: "GB", f: "🇬🇧" },
    "Trident": { c: "US", f: "🇺🇸" }, "TrikExplor": { c: "CN", f: "🇨🇳" }, "Trisled": { c: "AU", f: "🇦🇺" },
    "Utah Trikes": { c: "US", f: "🇺🇸" }, "Varibike": { c: "DE", f: "🇩🇪" }, "Velokraft": { c: "PL", f: "🇵🇱" },
    "Velomobiel.nl": { c: "NL", f: "🇳🇱" }, "Velomobile World": { c: "RO", f: "🇷🇴" }, "Velomtek": { c: "CA", f: "🇨🇦" },
    "Vision": { c: "US", f: "🇺🇸" }, "Windcheetah": { c: "GB", f: "🇬🇧" }, "Windwrap": { c: "US", f: "🇺🇸" },
    "Wolf & Wolf": { c: "CH", f: "🇨🇭" }, "Zockra": { c: "FR", f: "🇫🇷" }, "default": { c: "UN", f: "🏳️" }
  };

  const TYPE_LABEL = { tadpole: 'Tadpole', delta: 'Delta', bike: '2-wheel', quad: 'Quad', velomobile: 'Velomobile', handcycle: 'Handcycle' };
  const TYPE_CLASS = { tadpole: 't-tadpole', delta: 't-delta', bike: 't-bike', quad: 't-quad' };

  const SK = 'poziomki_state_v4';
  let state = GM_getValue(SK, { collapsed: false, minKg: 0, filterType: 'all', filterProd: 'all', sortCol: 'p', sortDir: 1, searchStr: '', modToken: '', modProducer: '' });
  function save() { GM_setValue(SK, state); }

  let host, shadow;

  // ==========================================
  // SECURE HTML ESCAPE UTILITY
  // ==========================================
  function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
  }

  // ==========================================
  // DATABASE API REQUESTS
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

  // ==========================================
  // WEATHER WIDGET
  // ==========================================
  async function loadPoziomkiWeather() {
      const weatherContainer = shadow.getElementById('poziomki-weather-widget');
      if (!weatherContainer) return;

      const cacheKey = 'poziomki_weather_data';
      const cached = JSON.parse(localStorage.getItem(cacheKey));
      const now = new Date().getTime();

      let temp, city, icon;

      if (cached && now - cached.timestamp < 3600000) {
          temp = cached.temp;
          city = cached.city;
          icon = cached.icon;
      } else {
          try {
              const geoRes = await new Promise((res, rej) => {
                  GM_xmlhttpRequest({
                      method: "GET", url: "https://get.geojs.io/v1/ip/geo.json",
                      onload: (r) => res(JSON.parse(r.responseText)), onerror: rej
                  });
              });
              city = geoRes.city;

              const weatherRes = await new Promise((res, rej) => {
                  GM_xmlhttpRequest({
                      method: "GET", url: `https://api.open-meteo.com/v1/forecast?latitude=${geoRes.latitude}&longitude=${geoRes.longitude}&current_weather=true`,
                      onload: (r) => res(JSON.parse(r.responseText)), onerror: rej
                  });
              });
              temp = Math.round(weatherRes.current_weather.temperature);
              const wcode = weatherRes.current_weather.weathercode;

              if(wcode === 0) icon = '☀️';
              else if(wcode <= 3) icon = '⛅';
              else if(wcode <= 67) icon = '🌧️';
              else if(wcode <= 77) icon = '❄️';
              else icon = '🌩️';

              localStorage.setItem(cacheKey, JSON.stringify({temp, city, icon, timestamp: now}));
          } catch(error) {
              weatherContainer.innerHTML = "⛅ Weather info";
              return;
          }
      }
      weatherContainer.innerHTML = `<span style="font-size: 14px; margin-right: 5px;">${icon}</span> ${temp}°C, ${city}`;
  }

  function parseAdConfig(activeStr) {
    let cfg = { status: 'Nie', start: '', end: '', days: [1,2,3,4,5,6,7] };
    if (!activeStr) return cfg;
    if (activeStr.trim().startsWith('{')) {
      try { cfg = { ...cfg, ...JSON.parse(activeStr) }; } catch(e) {}
    } else {
      cfg.status = activeStr.trim();
    }
    return cfg;
  }

  // ==========================================
  // UNIFIED COUNT & BADGE UPDATER (REAL-TIME)
  // ==========================================
  function updatePendingCount() {
    const count = PENDING_ITEMS.filter(d => d.Status && d.Status.trim().toLowerCase() === 'pending').length;
    pendingCountCached = count;
    const btn = shadow.getElementById('admin-dash-btn');
    if (btn) {
      btn.textContent = `🔔 Pending (${count})`;
      if (count > 0) {
        btn.classList.add('pending');
      } else {
        btn.classList.remove('pending');
      }
    }
  }

  // ==========================================
  // ROBUST STYLING (OPTIMIZED HEADER & 680px WIDTH)
  // ==========================================
  const styleCSS = `
    #pdb-wrap { position: fixed; top: 54px; right: 12px; width: 680px; height: 85vh; max-height: 800px; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13px; color: #1a1a2e; display: flex; flex-direction: column; background: transparent; filter: drop-shadow(0 10px 30px rgba(0,30,80,.2)); resize: horizontal; min-width: 520px; max-width: 95vw; --pz-hdr-bg: ${theme.hdrBg}; --pz-th-color: ${theme.thColor}; --pz-th-bg: ${theme.thBg}; --pz-btn-bg: ${theme.btnBg}; --pz-btn-color: ${theme.btnColor}; --pz-btn-border: ${theme.btnBorder}; z-index: 2147483647; }
    #pdb-wrap.col { height: 50px; min-height: 50px; max-height: 50px; }
    #pdb-hdr { background: var(--pz-hdr-bg); color: #fff; padding: 8px 14px; display: flex; align-items: center; gap: 8px; cursor: grab; user-select: none; flex-shrink: 0; height: 34px; border-radius: 12px 12px 0 0; border: 1px solid rgba(0,0,0,0.15); border-bottom: none; box-sizing: border-box; }
    #pdb-wrap.col #pdb-hdr { border-radius: 12px; border-bottom: 1px solid rgba(0,0,0,0.15); }
    #pdb-hdr:active { cursor: grabbing; }

    /* ASPECT RATIO & HOVER SCALER FIXES */
    .logo-wrap { width: 26px; height: 26px; position: relative; flex-shrink: 0; }
    .hdr-logo { width: 65px !important; height: 65px !important; max-width: none !important; max-height: none !important; position: absolute; top: 0; left: 0; transform: scale(0.4); transform-origin: top left; border-radius: 15px; background: #fff; padding: 5px; object-fit: contain !important; transition: transform 0.2s ease-in-out; box-sizing: border-box; cursor: pointer; display: block !important; z-index: 100; }
    .hdr-logo:hover { transform: scale(1); z-index: 99999 !important; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }

    .foot-avatar-wrap { width: 26px; height: 26px; position: relative; flex-shrink: 0; margin-right: 6px; }
    .foot-avatar { width: 65px !important; height: 65px !important; max-width: none !important; max-height: none !important; position: absolute; bottom: 0; left: 0; transform: scale(0.4); transform-origin: bottom left; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.15); object-fit: cover !important; background: #fff; transition: transform 0.2s ease-in-out; box-sizing: border-box; cursor: pointer; z-index: 100; display: block !important; }
    .foot-avatar:hover { transform: scale(1); box-shadow: 0 5px 25px rgba(0,0,0,0.3); z-index: 99999 !important; border-color: var(--pz-th-color); }

    #pdb-hdr .title { font-weight: 700; font-size: 13px; white-space: nowrap; pointer-events: none; }
    #pdb-search { padding: 4px 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.3); font-size: 11px; background: rgba(0,0,0,0.2); color: #fff; outline: none; transition: 0.2s; max-width: 120px !important; box-sizing: border-box; }
    #pdb-search:focus { background: #fff; color: #000; border-color: #fff; }
    #pdb-hdr .badge { background: rgba(255,255,255,.2); border-radius: 10px; padding: 2px 8px; font-size: 11px; font-weight: 700; pointer-events: none; }

    .hdr-btn { background: rgba(255,255,255,0.15); border: none; border-radius: 4px; color: #fff; cursor: pointer; padding: 3px 5px; font-size: 11px; transition: 0.2s; white-space: nowrap; }
    .hdr-btn:hover { background: rgba(255,255,255,0.3); }
    .hdr-btn.pending { background: #ef4444; font-weight: bold; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }

    #pdb-hdr .xbtn { background: none; border: none; color: rgba(255,255,255,.6); font-size: 16px; cursor: pointer; padding: 0 4px; transition: 0.2s; }
    #pdb-hdr .xbtn:hover { color: #ff5e5b; }

    #pdb-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; background: #fff; border: 1px solid #c0cce0; border-top: none; border-radius: 0 0 12px 12px; }
    #pdb-wrap.col #pdb-body { display: none; }
    .pdb-ctrl { padding: 8px 12px; display: flex; gap: 8px; background: #f4f7fb; border-bottom: 1px solid #e0e8f0; flex-shrink: 0; align-items: center; }
    .pdb-ctrl select, .pdb-ctrl input { padding: 5px 8px; border: 1px solid #c4d0e0; border-radius: 6px; min-width: 100px; font-size: 12px; height: 28px; box-sizing: border-box; }

    .btn-add-new { background: #10b981; color: #fff; border: none; padding: 5px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; height: 28px; line-height: 18px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; transition: 0.2s; margin-left: auto; }
    .btn-add-new:hover { background: #059669; }

    .pdb-ad-box { margin: 10px 12px 0 12px; border-radius: 8px; overflow: hidden; position: relative; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 6px rgba(0,0,0,0.1); flex-shrink: 0; background: #1e293b; height: 90px; min-height: 90px; max-height: 90px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .carousel-wrap { width: 100%; height: 100%; position: relative; }
    .carousel-slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.6s ease-in-out; pointer-events: none; }
    .carousel-slide.active { opacity: 1; z-index: 2; pointer-events: auto; }
    .carousel-slide img { max-height: 90px !important; max-width: 100% !important; object-fit: contain; }

    #pdb-tbl-wrap { flex: 1; overflow-y: auto; background: #fff; margin-top: 10px; }
    #pdb-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
    #pdb-tbl thead th { position: sticky; top: 0; background: var(--pz-th-bg); font-size: 11px; font-weight: 700; padding: 8px 10px; text-align: left; cursor: pointer; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.05); color: var(--pz-th-color); text-transform: uppercase; }
    #pdb-tbl tbody tr { border-bottom: 1px solid #f0f4f8; }
    #pdb-tbl tbody tr:hover td { background: #f8fafc; }
    #pdb-tbl tbody tr.row-collab-yes td { background: #f0fdf4; }
    #pdb-tbl tbody tr.row-collab-yes td.pdb-prod { border-left: 3px solid #22c55e; }
    #pdb-tbl tbody tr.row-collab-closed td { background: #fff5f5; }
    #pdb-tbl tbody tr.row-collab-closed td.pdb-prod { border-left: 3px solid #f87171; }

    #pdb-tbl tbody tr.row-broken td { background: #fef08a !important; }
    #pdb-tbl tbody tr.row-broken td.pdb-prod { border-left: 3px solid #eab308 !important; }

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
    .pdb-link.broken a { background: #ef4444 !important; border-color: #b91c1c !important; color: #fff !important; }

    .btn-edit { font-size: 9px; text-transform: uppercase; padding: 2px 5px; border-radius: 4px; background: #e2e8f0; color: #475569; border: 1px solid #cbd5e1; cursor: pointer; font-weight: bold; margin-left: 5px; transition: 0.2s; }
    .btn-edit:hover { background: var(--pz-th-color); color: #fff; }

    .pdb-modal-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(2px); border-radius: 12px; }
    .pdb-modal { background: #fff; width: 420px; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); padding: 20px; position: relative; max-height: 85%; overflow-y: auto; }
    .pdb-modal h3 { margin: 0 0 15px 0; font-size: 16px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    .pdb-form-group { margin-bottom: 12px; }
    .pdb-form-group label { display: block; font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 4px; }
    .pdb-form-group input[type="text"], .pdb-form-group input[type="number"], .pdb-form-group input[type="date"], .pdb-form-group select { width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; }
    .pdb-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .btn-save { background: #10b981; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .btn-cancel { background: #f1f5f9; color: #64748b; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    .pending-row { font-size: 11px; border-bottom: 1px solid #e2e8f0; padding: 10px 0; }
    .pending-row strong { color: #1e293b; font-size: 12px; }

    .pdb-foot { padding: 10px 15px; font-size: 11px; text-align: center; border-top: 1px solid #334155; background: #0f172a; flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; border-radius: 0 0 12px 12px; }
    .pdb-loading { padding: 40px 20px; text-align: center; font-size: 13px; font-weight: bold; color: var(--pz-th-color); background: #fff; border: 1px solid #c0cce0; border-top: none; border-radius: 0 0 12px 12px; }
    .error-msg { font-size: 12px; color: #cc0000; padding: 15px; background: #fff0f0; border: 1px solid #ffcccc; margin: 15px; border-radius: 8px; line-height: 1.5; }
    .spinner { display: inline-block; width: 24px; height: 24px; border: 3px solid rgba(42,96,144,0.3); border-radius: 50%; border-top-color: var(--pz-th-color); animation: spin 1s ease-in-out infinite; margin-bottom: 10px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  // ==========================================
  // PENDING CHANGE LISTENER (AUTO-ACCEPT ENGINE)
  // ==========================================
  function showAdminDashboard(pendingData) {
    const overlay = document.createElement('div');
    overlay.className = 'pdb-modal-overlay';

    let listHtml = pendingData.filter(d => d.Status && d.Status.trim().toLowerCase() === "pending").map(d => `
      <div class="pending-row" id="pending-row-${d.rowId}">
        <div><strong>${escapeHtml(d.Producer)}</strong> — ${escapeHtml(d.Model)}</div>
        <div style="color: #1a4494; margin: 4px 0; background: #f0f6ff; padding: 4px; border-radius: 4px;">${escapeHtml(d["Proposed changes"] || "No changes specified")}</div>
        <div style="font-size: 9px; color: #94a3b8;">Date: ${new Date(d["Date"]).toLocaleString()}</div>
        <div style="margin-top:8px;" data-payload='${escapeHtml(d.Payload || "{}")}'>
           <button class="btn-accept-pending" data-row="${d.rowId}" data-prod="${escapeHtml(d.Producer)}" data-model="${escapeHtml(d.Model)}" style="background:#10b981; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:10px; cursor:pointer;">✔ Accept changes</button>
           <button class="btn-reject-pending" data-row="${d.rowId}" data-prod="${escapeHtml(d.Producer)}" data-model="${escapeHtml(d.Model)}" style="background:#f1f5f9; color:#ef4444; border:1px solid #ef4444; padding:3px 10px; border-radius:4px; font-size:10px; cursor:pointer; margin-left:5px; font-weight:bold;">Reject</button>
        </div>
      </div>
    `).join('') || '<div style="text-align:center; padding:20px; color:#94a3b8;">The pending queue is empty.</div>';

    overlay.innerHTML = `
      <div class="pdb-modal">
        <h3>🔔 Pending Changes</h3>
        <div style="max-height: 400px; overflow-y: auto;">${listHtml}</div>
        <div style="text-align:right; margin-top:20px;">
          <button class="btn-cancel" id="admin-close">Close</button>
        </div>
      </div>
    `;
    shadow.getElementById('pdb-body').appendChild(overlay);

    overlay.addEventListener('click', async (e) => {
      if(e.target.classList.contains('btn-reject-pending') || e.target.classList.contains('btn-accept-pending')) {
        const isAccept = e.target.classList.contains('btn-accept-pending');
        const rowId = e.target.dataset.row;
        const prod = e.target.dataset.prod;
        const model = e.target.dataset.model;
        e.target.textContent = "Saving..."; e.target.disabled = true;

        let res;
        if (isAccept) {
            const payload = JSON.parse(e.target.parentElement.dataset.payload || "{}");
            res = await fetchAPI("accept_edit_live", "POST", {
                rowId: rowId,
                producer: prod,
                model: model,
                payload: payload
            });
        } else {
            res = await fetchAPI("reject_edit", "POST", { rowId });
        }

        if (res.status === "success") {
          // Instantly remove from local PENDING_ITEMS array
          PENDING_ITEMS = PENDING_ITEMS.filter(item => !(item.Producer === prod && item.Model === model));
          updatePendingCount(); // Refresh the top badge count IMMEDIATELY!

          const rowElement = shadow.getElementById(`pending-row-${rowId}`);
          rowElement.style.background = isAccept ? "#f0fdf4" : "#fff0f0";
          rowElement.innerHTML = `<div style='color:${isAccept ? "#10b981" : "#ef4444"}; text-align:center; padding:10px; font-weight:bold;'>${isAccept ? "Done! Changes successfully applied." : "Successfully rejected."}</div>`;

          setTimeout(() => {
            rowElement.remove();
          }, 1200);

          if (isAccept) {
            DB = await fetchAPI("get_fleet");
          }
          renderTable();
        } else {
          alert("Connection error. Please try again.");
          e.target.textContent = isAccept ? "✔ Accept" : "Reject";
          e.target.disabled = false;
        }
      }
    });
    shadow.getElementById('admin-close').onclick = () => overlay.remove();
  }

  // ==========================================
  // SMART TOKENS ENGINE (FRONTEND COUPLER)
  // ==========================================
  function showTokenDashboard(tokensData) {
    const overlay = document.createElement('div');
    overlay.className = 'pdb-modal-overlay';

    // 1. Get all unique producers currently present in the main UI dataset
    const dbProducers = [...new Set(DB.map(r => r.p))];

    // 2. Create index of existing tokens for fast lookup
    const tokenMap = {};
    tokensData.forEach(t => {
      tokenMap[t.producer] = { token: t.token, status: t.status };
    });

    // 3. Merge database producers and custom-defined tokens dynamically
    const allProducers = [...new Set([...dbProducers, ...Object.keys(tokenMap)])].sort((a, b) => a.localeCompare(b, 'en'));

    let listHtml = allProducers.map(prod => {
      const entry = tokenMap[prod] || { token: '', status: 'Active' };
      const currentToken = entry.token;
      const currentStatus = entry.status;

      return `
      <div class="pending-row" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(prod)}"><strong>${escapeHtml(prod)}</strong></div>
        <input type="text" class="tok-input" data-prod="${escapeHtml(prod)}" value="${escapeHtml(currentToken)}" placeholder="Enter token..." style="width:100px; padding:4px; font-size:11px;">
        <select class="tok-stat" data-prod="${escapeHtml(prod)}" style="width:80px; padding:4px; font-size:11px; margin: 0 5px;">
          <option value="Active" ${currentStatus==='Active' || currentStatus==='Aktywny'?'selected':''}>Active</option>
          <option value="Blocked" ${currentStatus==='Blocked' || currentStatus==='Blokada'?'selected':''}>Blocked</option>
        </select>
        <button class="btn-save-tok" data-prod="${escapeHtml(prod)}" style="background:#10b981; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;">Save</button>
      </div>
      `;
    }).join('') || '<div style="text-align:center; padding:20px; color:#94a3b8;">No brands found to manage.</div>';

    overlay.innerHTML = `
      <div class="pdb-modal" style="width: 480px;">
        <h3>🔑 Manage Tokens</h3>
        <div style="max-height: 400px; overflow-y: auto;">${listHtml}</div>
        <div style="text-align:right; margin-top:15px; border-top: 1px solid #e2e8f0; padding-top:10px;">
          <button class="btn-cancel" id="tok-close">Close</button>
        </div>
      </div>
    `;
    shadow.getElementById('pdb-body').appendChild(overlay);

    overlay.addEventListener('click', async (e) => {
      if(e.target.classList.contains('btn-save-tok')) {
        const prod = e.target.dataset.prod;
        const nt = overlay.querySelector(`.tok-input[data-prod="${prod}"]`).value.trim();
        const ns = overlay.querySelector(`.tok-stat[data-prod="${prod}"]`).value;
        e.target.textContent = "..."; e.target.disabled = true;
        const res = await fetchAPI("update_token", "POST", { producer: prod, newToken: nt, newStatus: ns });

        e.target.textContent = res.status === "success" ? "✔ Saved" : "Error";
        e.target.disabled = false;
        setTimeout(() => { e.target.textContent = "Save"; }, 2000);
      }
    });
    shadow.getElementById('tok-close').onclick = () => overlay.remove();
  }

  // ==========================================
  // DYNAMIC BRANDS STATUS DASHBOARD (ADMIN)
  // ==========================================
  function showBrandsDashboard() {
    const overlay = document.createElement('div');
    overlay.className = 'pdb-modal-overlay';

    const dbProducers = [...new Set(DB.map(r => r.p))].sort((a, b) => a.localeCompare(b, 'en'));

    let listHtml = dbProducers.map(prod => {
      const currentStatus = BRANDS_STATUS[prod] || 'none';

      return `
      <div class="pending-row" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(prod)}"><strong>${escapeHtml(prod)}</strong></div>
        <select class="brand-stat" data-prod="${escapeHtml(prod)}" style="width:160px; padding:4px; font-size:11px; margin: 0 5px;">
          <option value="none" ${currentStatus==='none'?'selected':''}>None (Ordinary)</option>
          <option value="yes" ${currentStatus==='yes'?'selected':''}>Collab / Verified (Green)</option>
          <option value="closed" ${currentStatus==='closed'?'selected':''}>Historical / Closed (Red)</option>
        </select>
        <button class="btn-save-brand" data-prod="${escapeHtml(prod)}" style="background:#10b981; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;">Save</button>
      </div>
      `;
    }).join('') || '<div style="text-align:center; padding:20px; color:#94a3b8;">No brands found to manage.</div>';

    overlay.innerHTML = `
      <div class="pdb-modal" style="width: 480px;">
        <h3>🏷️ Brand Status Manager</h3>
        <p style="font-size:11px; color:#64748b; margin-bottom:10px;">Set brand statuses to highlight verified partners (green) or historical/closed operations (red).</p>
        <div style="max-height: 400px; overflow-y: auto;">${listHtml}</div>
        <div style="text-align:right; margin-top:15px; border-top: 1px solid #e2e8f0; padding-top:10px;">
          <button class="btn-cancel" id="brands-close">Close</button>
        </div>
      </div>
    `;
    shadow.getElementById('pdb-body').appendChild(overlay);

    overlay.addEventListener('click', async (e) => {
      if(e.target.classList.contains('btn-save-brand')) {
        const prod = e.target.dataset.prod;
        const ns = overlay.querySelector(`.brand-stat[data-prod="${prod}"]`).value;
        e.target.textContent = "..."; e.target.disabled = true;
        const res = await fetchAPI("update_brand", "POST", { brand: prod, status: ns });

        if(res.status === "success") {
          BRANDS_STATUS[prod] = ns;
          e.target.textContent = "✔ Saved";
          renderTable();
        } else {
          e.target.textContent = "Error";
        }
        e.target.disabled = false;
        setTimeout(() => { e.target.textContent = "Save"; }, 2000);
      }
    });
    shadow.getElementById('brands-close').onclick = () => overlay.remove();
  }

  // ==========================================
  // ADD NEW MODEL / BRAND MODAL FORM
  // ==========================================
  function showAddModal() {
    const overlay = document.createElement('div');
    overlay.className = 'pdb-modal-overlay';

    const isAdmin = state.modProducer === 'ALL';
    const existingProducers = [...new Set(DB.map(r => r.p))].sort((a,b) => a.localeCompare(b,'en'));

    let producerHTML = '';
    if (isAdmin) {
      producerHTML = `
        <div class="pdb-form-group">
          <label>Producer / Brand</label>
          <select id="add-prod-select">
            ${existingProducers.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}
            <option value="__NEW__">➕ [ Add New Brand... ]</option>
          </select>
          <input type="text" id="add-prod-new-input" placeholder="Type brand name..." style="display:none; margin-top: 8px;">
        </div>
      `;
    } else {
      producerHTML = `
        <div class="pdb-form-group">
          <label>Producer / Brand</label>
          <input type="text" id="add-prod-static" disabled>
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="pdb-modal">
        <h3>➕ Add Specification</h3>
        ${producerHTML}
        <div class="pdb-form-group">
          <label>Model Name</label>
          <input type="text" id="add-model-name" placeholder="e.g. Ti-Fly X">
        </div>
        <div class="pdb-form-group">
          <label>Type</label>
          <select id="add-model-type">
            <option value="tadpole">Tadpole</option>
            <option value="delta">Delta</option>
            <option value="bike">Bike (2-wheel)</option>
            <option value="quad">Quad</option>
            <option value="velomobile">Velomobile</option>
            <option value="handcycle">Handcycle</option>
          </select>
        </div>
        <div class="pdb-form-group">
          <label>Max Load (kg)</label>
          <input type="number" id="add-model-kg" placeholder="e.g. 125" min="0">
        </div>
        <div class="pdb-form-group">
          <label>Website URL</label>
          <input type="text" id="add-model-url" placeholder="https://...">
        </div>
        <div id="add-error" style="color:red; font-size:11px; margin-bottom:10px; display:none;"></div>
        <div class="pdb-modal-actions">
          <button class="btn-cancel" id="add-close-btn">Cancel</button>
          <button class="btn-save" id="add-submit-btn">${isAdmin ? 'Add directly' : 'Submit for approval'}</button>
        </div>
      </div>
    `;

    shadow.getElementById('pdb-body').appendChild(overlay);

    if (isAdmin) {
      const select = shadow.getElementById('add-prod-select');
      const input = shadow.getElementById('add-prod-new-input');
      select.onchange = () => {
        input.style.display = select.value === '__NEW__' ? 'block' : 'none';
      };
    } else {
      // Programmatically set input to avoid raw injection issues
      shadow.getElementById('add-prod-static').value = state.modProducer;
    }

    shadow.getElementById('add-close-btn').onclick = () => overlay.remove();

    shadow.getElementById('add-submit-btn').onclick = async () => {
      const btn = shadow.getElementById('add-submit-btn');
      const errDiv = shadow.getElementById('add-error');
      errDiv.style.display = 'none';

      let producer = '';
      if (isAdmin) {
        const selectVal = shadow.getElementById('add-prod-select').value;
        if (selectVal === '__NEW__') {
          producer = shadow.getElementById('add-prod-new-input').value.trim();
        } else {
          producer = selectVal;
        }
      } else {
        producer = state.modProducer;
      }

      const modelName = shadow.getElementById('add-model-name').value.trim();
      const type = shadow.getElementById('add-model-type').value;
      const kg = parseInt(shadow.getElementById('add-model-kg').value) || 0;
      const url = shadow.getElementById('add-model-url').value.trim();

      if (!producer) {
        errDiv.textContent = "Please specify the producer/brand name.";
        errDiv.style.display = 'block'; return;
      }
      if (!modelName) {
        errDiv.textContent = "Please specify the model name.";
        errDiv.style.display = 'block'; return;
      }

      // Safety checks: Prevent double records or double submissions in Pending queue
      const alreadyExistsInFleet = DB.some(r => r.p.toLowerCase() === producer.toLowerCase() && r.m.toLowerCase() === modelName.toLowerCase());
      const alreadyExistsInPending = PENDING_ITEMS.some(p => p.Producer.toLowerCase() === producer.toLowerCase() && p.Model.toLowerCase() === modelName.toLowerCase() && p.Status && p.Status.trim().toLowerCase() === "pending");

      if (alreadyExistsInFleet) {
        errDiv.textContent = "This model specification already exists in the live database.";
        errDiv.style.display = 'block'; return;
      }
      if (alreadyExistsInPending) {
        errDiv.textContent = "A proposal for this model is already in the pending verification queue.";
        errDiv.style.display = 'block'; return;
      }

      btn.textContent = "Processing..."; btn.disabled = true;

      let res;
      if (isAdmin) {
        res = await fetchAPI("add_model_direct", "POST", { producer, model: modelName, type, kg, url });
      } else {
        res = await fetchAPI("submit_new_model", "POST", { producer, model: modelName, type, kg, url, userToken: state.modToken });
      }

      if (res.status === "success") {
        alert(isAdmin ? "Model successfully saved to database!" : "Model successfully submitted for review!");
        overlay.remove();

        DB = await fetchAPI("get_fleet");
        PENDING_ITEMS = await fetchAPI("get_pending");
        updatePendingCount();

        if (isAdmin) {
          buildUI(); // Full rebuild to update options in the producer filter
        } else {
          renderTable();
        }
      } else {
        errDiv.textContent = "Save failed. Please check internet connection.";
        errDiv.style.display = 'block';
        btn.textContent = isAdmin ? 'Add directly' : 'Submit for approval';
        btn.disabled = false;
      }
    };
  }

  // ==========================================
  // ADS MANAGER PANEL & SCHEDULER (100% ENGLISH)
  // ==========================================
  function showAdFormModal(ad) {
    const isNew = !ad;
    ad = ad || { placement: 'top', type: 'html', content: '', link: '', active: 'Tak', rowId: null };
    const cfg = parseAdConfig(ad.active);

    const overlay = document.createElement('div');
    overlay.className = 'pdb-modal-overlay';
    overlay.style.zIndex = "10001";

    overlay.innerHTML = `
      <div class="pdb-modal" style="width: 440px;">
        <h3>${isNew ? '➕ Create Ad' : '✏️ Edit Ad'}</h3>
        <div class="pdb-form-group">
          <label>Placement</label>
          <select id="ad-placement">
            <option value="top" ${ad.placement==='top'?'selected':''}>Top Banner</option>
            <option value="bottom" ${ad.placement==='bottom'?'selected':''}>Bottom Banner</option>
          </select>
        </div>
        <div class="pdb-form-group">
          <label>Type</label>
          <select id="ad-type">
            <option value="html" ${ad.type==='html'?'selected':''}>HTML Text</option>
            <option value="image" ${ad.type==='image'?'selected':''}>Image URL</option>
          </select>
        </div>
        <div class="pdb-form-group">
          <label>Content</label>
          <input type="text" id="ad-content">
        </div>
        <div class="pdb-form-group">
          <label>Target Link</label>
          <input type="text" id="ad-link">
        </div>

        <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 15px 0;">
        <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #1e293b;">📅 Schedule & Status</h4>

        <div class="pdb-form-group">
          <label>Status</label>
          <select id="ad-status">
            <option value="Tak">🟢 Active (Yes)</option>
            <option value="Nie">🔴 Inactive (No)</option>
          </select>
        </div>
        <div class="pdb-form-group" style="display:flex; gap:10px;">
          <div style="flex:1;">
            <label>Show From</label>
            <input type="date" id="ad-start">
          </div>
          <div style="flex:1;">
            <label>Show To</label>
            <input type="date" id="ad-end">
          </div>
        </div>
        <div class="pdb-form-group">
          <label>Active Days</label>
          <div style="display:flex; justify-content:space-between; background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #cbd5e1; margin-top:5px;">
            <label style="display:flex; flex-direction:column; align-items:center; font-size:10px; cursor:pointer; font-weight:normal; margin:0; color:#475569;">
              <input type="checkbox" class="ad-day-cb" value="1" style="margin-bottom:4px;"> Mon
            </label>
            <label style="display:flex; flex-direction:column; align-items:center; font-size:10px; cursor:pointer; font-weight:normal; margin:0; color:#475569;">
              <input type="checkbox" class="ad-day-cb" value="2" style="margin-bottom:4px;"> Tue
            </label>
            <label style="display:flex; flex-direction:column; align-items:center; font-size:10px; cursor:pointer; font-weight:normal; margin:0; color:#475569;">
              <input type="checkbox" class="ad-day-cb" value="3" style="margin-bottom:4px;"> Wed
            </label>
            <label style="display:flex; flex-direction:column; align-items:center; font-size:10px; cursor:pointer; font-weight:normal; margin:0; color:#475569;">
              <input type="checkbox" class="ad-day-cb" value="4" style="margin-bottom:4px;"> Thu
            </label>
            <label style="display:flex; flex-direction:column; align-items:center; font-size:10px; cursor:pointer; font-weight:normal; margin:0; color:#475569;">
              <input type="checkbox" class="ad-day-cb" value="5" style="margin-bottom:4px;"> Fri
            </label>
            <label style="display:flex; flex-direction:column; align-items:center; font-size:10px; cursor:pointer; font-weight:bold; margin:0; color:#e11d48;">
              <input type="checkbox" class="ad-day-cb" value="6" style="margin-bottom:4px;"> Sat
            </label>
            <label style="display:flex; flex-direction:column; align-items:center; font-size:10px; cursor:pointer; font-weight:bold; margin:0; color:#e11d48;">
              <input type="checkbox" class="ad-day-cb" value="7" style="margin-bottom:4px;"> Sun
            </label>
          </div>
        </div>

        <div class="pdb-modal-actions">
          <button class="btn-cancel" id="ad-cancel">Cancel</button>
          <button class="btn-save" id="ad-save">Save</button>
        </div>
      </div>
    `;
    shadow.getElementById('pdb-body').appendChild(overlay);

    // Set values programmatically to avoid HTML-injection breaking the inputs
    shadow.getElementById('ad-content').value = ad.content;
    shadow.getElementById('ad-link').value = ad.link || '';

    // Programmatic settings for schedule/dates:
    shadow.getElementById('ad-status').value = cfg.status;
    shadow.getElementById('ad-start').value = cfg.start || '';
    shadow.getElementById('ad-end').value = cfg.end || '';

    // Check checkboxes according to cfg.days
    const dayCheckboxes = overlay.querySelectorAll('.ad-day-cb');
    dayCheckboxes.forEach(cb => {
      const val = parseInt(cb.value);
      cb.checked = cfg.days.includes(val);
    });

    shadow.getElementById('ad-cancel').onclick = () => overlay.remove();

    shadow.getElementById('ad-save').onclick = async () => {
      const btn = shadow.getElementById('ad-save'); btn.textContent = "Saving..."; btn.disabled = true;
      const placement = shadow.getElementById('ad-placement').value;
      const type = shadow.getElementById('ad-type').value;
      const content = shadow.getElementById('ad-content').value;
      const link = shadow.getElementById('ad-link').value;

      const status = shadow.getElementById('ad-status').value;
      const start = shadow.getElementById('ad-start').value;
      const end = shadow.getElementById('ad-end').value;

      const checkedDays = [];
      overlay.querySelectorAll('.ad-day-cb:checked').forEach(cb => {
        checkedDays.push(parseInt(cb.value));
      });

      const activeJSON = JSON.stringify({
        status: status,
        start: start,
        end: end,
        days: checkedDays
      });

      await fetchAPI("save_ad", "POST", { rowId: ad.rowId, placement, type, content, link, active: activeJSON });
      ADS = await fetchAPI("get_ads");
      overlay.remove();
      const dash = shadow.getElementById('ads-dash-overlay'); if (dash) { dash.remove(); showAdsDashboard(); }
      renderAds();
    };
  }

  function showAdsDashboard() {
    const overlay = document.createElement('div');
    overlay.className = 'pdb-modal-overlay';
    overlay.id = 'ads-dash-overlay';

    let listHtml = ADS.map((ad, idx) => `
      <div class="pending-row" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="flex:1; padding-right:10px;">
          <div style="font-weight:bold; font-size:11px;">[${escapeHtml(ad.placement.toUpperCase())}] ${escapeHtml(ad.type.toUpperCase())}</div>
          <div style="font-size:10px; color:#666; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; width:280px;">${escapeHtml(ad.content)}</div>
        </div>
        <div style="display:flex; gap:5px;">
          <button class="hdr-btn btn-ad-edit" style="background:#3b82f6;" data-idx="${idx}">Edit</button>
          <button class="hdr-btn btn-ad-del" style="background:#ef4444;" data-idx="${idx}">Del</button>
        </div>
      </div>
    `).join('') || '<div style="text-align:center; padding:20px; color:#94a3b8;">No ads in database.</div>';

    overlay.innerHTML = `
      <div class="pdb-modal" style="width: 480px;">
        <h3>📢 Ads Manager</h3>
        <button class="hdr-btn" style="background:#10b981; margin-bottom:15px;" id="btn-new-ad">+ New Ad</button>
        <div style="max-height:300px; overflow-y:auto;">${listHtml}</div>
        <div style="text-align:right; margin-top:20px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          <button class="btn-cancel" id="ads-close">Close</button>
        </div>
      </div>
    `;
    shadow.getElementById('pdb-body').appendChild(overlay);

    overlay.querySelectorAll('.btn-ad-edit').forEach(btn => btn.onclick = () => showAdFormModal(ADS[btn.dataset.idx]));
    overlay.querySelectorAll('.btn-ad-del').forEach(btn => btn.onclick = async () => {
       if(confirm("Are you sure you want to delete this ad?")) {
         await fetchAPI("delete_ad", "POST", { rowId: ADS[btn.dataset.idx].rowId });
         ADS = await fetchAPI("get_ads"); overlay.remove(); showAdsDashboard(); renderAds();
       }
    });

    shadow.getElementById('btn-new-ad').onclick = () => showAdFormModal(null);
    shadow.getElementById('ads-close').onclick = () => overlay.remove();
  }

  // ==========================================
  // AUTH LOGIN PANEL
  // ==========================================
  function showLoginModal() {
    const overlay = document.createElement('div');
    overlay.className = 'pdb-modal-overlay';
    overlay.innerHTML = `
      <div class="pdb-modal">
        <h3>Moderator Login</h3>
        <div class="pdb-form-group">
          <label>Access Token</label>
          <input type="password" id="mod-token-input" placeholder="Enter security token...">
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

      btn.textContent = "Verifying..."; btn.disabled = true;
      const res = await fetchAPI("verify_token", "POST", { token: val });

      if (res.status === "success") {
        state.modToken = val; state.modProducer = res.producer; save(); overlay.remove();
        // Load pending items immediately to sync the administrator badge right after login
        PENDING_ITEMS = await fetchAPI("get_pending");
        buildUI();
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
    let currentStatus = row.arch ? "arch" : row.check ? "check" : "active";

    overlay.innerHTML = `
      <div class="pdb-modal">
        <h3>Edit: ${escapeHtml(row.m)}</h3>
        <div class="pdb-form-group"><label>Model Name</label><input type="text" id="edit-name"></div>
        <div class="pdb-form-group"><label>Max Load (kg)</label><input type="number" id="edit-kg"></div>
        <div class="pdb-form-group"><label>Website URL</label><input type="text" id="edit-url"></div>
        <div class="pdb-form-group">
          <label>Link Status</label>
          <select id="edit-status">
            <option value="active" ${currentStatus==='active'?'selected':''}>🔗 Active</option>
            <option value="arch" ${currentStatus==='arch'?'selected':''}>🗄 Archived</option>
            <option value="check" ${currentStatus==='check'?'selected':''}>❓ To Check</option>
          </select>
        </div>
        <div class="pdb-modal-actions">
          <button class="btn-cancel" id="edit-close">Cancel</button>
          <button class="btn-save" id="edit-save">Submit for approval</button>
        </div>
      </div>
    `;
    shadow.getElementById('pdb-body').appendChild(overlay);

    // Set values programmatically to avoid HTML-injection breaking the inputs
    shadow.getElementById('edit-name').value = row.m;
    shadow.getElementById('edit-kg').value = row.kg || '';
    shadow.getElementById('edit-url').value = row.url;

    shadow.getElementById('edit-close').onclick = () => overlay.remove();

    shadow.getElementById('edit-save').onclick = async () => {
      const btn = shadow.getElementById('edit-save'); btn.textContent = "Sending..."; btn.disabled = true;
      const res = await fetchAPI("submit_edit", "POST", {
          producer: row.p, model: row.m,
          newName: shadow.getElementById('edit-name').value,
          newKg: shadow.getElementById('edit-kg').value,
          newUrl: shadow.getElementById('edit-url').value,
          newStatus: shadow.getElementById('edit-status').value,
          userToken: state.modToken
      });
      if (res.status === "success") {
        alert("Submission sent successfully!");
        overlay.remove();
        // Force direct fetch to lock the submitted row on client
        PENDING_ITEMS = await fetchAPI("get_pending");
        updatePendingCount(); // Refresh the top badge count IMMEDIATELY!
        renderTable();
      }
      else { alert("Save error."); btn.textContent = "Submit for approval"; btn.disabled = false; }
    };
  }

  // ==========================================
  // DEAD LINK SCANNER
  // ==========================================
  function showLinkScannerModal() {
    const overlay = document.createElement('div');
    overlay.className = 'pdb-modal-overlay';
    overlay.innerHTML = `
      <div class="pdb-modal" style="width: 450px;">
        <h3>🔗 Live Link Scanner</h3>
        <p style="font-size: 11px; color: #64748b; margin-bottom: 15px;">The scanner will test all <strong>${DB.length} links</strong> in the background. Broken links will be highlighted in yellow in the list.</p>
        <div style="margin-bottom: 15px;">
            <button class="btn-save" id="start-scan-btn" style="width: 100%; background: #0ea5e9;">Start Scanning</button>
            <button class="btn-cancel" id="reset-scan-btn" style="width: 100%; margin-top: 8px; font-size: 11px;">Clear Yellow Highlights</button>
        </div>
        <div style="background: #1e293b; color: #cbd5e1; border-radius: 6px; height: 180px; overflow-y: auto; padding: 12px; font-size: 11px; font-family: monospace;" id="scan-log">
            Ready...
        </div>
        <div class="pdb-modal-actions">
          <button class="btn-cancel" id="scan-close">Close</button>
        </div>
      </div>
    `;
    shadow.getElementById('pdb-body').appendChild(overlay);
    shadow.getElementById('scan-close').onclick = () => overlay.remove();

    shadow.getElementById('reset-scan-btn').onclick = () => {
        DB.forEach(r => r.brokenStatus = null);
        renderTable();
        shadow.getElementById('scan-log').innerHTML += `<div style="color:#10b981;">[OK] Highlights cleared.</div>`;
    };

    shadow.getElementById('start-scan-btn').onclick = async () => {
        const btn = shadow.getElementById('start-scan-btn');
        const log = shadow.getElementById('scan-log');

        btn.disabled = true; btn.style.background = "#64748b";
        log.innerHTML = "Scanning in progress. If Tampermonkey asks for permissions, click 'Always allow'.<br><br>";

        DB.forEach(r => r.brokenStatus = null);
        renderTable();

        let brokenCount = 0;
        let checkedCount = 0;

        for (let i = 0; i < DB.length; i += 5) {
            const chunk = DB.slice(i, i + 5);
            const promises = chunk.map(r => {
                return new Promise((resolve) => {
                    if(!r.url || r.url.trim() === '') {
                        resolve({ row: r, status: "EMPTY", ok: false }); return;
                    }
                    GM_xmlhttpRequest({
                        method: "HEAD",
                        url: r.url,
                        timeout: 8000,
                        onload: (res) => {
                            if (res.status >= 400 && res.status !== 405 && res.status !== 403 && res.status !== 0) {
                                resolve({ row: r, status: res.status, ok: false });
                            } else {
                                resolve({ row: r, status: null, ok: true });
                            }
                        },
                        onerror: () => resolve({ row: r, status: "CONN_ERR", ok: true }),
                        ontimeout: () => resolve({ row: r, status: "TIMEOUT", ok: true })
                    });
                });
            });

            const results = await Promise.all(promises);
            checkedCount += results.length;
            btn.textContent = `Scanning... (${checkedCount} / ${DB.length})`;

            results.forEach(res => {
                if (!res.ok) {
                    brokenCount++;
                    res.row.brokenStatus = res.status;
                    log.innerHTML += `<div style="color:#ef4444;">[ERR: ${res.status}] ${escapeHtml(res.row.p)} ${escapeHtml(res.row.m)}</div>`;
                }
            });
            log.scrollTop = log.scrollHeight;
            renderTable();
        }

        btn.textContent = "Scanning Finished";
        if (brokenCount === 0) {
            log.innerHTML += `<br><div style="color: #10b981; font-weight: bold; font-size: 13px;">🎉 Zero errors found!</div>`;
        } else {
            log.innerHTML += `<br><div style="color: #eab308; font-weight: bold; font-size: 13px;">⚠️ Found ${brokenCount} broken links. Highlighted in the list.</div>`;
        }
    };
  }

  // ==========================================
  // TABLE CONTROLLER & RENDERER
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

    const tbody = shadow.getElementById('pdb-tbody');
    if (!tbody) return;

    if (DB.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center; padding:30px; color:#ef4444; font-weight:bold; line-height:1.5;">
              ⚠️ Database is currently empty!<br>
              <span style="font-size:11px; font-weight:normal; color:#475569; display:block; margin-top:10px;">
                Please contact the administrator to initialize the dataset.
              </span>
            </td>
          </tr>`;
        return;
    }

    tbody.innerHTML = rows.map((r, idx) => {
      const collab = BRANDS_STATUS[r.p] || '';
      let kgClass = 'kg-none'; let kgText = 'N/A';
      if (r.kg > 0) {
        kgText = r.kg + ' kg';
        if (r.kg < 120) kgClass = 'kg-low'; else if (r.kg < 150) kgClass = 'kg-120plus'; else if (r.kg < 200) kgClass = 'kg-150plus'; else kgClass = 'kg-200plus';
      }

      let linkClass = r.brokenStatus ? 'broken' : r.arch ? 'arch' : r.check ? 'check' : '';
      let linkText = r.brokenStatus ? `❌ Err: ${r.brokenStatus}` : r.arch ? '🗄 Arch' : r.check ? '❓ Check' : '↗ Link';

      let origin = originMap[r.p] || originMap["default"];

      // Block double editing. Check if current model has a pending state
      const hasPending = PENDING_ITEMS.some(p => p.Producer === r.p && p.Model === r.m && p.Status && p.Status.trim().toLowerCase() === "pending");

      let editBtnHtml = '';
      if (state.modProducer === 'ALL' || state.modProducer === r.p) {
        if (hasPending) {
          editBtnHtml = `<span style="font-size: 10px; color: #f59e0b; font-weight: bold; margin-left: 5px; background: #fffbeb; border: 1px solid #fef3c7; padding: 2px 6px; border-radius: 4px; display: inline-block; vertical-align: middle;">⏳ Pending</span>`;
        } else {
          editBtnHtml = `<button class="btn-edit" data-idx="${idx}">Edit</button>`;
        }
      }

      let trClass = r.brokenStatus ? 'row-broken' : collab === 'yes' ? 'row-collab-yes' : collab === 'closed' ? 'row-collab-closed' : '';

      return `
      <tr class="${trClass}">
        <td class="pdb-prod" title="${escapeHtml(origin.c)}">${origin.f} ${escapeHtml(r.p)}</td>
        <td class="pdb-model">${escapeHtml(r.m)} ${editBtnHtml}</td>
        <td><span class="pdb-type ${TYPE_CLASS[r.type]||''} ">${escapeHtml(TYPE_LABEL[r.type]||r.type)}</span></td>
        <td><span class="pdb-kg ${kgClass}">${escapeHtml(kgText)}</span></td>
        <td class="pdb-link ${linkClass}"><a href="${escapeHtml(r.url)}" target="_blank">${escapeHtml(linkText)}</a></td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.onclick = () => showEditModal(rows[btn.dataset.idx]);
    });
  }

  // ==========================================
  // CAROUSEL BANNER INJECTOR
  // ==========================================
  function renderAds() {
    carouselIntervals.forEach(clearInterval);
    carouselIntervals = [];

    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const localDate = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
    let currentDay = new Date().getDay(); currentDay = currentDay === 0 ? 7 : currentDay;

    const activeAds = ADS.filter(ad => {
      const cfg = parseAdConfig(ad.active);
      const isStatusActive = ['tak', 'yes'].includes(cfg.status.toLowerCase());
      if (!isStatusActive) return false;
      if (cfg.start && localDate < cfg.start) return false;
      if (cfg.end && localDate > cfg.end) return false;
      if (cfg.days && cfg.days.length > 0 && !cfg.days.includes(currentDay)) return false;
      return true;
    });

    const topAds = activeAds.filter(a => a.placement === "top");
    const botAds = activeAds.filter(a => a.placement === "bottom");

    const injectCarousel = (adArray, elId) => {
      const el = shadow.getElementById(elId); if(!el) return;
      if(adArray.length === 0) { el.style.display = 'none'; return; }
      el.style.display = 'flex';

      let html = '<div class="carousel-wrap">';
      adArray.forEach((ad, index) => {
        let slideHtml = ad.link ? `<a href="${escapeHtml(ad.link)}" target="_blank" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; text-decoration:none;">` : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold;">`;
        if (ad.type === 'image') {
          slideHtml += `<img src="${escapeHtml(ad.content)}" style="max-height:90px; max-width:100%; object-fit:contain;">`;
        } else {
          slideHtml += `<div style="background:var(--pz-hdr-bg); padding:10px; text-align:center; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">${ad.content}</div>`;
        }
        slideHtml += ad.link ? '</a>' : '</div>';
        html += `<div class="carousel-slide ${index === 0 ? 'active' : ''}">${slideHtml}</div>`;
      });
      html += '</div>';
      el.innerHTML = html;

      if (adArray.length > 1) {
        let cur = 0; const slides = el.querySelectorAll('.carousel-slide');
        const intervalId = setInterval(() => {
          slides[cur].classList.remove('active'); cur = (cur + 1) % slides.length; slides[cur].classList.add('active');
        }, 5000);
        carouselIntervals.push(intervalId);
      }
    };

    injectCarousel(topAds, 'pdb-ad-top');
    injectCarousel(botAds, 'pdb-ad-bot');
  }

  // ==========================================
  // UI ASSEMBLY
  // ==========================================
  async function buildUI() {
    const existing = shadow.getElementById('pdb-wrap'); if (existing) existing.remove();
    const wrap = document.createElement('div'); wrap.id = 'pdb-wrap';
    if (state.collapsed) wrap.classList.add('col');

    const producers = ['all', ...new Set(DB.map(r => r.p))].sort((a,b) => a === 'all' ? -1 : a.localeCompare(b,'en'));
    const loginIcon = state.modToken ? '🔓' : '🔐';
    const isAdmin = state.modProducer === 'ALL';
    const addBtnHtml = state.modProducer ? `<button id="pdb-btn-add" class="btn-add-new">+ Add New</button>` : '';

    const pzTopMetaHTML = `
      <div class="pz-top-meta" style="background-color: #fff3cd; color: #856404; padding: 10px 15px; border: 1px solid #ffeeba; border-radius: 4px; font-size: 11px; line-height: 1.4; margin: 10px 12px 0 12px; text-align: center; box-sizing: border-box;">
        <strong>Notice:</strong> This database is for reference only and may contain errors. Please verify directly on the manufacturer's official website.
      </div>`;

    let modSelfManageHtml = '';
    if (state.modProducer && state.modProducer !== 'ALL') {
      modSelfManageHtml = `<button id="mod-change-token-btn" class="btn-edit" style="margin-left:8px; vertical-align:middle; background:#f59e0b; color:#fff; border-color:#d97706;">🔑 Change Token</button>`;
    }

    wrap.innerHTML = `
      <div id="pdb-hdr">
        <div class="logo-wrap"><img src="${LOGO_URL}" class="hdr-logo" alt="Logo"></div>
        <span class="title">Poziomki DB</span>
        <div style="display: flex; align-items: center; margin-left: 5px;">
            <input type="text" id="pdb-search" placeholder="Search..." value="${escapeHtml(state.searchStr || '')}">
        </div>
        <div style="display: flex; align-items: center; gap: 4px; margin-left: auto;">
            <span class="badge" id="pdb-cnt" style="margin-right:2px;">0</span>
            ${isAdmin ? `
              <button class="hdr-btn" id="admin-dash-btn" title="Pending Queue">🔔 Pending...</button>
              <button class="hdr-btn" id="admin-tok-btn" style="background:#f59e0b;" title="Token Manager">🔑 Tokens</button>
              <button class="hdr-btn" id="admin-brands-btn" style="background:#ec4899;" title="Brand Status Manager">🏷️ Brands</button>
              <button class="hdr-btn" id="admin-ads-btn" style="background:#8b5cf6;" title="Ads Manager">📢 Ads</button>
              <button class="hdr-btn" id="admin-link-btn" style="background:#0ea5e9;" title="Link Scanner">🔗 Links</button>
            ` : ''}
            <button class="hdr-btn" id="cms-login-btn" title="Moderator Login">${loginIcon}</button>
            <span id="pdb-arr" style="cursor:pointer; padding: 0 4px; color:rgba(255,255,255,0.7);">${state.collapsed?'▲':'▼'}</span>
            <button class="xbtn" id="pdb-x">✕</button>
        </div>
      </div>
      <div id="pdb-body">
        ${pzTopMetaHTML}
        <div class="pdb-ad-box" id="pdb-ad-top" style="display:none"></div>
        <div class="pdb-ctrl">
          <select id="pdb-prod">${producers.map(p => `<option value="${escapeHtml(p)}"${p===state.filterProd?' selected':''}>${p==='all'?'All producers':escapeHtml(p)}</option>`).join('')}</select>
          <select id="pdb-type">
            <option value="all">All types</option>
            <option value="tadpole">Tadpole</option>
            <option value="delta">Delta</option>
            <option value="bike">Bike (2-wheel)</option>
            <option value="quad">Quad</option>
            <option value="velomobile">Velomobile</option>
            <option value="handcycle">Handcycle</option>
          </select>
          <input type="number" id="pdb-kg" placeholder="Min load (kg)" min="0" step="5" value="${state.minKg || ''}">
          ${addBtnHtml}
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
        <div class="pdb-ad-box" id="pdb-ad-bot" style="display:none; margin-bottom: 10px;"></div>
        <div class="pdb-foot">
          <div style="display: flex; align-items: center; color: #cbd5e1;">
            <div class="foot-avatar-wrap"><img src="${AVATAR_URL}" class="foot-avatar" alt="Author" onerror="if(this.src.includes('.jpg')){this.src=this.src.replace('.jpg','.png');}"></div>
            <span>Author: <strong>${CONFIG.author}</strong> | Mode: <strong>${escapeHtml(state.modProducer || 'Viewer')}</strong></span>
          </div>
          <div style="display: flex; align-items: center; gap: 15px;">
            <div id="poziomki-weather-widget" style="color: #cbd5e1; font-size: 12px; font-weight: 500; display: flex; align-items: center;"></div>
            <a href="${KOFI_URL}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; background-color: #FF5E5B; color: #ffffff; padding: 5px 12px; border-radius: 20px; text-decoration: none; font-weight: bold; font-size: 12px; box-shadow: 0 2px 5px rgba(255, 94, 91, 0.4); transition: transform 0.2s;">
              Buy me a coffee
            </a>
          </div>
        </div>
      </div>`;

    shadow.appendChild(wrap);
    shadow.getElementById('pdb-type').value = state.filterType;

    renderAds();
    setTimeout(loadPoziomkiWeather, 500);

    // Add model dynamic click event
    const addBtn = shadow.getElementById('pdb-btn-add');
    if (addBtn) addBtn.onclick = () => showAddModal();

    // Moderator token self change handler
    const modTokBtn = shadow.getElementById('mod-change-token-btn');
    if (modTokBtn) {
      modTokBtn.onclick = () => {
        const overlay = document.createElement('div');
        overlay.className = 'pdb-modal-overlay';
        overlay.innerHTML = `
          <div class="pdb-modal">
            <h3>🔑 Change Your Access Token</h3>
            <p style="font-size:11px; color:#64748b; margin-bottom:12px;">This will update your secret login token for brand <strong>${escapeHtml(state.modProducer)}</strong>.</p>
            <div class="pdb-form-group">
              <label>New Access Token</label>
              <input type="password" id="new-mod-token-input" placeholder="Enter new custom token...">
            </div>
            <div id="mod-tok-error" style="color:red; font-size:11px; margin-bottom:10px; display:none;"></div>
            <div class="pdb-modal-actions">
              <button class="btn-cancel" id="mod-tok-cancel">Cancel</button>
              <button class="btn-save" id="mod-tok-save">Save New Token</button>
            </div>
          </div>
        `;
        shadow.getElementById('pdb-body').appendChild(overlay);
        shadow.getElementById('mod-tok-cancel').onclick = () => overlay.remove();

        shadow.getElementById('mod-tok-save').onclick = async () => {
          const inputVal = shadow.getElementById('new-mod-token-input').value.trim();
          const btn = shadow.getElementById('mod-tok-save');
          const errDiv = shadow.getElementById('mod-tok-error');
          errDiv.style.display = 'none';

          if(!inputVal) {
            errDiv.textContent = "Token cannot be empty.";
            errDiv.style.display = 'block'; return;
          }

          btn.textContent = "Updating..."; btn.disabled = true;
          const res = await fetchAPI("update_token", "POST", { producer: state.modProducer, newToken: inputVal, newStatus: "Active" });

          if (res.status === "success") {
            state.modToken = inputVal;
            save();
            alert("Your token has been successfully changed! Keep it safe.");
            overlay.remove();
          } else {
            errDiv.textContent = "Error updating token. Try again.";
            errDiv.style.display = 'block';
            btn.textContent = "Save New Token"; btn.disabled = false;
          }
        };
      };
    }

    // Main authorization click handler
    shadow.getElementById('cms-login-btn').onclick = () => {
      if (state.modToken) {
        if (confirm("Are you sure you want to log out from Moderator mode?")) {
          state.modToken = ''; state.modProducer = ''; pendingCountCached = null; save(); buildUI();
        }
      } else {
        showLoginModal();
      }
    };

    if (isAdmin) {
      setTimeout(updatePendingCount, 50);

      shadow.getElementById('admin-dash-btn').onclick = async () => {
        const btn = shadow.getElementById('admin-dash-btn'); btn.textContent = "...";
        const data = await fetchAPI("get_pending"); showAdminDashboard(data);
      };
      shadow.getElementById('admin-tok-btn').onclick = async () => {
        const btn = shadow.getElementById('admin-tok-btn'); btn.textContent = "...";
        const data = await fetchAPI("get_tokens"); showTokenDashboard(data);
        btn.textContent = "🔑 Tokens";
      };
      shadow.getElementById('admin-brands-btn').onclick = () => showBrandsDashboard();
      shadow.getElementById('admin-ads-btn').onclick = () => showAdsDashboard();
      shadow.getElementById('admin-link-btn').onclick = () => showLinkScannerModal();
    }

    // Drag and Drop implementation
    const header = shadow.getElementById('pdb-hdr');
    let isDragging = false, hasDragged = false, startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', (e) => {
      if(e.target.closest('.logo-wrap') || e.target.closest('.hdr-btn') || e.target.id === 'pdb-x' || e.target.id === 'pdb-search' || e.target.id === 'pdb-btn-add') return;
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
      if(e.target.closest('.logo-wrap') || e.target.closest('.hdr-btn') || e.target.id === 'pdb-x' || e.target.id === 'pdb-search' || e.target.id === 'pdb-btn-add' || hasDragged) return;
      state.collapsed = !state.collapsed; wrap.classList.toggle('col');
      shadow.getElementById('pdb-arr').textContent = state.collapsed ? '▲' : '▼'; save();
    });

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
  // APP INITIALIZATION
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
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 6px;">Poziomki DB</div>
        <div style="font-size: 11px; color: #64748b; line-height: 1.4; max-width: 400px; margin: 0 auto;">
            Connecting... Please wait.
        </div>
      </div>
    `;
    shadow.appendChild(loadingWrap);

    try {
      const isAdmin = state.modProducer === 'ALL';

      // Fetch everything in parallel (Including Brand statuses from database!)
      const [adsResponse, fleetResponse, pendingResponse, brandsResponse] = await Promise.all([
        fetchAPI("get_ads"),
        fetchAPI("get_fleet"),
        fetchAPI("get_pending"),
        fetchAPI("get_brands")
      ]);

      ADS = adsResponse || [];
      DB = fleetResponse || [];
      PENDING_ITEMS = pendingResponse || [];

      BRANDS_STATUS = {};
      if (brandsResponse) {
        brandsResponse.forEach(b => {
          BRANDS_STATUS[b.brand] = b.status; // 'yes', 'closed', or 'none'
        });
      }

      if (isAdmin && PENDING_ITEMS) {
          pendingCountCached = PENDING_ITEMS.filter(d => d.Status && d.Status.trim().toLowerCase() === 'pending').length;
      }

      // Default fallback ads when Ads sheet is still unpopulated
      if (ADS.length === 0) {
        ADS = [
          { placement: "top", type: "html", content: "✨ Welcome to Poziomki DB!", link: "", active: "Tak" },
          { placement: "bottom", type: "html", content: "📢 Advertisements space. Setup your campaigns via Ads Manager.", link: "", active: "Tak" }
        ];
      }

      loadingWrap.remove();
      buildUI();
    } catch (error) {
      loadingWrap.innerHTML = `
        <div id="pdb-hdr">
          <div class="logo-wrap"><img src="${LOGO_URL}" class="hdr-logo" alt="Logo"></div>
          <span class="title">Connection Error</span>
        </div>
        <div class="error-msg" style="background:#fff;">
          <strong>Database Connection Error:</strong><br>Failed to retrieve dataset. Please try again later.
        </div>
      `;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp); else initApp();
})();
