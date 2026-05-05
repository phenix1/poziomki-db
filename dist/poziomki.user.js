// ==UserScript==
// @name         Poziomki — baza 2.0 PRO
// @namespace    https://poziomki.info
// @version      2.1
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

const DB_URL = "https://raw.githubusercontent.com/phenix1/poziomki-db/main/data/db.json";

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
  color:#222;              /* tekst wpisywany */
  background:#fff;
}

#pdb-search::placeholder {
  color:#777;              /* placeholder — teraz czytelny */
}

#pdb-banner {
  background:#dbe6f7;
  padding:6px;
  text-align:center;
  font-size:12px;
  color:#1e3a5f;
  border-bottom:1px solid #cfd6e0;
}

#pdb-controls {
  padding:6px;
  background:#eef3fa;
  display:flex;
  gap:4px;
  flex-wrap:wrap;
  border-bottom:1px solid #d0d8e5;
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
  font-size:13px;
}

#pdb-table td {
  padding:6px;
  border-bottom:1px solid #e0e6ef;
  color:#222;
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
  border-top:1px solid #cfd6e0;
}

#pdb-footer img:hover {
  opacity: 1;
  transform: scale(1.1);
  cursor: pointer;
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

// ===== BANNER =====
function getBanner(){
  const m = new Date().getMonth()+1;
  if(m===12) return "🎄 Wesołych Świąt!";
  if(m===4) return "🐣 Wesołej Wielkanocy!";
  return "";
}

// ===== UI =====
function init(){

  const wrap = document.createElement("div");
  wrap.id="pdb";

  const producers = ["all",...new Set(DB.map(r=>r.p))];

  wrap.innerHTML=`
    <div id="pdb-header">
  <img src="https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/logo.png?v=2"
     style="height:20px;margin-right:6px;
            background:white;
            padding:2px 4px;
            border-radius:4px;">
  🚴 Poziomki 2.0
  <input id="pdb-search" placeholder="szukaj...">
</div>

    <div id="pdb-banner">${getBanner()}</div>

    <div id="pdb-controls">
      <select id="prod">
        ${producers.map(p=>`<option value="${p}">${p}</option>`).join("")}
      </select>

     <select id="type">
  <option value="all">typ</option>
  ${[...new Set(DB.map(r=>r.type))].map(t=>`<option value="${t}">${t}</option>`).join("")}
</select>

      <input id="kg" placeholder="min kg" type="number">
    </div>

    <table id="pdb-table">
      <tbody id="pdb-body"></tbody>
    </table>

 <div id="pdb-footer">
  ${DB.length} modeli • zgłoś poprawki: 
  <a href="mailto:phenix29@gmail.com">email</a>

  <img src="https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/me.jpg?v=2"
       style="height:26px; margin-left:8px; border-radius:50%; opacity:0.6; vertical-align:middle;">
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
      <td>${r.p}</td>
      <td><a href="${r.url}" target="_blank">${r.m}</a></td>
      <td>${r.type}</td>
      <td>${r.kg||"-"} kg</td>
    </tr>
  `).join("");
}

// ===== START =====
await loadDB();
init();

})();
