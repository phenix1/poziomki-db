import fs from "fs";

// Wczytaj plik z naszą najnowszą strukturą jako tekst
const code = fs.readFileSync("dist/poziomki.user.js", "utf-8"); // Zmieniłem ścieżkę na nasz nowy folder docelowy

// Krok 1: Wytnij tylko zawartość tablicy DB! 
// To eliminuje problem chwytania CSS i innych funkcji z reszty skryptu.
const dbMatch = code.match(/const DB = \[([\s\S]*?)\];/);

if (!dbMatch) {
  console.error("BŁĄD: Nie znaleziono tablicy DB w pliku!");
  process.exit(1);
}

const dbString = dbMatch[1];

// Krok 2: Wyciągamy obiekty już z samej tablicy
const matches = [...dbString.matchAll(/{[\s\S]*?}/g)];
const result = [];

for (const m of matches) {
  try {
    // Ponieważ klucze nie mają cudzysłowów (np. p: 'Azub'), 
    // JSON.parse nie zadziała prosto z pudełka. new Function jest bezpieczniejszą alternatywą dla eval.
    const obj = new Function('return ' + m[0])();

    // Akceptujemy tylko obiekty posiadające Producenta (p) i Model (m)
    if (!obj.m || !obj.p) continue;

    result.push({
      p: obj.p,
      m: obj.m,
      type: obj.type || "",
      kg: obj.kg || 0, // Domyślnie 0, jeśli brakuje danych, aby utrzymać logikę braku nośności
      arch: obj.arch || false,
      offroad: obj.offroad || false,
      check: obj.check || false,
      url: obj.url || "",
      status: obj.url ? "verified" : "raw"
    });

  } catch (e) {
    // Bezpiecznie ignorujemy przypadkowe komentarze liniowe, jeśli złapały się w RegEx
  }
}

// Krok 3: Usuwanie duplikatów z wykorzystaniem Mapy
const map = new Map();
for (const r of result) {
  const key = r.p + "|" + r.m;
  map.set(key, r);
}

const final = Array.from(map.values());

// Krok 4: Uporządkowane sortowanie (Producent -> Model)
final.sort((a, b) => {
  if (a.p === b.p) return a.m.localeCompare(b.m);
  return a.p.localeCompare(b.p);
});

// Krok 5: Zapis do czystego JSON-a w folderze data
fs.writeFileSync("data/db.json", JSON.stringify(final, null, 2));

console.log(`SUKCES: Baza została przebudowana! Znaleziono i wyeksportowano ${final.length} modeli.`);
