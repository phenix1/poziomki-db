// ==UserScript==
// @name         Poziomki — baza 2.3 STABLE CORE
// @namespace    https://poziomki.info
// @version      2.3
// @match        https://*/*
// @exclude      https://github.com/*
// @exclude      https://raw.githubusercontent.com/*
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(async function () {
'use strict';

if (window.top !== window.self) return;

// 🔥 minimalna baza (stabilna)
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

// 🔥 CSS odporny na strony
GM_addStyle(`
#pdb {
  position: fixed;
  top: 60px;
  right: 10px;
  width: 560px;
  height: 80vh;
  background: #fff !important;
  border-radius: 10px;
  box-shadow: 0 8px 25px rgba(0,0,0,.4);
  z-index: 999999;
  display: flex;
  flex-direction: column;
  font-family: Arial, sans-serif;
  border:1px solid #ccc;
}

/* reset wpływu strony */
#pdb * {
  all: unset;
  font-family: Arial, sans-serif;
  box-sizing: border-box;
}

#pdb input, #pdb select {
  all: revert;
  background:#fff !important;
  color:#222 !important;
  border:1px solid #aaa;
  padding:4px;
}

/* HEADER */
#pdb-header {
  background:#2c3e50;
  color:#fff;
  padding:8px;
  display:flex;
  align-items:center;
}

#pdb-header input {
  margin-left:10px;
  flex:1;
}

/* CONTROLS */
#pdb-controls {
  padding:6px;
  background:#eef3fa;
  display:flex;
  gap:5px;
  flex-wrap:wrap;
}

/* TABLE */
#pdb-body {
  overflow-y:auto;
  flex:1;
}

table {
  width:100%;
  border-collapse:collapse;
}

td {
  padding:6px;
  border-bottom:1px solid #ddd;
}

tr:hover {
  background:#e8f0ff;
}

a {
  color:#0066cc;
  cursor:pointer;
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

// ===== STATE
let state = {
  search:"",
  prod:"all"
};

// ===== FILTER
function getData(){
  return DB.filter(r=>{
    const text = (r.p+" "+r.m).toLowerCase();

    if(state.search && !text.includes(state.search)) return false;
    if(state.prod!=="all" && r.p!==state.prod) return false;

    return true;
  });
}

// ===== UI
function init(){

  const wrap = document.createElement("div");
  wrap.id="pdb";

  const producers = ["all",...new Set(DB.map(r=>r.p))];

  wrap.innerHTML=`
    <div id="pdb-header">
      🚴 Poziomki 2.3
      <input id="search" placeholder="search...">
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
      <span>${DB.length} models • phenix29@gmail.com</span>
      <img src="https://raw.githubusercontent.com/phenix1/poziomki-db/main/assets/me.jpg">
    </div>
  `;

  document.body.appendChild(wrap);

  document.getElementById("search").oninput=e=>{
    state.search=e.target.value.toLowerCase();
    render();
  };

  document.getElementById("prod").onchange=e=>{
    state.prod=e.target.value;
    render();
  };

  render();
}

// ===== RENDER
function render(){
  const data = getData();

  document.getElementById("rows").innerHTML = data.map(r=>`
    <tr>
      <td class="prod" style="cursor:pointer;color:#1a4;">
        ${r.p}
      </td>
      <td>${r.url ? `<a href="${r.url}" target="_blank">${r.m}</a>` : r.m}</td>
      <td>${r.type}</td>
      <td>${r.kg ? r.kg+" kg" : "-"}</td>
    </tr>
  `).join("");

  // 🔥 klik w producenta
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
