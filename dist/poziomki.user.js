// ==UserScript==
// @name         Poziomki — baza 2.3 FINAL UI
// @namespace    https://poziomki.info
// @version      2.3
// @match        https://*/*
// @exclude      https://github.com/*
// @exclude      https://raw.githubusercontent.com/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function () {
'use strict';

if (window.top !== window.self) return;

// ===== BAZA =====
const DB = [
  {p:"HP Velotechnik", m:"Gekko 26", type:"tadpole", kg:150, url:"https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/gekko-26/"},
  {p:"HP Velotechnik", m:"Scorpion fs 26", type:"tadpole", kg:150, url:"https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/scorpion-fs-26/"},
  {p:"ICE", m:"Adventure HD", type:"tadpole", kg:150, url:"https://www.icetrikes.co/products/adventure-hd"},
  {p:"ICE", m:"Sprint X", type:"tadpole", kg:140, url:"https://www.icetrikes.co/products/sprint-x"},
  {p:"AZUB", m:"T-Tris 26", type:"tadpole", kg:130, url:"https://azub.eu/recumbent-bikes-and-trikes/t-tris-26/"},
  {p:"Catrike", m:"Expedition", type:"tadpole", kg:125, url:"https://www.catrike.com/catrike-expedition"},
  {p:"Greenspeed", m:"GT26", type:"tadpole", kg:140, url:"https://greenspeed-trikes.com/gt26/"},
  {p:"Hase Bikes", m:"Kettwiesel", type:"delta", kg:140, url:"https://hasebikes.com/en/your-bike/kettwiesel/"},
  {p:"KMX", m:"KMX Tornado", type:"tadpole", kg:null, url:""},
  {p:"Matix", m:"Matix Trike", type:"tadpole", kg:null, url:""}
];

// ===== STYLE =====
GM_addStyle(`
#pdb {
  position: fixed;
  top: 60px;
  right: 10px;
  width: 580px;
  height: 85vh;
  background: #fff !important;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,.4);
  z-index: 999999;
  display: flex;
  flex-direction: column;
  font-family: Arial, sans-serif;
  border:1px solid #cfd6e0;
}

/* INPUT FIX */
#pdb input, #pdb select {
  background:#fff !important;
  color:#222 !important;
  border:1px solid #aaa;
  padding:4px;
}

/* HEADER */
#pdb-header {
  background:#1e3a5f;
  color:#fff;
  padding:8px;
  display:flex;
  align-items:center;
}

#pdb-header img {
  height:22px;
  margin-right:6px;
  background:#fff;
  padding:2px 4px;
  border-radius:4px;
}

#pdb-search {
  margin-left:10px;
  flex:1;
}

/* CONTROLS */
#pdb-controls {
  padding:6px;
  background:#eef3fa;
  display:flex;
  gap:6px;
}

/* TABLE */
#pdb-body {
  overflow-y:auto;
  flex:1;
}

#pdb table {
  width:100%;
  border-collapse:collapse;
}

#pdb td {
  padding:6px;
  border-bottom:1px solid #e0e6ef;
}

#pdb tr:hover {
  background:#e8f0ff;
}

#pdb a {
  color:#0055cc;
  text-decoration:none;
}

/* FOOTER */
#pdb-footer {
  background:#dbe6f7;
  padding:6px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-size:11px;
}

#pdb-footer img {
  width:28px;
  height:28px;
  border-radius:50%;
}
`);

// ===== STATE =====
let state = {
  search:"",
  prod:"all"
};

// ===== FILTER =====
function getData(){
  return DB.filter(r=>{
    const text = (r.p+" "+r.m).toLowerCase();

    if(state.search && !text.includes(state.search)) return false;
    if(state.prod!=="all" && r.p!==state.prod) return false;

    return true;
  });
}

// ===== UI =====
function init(){

  const wrap = document.createElement("div");
  wrap.id="pdb";

  const producers = ["all",...new Set(DB.map(r=>r.p))];

  wrap.innerHTML=`
    <div id="pdb-header">
      <img src="https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/logo.png">
      🚴 Poziomki 2.3
      <input id="pdb-search" placeholder="search...">
    </div>

    <div id="pdb-controls">
      <select id="prod">
        ${producers.map(p=>`<option value="${p}">${p}</option>`).join("")}
      </select>
    </div>

    <div id="pdb-body">
      <table>
        <tbody id="rows"></tbody>
      </table>
    </div>

    <div id="pdb-footer">
      <span>
        ${DB.length} models • 
        <a href="mailto:phenix29@gmail.com">zgłoś błąd</a>
      </span>
      <img src="https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/me.jpg">
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

  render();
}

// ===== RENDER =====
function render(){
  const data = getData();

  document.getElementById("rows").innerHTML = data.map(r=>`
    <tr>
      <td class="prod" style="cursor:pointer;color:#1a4;">${r.p}</td>
      <td>${r.url ? `<a href="${r.url}" target="_blank">${r.m}</a>` : r.m}</td>
      <td>${r.type}</td>
      <td>${r.kg ? r.kg+" kg" : "-"}</td>
    </tr>
  `).join("");

  document.querySelectorAll(".prod").forEach(el=>{
    el.onclick = ()=>{
      state.prod = el.innerText;
      document.getElementById("prod").value = state.prod;
      render();
    };
  });
}

// ===== START
init();

})();
