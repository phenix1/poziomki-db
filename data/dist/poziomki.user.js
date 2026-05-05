// ==UserScript==
// @name         Poziomki — baza 2.0
// @namespace    https://poziomki.info
// @version      2.0
// @description  Baza rowerów poziomych (GitHub DB)
// @match https://*/*
// @exclude https://github.com/*
// @exclude https://raw.githubusercontent.com/*
// @exclude https://greasyfork.org/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(async function () {
'use strict';

// 🔥 TWOJE repo — już ustawione
const DB_URL = "https://raw.githubusercontent.com/phenix1/poziomki-db/main/data/db.json";

let DB = [];

// 📦 Ładowanie danych
async function loadDB() {
  try {
    const res = await fetch(DB_URL);
    DB = await res.json();
  } catch(e) {
    console.error("DB load error", e);
  }
}

// 🎨 STYLE (proste, czytelne)
GM_addStyle(`
#pdb {
  position: fixed;
  top: 60px;
  right: 10px;
  width: 500px;
  max-height: 80vh;
  overflow:auto;
  background:white;
  border-radius:10px;
  box-shadow:0 6px 20px rgba(0,0,0,.2);
  font-size:13px;
  z-index:999999;
}

#pdb-header {
  background:#1e3a5f;
  color:white;
  padding:8px;
  display:flex;
}

#pdb-header span {
  margin-left:auto;
}

#pdb-controls {
  padding:6px;
  background:#f0f4fa;
}

#pdb-controls input, select {
  margin:2px;
  padding:4px;
}

table {
  width:100%;
  border-collapse:collapse;
}

td {
  padding:5px;
  border-bottom:1px solid #eee;
}

a {
  color:#0066cc;
}
`);

// 🧠 STATE
let state = { prod:"all", type:"all", kg:0 };

// 🔧 NORMALIZACJA
function norm(p){
  return p.toLowerCase().replace("bike","").trim();
}

// 🔎 FILTR
function getData(){
  return DB.filter(r=>{
    if(state.prod!=="all" && norm(r.p)!==norm(state.prod)) return false;
    if(state.type!=="all" && r.type!==state.type) return false;
    if(state.kg && r.kg<state.kg) return false;
    return true;
  });
}

// 🎄 banner (na przyszłość)
function banner(){
  const m=new Date().getMonth()+1;
  if(m===12) return "🎄";
  if(m===4) return "🐣";
  return "";
}

// 🖥 render
function render(){
  const data = getData();

  document.getElementById("pdb-body").innerHTML = data.map(r=>`
    <tr>
      <td>${r.p}</td>
      <td>${r.m}</td>
      <td>${r.type}</td>
      <td>${r.kg||"-"}</td>
      <td><a href="${r.url}" target="_blank">↗</a></td>
    </tr>
  `).join("");
}

// 🏗 UI
function init(){
  const wrap = document.createElement("div");
  wrap.id="pdb";

  const producers = ["all",...new Set(DB.map(r=>r.p))];

  wrap.innerHTML=`
    <div id="pdb-header">
      🚴 Poziomki 2.0
      <span>${banner()}</span>
    </div>

    <div id="pdb-controls">
      <select id="prod">
        ${producers.map(p=>`<option>${p}</option>`).join("")}
      </select>

      <select id="type">
        <option value="all">typ</option>
        <option value="tadpole">tadpole</option>
        <option value="delta">delta</option>
        <option value="bike">2-wheel</option>
      </select>

      <input id="kg" placeholder="min kg" type="number">
    </div>

    <table>
      <tbody id="pdb-body"></tbody>
    </table>
  `;

  document.body.appendChild(wrap);

  document.getElementById("prod").onchange=e=>{
    state.prod=e.target.value; render();
  };

  document.getElementById("type").onchange=e=>{
    state.type=e.target.value; render();
  };

  document.getElementById("kg").oninput=e=>{
    state.kg=parseInt(e.target.value)||0; render();
  };

  render();
}

// 🚀 start
await loadDB();
init();

})();
