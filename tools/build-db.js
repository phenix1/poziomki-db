// tools/build-db.js
// Node >=18
import fs from 'fs';

const V1_PATH   = 'data/v1.js';
const V11_PATH  = 'data/v1_1.js';
const OUT_PATH  = 'data/db.json';

// ---- utils ----
const norm = s => (s||'')
  .toLowerCase()
  .replace(/[\u00A0\s_-]+/g,'')
  .replace(/[^a-z0-9]/g,'');

function makeKey(p, m){
  return norm(p) + '|' + norm(m);
}

// ---- extractors ----
// Wyciąga pary "Model": "url" z obiektu recumbentLinks = { ... }
function extractLinks(jsText){
  const out = [];
  const re = /["'`]([^"'`]+?)["'`]\s*:\s*["'`](https?:\/\/[^"'`]+)["'`]/g;
  let m;
  while((m = re.exec(jsText))){
    out.push({ m: m[1].trim(), url: m[2].trim() });
  }
  return out;
}

// Wyciąga modele z Gemini (klucze obiektu lub wpisy w tablicach)
function extractModels(jsText){
  const set = new Set();

  // 1) klucze obiektu "Model": ...
  const reObj = /["'`]([^"'`]+?)["'`]\s*:/g;
  let m;
  while((m = reObj.exec(jsText))){
    const name = m[1].trim();
    if(name.length > 1 && !name.startsWith('http')) set.add(name);
  }

  // 2) stringi w tablicach ['Model', ...]
  const reArr = /["'`]([^"'`]{2,})["'`]/g;
  while((m = reArr.exec(jsText))){
    const name = m[1].trim();
    if(name.length > 2 && !name.startsWith('http')) set.add(name);
  }

  return Array.from(set);
}

// Heurystyka producenta z nazwy modelu
function guessProducer(name){
  const n = name.toLowerCase();
  if(n.includes('scorpion') || n.includes('gekko') || n.includes('grasshopper') || n.includes('speedmachine')) return 'HP Velotechnik';
  if(n.includes('adventure') || n.includes('sprint') || n.includes('vtx') || n.includes('full fat')) return 'ICE';
  if(n.includes('ti-fly') || n.includes('tricon') || n.includes('t-tris') || n.includes('azub')) return 'AZUB';
  if(n.match(/\b700\b|expedition|trail|villager|dumont/)) return 'Catrike';
  if(n.includes('kettwiesel') || n.includes('lep')) return 'Hase Bikes';
  if(n.includes('kmx')) return 'KMX';
  if(n.includes('matix')) return 'Matix';
  if(n.includes('dekers')) return 'Dekers';
  // fallback:
  return 'Unknown';
}

// ---- main ----
const v1  = fs.readFileSync(V1_PATH, 'utf8');
const v11 = fs.readFileSync(V11_PATH, 'utf8');

const v1Links = extractLinks(v1);

// indeks linków z v1 po znormalizowanej nazwie modelu
const linkMap = new Map();
for(const {m, url} of v1Links){
  linkMap.set(norm(m), url);
}

// modele z Gemini
const models = extractModels(v11);

// budujemy DB
const rows = [];
const seen = new Set();

for(const name of models){
  const p = guessProducer(name);
  const key = makeKey(p, name);

  if(seen.has(key)) continue;
  seen.add(key);

  const url = linkMap.get(norm(name)) || '';

  rows.push({
    p,
    m: name,
    key,
    type: null,
    kg: null,
    url,
    status: url ? 'raw' : 'unknown'
  });
}

// + dołóż modele z v1, których Gemini nie ma
for(const {m, url} of v1Links){
  const p = guessProducer(m);
  const key = makeKey(p, m);
  if(seen.has(key)) continue;
  seen.add(key);

  rows.push({
    p,
    m,
    key,
    type: null,
    kg: null,
    url,
    status: 'raw'
  });
}

// sort (producent, model)
rows.sort((a,b)=>{
  if(a.p === b.p) return a.m.localeCompare(b.m);
  return a.p.localeCompare(b.p);
});

// zapis
fs.writeFileSync(OUT_PATH, JSON.stringify(rows, null, 2), 'utf8');

console.log(`OK → ${rows.length} modeli zapisane do ${OUT_PATH}`);
