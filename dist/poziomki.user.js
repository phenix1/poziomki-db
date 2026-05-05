// ==UserScript==
// @name         Poziomki — baza 2.5 FULL UI
// @namespace    https://poziomki.info
// @version      2.5
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

// 🔥 DB (cache breaker)
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
  width: 580px;
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

/* HEADER */
#pdb-header {
  background:#1e3a5f;
  color:white;
  padding:8px;
  display:flex;
  align-items:center;
  gap:6px;
}

#pdb-header img.logo {
  height:20px;
  background:#fff;
  padding:2px 4px;
  border-radius:4px;
}

#pdb-search {
  flex:1;
  padding:5px;
  border-radius:4px;
  border:1px solid #ccc;
  color:#222;
}

#pdb-search::placeholder {
  color:#777;
}

/* CONTROLS */
#pdb-controls {
  padding:6px;
  background:#eef3fa;
  display:flex;
  gap:6px;
  flex-wrap:wrap;
  border-bottom:1px solid #d0d8e5;
}

#pdb-controls select,
#pdb-controls input {
  padding:4px;
  border:1px solid #bbb;
  border-radius:4px;
}

#pdb-controls label {
  font-size:11px;
}

/* SCROLL AREA */
#pdb-list {
  overflow-y:auto;
  flex:1;
}

/* TABLE */
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

#pdb-table td:first-child {
  cursor:pointer;
  color:#1e3a5f;
  font-weight:500;
}

/* LINKS */
a {
  color:#0055cc;
}

.bad {
  color:#aaa;
}

/* FOOTER */
#pdb-footer {
  background:#dbe6f7;
  padding:6px;
  font-size:11px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
}

#pdb-footer-left {
  display:flex;
  align-items:center;
  gap:6px;
}

#pdb-footer a {
  color:#1e3a5f;
  text-decoration:none;
  font-weight:500;
}

#pdb-footer img.me {
  height:26px;
  border-radius:50%;
  opacity:0.6;
  transition:0.2s;
}

#pdb-footer img.me:hover {
  opacity:1;
  transform:scale(1.1);
}
`);

// ===== STATE =====
let state = {
  search:"",
  prod:"all",
  type:"all",
  kg:0,
  noLink:false,
  onlyRaw:false
};

// ===== FILTER =====
function getData(){
  return DB.filter(r=>{
    const text = (r.p + " " + r.m).toLowerCase();

    if(state.search && !text.includes(state.search)) return false;
    if(state.prod !== "all" && r.p !== state.prod) return false;
    if(state.type !== "all" && r.type !== state.type) return false;
    if(state.kg && r.kg && r.kg < state.kg) return false;
    if(state.noLink && r.url) return false;
    if(state.onlyRaw && r.status !== "raw") return false;

    return true;
  });
}

// ===== UI =====
function init(){

  const producers = ["all", ...new Set(DB.map(r=>r.p))];
  const types = ["all", ...new Set(DB.map(r=>r.type).filter(Boolean))];

  const wrap = document.createElement("div");
  wrap.id="pdb";

  wrap.innerHTML=`
    <div id="pdb-header">
      <img class="logo" src="https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/logo.png?v=3">
      🚴 Poziomki 2.4
      <input id="pdb-search" placeholder="search...">
    </div>

    <div id="pdb-controls">
      <select id="prod">
        ${producers.map(p=>`<option value="${p}">${p}</option>`).join("")}
      </select>

      <select id="type">
        ${types.map(t=>`<option value="${t}">${t}</option>`).join("")}
      </select>

      <input id="kg" type="number" placeholder="min kg">

      <label><input type="checkbox" id="noLink"> no link</label>
      <label><input type="checkbox" id="onlyRaw"> to verify</label>
    </div>

    <div id="pdb-list">
      <table id="pdb-table">
        <tbody id="pdb-body"></tbody>
      </table>
    </div>

    <div id="pdb-footer">
      <div id="pdb-footer-left">
        <span id="count"></span>
        •
        <a href="mailto:phenix29@gmail.com">report issues</a>
      </div>

      <img class="me" src="https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/me.jpg?v=3">
    </div>
  `;

  document.body.appendChild(wrap);

  // EVENTS
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

  document.getElementById("onlyRaw").onchange=e=>{
    state.onlyRaw=e.target.checked;
    render();
  };

  render();
}

// ===== RENDER =====
function render(){

  const data = getData();
  const body = document.getElementById("pdb-body");

  body.innerHTML = data.map(r=>`
    <tr>
      <td data-prod="${r.p}">${r.p}</td>
      <td class="${!r.url ? 'bad' : ''}">
        ${r.url ? `<a href="${r.url}" target="_blank">${r.m}</a>` : r.m}
      </td>
      <td>${r.type||""}</td>
      <td>${r.kg||"-"} kg</td>
    </tr>
  `).join("");

  document.getElementById("count").innerText = data.length + " models";

  // klik producenta
  document.querySelectorAll("#pdb-table td:first-child").forEach(td=>{
    td.onclick = ()=>{
      state.prod = td.dataset.prod;
      document.getElementById("prod").value = state.prod;
      render();
    };
  });
}

// ===== START =====
await loadDB();
init();

})();
