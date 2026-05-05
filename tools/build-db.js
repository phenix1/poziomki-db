import fs from "fs";

// ===== LOAD FILES =====
const v1 = fs.readFileSync("data/v1.js", "utf-8");
const v11 = fs.readFileSync("data/v1_1.js", "utf-8");

// ===== EXTRACT JSON ARRAYS =====
function extractArray(code) {
  const match = code.match(/\[([\s\S]*)\]/);
  if (!match) return [];
  try {
    return JSON.parse("[" + match[1] + "]");
  } catch (e) {
    return [];
  }
}

const dataV1 = extractArray(v1);
const dataV11 = extractArray(v11);

// ===== CLEAN FILTER =====
function isValid(r) {
  if (!r || !r.m || !r.p) return false;

  const text = (r.m + r.p).toLowerCase();

  const bad = [
    "${",
    "type_label",
    "rowclass",
    ">",
    "typ",
    "model",
    "producer",
    "load kg",
    "wszystkie",
    "unknown"
  ];

  return !bad.some(b => text.includes(b));
}

// ===== NORMALIZE =====
function normalize(r) {
  return {
    p: (r.p || "").trim(),
    m: (r.m || "").trim(),
    type: r.type || "",
    kg: r.kg || null,
    url: r.url || "",
    status: r.status || "raw"
  };
}

// ===== MERGE =====
const map = new Map();

// 1️⃣ najpierw GEMINI (duża baza)
for (const r of dataV11) {
  const n = normalize(r);
  if (!isValid(n)) continue;

  const key = n.p + "|" + n.m;
  map.set(key, n);
}

// 2️⃣ potem v1 (nadpisuje linki)
for (const r of dataV1) {
  const n = normalize(r);
  if (!isValid(n)) continue;

  const key = n.p + "|" + n.m;

  if (map.has(key)) {
    const existing = map.get(key);

    // 🔥 nadpisujemy lepsze dane
    if (n.url) existing.url = n.url;
    if (n.kg) existing.kg = n.kg;
    if (n.type) existing.type = n.type;

  } else {
    map.set(key, n);
  }
}

// ===== FINAL LIST =====
const result = Array.from(map.values());

// sortowanie (ładniej wygląda)
result.sort((a, b) => {
  if (a.p === b.p) return a.m.localeCompare(b.m);
  return a.p.localeCompare(b.p);
});

// ===== SAVE =====
fs.writeFileSync("data/db.json", JSON.stringify(result, null, 2));

console.log(`OK → ${result.length} modeli zapisane do data/db.json`);
