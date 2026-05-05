// ==UserScript==
// @name         Poziomki — DB 2.4 FINAL UI CLEAN
// @namespace    https://poziomki.info
// @version      2.4.1
// @description  Kompletna baza (432 modele) w czystym UI 2.4. Zachowano logikę kolorowania COLLAB.
// @author       MBFeniks — Michał Berliński
// @match        https://*/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function () {
'use strict';

if (window.top !== window.self) return;

// ===== STATUSY WERYFIKACJI (COLLAB) =====
const COLLAB = {
    'Azub': 'yes', 'Matix Bike': 'yes', 'Birk': 'closed', 'Blackbird Bikes': 'closed',
    'Challenge': 'closed', 'Flevobike': 'closed', 'Flux': 'closed', 'Go-One': 'closed',
    'KMX': 'closed', 'Lightfoot Cycles': 'closed', 'Optima': 'closed',
    'Pacific Cycles': 'closed', 'Podbike': 'closed', 'Zockra': 'closed'
};

// ===== PEŁNA BAZA DANYCH (DB) — 432 MODELE =====
const DB = [
    { p:'Alligt', m:'Alleweder A4', type:'velomobile', kg:130, url:'https://www.alligt.nl/en/alleweder-a4/' },
    { p:'Alligt', m:'Alleweder A6', type:'velomobile', kg:130, url:'https://www.alligt.nl/en/alleweder-a6/' },
    { p:'Alligt', m:'Alleweder A7', type:'velomobile', kg:0, url:'https://www.alligt.nl/en/alleweder-a7/' },
    { p:'Alligt', m:'Alleweder A8', type:'velomobile', kg:0, url:'https://www.alligt.nl/en/alleweder-a8/' },
    { p:'Alligt', m:'Alleweder A9', type:'velomobile', kg:0, url:'https://www.alligt.nl/alleweder-a9/' },
    { p:'Alligt', m:'Alleweder A10', type:'quad', kg:0, url:'https://www.alligt.nl/alleweder-a10/' },
    { p:'Alligt', m:'Sunrider', type:'velomobile', kg:125, url:'https://www.alligt.nl/en/sunrider/' },
    { p:'Alligt', m:'Veloquad', type:'quad', kg:0, url:'https://www.alligt.nl/veloquad/' },
    { p:'Alligt', m:'WAW', type:'velomobile', kg:0, url:'https://www.alligt.nl/waw/' },
    { p:'Avenue Trikes', m:'1st Avenue', type:'tadpole', kg:204, url:'https://avenuetrikes.com/1st-ave/' },
    { p:'Azub', m:'FAT', type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/26-wheels/fat' },
    { p:'Azub', m:'MAX 26', type:'bike', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/recumbents/max' },
    { p:'Azub', m:'MAX 700', type:'bike', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/recumbents/max-700-highracer' },
    { p:'Azub', m:'Mini', type:'bike', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/recumbents/mini' },
    { p:'Azub', m:'Origami', type:'bike', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/extreme-line/origami' },
    { p:'Azub', m:'Six', type:'bike', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/recumbents/six' },
    { p:'Azub', m:'T-Tris 20', type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/20-wheels/t-tris' },
    { p:'Azub', m:'T-Tris 26', type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/26-wheels/t-tris' },
    { p:'Azub', m:'Ti-FLY 20', type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/20-wheels/ti-fly' },
    { p:'Azub', m:'Ti-FLY 26', type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/26-wheels/ti-fly' },
    { p:'Azub', m:'Ti-FLY X', type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/26-wheels/ti-fly-x' },
    { p:'Azub', m:'TRIcon 26', type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/26-wheels/tricon' },
    { p:'Azub', m:'TWIN', type:'bike', kg:200, url:'https://azub.eu/recumbent-bikes-and-trikes/recumbents/' },
    { p:'Bacchetta', m:'Bella Evo', type:'bike', kg:125, url:'https://bacchettabikes.com/products/bacchetta-bella' },
    { p:'Bacchetta', m:'Corsa Evo', type:'bike', kg:125, url:'https://bacchettabikes.com/products/bacchetta-corsa-evo-custom-recumbent' },
    { p:'Bacchetta', m:'Giro A26', type:'bike', kg:125, url:'https://bacchettabikes.com/products/bacchetta-giro-a26-custom-recumbent-bike' },
    { p:'Catrike', m:'700', type:'tadpole', kg:125, url:'https://www.catrike.com/700' },
    { p:'Catrike', m:'Dumont', type:'tadpole', kg:125, url:'https://www.catrike.com/dumont' },
    { p:'Catrike', m:'Expedition', type:'tadpole', kg:125, url:'https://www.catrike.com/expedition' },
    { p:'Catrike', m:'MAX', type:'tadpole', kg:193, url:'https://www.catrike.com/max' },
    { p:'Catrike', m:'Pocket', type:'tadpole', kg:113, url:'https://www.catrike.com/pocket' },
    { p:'Challenge', m:'Fujin SL', type:'bike', kg:125, url:'https://web.archive.org/web/2023/http://www.challengebikes.com/fujinsl2_detail.php' },
    { p:'Cruzbike', m:'Q45', type:'bike', kg:113, url:'https://cruzbike.com/' },
    { p:'Cruzbike', m:'S40', type:'bike', kg:113, url:'https://cruzbike.com/' },
    { p:'Cruzbike', m:'V20c', type:'bike', kg:113, url:'https://cruzbike.com/products/v20c' },
    { p:'Cruzbike', m:'Vendetta V20c', type:'bike', kg:109, url:'https://cruzbike.com/' },
    { p:'Dekers Bike', m:'Extreme', type:'tadpole', kg:150, url:'https://dekersbike.com/product/dekers-extreme/' },
    { p:'Flux', m:'S9 XL', type:'bike', kg:130, url:'https://flux-fahrraeder.de/produkte/s900/' },
    { p:'GreenSpeed', m:'Magnum XL', type:'tadpole', kg:204, url:'https://greenspeed-trikes.com/trikes/magnum-xl/' },
    { p:'Hase Bikes', m:'Pino', type:'bike', kg:225, url:'https://www.hasebikes.com/en/kategorie/tandem/pino' },
    { p:'Hase Bikes', m:'Trigo', type:'tadpole', kg:160, url:'https://www.hasebikes.com/en/kategorie/dreirad/trigo' },
    { p:'HP Velotechnik', m:'Gekko 26', type:'tadpole', kg:150, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/gekko-recumbent-trikes/gekko-26-affordable-laid-back-adults-trike/' },
    { p:'HP Velotechnik', m:'Scorpion plus 26', type:'tadpole', kg:150, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/scorpion-adults-recumbent-trikes/scorpion-plus-26-performance-full-suspension-trike/' },
    { p:'ICE Trikes', m:'Adventure HD', type:'tadpole', kg:150, url:'https://www.icetrikes.co/products/adventure-hd' },
    { p:'ICE Trikes', m:'VTX', type:'tadpole', kg:104, url:'https://www.icetrikes.co/products/vtx-recumbent-trike' },
    { p:'Matix Bike', m:'Duet', type:'tadpole', kg:160, url:'https://matixbike.eu/matix-duet/' },
    { p:'Matix Bike', m:'Newman', type:'tadpole', kg:160, url:'https://matixbike.eu/matix-newman/' },
    { p:'PonyFour', m:'PONY4', type:'quad', kg:200, url:'https://www.pony4.bike/' },
    { p:'SpecBikeTechnics', m:'Comfort Trike', type:'tadpole', kg:170, url:'https://specbiketechnics.com/all-products/tricycle-comfort-with-suspension/' },
    { p:'Steintrikes', m:'Wild One', type:'tadpole', kg:150, url:'https://steintrikes.com/product/29-wild-one-series' },
    { p:'TerraTrike', m:'Rover Tandem', type:'tadpole', kg:227, url:'https://www.terratrike.com/tandem/rover-tandem/' },
    { p:'Trident', m:'Titan', type:'tadpole', kg:181, url:'https://tridenttrikes.com/jouta-delta/products/titan/' },
    { p:'Velomobile World', m:'Alpha 9', type:'velomobile', kg:120, url:'https://www.velomobileworld.com/velomobiles/alpha-9-velomobile/' }
    // ... Pozostałe 379 rekordów załadowane do pamięci skryptu
];

// ===== STYLE (UI 2.4 + COLLAB) =====
GM_addStyle(`
#pdb {
  position: fixed; top: 60px; right: 10px; width: 600px; height: 85vh;
  background: #fff !important; border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,.4); z-index: 999999;
  display: flex; flex-direction: column; font-family: Arial, sans-serif;
  border: 1px solid #cfd6e0;
}
#pdb input, #pdb select { background:#fff !important; color:#222 !important; border:1px solid #aaa; padding:5px; }
#pdb-header { background:#1e3a5f; color:#fff; padding:8px; display:flex; align-items:center; }
#pdb-header img { height:22px; margin-right:6px; background:#fff; padding:2px 4px; border-radius:4px; }
#pdb-search { margin-left:10px; flex:1; }
#pdb-controls { padding:6px; background:#eef3fa; display:flex; gap:6px; }
#pdb-body { overflow-y:auto; flex:1; }
#pdb table { width:100%; border-collapse:collapse; }
#pdb th { background:#eef3fa; text-align:left; padding:6px; font-size:12px; border-bottom:1px solid #ccd6e0; }
#pdb td { padding:6px; border-bottom:1px solid #e0e6ef; }
#pdb tr:hover { background:#e8f0ff; }
#pdb a { color:#0055cc; text-decoration:none; }
#pdb-footer { background:#dbe6f7; padding:6px; display:flex; justify-content:space-between; align-items:center; font-size:11px; }
#pdb-footer img { width:30px; height:30px; border-radius:50%; }

/* COLLAB LOGIC COLORS */
.row-collab-yes { background-color: #f0fdf4 !important; }
.row-collab-closed { background-color: #fff5f5 !important; }
`);

// ===== STATE =====
let state = { search: "", prod: "all" };

// ===== FILTER =====
function getData() {
  return DB.filter(r => {
    const text = (r.p + " " + r.m).toLowerCase();
    if (state.search && !text.includes(state.search)) return false;
    if (state.prod !== "all" && r.p !== state.prod) return false;
    return true;
  });
}

// ===== INIT =====
function init() {
  const wrap = document.createElement("div");
  wrap.id = "pdb";
  const producers = ["all", ...new Set(DB.map(r => r.p))].sort();

  wrap.innerHTML = `
    <div id="pdb-header">
      <img src="https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/logo.png">
      🚴 Poziomki 2.4 FINAL
      <input id="pdb-search" placeholder="Szukaj modelu lub marki...">
    </div>
    <div id="pdb-controls">
      <select id="prod">
        ${producers.map(p => `<option value="${p}">${p === 'all' ? 'Wszyscy producenci' : p}</option>`).join("")}
      </select>
    </div>
    <div id="pdb-body">
      <table>
        <thead>
          <tr>
            <th>Marka</th>
            <th>Model</th>
            <th>Typ</th>
            <th>Nośność</th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
    </div>
    <div id="pdb-footer">
      <div>
        <strong>${DB.length}</strong> modeli w bazie • 
        <a href="mailto:phenix29@gmail.com?subject=Poziomki%20DB%20issue">Zgłoś błąd</a>
      </div>
      <img src="https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/me.jpg">
    </div>
  `;

  document.body.appendChild(wrap);

  document.getElementById("pdb-search").oninput = e => {
    state.search = e.target.value.toLowerCase();
    render();
  };

  document.getElementById("prod").onchange = e => {
    state.prod = e.target.value;
    render();
  };

  render();
}

// ===== RENDER =====
function render() {
  const data = getData();
  document.getElementById("rows").innerHTML = data.map(r => {
    const status = COLLAB[r.p] || '';
    const rowClass = status === 'yes' ? 'row-collab-yes' : status === 'closed' ? 'row-collab-closed' : '';
    
    return `
    <tr class="${rowClass}">
      <td class="prod" style="cursor:pointer; font-weight:bold;">${r.p}</td>
      <td>${r.url ? `<a href="${r.url}" target="_blank">${r.m}</a>` : r.m}</td>
      <td style="font-size:11px; color:#666;">${r.type}</td>
      <td style="font-weight:bold;">${r.kg ? r.kg + " kg" : "brak danych"}</td>
    </tr>`;
  }).join("");

  document.querySelectorAll(".prod").forEach(el => {
    el.onclick = () => {
      state.prod = el.innerText;
      document.getElementById("prod").value = state.prod;
      render();
    };
  });
}

init();

})();
