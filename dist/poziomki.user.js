// ==UserScript==
// @name         Poziomki — baza 2.3 STABLE
// @namespace    https://poziomki.info
// @version      2.3
// @match        https://*/*
// @exclude      https://github.com/*
// @exclude      https://raw.githubusercontent.com/*
// @exclude      https://greasyfork.org/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(async function () {
'use strict';

// ===== LANG =====
const LANG = "en";

const i18n = {
  en: {
    search: "search...",
    type: "type",
    minKg: "min load (kg)",
    all: "all",
    models: "models",
    contact: "report issues"
  }
};

function t(key){
  return i18n[LANG][key] || key;
}

// ===== SAFETY =====
if (window.top !== window.self) return;

// ===== DB =====
const DB_URL = "https://raw.githubusercontent.com/phenix1/poziomki-db/main/data/db.json?v=" + Date.now();
let DB = [];

// ===== COMPANY STATUS =====
const COMPANY_STATUS = {
  "HP Velotechnik": "verified",
  "ICE": "verified",
  "AZUB": "verified",

  "KMX": "archived_all",

  "Matix": "active",
  "Dekers": "active"
};

// ===== LOAD =====
async function loadDB() {
  const res = await fetch(DB_URL);
  DB = await res.json();
}

// ===== STYLE =====
GM_addStyle(`
#pdb {
  position: fixed;
  top: 60px;
  right: 10px;
  width: 560px;
  max-height: 88vh;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0,0,0,.35);
  font-size: 13px;
  z-index:999999;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  border:1px solid #cfd6e0;
}

#pdb-header {
  background:#1e3a5f;
  color:white;
  padding:8px;
  display:flex;
  align-items:center;
}

#pdb-search {
  margin-left:10px;
  flex:1;
  padding:5px;
  border-radius:4px;
  border:1px solid #ccc;
  color:#222;
  background:#fff;
}

#pdb-search::placeholder {
  color:#777;
}

#pdb-controls {
  padding:6px;
  background:#eef3fa;
  display:flex;
  gap:4px;
  flex-wrap:wrap;
}

#pdb-controls input, 
#pdb-controls select {
  padding:4px;
  border:1px solid #bbb;
  border-radius:4px;
}

#pdb-table {
  width:100%;
  border-collapse:collapse;
}

#pdb-table td {
  padding:6px;
  border-bottom:1px solid #e0e6ef;
}

#pdb-table tr:hover {
  background:#e8f0ff;
}

a {
  color:#0055cc;
  font-weight:500;
}

#pdb-footer {
  background:#dbe6f7;
  padding:6px;
  font-size:11px;
  text-align:right;
  color:#1e3a5f;
}
`);

// ===== STATE =====
let state = {
  search:"",
  prod:"all",
  type:"all",
  kg:0
};

// ===== FILTER =====
function getData(){
  return DB.filter(r=>{
    const text = (r.p + " " + r.m + " " + r.type).toLowerCase();

    if(state.search && !text.includes(state.search)) return false;
    if(state.prod!=="all" && r.p!==state.prod) return false;
    if(state.type!=="all" && r.type!==state.type) return false;
    if(state.kg && r.kg<state.kg) return false;

    return true;
  });
}

// ===== COMPANY COLOR =====
function getCompanyColor(p){
  const s = COMPANY_STATUS[p] || "active";

  if(s === "verified") return "#e6f4ea";
  if(s === "archived_all") return "#fff8e1";
  if(s === "defunct") return "#fdecea";

  return "#ffffff";
}

// ===== UI =====
function init(){

  const wrap = document.createElement("div");
  wrap.id="pdb";

  const producers = ["all", ...new Set(DB.map(r=>r.p))];

  wrap.innerHTML=`
    <div id="pdb-header">
      <img src="https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/logo.png?v=2"
           style="height:20px;margin-right:6px;background:white;padding:2px 4px;border-radius:4px;">
      🚴 Poziomki 2.3
      <input id="pdb-search" placeholder="${t('search')}">
    </div>

    <div id="pdb-controls">
      <select id="prod">
        ${producers.map(p=>`
          <option value="${p}">
            ${p==="all"?t('all'):p}
          </option>
        `).join("")}
      </select>

      <select id="type">
        <option value="all">${t('type')}</option>
        ${[...new Set(DB.map(r=>r.type))].map(t=>`<option value="${t}">${t}</option>`).join("")}
      </select>

      <input id="kg" placeholder="${t('minKg')}" type="number">
    </div>

    <table id="pdb-table">
      <tbody id="pdb-body"></tbody>
    </table>

    <div id="pdb-footer">
      ${DB.length} ${t('models')} • 
      <a href="mailto:phenix29@gmail.com">${t('contact')}</a>

      <img src="https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/me.jpg?v=2"
           style="height:26px;margin-left:8px;border-radius:50%;opacity:0.6;">
    </div>
  `;

  document.body.appendChild(wrap);

  document.getElementById("pdb-search").oninput=e=>{
    state.search=e.target.value.toLowerCase();
    render();
  };

  document.getElementById("prod").onchange=e=>{
    state.prod=e.target.value;
    render();
  };

  document.getElementById("type").onchange=e=>{
    state.type=e.target.value;
    render();
  };

  document.getElementById("kg").oninput=e=>{
    state.kg=parseInt(e.target.value)||0;
    render();
  };

  render();
}

// ===== RENDER =====
function render(){
  const data = getData();

  document.getElementById("pdb-body").innerHTML = data.map(r=>`
    <tr>
      <td class="pdb-producer" data-p="${r.p}"
          style="cursor:pointer;font-weight:500;background:${getCompanyColor(r.p)};">
        ${r.p}
      </td>

      <td>
        ${r.url ? `<a href="${r.url}" target="_blank">${r.m}</a>` : r.m}
        ${r.production === "discontinued" ? " 🕓" : ""}
      </td>

      <td>${r.type}</td>
      <td>${r.kg || "-"}</td>
    </tr>
  `).join("");
}

// ===== CLICK FILTER =====
document.addEventListener("click", e=>{
  if(e.target.classList.contains("pdb-producer")){
    state.prod = e.target.dataset.p;
    document.getElementById("prod").value = state.prod;
    render();
  }
});

// ===== START =====
await loadDB();
init();

})();
