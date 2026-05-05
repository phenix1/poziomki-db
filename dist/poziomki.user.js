// ==UserScript==
// @name         Poziomki — baza 2.7 FIX UI
// @namespace    https://poziomki.info
// @version      2.7
// @match        https://*/*
// @exclude      https://github.com/*
// @exclude      https://raw.githubusercontent.com/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(async function () {
'use strict';

if (window.top !== window.self) return;

const DB_URL = "https://raw.githubusercontent.com/phenix1/poziomki-db/main/data/db.json?v=" + Date.now();

let DB = [];

async function loadDB() {
  const res = await fetch(DB_URL);
  DB = await res.json();
}

GM_addStyle(`
#pdb {
  position: fixed;
  top: 60px;
  right: 10px;
  width: 560px;
  max-height: 88vh;
  background: #ffffff !important;
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0,0,0,.35);
  font-size: 13px;
  z-index:999999;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  border:1px solid #cfd6e0;
  font-family: Arial, sans-serif;
}

/* 🔥 FIX DARK MODE + WIDTH */
#pdb input,
#pdb select {
  background: #ffffff !important;
  color: #222 !important;
  border: 1px solid #bbb !important;
  width: auto !important;
  flex: none !important;
  min-width: 80px;
}

/* 🔥 KONTROLKI */
#pdb-controls {
  padding:6px;
  background:#eef3fa;
  display:flex !important;
  flex-wrap:wrap;
  gap:6px;
  align-items:center;
  border-bottom:1px solid #d0d8e5;
}

#pdb-controls select {
  width: 130px !important;
}

#pdb-controls input[type="number"] {
  width: 90px !important;
}

/* HEADER */
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
}

/* TABLE */
#pdb-table {
  width:100%;
  border-collapse:collapse;
}

#pdb-table td {
  padding:6px;
  border-bottom:1px solid #e0e6ef;
  color:#222;
}

#pdb-table tr:hover {
  background:#e8f0ff;
}

#pdb-table a {
  color:#0055cc;
  font-weight:500;
  text-decoration:none;
}

#pdb-table a:hover {
  text-decoration:underline;
}

/* FOOTER */
#pdb-footer {
  background:#dbe6f7;
  padding:6px;
  font-size:11px;
  text-align:right;
  color:#1e3a5f;
  border-top:1px solid #cfd6e0;
}
`);

let state = {
  search:"",
  prod:"all",
  type:"all",
  kg:0,
  noLink:false
};

function getData(){
  return DB.filter(r=>{
    const text = (r.p + " " + r.m + " " + r.type).toLowerCase();

    if(state.search && !text.includes(state.search)) return false;
    if(state.prod!=="all" && r.p!==state.prod) return false;
    if(state.type!=="all" && r.type!==state.type) return false;
    if(state.kg && r.kg < state.kg) return false;
    if(state.noLink && r.url) return false;

    return true;
  });
}

function init(){

  const wrap = document.createElement("div");
  wrap.id="pdb";

  const producers = ["all",...new Set(DB.map(r=>r.p))];

  wrap.innerHTML=`
    <div id="pdb-header">
      <img src="https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/logo.png"
           style="height:20px;margin-right:6px;background:white;padding:2px 4px;border-radius:4px;">
      🚴 Poziomki 2.7
      <input id="pdb-search" placeholder="search...">
    </div>

    <div id="pdb-controls">
      <select id="prod">
        ${producers.map(p=>`<option value="${p}">${p}</option>`).join("")}
      </select>

      <select id="type">
        <option value="all">type</option>
        ${[...new Set(DB.map(r=>r.type))].map(t=>`<option value="${t}">${t}</option>`).join("")}
      </select>

      <input id="kg" placeholder="min kg" type="number">

      <label><input type="checkbox" id="noLink"> no link</label>
    </div>

    <table id="pdb-table">
      <tbody id="pdb-body"></tbody>
    </table>

    <div id="pdb-footer">
      ${DB.length} models • 
      <a href="mailto:phenix29@gmail.com">report issues</a>
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

  document.getElementById("noLink").onchange=e=>{
    state.noLink=e.target.checked;
    render();
  };

  render();
}

function render(){
  const data = getData();

  document.getElementById("pdb-body").innerHTML = data.map(r=>`
    <tr>
      <td>${r.p}</td>
      <td>${r.url ? `<a href="${r.url}" target="_blank">${r.m}</a>` : r.m}</td>
      <td>${r.type||"-"}</td>
      <td>${r.kg||"-"} kg</td>
    </tr>
  `).join("");
}

await loadDB();
init();

})();
