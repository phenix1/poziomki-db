// ==UserScript==
// @name         Poziomki — baza 2.5 SMART CHECK
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

const DB_URL = "https://raw.githubusercontent.com/phenix1/poziomki-db/main/data/db.json?v=" + Date.now();

let DB = [];

// ===== LOAD =====
async function loadDB() {
  const res = await fetch(DB_URL);
  DB = await res.json();
}

// ===== STYLE =====
GM_addStyle(`
#pdb { position: fixed; top:60px; right:10px; width:560px; max-height:88vh; background:#fff; border-radius:10px; box-shadow:0 8px 28px rgba(0,0,0,.35); z-index:999999; overflow:auto;}
#pdb-header { background:#1e3a5f; color:#fff; padding:8px; display:flex;}
#pdb-search { margin-left:10px; flex:1; padding:5px;}
#pdb-table td { padding:6px; border-bottom:1px solid #ddd;}
.bad { color:#999; text-decoration: line-through;}
.badge { font-size:10px; margin-left:5px;}
`);

// ===== STATE =====
let state = { search:"" };

// ===== SMART CHECK =====
async function checkContent(r){
  if(!r.url) return "no-link";

  try{
    const res = await fetch(r.url);
    const text = await res.text();

    const name = r.m.toLowerCase().split(" ")[0]; // uproszczone dopasowanie

    if(text.toLowerCase().includes(name)){
      return "ok";
    } else {
      return "sus"; // podejrzany
    }

  }catch{
    return "bad";
  }
}

// ===== UI =====
function init(){

  const wrap = document.createElement("div");
  wrap.id="pdb";

  wrap.innerHTML=`
    <div id="pdb-header">
      🚴 Poziomki 2.5
      <input id="pdb-search" placeholder="search...">
    </div>
    <table id="pdb-table"><tbody id="body"></tbody></table>
  `;

  document.body.appendChild(wrap);

  document.getElementById("pdb-search").oninput=e=>{
    state.search=e.target.value.toLowerCase();
    render();
  };

  render();
}

// ===== RENDER =====
async function render(){

  const body = document.getElementById("body");
  body.innerHTML = "";

  for(const r of DB){

    if(state.search && !(r.p + r.m).toLowerCase().includes(state.search)) continue;

    const status = await checkContent(r);

    let cls = "";
    let badge = "";

    if(status === "bad"){
      cls = "bad";
      badge = "❌";
    }

    if(status === "sus"){
      badge = "⚠";
    }

    if(status === "no-link"){
      badge = "∅";
    }

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${r.p}</td>
      <td class="${cls}">
        ${r.url ? `<a href="${r.url}" target="_blank">${r.m}</a>` : r.m}
        <span class="badge">${badge}</span>
      </td>
      <td>${r.type||""}</td>
      <td>${r.kg||"-"}</td>
    `;

    body.appendChild(tr);
  }
}

// ===== START =====
await loadDB();
init();

})();
