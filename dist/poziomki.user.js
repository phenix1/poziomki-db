// ==UserScript==
// @name         Poziomki — baza 2.2 PRO
// @namespace    https://poziomki.info
// @version      2.2
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

// 🔥 DB
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
  background: #fff;
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
}

#pdb-controls {
  padding:6px;
  background:#eef3fa;
  display:flex;
  gap:6px;
  flex-wrap:wrap;
  border-bottom:1px solid #d0d8e5;
}

#pdb-controls label {
  font-size:11px;
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
}

.bad {
  color:#aaa;
}

#pdb-footer {
  background:#dbe6f7;
  padding:6px;
  font-size:11px;
  text-align:right;
}
`);

// ===== STATE =====
let state = {
  search:"",
  noLink:false,
  onlyRaw:false
};

// ===== FILTER =====
function getData(){
  return DB.filter(r=>{
    const text = (r.p + " " + r.m).toLowerCase();

    if(state.search && !text.includes(state.search)) return false;

    if(state.noLink && r.url) return false;

    if(state.onlyRaw && r.status !== "raw") return false;

    return true;
  });
}

// ===== UI =====
function init(){

  const wrap = document.createElement("div");
  wrap.id="pdb";

  wrap.innerHTML=`
    <div id="pdb-header">
      🚴 Poziomki 2.2
      <input id="pdb-search" placeholder="search...">
    </div>

    <div id="pdb-controls">
      <label><input type="checkbox" id="noLink"> no link</label>
      <label><input type="checkbox" id="onlyRaw"> to verify</label>
    </div>

    <table id="pdb-table">
      <tbody id="pdb-body"></tbody>
    </table>

    <div id="pdb-footer"></div>
  `;

  document.body.appendChild(wrap);

  document.getElementById("pdb-search").oninput=e=>{
    state.search=e.target.value.toLowerCase();
    render();
  };

  document.getElementById("noLink").onchange=e=>{
    state.noLink=e.target.checked;
    render();
  };

  document.getElementById("onlyRaw").onchange=e=>{
    state.onlyRaw=e.target.checked;
    render();
  };

  render();
}

// ===== RENDER =====
function render(){

  const data = getData();

  document.getElementById("pdb-body").innerHTML = data.map(r=>`
    <tr>
      <td>${r.p}</td>
      <td class="${!r.url ? 'bad' : ''}">
        ${r.url ? `<a href="${r.url}" target="_blank">${r.m}</a>` : r.m}
      </td>
      <td>${r.type||""}</td>
      <td>${r.kg||"-"} kg</td>
    </tr>
  `).join("");

  document.getElementById("pdb-footer").innerText =
    data.length + " models";
}

// ===== START =====
await loadDB();
init();

})();
