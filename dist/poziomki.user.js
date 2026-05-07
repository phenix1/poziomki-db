// ==UserScript==
// @name         Poziomki DB v1.8.1
// @namespace    https://poziomki.info
// @version      1.8.1
// @description  Recumbent bikes database (Avatar set to me.jpg)
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
  // Zmiana na me.jpg na twardo
  const AVATAR_URL = 'https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/me.jpg';
  const KOFI_URL = 'https://ko-fi.com/mbfeniks';

  let COLLAB = {};
  let DB = [];
  let CONFIG = { version: "1.8.1" };

  const SK = 'poziomki_state_v1_8';
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
      display: flex; flex-direction: column; background: transparent; 
      filter: drop-shadow(0 10px 30px rgba(0,30,80,.2));
      resize: horizontal; min-width: 450px; max-width: 95vw;
    }
    #pdb-wrap.col { height: 50px; min-height: 50px; max-height: 50px; }
    #pdb-hdr { 
      background: linear-gradient(135deg, #162b45 0%, #2a6090 100%); color: #fff; 
      padding: 8px 14px; display: flex; align-items: center; gap: 10px; 
      cursor: grab; user-select: none; flex-shrink: 0; height: 34px;
      border-radius: 12px 12px 0 0; border: 1px solid #162b45; border-bottom: none;
    }
    #pdb-wrap.col #pdb-hdr { border-radius: 12px; border-bottom: 1px solid #162b45; }
    #pdb-hdr:active { cursor: grabbing; }
    
    .hdr-logo { height: 26px; width: 26px; border-radius: 6px; background: #fff; padding: 2px; object-fit: contain; pointer-events: auto; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: top left; }
    .hdr-logo:hover { transform: scale(2.5); z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    
    .hdr-avatar { height: 30px; width: 30px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.8); object-fit: cover; background: #fff; pointer-events: auto; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: top right; }
    .hdr-avatar:hover { transform: scale(2.5); z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    
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
    
    #pdb-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; background: #fff; border: 1px solid #c0cce0; border-top: none; border-radius: 0 0 12px 12px; }
    #pdb-wrap.col #pdb-body { display: none; }
    
    .pdb-ctrl { padding: 8px 12px; display: flex; gap: 8px; background: #f4f7fb; border-bottom: 1px solid #e0e8f0; flex-shrink: 0; }
    .pdb-ctrl select, .pdb-ctrl input { padding: 5px 8px; border: 1px solid #c4d0e0; border-radius: 6px; min-width: 100px; font-size: 12px; }
    
    .pdb-promo { text-align: center; background: #f8fafc; flex-shrink: 0; padding: 6px; display: flex; justify-content: center; }
    .pdb-promo img { max-width: 100%; max-height: 80px; border-radius: 6px; display: block; box-shadow: 0 2px 6px rgba(0,0,0,0.1); transition: opacity 0.2s; }
    .pdb-promo a:hover img { opacity: 0.85; }
    #pdb-promo-top { border-bottom: 1px solid #e0e8f0; }
    #pdb-promo-bottom { border-top: 1px solid #e0e8f0; }
    
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
    
    .pdb-prod { font-weight: 600
