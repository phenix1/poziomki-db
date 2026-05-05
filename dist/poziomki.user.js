// ==UserScript==
// @name         Poziomki — baza 2.4 CHECK
// @namespace    https://poziomki.info
// @version      2.4
// @match        https://*/*
// @exclude      https://github.com/*
// @exclude      https://raw.githubusercontent.com/*
// @exclude      https://greasyfork.org/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(async function () {
'use strict';

if (window.top !== window.self) return;

const DB_URL = "https://raw.githubusercontent.com/phenix1/poziomki-db/main/data/db.json?v=" + Date.now();

let DB = [];

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
}

#pdb-controls {
  padding:6px;
  background:#eef3fa;
  display:flex;
  gap:4px;
}

#pdb-table td {
  padding:6px;
  border-bottom:1px solid #e0e6ef;
}

.broken {
  color:#999 !important;
  text-decoration: line-through;
}

.badge {
  font-size:10px;
  margin-left:4px;
}
`);

// ===== STATE =====
let state = {
  search:"",
  prod:"all"
};

// ===== CHECK LINK =====
async function checkLink(url){
  try{
    const res = await fetch(url, {method:"HEAD"});
    return res.ok;
  }catch{
    return false;
  }
}

// ===== UI =====
function init(){

  const wrap = document.createElement("div");
  wrap.id="pdb";

  const producers = ["all", ...new Set(DB.map(r=>r.p))];

  wrap.innerHTML=`
    <div id="pdb-header">
      🚴 Poziomki 2.4
      <input id="pdb-search" placeholder="search...">
    </div>

    <div id="pdb-controls">
      <select id="prod">
        ${producers.map(p=>`<option value="${p}">${p}</option>`).join("")}
      </select>
    </div>

    <table id="pdb-table">
      <tbody id="pdb-body"></tbody>
    </table>
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

  render();
}

// ===== RENDER =====
async function render(){

  const data = DB.filter(r=>{
    const text = (r.p + " " + r.m).toLowerCase();

    if(state.search && !text.includes(state.search)) return false;
    if(state.prod!=="all" && r.p!==state.prod) return false;

    return true;
  });

  const body = document.getElementById("pdb-body");
  body.innerHTML = "";

  for(const r of data){

    const tr = document.createElement("tr");

    const ok = r.url ? await checkLink(r.url) : false;

    tr.innerHTML = `
      <td>${r.p}</td>
      <td class="${ok ? "" : "broken"}">
        ${r.url ? `<a href="${r.url}" target="_blank">${r.m}</a>` : r.m}
        ${ok ? "" : `<span class="badge">⚠</span>`}
      </td>
      <td>${r.type || ""}</td>
      <td>${r.kg || "-"}</td>
    `;

    body.appendChild(tr);
  }
}

// ===== START =====
await loadDB();
init();

})();
