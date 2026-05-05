import fs from "fs";

// wczytaj plik v1.1 jako tekst
const code = fs.readFileSync("data/v1_1.js", "utf-8");

// wyciągnij tylko linie z rekordami
const matches = [...code.matchAll(/{[^}]+}/g)];

const result = [];

for (const m of matches) {
  try {
    const obj = eval("(" + m[0] + ")");

    // tylko poprawne rekordy
    if (!obj.m || !obj.p) continue;

    result.push({
      p: obj.p,
      m: obj.m,
      type: obj.type || "",
      kg: obj.kg || null,
      url: obj.url || "",
      status: obj.url ? "verified" : "raw"
    });

  } catch (e) {
    // ignorujemy śmieci
  }
}

// usuń duplikaty
const map = new Map();
for (const r of result) {
  const key = r.p + "|" + r.m;
  map.set(key, r);
}

const final = Array.from(map.values());

// sort
final.sort((a, b) => {
  if (a.p === b.p) return a.m.localeCompare(b.m);
  return a.p.localeCompare(b.p);
});

// zapis
fs.writeFileSync("data/db.json", JSON.stringify(final, null, 2));

console.log(`OK → ${final.length} modeli`);
