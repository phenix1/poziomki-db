// ==UserScript==
// @name         Poziomki — baza rowerów leżących
// @namespace    https://poziomki.info
// @version      1.0
// @description  Kompletna baza rowerów poziomych (trajki, dwukołowe, delta, quady) — producent, model, nośność, link. Działa na każdej stronie.
// @author       MBFeniks — Michał Berliński (phenix29@gmail.com)
// @description2 Errors, missing models? → phenix29@gmail.com
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ============================================================
  // BAZA DANYCH
  // Typy:
  //   tadpole = trajka tadpole (2 koła z przodu, 1 z tyłu)
  //   delta   = trajka delta   (1 koło z przodu, 2 z tyłu)
  //   bike    = rower dwukołowy poziomy
  //   quad    = czterokołowiec / inne
  //
  // kg = max nośność całkowita (jeździec + ładunek)
  // kg = 0 → brak danych producenta (sprawdź na stronie)
  //
  // Dane zweryfikowane ze stron producentów, maj 2025.
  // Aby dodać model: skopiuj linię i wypełnij dane.
  // ============================================================
  const COLLAB = {
    'Azub':            'yes',
    'Matix Bike':      'yes',
    'KMX':             'closed',
    'Challenge':       'closed',
    'Go-One':          'closed',
    'Flux':            'closed',
    'Lightfoot Cycles':'closed',
    'Blackbird Bikes': 'closed',
    'Pacific Cycles':  'closed',
    'Podbike':         'closed',
    'Birk':            'closed',
    'Zockra':          'closed',
    'Flevobike':       'closed',
    'Optima':          'closed',
  };

    const DB = [
    // ── Azub ─────────────────────────────────────────
    { p:'Azub', m:'Azub 5',      type:'bike',    kg:135,   arch:true, url:'https://azub.eu/' }, // poprzednik SIX
    { p:'Azub', m:'Eco 20',      type:'tadpole', kg:100,   arch:true, url:'https://azub.eu/' }, // poprzednik T-Trisek

    { p:'Azub', m:'FAT',         type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/26-wheels/fat' },
    { p:'Azub', m:'MAX 26',         type:'bike',    kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/recumbents/max' },
    { p:'Azub', m:'MAX 700', type:'bike', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/recumbents/max-700-highracer' },
    { p:'Azub', m:'Mini',        type:'bike',    kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/recumbents/mini' },
    { p:'Azub', m:'Origami',     type:'bike',    kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/extreme-line/origami' },
    { p:'Azub', m:'Six',         type:'bike',    kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/recumbents/six' },
    { p:'Azub', m:'T-Tris 20',   type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/20-wheels/t-tris' },
    { p:'Azub', m:'T-Tris 26',   type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/26-wheels/t-tris' },
    { p:'Azub', m:'T-Tris AR',   type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/26-wheels/t-tris-ar' },
    { p:'Azub', m:'T-Trisek',    type:'tadpole', kg:135, url:'https://azub.eu/azub-t-trisek-recumbent-tricycle-for-short-riders' },
    { p:'Azub', m:'Ti-FLY 20',   type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/20-wheels/ti-fly' },
    { p:'Azub', m:'Ti-FLY 26',   type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/26-wheels/ti-fly' },
    { p:'Azub', m:'Ti-FLY X',    type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/26-wheels/ti-fly-x' },
    { p:'Azub', m:'TRIcon 20',   type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/20-wheels/tricon' },
    { p:'Azub', m:'TRIcon 26',   type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/26-wheels/tricon' },
    { p:'Azub', m:'TRIcon GR',   type:'tadpole', kg:135, url:'https://azub.eu/recumbent-bikes-and-trikes/trikes/26-wheels/azub-tricon-gr-off-road-trike' },
    { p:'Azub', m:'TWIN',        type:'bike',    kg:200,   check:true, url:'https://azub.eu/recumbent-bikes-and-trikes/recumbents/' }, // tandem — potwierdzony na azub.eu (Łukasz Schuster)

    // ── Bacchetta ────────────────────────────────────────────
    // Aktywne modele (2025)
    { p:'Bacchetta', m:'Bella Evo',     type:'bike', kg:125, url:'https://bacchettabikes.com/products/bacchetta-bella' },
    { p:'Bacchetta', m:'Corsa Evo',     type:'bike', kg:125, url:'https://bacchettabikes.com/products/bacchetta-corsa-evo-custom-recumbent' },
    { p:'Bacchetta', m:'Giro A20',      type:'bike', kg:125, url:'https://bacchettabikes.com/products/bacchetta-giro-a20' },
    { p:'Bacchetta', m:'Giro 26 Evo',   type:'bike', kg:125, url:'https://bacchettabikes.com/products/bacchetta-giro-a26-custom-recumbent-bike' },
    { p:'Bacchetta', m:'Pronto',        type:'bike', kg:0,   url:'https://bacchettabikes.com/products/bacchetta-pronto' }, // e-assist, base = Giro A20
    { p:'Bacchetta', m:'Pronto Alto',   type:'bike', kg:0,   url:'https://bacchettabikes.com/products/bacchetta-pronto-alto-custom-recumbent' }, // e-assist, base = Giro A26/Corsa A70
    { p:'Bacchetta', m:'Pronto Bella',  type:'bike', kg:0,   url:'https://bacchettabikes.com/products/bacchetta-bella-pronto-custom-recumbent' }, // e-assist, base = Bella
    { p:'Bacchetta', m:'Quattro',       type:'bike', kg:0,   url:'https://bacchettabikes.com/products/bacchetta-carbon-aero-quattro-frameset' }, // race carbon, 4. generacja
    // Archiwalne
    { p:'Bacchetta', m:'Aero',          type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/aero-recumbent-bike' },
    { p:'Bacchetta', m:'Agio',          type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/agio-recumbent-bike' },
    { p:'Bacchetta', m:'Bella ATT',     type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/bella-att-recumbent-bike' },
    { p:'Bacchetta', m:'Bellandare',    type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/bellandare' },
    { p:'Bacchetta', m:'Carbon Aero 650c',   type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/carbon-aero-650c' },
    { p:'Bacchetta', m:'Carbon Aero 2.0',    type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/carbon-aero-2-0-650c' },
    { p:'Bacchetta', m:'Carbon Basso GS',    type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/carbon-basso-gs' },
    { p:'Bacchetta', m:'Carbon Corsa',       type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/carbon-corsa' },
    { p:'Bacchetta', m:'Corsa 24',      type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/corsa-24' },
    { p:'Bacchetta', m:'Corsa 700',     type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/corsa-700' },
    { p:'Bacchetta', m:'Corsa A65',     type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/corsa-a65' },
    { p:'Bacchetta', m:'Corsa SS',      type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/corsa-ss' },
    { p:'Bacchetta', m:'Giro 20',       type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/giro-20' },
    { p:'Bacchetta', m:'Giro 26',       type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/giro-26' },
    { p:'Bacchetta', m:'Giro 26 ATT',   type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/giro-26att' },
    { p:'Bacchetta', m:'Strada',        type:'bike', kg:0, arch:true, url:'https://bacchettabikes.com/pages/strada' },
    // ── Barcroft ─────────────────────────────────────
    { p:'Barcroft', m:'Dakota',      type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/?p=9477' },
    { p:'Barcroft', m:'Va Va Voom',  type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/?p=9477' },
    { p:'Barcroft', m:'Virginia Ti', type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/?p=9477' },

    // ── BikeE ────────────────────────────────────────
    { p:'BikeE', m:'AT', type:'bike', kg:0, arch:true, url:'https://en.wikipedia.org/wiki/BikeE' },
    { p:'BikeE', m:'CT', type:'bike', kg:0, arch:true, url:'https://en.wikipedia.org/wiki/BikeE' },
    { p:'BikeE', m:'E2', type:'bike', kg:0, arch:true, url:'https://en.wikipedia.org/wiki/BikeE' },

    // Vision Recumbents (USA, zamknięty)
    { p:'BikeE', m:'NX', type:'bike', kg:0, arch:true, url:'https://en.wikipedia.org/wiki/BikeE' },
    { p:'BikeE', m:'RX', type:'bike', kg:0, arch:true, url:'https://en.wikipedia.org/wiki/BikeE' },

    // ── Birk ─────────────────────────────────────────
    { p:'Birk', m:'Comet', type:'bike', arch:true, kg:0, url:'https://velomobil.ch/' },

    // Linear (USA, zamknięty)

    // ── Burley ───────────────────────────────────────
    { p:'Burley', m:'Canto',       type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Burley', m:'Django',      type:'bike', kg:147, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Burley', m:'Hepcat',      type:'bike', kg:147, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Burley', m:'Jett Creek',  type:'bike', kg:125, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Burley', m:'Koosah',      type:'bike', kg:125, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Burley', m:'Limbo',       type:'bike', kg:125, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Burley', m:'Nasoke',      type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Burley', m:'Sand Point',  type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Burley', m:'Spider',      type:'tadpole', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Burley', m:'Taiko',       type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },

    // KMX Karts (UK — trajki dla dzieci i dorosłych)

    // ── Catrike ──────────────────────────────────────
    { p:'Catrike', m:'5.5.9', type:'tadpole', kg:0, arch:true, url:'https://www.catrike.com/' },
    { p:'Catrike', m:'700',        type:'tadpole', kg:125, url:'https://www.catrike.com/700' },
    { p:'Catrike', m:'All Road',   type:'tadpole', kg:125, url:'https://www.catrike.com/all-road' },
    { p:'Catrike', m:'All Road eCAT', type:'tadpole', kg:125, url:'https://www.catrike.com/all-road-ecat' },
    { p:'Catrike', m:'Dumont',     type:'tadpole', kg:125, url:'https://www.catrike.com/dumont' },
    { p:'Catrike', m:'Eola',       type:'tadpole', kg:125, arch:true, url:'https://www.catrike.com/' }, // wycofana 2021
    { p:'Catrike', m:'Expedition', type:'tadpole', kg:125, url:'https://www.catrike.com/expedition' },
    { p:'Catrike', m:'MAX',        type:'tadpole', kg:193, url:'https://www.catrike.com/max' },
    { p:'Catrike', m:'Pocket',     type:'tadpole', kg:113, url:'https://www.catrike.com/pocket' },
    { p:'Catrike', m:'Road',  type:'tadpole', kg:0, arch:true, url:'https://www.catrike.com/' }, // zastąpiony przez Road AR
    { p:'Catrike', m:'Trail',      type:'tadpole', kg:125, url:'https://www.catrike.com/trail' },
    { p:'Catrike', m:'Villager',   type:'tadpole', kg:125, url:'https://www.catrike.com/villager' },

    // ── Challenge ────────────────────────────────────────────
    // Firma zakończyła działalność — serwer challengebikes.com offline (timeout 2025)
    // Linki do Web Archive (archive.org)
    { p:'Challenge', m:'Chamsin',   type:'bike', kg:0,   arch:true, url:'https://web.archive.org/web/2023/http://www.challengebikes.com/chamsin.php' },
    { p:'Challenge', m:'Fujin',     type:'bike', kg:125,   arch:true, url:'https://web.archive.org/web/2023/http://www.challengebikes.com/fujinsport_detail.php' },
    { p:'Challenge', m:'Fujin SL',  type:'bike', kg:125,   arch:true, url:'https://web.archive.org/web/2023/http://www.challengebikes.com/fujinsl2_detail.php' },
    { p:'Challenge', m:'Hurricane', type:'bike', kg:125, arch:true, url:'https://web.archive.org/web/2023/http://www.challengebikes.com/hurricane_detail.php' },
    { p:'Challenge', m:'Jester',    type:'bike', kg:0,   arch:true, url:'https://web.archive.org/web/2023/http://www.challengebikes.com/' },
    { p:'Challenge', m:'Mistral',   type:'bike', kg:125, arch:true, url:'https://web.archive.org/web/2023/http://www.challengebikes.com/touring_recumbents.php' },
    { p:'Challenge', m:'Seiran',    type:'bike', kg:125, arch:true, url:'https://web.archive.org/web/2023/http://www.challengebikes.com/seiran_detail.php' },
    { p:'Challenge', m:'Seiran SL', type:'bike', kg:125, arch:true, url:'https://web.archive.org/web/2023/http://www.challengebikes.com/seiran_detail.php' },
    { p:'Challenge', m:'Alize',     type:'bike', kg:130,   arch:true, url:'https://web.archive.org/web/2023/http://www.challengebikes.com/' },
    { p:'Challenge', m:'Taifun',    type:'bike', kg:125,   arch:true, url:'https://web.archive.org/web/2023/http://www.challengebikes.com/' },
    { p:'Challenge', m:'Ventus',    type:'bike', kg:0,   arch:true, url:'https://web.archive.org/web/2023/http://www.challengebikes.com/' },
    // ── Cruzbike ─────────────────────────────────────
    { p:'Cruzbike', m:'Freerider', type:'bike', kg:0, arch:true, url:'https://cruzbike.com/' },
        { p:'Cruzbike', m:'A4x Complete', type:'bike', kg:0, url:'https://cruzbike.com/' }, // adventure touring, nowy 2026
{ p:'Cruzbike', m:'Q45',       type:'bike', kg:136, url:'https://cruzbike.com/' },
    { p:'Cruzbike', m:'Quest',     type:'bike', kg:0, arch:true, url:'https://cruzbike.com/' },
    { p:'Cruzbike', m:'S40',       type:'bike', kg:125, url:'https://cruzbike.com/' },
    { p:'Cruzbike', m:'Silvio',    type:'bike', kg:0, arch:true, url:'https://cruzbike.com/' },
    { p:'Cruzbike', m:'Sofrider',     type:'bike', kg:0, arch:true, url:'https://cruzbike.com/collections/all-products/bicycles-and-framesets' }, // starszy model, brak na stronie jako osobna pozycja
    { p:'Cruzbike', m:'T50',          type:'bike', kg:125, url:'https://cruzbike.com/' },
    { p:'Cruzbike', m:'V20c',      type:'bike', kg:0, arch:true, url:'https://cruzbike.com/products/v20c' }, // poprzednia generacja
    { p:'Cruzbike', m:'Vendetta',  type:'bike', kg:0, arch:true, url:'https://cruzbike.com/' },
    { p:'Cruzbike', m:'Vendetta V20c', type:'bike', kg:109, url:'https://cruzbike.com/' },

    // ── Cycle Genius ─────────────────────────────────
    { p:'Cycle Genius', m:'Falcon', type:'bike', kg:0, check:true, url:'https://www.cyclegenius.com.tw/' },
    { p:'Cycle Genius', m:'LTX',    type:'bike', kg:0, check:true, url:'https://www.cyclegenius.com.tw/' },

    // Haluzak (USA)
    { p:'Cycle Genius', m:'Raven',  type:'bike', kg:0, check:true, url:'https://www.cyclegenius.com.tw/' },

    // ── Dekers Bike ──────────────────────────────────
    { p:'Dekers Bike', m:'Extreme',         type:'tadpole', kg:150, url:'https://dekersbike.com/product/dekers-extreme/' },
    { p:'Dekers Bike', m:'Fattrike',        type:'tadpole', kg:150, url:'https://dekersbike.com/product/dekers-fattrike/' },
    { p:'Dekers Bike', m:'Hunter',          type:'tadpole', kg:150, url:'https://dekersbike.com/product/dekers-hunter/' },

    // ── Easy Racers ──────────────────────────────────
    { p:'Easy Racers', m:'EZ-1',            type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/?s=easy+racers' },
    { p:'Easy Racers', m:'EZ-1',             type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },

    // Burley Design (USA, zamknięty ~2007)
    { p:'Easy Racers', m:'Gold Rush',       type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/?s=easy+racers' },
    { p:'Easy Racers', m:'Gold Rush Replica', type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Easy Racers', m:'Javelin',           type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Easy Racers', m:'Ti-Rush',           type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Easy Racers', m:'Tour Easy',       type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/?s=easy+racers' },
    { p:'Easy Racers', m:'Tour Easy',         type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },

    // ── GreenSpeed ───────────────────────────────────
    { p:'GreenSpeed', m:'Aero',       type:'tadpole', kg:113, url:'https://greenspeed-trikes.com/trikes/aero/' },
    { p:'GreenSpeed', m:'Anura',      type:'delta',   kg:136, url:'https://greenspeed-trikes.com/trikes/anura/' },
    { p:'GreenSpeed', m:'GT20',       type:'tadpole', kg:113, url:'https://greenspeed-trikes.com/trikes/gt20/' },
    { p:'GreenSpeed', m:'GT26',       type:'tadpole', kg:113, url:'https://greenspeed-trikes.com/trikes/gt26/' },
    { p:'GreenSpeed', m:'Magnum',  type:'tadpole', kg:181, url:'https://greenspeed-trikes.com/trikes/magnum/' },
    { p:'GreenSpeed', m:'Magnum BW',  type:'tadpole', kg:181, url:'https://greenspeed-trikes.com/trikes/magnum-bw/' },
    { p:'GreenSpeed', m:'Magnum SD',  type:'tadpole', kg:181, url:'https://greenspeed-trikes.com/trikes/magnum/' },
    { p:'GreenSpeed', m:'Magnum XL',  type:'tadpole', kg:204, url:'https://greenspeed-trikes.com/trikes/magnum-xl/' },

    // ── Haluzak ──────────────────────────────────────
    { p:'Haluzak', m:'Horizon',    type:'bike', arch:true, kg:0, url:'https://bicycleman.com/haluzak-horizon-recumbent-bike/' },
    { p:'Haluzak', m:'Leprechaun', type:'bike', arch:true, kg:0, url:'https://bicycleman.com/haluzak-leprechaun-recumbent-bike/' },
    { p:'Haluzak', m:'Traverse',   type:'bike', arch:true, kg:0, url:'https://bicycleman.com/brands/haluzak-recumbents/' },

    // ── Hase Bikes ───────────────────────────────────
    { p:'Hase Bikes', m:'Kettwiesel ONE', type:'delta',   kg:140, url:'https://www.hasebikes.com/en/kettwiesel' },
    { p:'Hase Bikes', m:'Lepus → Kettwiesel ONE', type:'delta', kg:140, url:'https://www.hasebikes.com/en/kettwiesel' }, // Lepus zastąpiony przez Kettwiesel ONE (2024)
    { p:'Hase Bikes', m:'Pino',       type:'bike',    kg:225,   url:'https://www.hasebikes.com/en/kategorie/tandem/pino' }, // tandem semi-recumbent, 225 kg total (2 osoby)
    { p:'Hase Bikes', m:'Trets', type:'delta', kg:100, url:'https://www.hasebikes.com/en/kategorie/therapierader/trets' }, // dla dzieci
    { p:'Hase Bikes', m:'Trigo',      type:'tadpole', kg:160, url:'https://www.hasebikes.com/en/kategorie/dreirad/trigo' },
    { p:'Hase Bikes', m:'Trigo UP', type:'delta', kg:160, url:'https://www.hasebikes.com/en/kategorie/dreirad/trigo' },
    { p:'Hase Bikes', m:'Trix',  type:'delta', kg:140, url:'https://www.hasebikes.com/en/kategorie/therapierader/trix' }, // dla dzieci

    // ── HP Velotechnik ───────────────────────────────
    { p:'HP Velotechnik', m:'Delta tx',    type:'delta',   kg:140, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/delta-tx/' },
    // Rowery dwukołowe
    { p:'HP Velotechnik', m:'Gekko 20',    type:'tadpole', arch:true, kg:0, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/gekko-recumbent-trikes/' },
    { p:'HP Velotechnik', m:'Gekko 26',    type:'tadpole', kg:150, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/gekko-recumbent-trikes/gekko-26-affordable-laid-back-adults-trike/' },
    { p:'HP Velotechnik', m:'Gekko fx 20', type:'tadpole', kg:130, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/gekko-recumbent-trikes/gekko-fx-20-compact-fast-folding-trike/' },
    { p:'HP Velotechnik', m:'Gekko fx 26', type:'tadpole', kg:130, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/gekko-recumbent-trikes/gekko-fx-26-sporty-foldable-touring-trike/' },
    // Delta
    { p:'HP Velotechnik', m:'Gekko fxs',           type:'tadpole', kg:100, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/gekko-recumbent-trikes/gekko-fxs-kids-trike-therapy-special-needs-childrens-tricycle/' }, // therapy/kids trike, riders from 1.15m
    { p:'HP Velotechnik', m:'Grasshopper fx',    type:'bike', kg:130, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/grasshopper-fx/' },
    { p:'HP Velotechnik', m:'Scorpion',             type:'tadpole', kg:150,   arch:true, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/scorpion-adults-recumbent-trikes/' }, // starsza wersja
    { p:'HP Velotechnik', m:'Scorpion fs 20',      type:'tadpole', kg:130, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/scorpion-adults-recumbent-trikes/scorpion-fs-20-full-suspension-trike/' },
    { p:'HP Velotechnik', m:'Scorpion fs 26',      type:'tadpole', kg:140, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/scorpion-adults-recumbent-trikes/scorpion-fs-26-performance-full-suspension-trike/' },
    { p:'HP Velotechnik', m:'Scorpion fs 26 Enduro', type:'tadpole', kg:140, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/scorpion-adults-recumbent-trikes/scorpion-fs-26-enduro-offroad-trike/' },
    { p:'HP Velotechnik', m:'Scorpion fs 26 S-Pedelec', type:'tadpole', kg:140, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/scorpion-adults-recumbent-trikes/' },
    { p:'HP Velotechnik', m:'Scorpion fx 20',      type:'tadpole', kg:140, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/scorpion-adults-recumbent-trikes/scorpion-fx-20-compact-foldable-trike/' },
    { p:'HP Velotechnik', m:'Scorpion fx 26',      type:'tadpole', kg:140, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/scorpion-adults-recumbent-trikes/scorpion-fx-26-medium-high-foldable-travel-trike-26-inch/' },
    // Trajki – seria Gekko
    { p:'HP Velotechnik', m:'Scorpion plus 20',    type:'tadpole', kg:150, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/scorpion-adults-recumbent-trikes/scorpion-plus-20-compact-high-seat-adults-trike/' },
    { p:'HP Velotechnik', m:'Scorpion plus 26',    type:'tadpole', kg:150, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/scorpion-adults-recumbent-trikes/scorpion-plus-26-performance-full-suspension-trike/' },
    { p:'HP Velotechnik', m:'Speedmachine',      type:'bike', kg:130,   url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/speedmachine/' }, // max payload 130 kg per hpvelotechnik.com
    { p:'HP Velotechnik', m:'Speedmachine S-Pedelec', type:'bike',  kg:130, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/speedmachine/' },
    { p:'HP Velotechnik', m:'Streetmachine Gte', type:'bike', kg:130, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/streetmachine-gte/' },

    // ── ICE Trikes ───────────────────────────────────
    { p:'ICE Trikes', m:'Adventure',       type:'tadpole', kg:125, url:'https://www.icetrikes.co/products/adventure' },
    { p:'ICE Trikes', m:'Adventure HD',    type:'tadpole', kg:150, url:'https://www.icetrikes.co/products/adventure-hd' },
    { p:'ICE Trikes', m:'Full Fat',        type:'tadpole', kg:125, url:'https://www.icetrikes.co/products/full-fat' },
    { p:'ICE Trikes', m:'Handcycle',       type:'tadpole', kg:0, url:'https://www.icetrikes.co/products/ice-trikes-handcycle-handtrike' },
    { p:'ICE Trikes', m:'Sprint X',        type:'tadpole', kg:125, url:'https://www.icetrikes.co/products/sprint-x-recumbent-trike' },
    { p:'ICE Trikes', m:'Sprint X Pixel',  type:'tadpole', kg:125, url:'https://www.icetrikes.co/products/sprint-x-tour-recumbent-trike' },

    { p:'ICE Trikes', m:'Sprint X Tour',   type:'tadpole', kg:125, url:'https://www.icetrikes.co/products/sprint-x-tour-recumbent-trike' },
    { p:'ICE Trikes', m:'VTX',             type:'tadpole', kg:104, url:'https://www.icetrikes.co/products/vtx-recumbent-trike' },

    // ── IN Trikes ────────────────────────────────────
    { p:'IN Trikes', m:'NEO', type:'tadpole', kg:150, check:true, url:'https://www.facebook.com/INTRIKES/' }, // strona intrikes.com nie działa

    // ── Kamrad ───────────────────────────────────────
    { p:'Kamrad', m:'R16', type:'bike', kg:120, check:true, url:'https://kamrad.pl/' },

    // Pelso (Węgry)

    // ── KMX ──────────────────────────────────────────────────────
    // Firma zakończyła działalność (~2023, bez ogłoszenia) — serwer offline
    // Linki do Web Archive (archive.org)
    { p:'KMX', m:'Kobra',   type:'tadpole', kg:0, arch:true, url:'https://web.archive.org/web/2023/https://www.kmxkarts.co.uk/Recumbent-Trikes/KMX-Performance/KMX-Cobra-Adults-Sports-Trike.aspx' },
    { p:'KMX', m:'Kolt',    type:'tadpole', kg:0, arch:true, url:'https://web.archive.org/web/2023/https://www.kmxkarts.co.uk/Recumbent-Trikes/KMX-Adult/KMX-Kolt-Adults-Sports-Trike.aspx' },
    { p:'KMX', m:'Kompact', type:'tadpole', kg:0, arch:true, url:'https://web.archive.org/web/2023/https://www.kmxkarts.co.uk/Recumbent-Trikes/KMX-Kidz/KMX-Kompact-R-.aspx' },
    { p:'KMX', m:'Koyote',  type:'tadpole', kg:0, arch:true, url:'https://web.archive.org/web/2023/https://www.kmxkarts.co.uk/Recumbent-Trikes/KMX-Adult/KMX-Koyote-Adults-Sports-Trike.aspx' },
    { p:'KMX', m:'Tornado', type:'tadpole', kg:0, arch:true, url:'https://web.archive.org/web/2023/https://www.kmxkarts.co.uk/Recumbent-Trikes/KMX-Sport/KMX-Tornado-F8-Adults-Sports-Trike.aspx' },
    { p:'KMX', m:'Typhoon', type:'tadpole', kg:0, arch:true, url:'https://web.archive.org/web/2023/https://www.kmxkarts.co.uk/Recumbent-Trikes/KMX-Sport/KMX-Typhoon-Adults-Sports-Trike.aspx' },
    { p:'KMX', m:'Venom',   type:'tadpole', kg:0, arch:true, url:'https://web.archive.org/web/2023/https://www.kmxkarts.co.uk/Recumbent-Trikes/KMX-Performance/KMX-Venom-Adults-Sports-Trike.aspx' },
    { p:'KMX', m:'Viper',   type:'tadpole', kg:0, arch:true, url:'https://web.archive.org/web/2023/https://www.kmxkarts.co.uk/Recumbent-Trikes/KMX-Performance/KMX-Viper-Adults-Sports-Trike.aspx' },
    // ── Lightning ────────────────────────────────────
    { p:'Lightning', m:'F-40',    type:'bike', kg:113, url:'https://www.lightningbikes.com/f40/index.html' }, // max ~250 lbs XL = 113 kg
    { p:'Lightning', m:'P-38',    type:'bike', kg:113, url:'https://www.lightningbikes.com/p38/index.html' }, // max 250 lbs (XL) = 113 kg; S=73kg, M=91kg, L=100kg, XL=113kg
    { p:'Lightning', m:'Phantom', type:'bike', kg:113, url:'https://www.lightningbikes.com/phantom/index.html' }, // max ~250 lbs XL = 113 kg
    { p:'Lightning', m:'R-84', type:'bike', kg:113, url:'https://www.lightningbikes.com/r84/index.html' },
    { p:'Lightning', m:'e-Lightning',   type:'bike', kg:0, url:'https://www.lightningbikes.com/e-lightning/index.html' }, // elektryczny, pedal-assist + throttle, 28 mph
    { p:'Lightning', m:'P-38 Belt Drive',type:'bike', kg:113, url:'https://www.lightningbikes.com/p38/belt-drive.html' }, // pasek + Rohloff 14-speed, pierwsza poziomka z paskiem na świecie
    { p:'Lightning', m:'P-38 Voyager',  type:'bike', kg:113, url:'https://www.lightningbikes.com/voyager/index.html' }, // składany z twardym kufrem, 30 min montaż
    { p:'Lightning', m:'R-84 E-84',     type:'bike', kg:0,   url:'https://www.lightningbikes.com/r84/e84.html' }, // elektryczna wersja R-84

    // ── Linear ───────────────────────────────────────
    { p:'Linear', m:'Limo',     type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Linear', m:'Roadster', type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },

    // Cycle Genius (Tajwan)

    // ── M5 ───────────────────────────────────────────
    { p:'M5', m:'26/26 high bar',      type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/26_26_and_26_20_high_bar' },
    { p:'M5', m:'26/26 low bar',       type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/26_26_and_26_20_low_bar' },
    { p:'M5', m:'Carbon High Racer', type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/Carbon_High_Racer/' },
    { p:'M5', m:'Carbon Low Racer',    type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/Carbon_Low_Racer' },
    { p:'M5', m:'Carbon Medium Racer', type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/Carbon_Medium_Racer' },
    { p:'M5', m:'City Cruiser',        type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/City_Cruiser/' },
    { p:'M5', m:'City Racer',          type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/City_Racer/' },
    { p:'M5', m:'CMPCT',               type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/CMPCT/' },
    { p:'M5', m:'CrMo Low Racer', type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/CrMo_Low_Racer/' },
    { p:'M5', m:'CroMo Low Racer',   type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/CrMo_Low_Racer/' },
    // Brakujące modele M5 (z menu strony m5-ligfietsen.nl)
    { p:'M5', m:'M-Racer',           type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/M-Racer/' },
    { p:'M5', m:'Shock Proof 406',     type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/Shock_Proof_406_CrMo/' },
    { p:'M5', m:'Shock Proof 451',     type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/Shock_Proof_451_CrMo/' },
    { p:'M5', m:'Shock Proof 559',     type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/Shock_Proof_559_CrMo/' },
    { p:'M5', m:'Tandem',         type:'bike', kg:0, url:'http://www.m5-ligfietsen.nl/site/EN/Models/Tandem/' },

    // ── Matix Bike ───────────────────────────────────
    { p:'Matix Bike', m:'Long',    type:'tadpole', kg:160, url:'https://matixbike.eu/matix-long/' },
    { p:'Matix Bike', m:'Newman',  type:'tadpole', kg:160, url:'https://matixbike.eu/matix-newman/' },
    { p:'Matix Bike', m:'FAT',   type:'tadpole', kg:160, offroad:true, url:'https://matixbike.eu/matix-fat/' }, // terenowy z zawieszeniem na 3 koła, opony fat 4-5"
    { p:'Matix Bike', m:'Duet',  type:'tadpole', kg:160, url:'https://matixbike.eu/matix-duet/' }, // składany, przystosowany do przewozu dziecka

    // Kamrad (Polska)
    { p:'Matix Bike', m:'Turist',  type:'tadpole', kg:160, url:'https://matixbike.eu/matix-turist/' },

    // ── Nazca ────────────────────────────────────────
    { p:'Nazca', m:'Cruiser',  type:'bike', kg:0,   arch:true, url:'https://nazca-ligfietsen.nl/en/cruiser' }, // firma zamknięta 2021
    { p:'Nazca', m:'Explorer',        type:'bike', kg:0, arch:true, url:'https://nazca-ligfietsen.nl/en/cruiser' },
    { p:'Nazca', m:'Fiero',    type:'bike', kg:130,   arch:true, url:'https://nazca-ligfietsen.nl/en/fiero-xs' }, // firma zamknięta 2021
    { p:'Nazca', m:'Fiero xs', type:'bike', kg:130,   arch:true, url:'https://nazca-ligfietsen.nl/en/fiero-xs' }, // firma zamknięta 2021
    { p:'Nazca', m:'Fuego',    type:'bike', kg:130, arch:true, url:'https://nazca-ligfietsen.nl/en/fuego' },    // wycofany 2019
    { p:'Nazca', m:'Gaucho',   type:'bike', kg:0,   arch:true, url:'https://nazca-ligfietsen.nl/en/gaucho' },  // wycofany 2020
    { p:'Nazca', m:'Gaucho Highracer',type:'bike', kg:0, arch:true, url:'https://nazca-ligfietsen.nl/en/gaucho' },
    { p:'Nazca', m:'Gaucho Tour',     type:'bike', kg:0, arch:true, url:'https://nazca-ligfietsen.nl/en/gaucho' },
    { p:'Nazca', m:'Paseo',    type:'bike', kg:130,   arch:true, url:'https://nazca-ligfietsen.nl/en/paseo' },   // wycofany 2019
    { p:'Nazca', m:'Pioneer',  type:'bike', kg:130,   arch:true, url:'https://nazca-ligfietsen.nl/en/pioneer' }, // firma zamknięta 2021
    { p:'Nazca', m:'Quetzal',  type:'bike', kg:225,   arch:true, url:'https://nazca-ligfietsen.nl/en/quetzal' }, // wycofany 2021

    // ── Optima ───────────────────────────────────────
    { p:'Optima', m:'Baron',   type:'bike', kg:115, arch:true, url:'https://ligfiets.net/brands/3' }, // Optima nie produkuje już poziomek
    { p:'Optima', m:'Baron Elite', type:'bike',    kg:115, arch:true, url:'https://ligfiets.net/brands/3' },
    { p:'Optima', m:'Condor',  type:'bike', arch:true, kg:0, url:'https://ligfiets.net/brands/3' },
    { p:'Optima', m:'Cougar',      type:'bike',    kg:0, arch:true, url:'https://ligfiets.net/brands/3' },
    { p:'Optima', m:'Dolphin',     type:'bike',    kg:125, arch:true, url:'https://ligfiets.net/brands/3' },
    { p:'Optima', m:'Dragon',      type:'bike',    kg:125, arch:true, url:'https://ligfiets.net/brands/3' },
    { p:'Optima', m:'Falcon',      type:'bike',    kg:0, arch:true, url:'https://ligfiets.net/brands/3' },
    { p:'Optima', m:'HighBaron',   type:'bike',    kg:0, arch:true, url:'https://ligfiets.net/brands/3' },
    { p:'Optima', m:'Lynx',    type:'bike', arch:true, kg:125, url:'https://ligfiets.net/brands/3' },
    { p:'Optima', m:'Orca',        type:'bike',    kg:125, arch:true, url:'https://ligfiets.net/brands/3' },
    { p:'Optima', m:'Oryx',        type:'bike',    kg:0, arch:true, url:'https://ligfiets.net/brands/3' },


    // E-BIKES & TRIKES /bikes-catalog/5
    { p:'Performer', m:'Defender',        type:'tadpole',    kg:0, url:'https://www.performercycles.com/bike-detail/28' },
    { p:'Performer', m:'E-Family',        type:'bike',    kg:0, url:'https://www.performercycles.com/bike-detail/29' },
    { p:'Performer', m:'E-Futuro',        type:'tadpole', kg:0, url:'https://www.performercycles.com/bike-detail/27' },
    { p:'Performer', m:'E-JC-26X',        type:'tadpole', kg:0, url:'https://www.performercycles.com/bike-detail/25' },
    { p:'Performer', m:'E-JC70',          type:'tadpole', kg:0, url:'https://www.performercycles.com/bike-detail/24' },
    { p:'Performer', m:'Folding E-JC-26X',type:'tadpole', kg:0, url:'https://www.performercycles.com/bike-detail/26' },
    // TANDEM BIKES /bikes-catalog/4

    { p:'Performer', m:'Tandem Recumbent',        type:'bike', kg:0, url:'https://www.performercycles.com/bike-detail/23' },



    // ── Pelso ────────────────────────────────────────
    { p:'Pelso', m:'Brevet', type:'bike', kg:0, url:'https://www.pelsobrevet.com/products/pelso-brevet-complete-bike' },

    // Zockra (Czechy)

    // ── Performer ────────────────────────────────────────────
    // Trajki
    { p:'Performer', m:'Cantilever',         type:'tadpole', kg:140, url:'https://www.performercycles.com/bikes-catalog/1', check:true },
    { p:'Performer', m:'Cantus',             type:'tadpole', kg:0,   url:'https://www.performercycles.com/bike-detail/7' },
    { p:'Performer', m:'Folding JC-26X',     type:'tadpole', kg:0,   url:'https://www.performercycles.com/bike-detail/5' },
    { p:'Performer', m:'Futuro FRP',         type:'tadpole', kg:113, url:'https://www.performercycles.com/bike-detail/8' },
    { p:'Performer', m:'Futuro Mesh',        type:'tadpole', kg:113, url:'https://www.performercycles.com/bike-detail/8' },
    { p:'Performer', m:'Hero FRP',           type:'tadpole', kg:0,   url:'https://www.performercycles.com/bike-detail/9' },
    { p:'Performer', m:'Hero Mesh',          type:'tadpole', kg:0,   url:'https://www.performercycles.com/bike-detail/10' },
    { p:'Performer', m:'JC-26X FRP',         type:'tadpole', kg:140, url:'https://www.performercycles.com/bike-detail/3' },
    { p:'Performer', m:'JC-26X Mesh',        type:'tadpole', kg:140, url:'https://www.performercycles.com/bike-detail/4' },
    { p:'Performer', m:'JC20',               type:'tadpole', kg:120, url:'https://www.performercycles.com/bikes-catalog/1', check:true },
    { p:'Performer', m:'JC70 FRP',           type:'tadpole', kg:120, url:'https://www.performercycles.com/bike-detail/1' },
    { p:'Performer', m:'JC70 Mesh',          type:'tadpole', kg:120, url:'https://www.performercycles.com/bike-detail/2' },
    { p:'Performer', m:'Trike-F',            type:'tadpole', kg:0,   url:'https://www.performercycles.com/bike-detail/6' },
    { p:'Performer', m:'Trike-X',            type:'tadpole', kg:140, url:'https://www.performercycles.com/bikes-catalog/1', check:true },
    // Rowery
    { p:'Performer', m:'Goal 20-26x OSS',    type:'bike',    kg:0,   url:'https://www.performercycles.com/bike-detail/14' },
    { p:'Performer', m:'Goal 20-26x USS',    type:'bike',    kg:0,   url:'https://www.performercycles.com/bike-detail/15' },
    { p:'Performer', m:'Goal 26x OSS',       type:'bike',    kg:0,   url:'https://www.performercycles.com/bike-detail/12' },
    { p:'Performer', m:'Goal 26x USS',       type:'bike',    kg:0,   url:'https://www.performercycles.com/bike-detail/13' },
    { p:'Performer', m:'High Racer (Lacka)', type:'bike',    kg:0,   url:'https://www.performercycles.com/bike-detail/17' },
    { p:'Performer', m:'Low Racer (X-Low)',  type:'bike',    kg:0,   url:'https://www.performercycles.com/bike-detail/18' },
    { p:'Performer', m:'Muses',              type:'bike',    kg:0,   url:'https://www.performercycles.com/bike-detail/11' },
    { p:'Performer', m:'Unicorn',            type:'bike',    kg:0,   url:'https://www.performercycles.com/bike-detail/16' },
    // ── Pony4 ────────────────────────────────────────

    // ── RANS ─────────────────────────────────────────
    { p:'RANS', m:'Civo',       type:'bike', kg:0, check:true, url:'http://www.ransbikes.com/bicycles/' },  // firma kończy produkcję — sprawdź dostępność
    { p:'RANS', m:'Dynamik',    type:'bike', kg:0, check:true, url:'http://www.ransbikes.com/bicycles/' },  // firma kończy produkcję — sprawdź dostępność
    { p:'RANS', m:'Gliss',               type:'bike', kg:0, arch:true, url:'http://www.ransbikes.com/bicycles/' },
    { p:'RANS', m:'Nimbus',              type:'bike', kg:0, arch:true, url:'http://www.ransbikes.com/bicycles/' },
    { p:'RANS', m:'Phoenix',             type:'bike', kg:0, arch:true, url:'http://www.ransbikes.com/bicycles/' },
    { p:'RANS', m:'Response',            type:'bike', kg:0, arch:true, url:'http://www.ransbikes.com/bicycles/' },
    { p:'RANS', m:'Rocket',              type:'bike', kg:0, arch:true, url:'http://www.ransbikes.com/bicycles/' },
    { p:'RANS', m:'Screamer',            type:'bike', kg:0, arch:true, url:'http://www.ransbikes.com/bicycles/' },
    { p:'RANS', m:'Stratus',              type:'bike', kg:0, arch:true, url:'http://www.ransbikes.com/bicycles/' },
    { p:'RANS', m:'Stratus XP', type:'bike', kg:0, check:true, url:'http://www.ransbikes.com/bicycles/' },  // firma kończy produkcję — sprawdź dostępność
    { p:'RANS', m:'Tailwind',            type:'bike', kg:0, arch:true, url:'http://www.ransbikes.com/bicycles/' },
    { p:'RANS', m:'Trizard',             type:'tadpole', kg:0, arch:true, url:'http://www.ransbikes.com/bicycles/' },
    { p:'RANS', m:'V-Rex',               type:'bike', kg:0, arch:true, url:'http://www.ransbikes.com/bicycles/' },
    { p:'RANS', m:'Velocity Squared',    type:'bike', kg:0, arch:true, url:'http://www.ransbikes.com/bicycles/' },
    { p:'RANS', m:'Wave',                type:'bike', kg:0, arch:true, url:'http://www.ransbikes.com/bicycles/' },

    // ── Slyway ───────────────────────────────────────
    { p:'Slyway', m:'Endorphin', type:'bike', kg:0, url:'https://slyway.wordpress.com/tag/endorphin/' },

    // Matix Bike (Polska)
    { p:'Slyway', m:'Team',      type:'bike', kg:0, check:true, url:'https://slyway.wordpress.com/' },
    { p:'Slyway', m:'ULTRA',     type:'bike', kg:130, check:true, url:'https://www.slywayprojects.com/' },

    // ── SpecBikeTechnics ─────────────────────────────
    { p:'SpecBikeTechnics', m:'Comfort E-Trike', type:'tadpole', kg:170, url:'https://specbiketechnics.com/all-products/comfort-e-trike/' },
    { p:'SpecBikeTechnics', m:'Comfort Trike',   type:'tadpole', kg:170, url:'https://specbiketechnics.com/all-products/tricycle-comfort-with-suspension/' },
    { p:'SpecBikeTechnics', m:'Fat Trike',       type:'tadpole', kg:150, url:'https://specbiketechnics.com/all-products/fat-trike/' },
    { p:'SpecBikeTechnics', m:'Standard Trike',  type:'tadpole', kg:135, url:'https://specbiketechnics.com/all-products/' },

    // ── Steintrikes ──────────────────────────────────
    { p:'Steintrikes', m:'Alien',    type:'tadpole', kg:0, check:true, url:'https://steintrikes.com/trikes/2' },
    { p:'Steintrikes', m:'Kobold',   type:'tadpole', kg:0, check:true, url:'https://steintrikes.com/trikes/2' },
    { p:'Steintrikes', m:'MadMax',   type:'tadpole', kg:0, check:true, url:'https://steintrikes.com/trikes/2' },
    { p:'Steintrikes', m:'Mungo',         type:'tadpole', kg:130, url:'https://steintrikes.com/product/mungo' },
    { p:'Steintrikes', m:'Nomad',    type:'tadpole', kg:0, check:true, url:'https://steintrikes.com/trikes/2' },
    { p:'Steintrikes', m:'Rebel',    type:'tadpole', kg:0, url:'https://steintrikes.com/product/rebel-fat-series' },
    { p:'Steintrikes', m:'RoadShark',type:'tadpole', kg:0, check:true, url:'https://steintrikes.com/trikes/2' },
    { p:'Steintrikes', m:'Tuareg',   type:'tadpole', kg:0, check:true, url:'https://steintrikes.com/trikes/2' },
    { p:'Steintrikes', m:'Viper',    type:'tadpole', kg:0, check:true, url:'https://steintrikes.com/trikes/2' },
    { p:'Steintrikes', m:'Wild One',      type:'tadpole', kg:150, url:'https://steintrikes.com/product/29-wild-one-series' }, // max 150 kg incl. rider+baggage
    { p:'Steintrikes', m:'Wild One Fat',  type:'tadpole', kg:150, url:'https://steintrikes.com/product/30-wild-one-fat-series' }, // max 150 kg incl. rider+baggage

    // ── SunSeeker ────────────────────────────────────
    { p:'SunSeeker', m:'Eco-Delta SX',  type:'delta',   kg:136, url:'https://sunseeker.bike/products/eco-delta-sx-11737' },
    { p:'SunSeeker', m:'EZ-3 USX HD',   type:'delta',   kg:181, url:'https://sunseeker.bike/products/ez-3-usx-hd-trike-6125' },
    { p:'SunSeeker', m:'EZ-Classic SX', type:'tadpole', kg:136, url:'https://sunseeker.bike/products/ez-classic-sx-21sp-8433' },

    // ── TerraTrike ───────────────────────────────────
    { p:'TerraTrike', m:'All Terrain', type:'tadpole', kg:136, url:'https://www.terratrike.com/adventure/all-terrain/' },
    { p:'TerraTrike', m:'Charge',      type:'tadpole', kg:125, url:'https://www.terratrike.com/electric/charge/' },
    { p:'TerraTrike', m:'E.V.O.',      type:'tadpole', kg:136, url:'https://www.terratrike.com/adventure-touring/evo/' },
    { p:'TerraTrike', m:'Grand Tourismo', type:'tadpole', kg:136, url:'https://www.terratrike.com/adventure-touring-gt/' },
    { p:'TerraTrike', m:'Maverick',    type:'tadpole', kg:125, url:'https://www.terratrike.com/leisure/maverick/' },
    { p:'TerraTrike', m:'Rambler',     type:'tadpole', kg:181, url:'https://www.terratrike.com/leisure/rambler/' },
    { p:'TerraTrike', m:'Rover',       type:'tadpole', kg:181, url:'https://www.terratrike.com/leisure/rover/' },
    { p:'TerraTrike', m:'Rover Tandem', type:'tadpole', kg:227, url:'https://www.terratrike.com/tandem/rover-tandem/' }, // 500 lbs tandem
    { p:'TerraTrike', m:'Sportster',  type:'tadpole', kg:0, arch:true, url:'https://www.terratrike.com/' },
    { p:'TerraTrike', m:'Spyder',      type:'tadpole', kg:113, url:'https://www.terratrike.com/performance/spyder/' },
    { p:'TerraTrike', m:'Tandem Pro', type:'tadpole', kg:0, check:true, url:'https://www.terratrike.com/' },
    { p:'TerraTrike', m:'Tour II',    type:'tadpole', kg:0, arch:true, url:'https://www.terratrike.com/' },
    { p:'TerraTrike', m:'Traveler',    type:'tadpole', kg:136, url:'https://www.terratrike.com/folding/traveler/' },

    // ── Trice ────────────────────────────────────────
    { p:'Trice', m:'Micro',   type:'tadpole', kg:0, arch:true, url:'https://www.icetrikes.co/' },
    { p:'Trice', m:'Monster', type:'tadpole', kg:100, arch:true, url:'https://www.icetrikes.co/' },
    { p:'Trice', m:'Q',       type:'tadpole', kg:114, arch:true, url:'https://www.icetrikes.co/' },
    { p:'Trice', m:'QNT',     type:'tadpole', kg:114, arch:true, url:'https://www.icetrikes.co/' },
    { p:'Trice', m:'S',       type:'tadpole', kg:0, arch:true, url:'https://www.icetrikes.co/' },
    { p:'Trice', m:'T',       type:'tadpole', kg:114, arch:true, url:'https://www.icetrikes.co/' },
    { p:'Trice', m:'TNT',     type:'tadpole', kg:114, arch:true, url:'https://www.icetrikes.co/' },
    { p:'Trice', m:'XL',      type:'tadpole', kg:0, arch:true, url:'https://www.icetrikes.co/' },

    // ── Trident ──────────────────────────────────────
    { p:'Trident', m:'Chameleon Tandem', type:'tadpole', kg:125, url:'https://tridenttrikes.com/jouta-delta/products/chameleon/' },
    { p:'Trident', m:'Fat Trekker',    type:'tadpole', kg:125, offroad:true, url:'https://tridenttrikes.com/jouta-delta/products/trekker/' },
    { p:'Trident', m:'Jouta Fat Quad', type:'quad', kg:159, url:'https://tridenttrikes.com/jouta-delta/products/jouta-quad/' }, // 350 lbs, fat tires 20x4
    { p:'Trident', m:'Jouta Quad',       type:'quad',    kg:159, url:'https://tridenttrikes.com/jouta-delta/products/jouta-quad/' },
    { p:'Trident', m:'Jouta Tadpole',    type:'tadpole', kg:136, url:'https://tridenttrikes.com/jouta-delta/products/jouta-tadpole/' },
    { p:'Trident', m:'Nomad',            type:'tadpole', kg:125, url:'https://tridenttrikes.com/jouta-delta/products/nomad/' },
    { p:'Trident', m:'Spike 1',      type:'tadpole', kg:125, url:'https://tridenttrikes.com/jouta-delta/products/spike/' }, // 275 lbs
    { p:'Trident', m:'Spike 2',      type:'tadpole', kg:125, url:'https://tridenttrikes.com/jouta-delta/products/spike/' }, // 275 lbs
    { p:'Trident', m:'Spike 380',    type:'tadpole', kg:125, url:'https://tridenttrikes.com/jouta-delta/products/spike/' }, // 275 lbs
    { p:'Trident', m:'Stowaway I',  type:'tadpole', kg:125, url:'https://tridenttrikes.com/jouta-delta/products/stowaway/' },
    { p:'Trident', m:'Stowaway II', type:'tadpole', kg:125, url:'https://tridenttrikes.com/jouta-delta/products/stowaway/' },
    { p:'Trident', m:'T.W.I.G',          type:'bike',    kg:125, url:'https://tridenttrikes.com/jouta-delta/products/t-w-i-g/' },
    { p:'Trident', m:'Terrain 20', type:'tadpole', kg:125, offroad:true, url:'https://tridenttrikes.com/jouta-delta/products/terrain/' },
    { p:'Trident', m:'Terrain 26', type:'tadpole', kg:147, offroad:true, url:'https://tridenttrikes.com/jouta-delta/products/terrain/' },
    { p:'Trident', m:'Titan',    type:'tadpole', kg:181, url:'https://tridenttrikes.com/jouta-delta/products/titan/' },
    { p:'Trident', m:'Tomcat',          type:'tadpole', kg:125, url:'https://tridenttrikes.com/jouta-delta/products/tomcat/' }, // 275 lbs
    { p:'Trident', m:'Tomcat 380',      type:'tadpole', kg:125, url:'https://tridenttrikes.com/jouta-delta/products/tomcat/' }, // 275 lbs, Enviolo TR
    { p:'Trident', m:'Tomcat E',        type:'tadpole', kg:125, url:'https://tridenttrikes.com/jouta-delta/products/tomcat/' }, // 275 lbs, 350W electric
    { p:'Trident', m:'Trekker 20',     type:'tadpole', kg:125, url:'https://tridenttrikes.com/jouta-delta/products/trekker/' },
    { p:'Trident', m:'Trekker 26',     type:'tadpole', kg:125, url:'https://tridenttrikes.com/jouta-delta/products/trekker/' },

    // ── Vision ───────────────────────────────────────
    { p:'Vision', m:'R-30 Metro',    type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Vision', m:'R-32',          type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Vision', m:'R-40',          type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Vision', m:'R-42',          type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Vision', m:'R-44',          type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Vision', m:'R-45',          type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },
    { p:'Vision', m:'R-80 Double Vision', type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },

    // Easy Racers (USA, zamknięty ~2015)
    { p:'Vision', m:'Sabre',         type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/' },

    // ── Wolf & Wolf ──────────────────────────────────
    { p:'Wolf & Wolf', m:'Alpentourer AT1', type:'bike', kg:0, url:'https://www.wolfundwolf.ch/en/recumbent/models-and-configurator/alpentourer-at1/' },
    { p:'Wolf & Wolf', m:'Alpentourer AT2', type:'bike', kg:0, url:'https://www.wolfundwolf.ch/en/recumbent/models-and-configurator/alpentourer-at2/' },

    // Slyway (Francja)

    // ── Zockra ───────────────────────────────────────
    { p:'Zockra', m:'High Racer',    type:'bike', arch:true, kg:0, url:'https://www.bentrideronline.com/?tag=zockra' },
    { p:'Zockra', m:'Kouign Amann',  type:'bike', arch:true, kg:0, url:'https://www.bentrideronline.com/?tag=zockra' },

    // Birk (Dania)
    // ── Cycles JV Fenioux ─────────────────────────────────────────
    // Dystrybutor/producent Francja — modele customowe, brak standardowych modeli seryjnych
    // check:true — strona bez spec modeli
    { p:'Cycles JV Fenioux', m:'Fenioux Custom', type:'bike', kg:0, check:true, url:'https://cycles-jv-fenioux.com/' },

    // ── Flux ──────────────────────────────────────────────────────
    // Niemcy (Isny im Allgäu) — firma zakończyła produkcję ("alle Räder sind ausverkauft")
    // Strona utrzymywana jako archiwum informacyjne
    { p:'Flux', m:'S9 SM',  type:'bike', kg:0,   arch:true, url:'https://flux-fahrraeder.de/produkte/s9-ol-ul-sm/' },
    { p:'Flux', m:'S9 ML',  type:'bike', kg:130, arch:true, url:'https://flux-fahrraeder.de/produkte/s900/' },
    { p:'Flux', m:'S9 XL',  type:'bike', kg:130, arch:true, url:'https://flux-fahrraeder.de/produkte/s900/' },
    { p:'Flux', m:'A10',    type:'bike', kg:0,   arch:true, url:'https://flux-fahrraeder.de/produkte/a10/' }, // uprightbike — nie poziomy, ale powiązany producent
    { p:'Flux', m:'C500',   type:'bike', kg:0,   arch:true, url:'https://flux-fahrraeder.de/c500/' },
    // ── ORSA Cycles ───────────────────────────────────────────────
    // Francja (Pireneje) — elektryczny quadrycykl off-road
    // Produkowany w małych seriach, głównie dla profesjonalistów (wynajem)
    { p:'ORSA Cycles', m:'Bugg-E', type:'quad', kg:0, url:'https://orsa-cycles.com/en/home' },

    // ── Zockra ────────────────────────────────────────────────────
    // Zockra Low Racer — brakujący model (High Racer i Kouign Amann już są)
    { p:'Zockra', m:'Low Racer', type:'bike', kg:0, arch:true, url:'https://www.bentrideronline.com/?tag=zockra' },

    // ── Velomobile World ──────────────────────────────────────────
    // Największy producent velomobili na świecie (Rumunia, założona 2020)
    // Portfolio: Alpha series, Milan, Bülk — wszystko to velomobile (zamknięte trajki)
    // Kontakt: velomobileworld.com/contact/
    { p:'Velomobile World', m:'Alpha 7',       type:'tadpole', kg:120, url:'https://www.velomobileworld.com/product/3-alpha-7/' },        // 165-195 cm wzrostu, carbon, 23 kg
    { p:'Velomobile World', m:'Alpha 7 Electra',type:'tadpole', kg:120, url:'https://www.velomobileworld.com/product/alpha-7/' },          // elektryczna wersja Alpha 7
    { p:'Velomobile World', m:'Alpha 9.2',     type:'tadpole', kg:120, url:'https://www.velomobileworld.com/velomobiles/alpha-9-velomobile/' }, // dla bardzo wysokich (185-205 cm)
    { p:'Velomobile World', m:'Alpha W9',      type:'tadpole', kg:90,  url:'https://www.velomobileworld.com/velomobiles/alpha-w9-velomobile/' }, // 159-180 cm, wąski wyścigowy
    { p:'Velomobile World', m:'Alpha W9S',     type:'tadpole', kg:90,  url:'https://www.velomobileworld.com/velomobiles/alpha-w9s-velomobile/' }, // 158-178 cm, najwęższy
    { p:'Velomobile World', m:'Bülk MK1',      type:'tadpole', kg:120, url:'https://www.velomobileworld.com/velomobiles/bulk-mk-1-velomobile/' }, // 158-195 cm, carbon, 24 kg, od 2021
    { p:'Velomobile World', m:'Milan SL',      type:'tadpole', kg:0,   url:'https://store.velomobileworld.com/product/milan-gt/' },        // rekordowe velomobile, CdA=0.1
    { p:'Velomobile World', m:'Milan GT',      type:'tadpole', kg:0,   url:'https://store.velomobileworld.com/product/milan-gt/' },        // CW=0.1, rekord 1219 km/24h

    // ══════════════════════════════════════════════════════════════
    // VELOMOBILE — zamknięte rowery poziome z owiewką aerodynamiczną
    // ══════════════════════════════════════════════════════════════

    // ── Go-One (Beyss GmbH, Niemcy) ──────────────────────────────
    // Firma zakończyła produkcję — go-one.de i go-one.us offline
    // Michael Beyss przeszedł do innej firmy velomobilowej
    // Linki do Web Archive
    { p:'Go-One', m:'Evo R',  type:'velomobile', kg:0, arch:true, url:'https://web.archive.org/web/2023/https://www.go-one.de/' },
    { p:'Go-One', m:'Evo K',  type:'velomobile', kg:0, arch:true, url:'https://web.archive.org/web/2023/https://www.go-one.de/' },
    { p:'Go-One', m:'Evo Ks', type:'velomobile', kg:0, arch:true, url:'https://web.archive.org/web/2023/https://www.go-one.de/' },
    { p:'Go-One', m:'Go-One 3', type:'velomobile', kg:0, arch:true, url:'https://web.archive.org/web/2020/https://www.go-one.de/' },
    // ── Leiba (Niemcy) ────────────────────────────────────────────
    { p:'Leiba', m:'Leiba Record',  type:'velomobile', kg:140, url:'http://www.leiba.de/leiba_record.html' },
    { p:'Leiba', m:'Leiba Xstream', type:'velomobile', kg:0, url:'http://www.leiba.de/leiba_xstream.html' },
    { p:'Leiba', m:'x-stream XXL', type:'velomobile', kg:140, url:'http://www.leiba.de/leiba_xstream_xxl.html' }, // 7cm szerszy niż x-stream, 140 kg
    { p:'Leiba', m:'Leiba Hybrid',  type:'velomobile', kg:140, url:'http://www.leiba.de/leiba_hybrid.html' },

    // ── Velomobiel.nl / InterCityBike (Holandia) ──────────────────
    { p:'Velomobiel.nl', m:'Quest',         type:'velomobile', kg:0, url:'https://www.velomobiel.nl/en/quest/' },
    { p:'Velomobiel.nl', m:'Quest XS',      type:'velomobile', kg:0, url:'https://www.velomobiel.nl/en/questxs/' },
    { p:'Velomobiel.nl', m:'Strada',        type:'velomobile', kg:0, url:'https://www.velomobiel.nl/en/strada/' },
    { p:'Velomobiel.nl', m:'Quattrovelo',   type:'velomobile', kg:0, url:'https://www.velomobiel.nl/en/quattrovelo/' },
    { p:'Velomobiel.nl', m:'Quattrovelo XL',type:'velomobile', kg:0, url:'https://www.velomobiel.nl/en/quattrovelo/' },
    { p:'InterCityBike', m:'DF',            type:'velomobile', arch:true, kg:0, url:'https://intercitybike.nl/en/product/intercity-bike-tuna-velomobiel/' },
    { p:'InterCityBike', m:'DF XL',         type:'velomobile', arch:true, kg:0, url:'https://intercitybike.nl/en/product/intercity-bike-tuna-velomobiel/' },
    { p:'InterCityBike', m:'Tuna', type:'velomobile', kg:0, url:'https://intercitybike.nl/en/product/intercity-bike-tuna-velomobiel/' }, // następca DF XL, własna konstrukcja (2022)

    // ── Sinner Bikes / Drymer (Holandia) ──────────────────────────
    { p:'Sinner', m:'Mango',       type:'velomobile', kg:0, url:'https://www.sinner.eu/en/mango/' },
    { p:'Sinner', m:'Mango Speed', type:'velomobile', kg:0, url:'https://www.sinner.eu/en/mango-speed/' },

    // ── Alligt (Holandia) ─────────────────────────────────────────
    { p:'Alligt', m:'Alleweder A4', type:'velomobile', kg:0, url:'https://www.alligt.nl/en/alleweder-a4/' },
    { p:'Alligt', m:'Alleweder A6', type:'velomobile', kg:0, url:'https://www.alligt.nl/en/alleweder-a6/' },
    { p:'Alligt', m:'Sunrider',     type:'velomobile', kg:0, url:'https://www.alligt.nl/en/sunrider/' },

    // ── Trisled (Australia) ───────────────────────────────────────
    { p:'Trisled', m:'Rotovelo',        type:'velomobile', kg:0, url:'https://www.trisled.com.au/rotovelo' },
    { p:'Trisled', m:'Overzealous XC',  type:'velomobile', kg:0, url:'https://www.trisled.com.au/overzealous-xc' },

        // ── Katanga s.r.o. (Czechy, Brno) ───────────────────────────
    // Producent WAW od 2012 | Kontakt: info@katanga.eu | Stephane Boving
    { p:'Katanga', m:'WAW',         type:'velomobile', kg:0, url:'https://www.katanga.eu/waw/' },
    { p:'Katanga', m:'WAW E',       type:'velomobile', kg:0, url:'https://www.katanga.eu/waw/' }, // elektryczna wersja E-WAW
    { p:'Katanga', m:'VELION',      type:'velomobile', kg:0, url:'https://www.katanga.eu/vm45/' }, // VM45 — nowy typ LEV L6e-A, e-assist do 45 km/h
    { p:'Katanga', m:'Alleweder 4', type:'velomobile', kg:0, url:'https://www.katanga.eu/alleweder4/' }, // wspólnie z Alligt i Passion-Velomobile od 2024

    // ── PonyFour s.r.o. (Czechy) ─────────────────────────────────
    // Osobna firma (spin-off Katanga) | Kontakt: info@pony4.bike
    // PONY4 = quad poziomy bez owiewki, rama CrMo 2.5 kg, nośność ramy 200 kg!
    { p:'PonyFour', m:'PONY4',      type:'quad',       kg:200, url:'https://www.pony4.bike/' }, // 4 koła, pełne zawieszenie, opcja owiewki/solaru/przyczepy
    // ── Cycles LV & Fenioux (Francja) ────────────────────────────
    { p:'Cycles JV Fenioux', m:'LeMans',   type:'velomobile', kg:0, url:'https://cycles-jv-fenioux.com/catalogue-velos/le-mans/' },
    { p:'Cycles JV Fenioux', m:'Mulsanne', type:'velomobile', kg:0, url:'https://cycles-jv-fenioux.com/catalogue-velos/mulsanne/' },

    // ── Räderwerk Hannover (Niemcy — dystrybutor Milan) ───────────
    { p:'Räderwerk', m:'Milan SL',  type:'velomobile', kg:0, url:'https://velowerk.info/' },
    { p:'Räderwerk', m:'Milan GT',  type:'velomobile', kg:0, url:'https://velowerk.info/' },
    { p:'Räderwerk', m:'Milan 4.2', type:'velomobile', kg:0, url:'https://velowerk.info/' },

    // ── Nowe modele z katalogu Cycles JV Fenioux ─────────────────

    // Velomobile World — brakujące modele serii Alpha/Milan
    { p:'Velomobile World', m:'Alpha 9',     type:'velomobile', kg:120, url:'https://www.velomobileworld.com/velomobiles/alpha-9-velomobile/' },
    { p:'Velomobile World', m:'M9',          type:'velomobile', kg:120, url:'https://www.velomobileworld.com/velomobiles/m9-velomobile/' },
    { p:'Velomobile World', m:'Milan SL MK7',type:'velomobile', kg:0,   url:'https://store.velomobileworld.com/product/milan-sl-mk7/' },
    { p:'Velomobile World', m:'Milan GT MK7',type:'velomobile', kg:0,   url:'https://store.velomobileworld.com/product/milan-gt/' },

    // Leiba (Niemcy) — brakujące modele Classic
    { p:'Leiba', m:'Leiba Classic',   type:'velomobile', kg:140, url:'http://www.leiba.de/leiba_classic.html' },
    { p:'Leiba', m:'Leiba Classic L', type:'velomobile', kg:140, url:'http://www.leiba.de/leiba_classic_l.html' },

    // Sinner (Holandia) — brakujące warianty Mango
    { p:'Sinner', m:'Mango Sport', type:'velomobile', kg:0, url:'https://www.sinner.eu/en/mango-sport/' },
    { p:'Sinner', m:'Mango Tour',  type:'velomobile', kg:0, url:'https://www.sinner.eu/en/mango-tour/' },

    // Trisled (Australia) — Aquila 3
    { p:'Trisled', m:'Aquila 3', type:'velomobile', kg:0, url:'https://www.trisled.com.au/aquila' },

    // Le Snoek / Snoek L — holenderski velomobile (Snoek Velomobile BV)
    { p:'Snoek', m:'Le Snoek', type:'velomobile', kg:0, url:'https://www.snoek-velomobile.com/' },
    { p:'Snoek', m:'Snoek L',  type:'velomobile', kg:0, url:'https://www.snoek-velomobile.com/' },

    // Challenge Taifun compact — składana wersja Taifun (nie mylić z Taifun)
    { p:'Challenge', m:'Taifun compact', type:'bike', kg:0, arch:true, url:'https://web.archive.org/web/2023/http://www.challengebikes.com/' },

    // Alligt — Alleweder (ogólna nazwa serii, mamy A4 i A6 osobno)
    // Alleweder bez numeru = starsza seria — arch:true
    { p:'Alligt', m:'Alleweder', type:'velomobile', kg:0, arch:true, url:'https://www.alligt.nl/en/alleweder/' },

    // ══════════════════════════════════════════════════════════════
    // QUADY POZIOME (type:'quad')
    // ══════════════════════════════════════════════════════════════

    // ── Velomobiel.nl (Holandia) — quady ─────────────────────────
    // Quattrovelo — 4 koła, napęd na 2 tylne, dla 1 osoby + dziecko
    // Produkcja wstrzymana do redesignu (~2027)
    { p:'Velomobiel.nl', m:'Quattrovelo',    type:'quad', kg:0, arch:true, url:'https://en.velomobiel.nl/quattrovelo/' },
    { p:'Velomobiel.nl', m:'Quattrovelo XL', type:'quad', kg:0, arch:true, url:'https://en.velomobiel.nl/quattrovelo/' },
    // DuoQuest — tandem back-to-back, tylko 5 szt. zbudowane
    { p:'Velomobiel.nl', m:'DuoQuest',       type:'quad', kg:0, arch:true, url:'https://en.velomobiel.nl/duoquest/' },
    // Snoek — nowy wyścigowy, nie quad ale brakuje w bazie
    { p:'Velomobiel.nl', m:'Snoek',          type:'velomobile', kg:0, url:'https://en.velomobiel.nl/snoek/' },
    { p:'Velomobiel.nl', m:'Snoek L',        type:'velomobile', kg:0, url:'https://en.velomobiel.nl/snoek/' },

    // ── Utah Trikes (USA) — customowe quady ──────────────────────
    // Cat-4 = Catrike przerobiony na quad z własną osią tylną 2WD
    { p:'Utah Trikes', m:'UTCustom Cat-4',   type:'quad', kg:0, url:'https://www.utahtrikes.com/PROD-11617640.html' },

    // ── TrikExplor / Motrike (Chiny) ─────────────────────────────
    // Producent masowy quadów poziomych, OEM
    { p:'TrikExplor', m:'F420 4WD',          type:'quad', kg:0, offroad:true, url:'https://www.trikexplor.com/pages/trikexplor-recumbent-quad' },
    { p:'TrikExplor', m:'Sport Utility Quad',type:'quad', kg:0, offroad:true, url:'https://www.trikexplor.com/pages/trikexplor-recumbent-quad' },
    { p:'TrikExplor', m:'Touring Quad',      type:'quad', kg:0, url:'https://www.trikexplor.com/pages/trikexplor-recumbent-quad' },

    // ══════════════════════════════════════════════════════════════
    // HANDCYCLE — napęd ręczny (type:'handcycle')
    // ══════════════════════════════════════════════════════════════

    // ── HP Velotechnik — Hands-On-Cycle ──────────────────────────
    // Przystawka do swoich trajek + własny handcycle
    { p:'HP Velotechnik', m:'Scorpion Handbike', type:'handcycle', kg:100, url:'https://www.hpvelotechnik.com/en/recumbent-trikes-bikes/accessories/hands-on-cycle-the-hand-powered-bicycle-drive-for-trikes/' },

    // ── Varibike (Niemcy) ─────────────────────────────────────────
    // Full-body bike — napęd rękoma + nogami + rowing
    { p:'Varibike', m:'Varibike Trike', type:'handcycle', kg:0, url:'https://www.varibike.com/t-en-us/modelle' },
    { p:'Varibike', m:'Varibike',       type:'bike',      kg:0, url:'https://www.varibike.com/t-en-us/modelle' },

    // ── RAD-Innovations (Australia) ───────────────────────────────
    { p:'RAD-Innovations', m:'Dual Drive', type:'handcycle', kg:0, url:'https://www.rad-innovations.com/dual-drive.html' }, // dealer AU — Dual Drive = własna konstrukcja,

    // ── Drymer (Niemcy/Holandia) ──────────────────────────────────
    // Producent Hilgo velomobile — Harry Drymer, Groningen
    // Sprzedawane przez Räderwerk/Velowerk (info@velowerk.info)
    { p:'Drymer', m:'Hilgo', type:'velomobile', kg:0, url:'https://velowerk.info/produkt-kategorie/velomobile/hilgo/' },

    // ── Räderwerk (Niemcy, Hannover/Siedenburg) ───────────────────
    // Producent Milan velomobile + centrum dealerskie (velowerk.info)
    // Kontakt: info@velowerk.info | Tel. 04272-9648001
    // ── ReActive Adaptations (USA) ───────────────────────────────
    { p:'ReActive Adaptations', m:'Nuke Off-Road', type:'handcycle', kg:0, offroad:true, url:'https://reactiveadaptations.com/nuke-recumbent-offroad-handcycle/' },

    // ── BerkelBike (Holandia) — hand+foot ─────────────────────────
    { p:'BerkelBike', m:'BerkelBike Pro',   type:'handcycle', kg:0, url:'https://berkelbike.com/' },
    { p:'BerkelBike', m:'BerkelBike Sport', type:'handcycle', kg:0, url:'https://berkelbike.com/' },

    // ══════════════════════════════════════════════════════════════
    // VELOMOBILE 4-KOŁOWE (quadvelo/velocar)
    // ══════════════════════════════════════════════════════════════

    // ── Alligt — Alleweder A10 (velocar) ─────────────────────────
    // Zapowiedziany na SPEZI 2025, rotomolded body, premiera 2026
    { p:'Alligt', m:'Alleweder A10', type:'quad', kg:0, url:'https://www.alligt.nl/en/' }, // velocar — SPEZI 2025, planowany 2026

    // ── ENVO Drive Systems (Kanada) ───────────────────────────────
    // Przejęli Veemo od VeloMetro Mobility w 2023
    { p:'ENVO', m:'Veemo', type:'velomobile', kg:0, url:'https://www.envodrivesystems.com/veemo' }, // e-velomobile, dostawa od 2025

    // ── Velomobiel.nl — Quatrevelo nowa wersja ────────────────────
    // Redesign planowany po 2027

    // ══════════════════════════════════════════════════════════════
    // ROWERY POZIOME — BRAKUJĄCE MODELE Velomobiel.nl
    // ══════════════════════════════════════════════════════════════
    // Quest VS (nowa wersja, zaktualizowany model)
    { p:'Velomobiel.nl', m:'Quest VS',  type:'velomobile', kg:0, url:'https://en.velomobiel.nl/quest/' },

    // ── Lightfoot Cycles (USA, Montana) — zamknięta 2015 ─────────
    // Producent quadów poziomych — Microcar, Duo, Duette + rowery
    { p:'Lightfoot Cycles', m:'Microcar',    type:'quad', kg:0, arch:true, url:'https://web.archive.org/web/2015/http://lightfootcycles.com/' }, // 2-osobowy side-by-side
    { p:'Lightfoot Cycles', m:'Duo',         type:'quad', kg:0, arch:true, url:'https://web.archive.org/web/2015/http://lightfootcycles.com/' }, // 2-osobowy tandem quad
    { p:'Lightfoot Cycles', m:'Duette',      type:'quad', kg:0, arch:true, url:'https://web.archive.org/web/2015/http://lightfootcycles.com/' }, // mniejsza wersja Duo
    { p:'Lightfoot Cycles', m:'Ranger',      type:'bike', kg:0, arch:true, url:'https://web.archive.org/web/2015/http://lightfootcycles.com/' }, // LWB recumbent touring

    // ── InterCityBike DF4 — quad velomobile (prototyp) ───────────
    // Prototyp Daniel Fenn + Ymte Sijbrandij, pokazany SPEZI 2017
    // Brak produkcji seryjnej — check:true
    { p:'InterCityBike', m:'DF4', type:'velomobile', kg:0, check:true, url:'https://www.recumbent.news/2021/01/31/sunday-video-new-four-wheel-velomobile-the-df4-some-info-from-the-designer/' }, // prototyp quad velomobile

    // ── Trident — brakujące modele ───────────────────────────────
    // Fat Quad (4 koła fat) + Jouta Quad
    // już w bazie — sprawdzamy

    // ── GreenSpeed — korekta Magnum SD i BW ──────────────────────
    // Magnum SD i BW — sprawdź czy archiwalne
    // Strona ma tylko: GT20, GT26, Magnum, Aero, Anura — bez SD/BW
    // Magnum BW (Big Wheels) i Magnum SD (Standard Drive) to warianty
    // konfiguracyjne Magnum, nie osobne modele — zostawiamy

    // ── EZ Quadribent / Blackbird Bikes ──────────────────────────
    { p:'Blackbird Bikes', m:'EZ Quadribent', type:'quad', kg:0, arch:true, url:'https://web.archive.org/web/2020/http://blackbirdbikes.com/' }, // USA, 2 rowery EZ połączone obok siebie

    // ── Pacific Cycles — 2Rider ──────────────────────────────────
    { p:'Pacific Cycles', m:'2Rider', type:'quad', kg:0, arch:true, url:'https://web.archive.org/web/2015/http://www.pacific-cycles.com/' }, // Tajwan, side-by-side quad

    // ── Hase Bikes — brakujące modele ────────────────────────────
    // Pino (tandem semi-poziomy) i Tret (tandem) — sprawdź czy są
    // Dodaj Hase Pino jeśli nie ma

    // ── Sport-On (Niemcy) — handcycle ────────────────────────────
    { p:'Sport-On', m:'Jeetrike',    type:'handcycle', kg:0, url:'https://www.sport-on.de/jeetrike/' },
    { p:'Sport-On', m:'XCR',         type:'handcycle', kg:0, url:'https://www.sport-on.de/xcr/' },
    { p:'Sport-On', m:'Troublemaker',type:'handcycle', kg:0, url:'https://www.sport-on.de/troublemaker/' },

    // ── ENVO Veemo — elektryczny velomobile ──────────────────────
    // Już w bazie z poprzedniej sesji — sprawdź

    // ── Podbike Frikar (Norwegia) — zamknięty 2025 ───────────────
    // 4000+ pre-orderów, projekt zakończony maj 2025
    { p:'Podbike', m:'Frikar', type:'velomobile', kg:0, arch:true, url:'https://web.archive.org/web/2024/https://www.podbike.com/' }, // norweski e-velomobile, 4 koła, projekt zakończony 2025

    // ── Avenue Trikes (USA) ───────────────────────────────────────
    // CrMo tadpole, nośność 450 lbs = 204 kg! Bardzo solidna konstrukcja
    { p:'Avenue Trikes', m:'1st Avenue', type:'tadpole', kg:204, url:'https://avenuetrikes.com/1st-ave/' },

    // ── Maxarya Design (Kanada, Concord ON) ───────────────────────
    // Najlepszy CLWB na świecie wg użytkowników — 40M km przejechanego
    // Ray 2 = 300 lbs = 136 kg
    { p:'Maxarya', m:'Ray 1',    type:'bike', kg:136, arch:true, url:'https://www.maxarya.com/product-category/recumbents/' }, // pierwsza generacja, arch
    { p:'Maxarya', m:'Ray 2',    type:'bike', kg:136, url:'https://www.maxarya.com/ray-2-recumbent-bicycle' },
    { p:'Maxarya', m:'Ray 2D',   type:'bike', kg:136, url:'https://www.maxarya.com/ray-2d-recumbent-bicycle' }, // SRAM DualDrive 27-speed
    { p:'Maxarya', m:'Ray 2E',   type:'bike', kg:136, url:'https://www.maxarya.com/ray-2e-electric-recumbent-bicycle' }, // elektryczny
    { p:'Maxarya', m:'Ray 2X',   type:'bike', kg:136, url:'https://www.maxarya.com/ray-2x-recumbent-bicycle' }, // Shimano Dynasys AIR suspension

    // ── Leitra ApS (Dania, Skovlunde) ────────────────────────────
    // Najdłużej produkowany velomobile na świecie (od 1983!)
    // Carl Georg Rasmussen | leitra@leitra.dk | +45 26 23 12 26
    // Każdy egzemplarz budowany na zamówienie — brak standardowej nośności
    { p:'Leitra', m:'Leitra',       type:'velomobile', kg:0, url:'http://leitra.dk/' },
    { p:'Leitra', m:'Leitra Sport', type:'velomobile', kg:0, url:'http://leitra.dk/' },
    { p:'Leitra', m:'Wildcat',      type:'velomobile', kg:0, url:'http://leitra.dk/' }, // owiewka do trajek

    // ── Flevobike (Holandia) — archiwalne ────────────────────────
    // Firma zamknięta, modele na rynku wtórnym
    { p:'Flevobike', m:'Basic',       type:'bike', kg:0, arch:true, url:'https://web.archive.org/web/2010/http://www.flevobike.nl/' },
    { p:'Flevobike', m:'Fifty-fifty', type:'bike', kg:0, arch:true, url:'https://web.archive.org/web/2010/http://www.flevobike.nl/' },
    { p:'Flevobike', m:'Greenmachine',type:'velomobile', kg:0, arch:true, url:'https://web.archive.org/web/2010/http://www.flevobike.nl/' },
    { p:'Flevobike', m:'Versatile',   type:'velomobile', kg:0, arch:true, url:'https://web.archive.org/web/2010/http://www.flevobike.nl/' },

    // ── BamBuk (Niemcy) ───────────────────────────────────────────
    // Producent tandemowych e-trajek | bambuk.de
    { p:'BamBuk', m:'E-Trike Tandem', type:'delta', kg:0, url:'https://www.bambuk.de/' }, // tandem delta e-trike, teleskopowe składanie do 200cm

  ];

  // ============================================================
  // STAN
  // ============================================================
  const SK = 'poziomki_v1';
  let state = GM_getValue(SK, {
    collapsed:  false,
    minKg:      0,
    filterType: 'all',
    filterProd: 'all',
    sortCol:    'kg',
    sortDir:    -1,
  });
  function save() { GM_setValue(SK, state); }

  // ============================================================
  // STYLE
  // ============================================================
  GM_addStyle(`
    #pdb-wrap {
      position: fixed; top: 54px; right: 12px; width: 560px;
      max-height: 90vh; z-index: 2147483640;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 13px; color: #1a1a2e;
      display: flex; flex-direction: column;
      background: #fff;
      border: 1.5px solid #c0cce0;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,40,100,.14);
      overflow: hidden;
      resize: horizontal;
      min-width: 360px;
      max-width: 90vw;
    }
    #pdb-wrap.col { max-height: 48px; }
    #pdb-hdr {
      background: linear-gradient(135deg, #1a3a5c 0%, #2a6090 100%);
      color: #fff; padding: 10px 14px;
      display: flex; align-items: center; gap: 8px;
      cursor: pointer; user-select: none; flex-shrink: 0;
    }
    #pdb-hdr .icon { font-size: 18px; line-height: 1; }
    #pdb-hdr .title { flex: 1; font-weight: 700; font-size: 13.5px; letter-spacing: .02em; }
    #pdb-hdr .badge {
      background: rgba(255,255,255,.2); color: #fff;
      border-radius: 10px; padding: 1px 9px;
      font-size: 11px; font-weight: 700;
    }
    #pdb-hdr .xbtn {
      background: none; border: none; color: rgba(255,255,255,.6);
      font-size: 16px; cursor: pointer; padding: 0 2px; line-height: 1;
    }
    #pdb-hdr .xbtn:hover { color: #fff; }
    #pdb-wrap.col #pdb-body { display: none; }
    #pdb-body { overflow-y: auto; overflow-x: hidden; flex: 1; }
    .pdb-ctrl {
      padding: 8px 12px 6px;
      display: flex; flex-wrap: wrap; gap: 5px;
      background: #f4f7fb;
      border-bottom: 1px solid #e0e8f0;
      flex-shrink: 0;
    }
    .pdb-ctrl select, .pdb-ctrl input {
      font-size: 12px; padding: 4px 7px;
      border: 1px solid #c4d0e0; border-radius: 6px;
      background: #fff; color: #1a1a2e; flex: 1; min-width: 90px;
      outline: none;
    }
    .pdb-ctrl select:focus, .pdb-ctrl input:focus { border-color: #2a6090; }
    .pdb-stat {
      padding: 5px 12px 4px;
      font-size: 11px; color: #666;
      background: #f4f7fb;
      border-bottom: 1px solid #e0e8f0;
      flex-shrink: 0;
    }
    /* TABLE */
    #pdb-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
    #pdb-tbl thead th {
      background: #eef3fa;
      font-size: 10px; font-weight: 700; color: #4a6080;
      text-transform: uppercase; letter-spacing: .06em;
      padding: 6px 10px; text-align: left;
      border-bottom: 1px solid #dce8f4;
      cursor: pointer; user-select: none;
      white-space: nowrap; position: sticky; top: 0; z-index: 2;
    }
    #pdb-tbl thead th:hover { color: #1a3a5c; background: #e4edf8; }
    #pdb-tbl thead th.sorted { color: #2a6090; }
    #pdb-tbl tbody tr { border-bottom: 1px solid #f0f4f8; transition: background .1s; }
    #pdb-tbl tbody tr.row-collab-yes td { background: #f0fdf4; }
    #pdb-tbl tbody tr.row-collab-yes:hover td { background: #dcfce7; }
    #pdb-tbl tbody tr.row-collab-yes td.pdb-prod { border-left: 3px solid #22c55e; }
    #pdb-tbl tbody tr.row-collab-closed td { background: #fff5f5; }
    #pdb-tbl tbody tr.row-collab-closed:hover td { background: #ffe4e4; }
    #pdb-tbl tbody tr.row-collab-closed td.pdb-prod { border-left: 3px solid #f87171; }
    #pdb-tbl tbody tr:last-child { border-bottom: none; }
    #pdb-tbl tbody tr:hover td { background: #f0f6ff; }
    #pdb-tbl td { padding: 6px 10px; vertical-align: middle; white-space: nowrap; }
    #pdb-tbl th:nth-child(1), #pdb-tbl td:nth-child(1) { width: 21%; }
    #pdb-tbl th:nth-child(2), #pdb-tbl td:nth-child(2) { width: 32%; white-space: normal; word-break: break-word; }
    #pdb-tbl th:nth-child(3), #pdb-tbl td:nth-child(3) { width: 13%; }
    #pdb-tbl th:nth-child(4), #pdb-tbl td:nth-child(4) { width: 14%; }
    #pdb-tbl th:nth-child(5), #pdb-tbl td:nth-child(5) { width: 12%; text-align: center; }
    .pdb-prod { font-weight: 600; font-size: 12px; color: #1a3a5c; white-space: nowrap; }
    .pdb-model { font-size: 13px; }
    .pdb-type {
      display: inline-block; font-size: 10px; padding: 1px 6px;
      border-radius: 8px; font-weight: 600; white-space: nowrap;
    }
    .t-tadpole { background: #e0eeff; color: #1a4494; }
    .t-delta   { background: #fde8e0; color: #993020; }
    .t-bike    { background: #e0f4e8; color: #1a6e40; }
    .t-quad    { background: #f0e0fe; color: #6a10a0; }
    .pdb-kg {
      font-weight: 700; font-size: 12px; white-space: nowrap;
    }
    .kg-200plus { color: #6a10a0; }
    .kg-150plus { color: #1a4494; }
    .kg-120plus { color: #1a6e40; }
    .kg-low     { color: #994020; }
    .kg-none    { color: #aaa; font-weight: 400; font-style: italic; font-size: 11px; }
    .pdb-link a {
      display: inline-block; font-size: 11px; padding: 2px 8px;
      border: 1px solid #c0d0e4; border-radius: 5px;
      text-decoration: none; color: #2a6090; background: #f0f6ff;
      white-space: nowrap; font-weight: 500;
    }
    .pdb-link a:hover { background: #d8eaff; border-color: #2a6090; }
    .pdb-arch a {
      display: inline-block; font-size: 10px; padding: 2px 6px;
      border: 1px solid #d0b060; border-radius: 5px;
      text-decoration: none; color: #806010; background: #fdf5d8;
      white-space: nowrap;
    }
    .pdb-arch a:hover { background: #fce8a0; }
    .pdb-check a {
      display: inline-block; font-size: 10px; padding: 2px 6px;
      border: 1px solid #b090d0; border-radius: 5px;
      text-decoration: none; color: #6030a0; background: #f3eaff;
      white-space: nowrap;
    }
    .pdb-check a:hover { background: #e5d5ff; }
    .pdb-nores { padding: 20px; text-align: center; color: #aaa; font-size: 12px; }
    .pdb-foot {
      padding: 5px 12px; font-size: 10px; color: #aaa;
      text-align: center; border-top: 1px solid #e8eef4;
      flex-shrink: 0; background: #f8fafc;
    }
    .pdb-csv {
      display: inline-block; margin-left: 8px; font-size: 10px;
      padding: 1px 6px; border: 1px solid #c0d0e0; border-radius: 4px;
      cursor: pointer; color: #2a6090; background: #fff; text-decoration: none;
    }
    .pdb-csv:hover { background: #e8f0ff; }
    @media (prefers-color-scheme: dark) {
      #pdb-wrap { background: #13192a; border-color: #2a3a5a; color: #d8e8f8; }
      .pdb-ctrl { background: #1a2438; border-color: #2a3a5a; }
      .pdb-ctrl select, .pdb-ctrl input { background: #1f2d44; color: #d8e8f8; border-color: #2a3a5a; }
      .pdb-stat { background: #1a2438; border-color: #2a3a5a; color: #6888aa; }
      #pdb-tbl thead th { background: #1a2840; color: #5a88b8; border-color: #2a3a5a; }
      #pdb-tbl thead th:hover { background: #1e3050; color: #9ac0e0; }
      #pdb-tbl tbody tr { border-color: #1e2a3e; }
      #pdb-tbl tbody tr:hover td { background: #1a2e4a; }
      .pdb-prod { color: #7ab0d8; }
      .pdb-link a { background: #1a2a40; border-color: #2a4060; color: #7ab0d8; }
      .pdb-link a:hover { background: #1a3a5c; }
      .t-tadpole { background: #1a2a50; color: #8ab4e8; }
      .t-delta   { background: #3a1a10; color: #f09070; }
      .t-bike    { background: #102a1a; color: #70c890; }
      .t-quad    { background: #2a1040; color: #c090f0; }
      .pdb-foot { background: #141a28; border-color: #1e2a3e; }
    }
  `);

  // ============================================================
  // HELPERS
  // ============================================================
  const TYPE_LABEL = { tadpole:'Tadpole', delta:'Delta', bike:'2-wheel', quad:'Quad', velomobile:'Velomobile', handcycle:'Handcycle' };
  const TYPE_CLASS = { tadpole:'t-tadpole', delta:'t-delta', bike:'t-bike', quad:'t-quad' };

  function kgClass(kg) {
    if (!kg) return 'kg-none';
    if (kg >= 200) return 'kg-200plus';
    if (kg >= 150) return 'kg-150plus';
    if (kg >= 120) return 'kg-120plus';
    return 'kg-low';
  }

  function getFiltered() {
    return DB.filter(r => {
      if (state.filterType !== 'all' && r.type !== state.filterType) return false;
      if (state.filterProd !== 'all' && r.p !== state.filterProd) return false;
      if (state.minKg > 0 && r.kg < state.minKg) return false;
      return true;
    }).sort((a, b) => {
      const col = state.sortCol;
      let primary;
      if (col === 'kg') {
        const ak = a.kg || 0, bk = b.kg || 0;
        primary = state.sortDir * (ak - bk);
      } else {
        const av = (a[col] || '').toLowerCase();
        const bv = (b[col] || '').toLowerCase();
        primary = state.sortDir * av.localeCompare(bv, 'pl');
      }
      if (primary !== 0) return primary;
      // przy równej wartości: sortuj po producencie, potem modelu alfabetycznie
      const pp = a.p.localeCompare(b.p, 'pl');
      if (pp !== 0) return pp;
      return a.m.localeCompare(b.m, 'pl');
    });
  }

  function exportCSV(rows) {
    const header = 'Producer;Model;Type;Load (kg);URL';
    const lines  = rows.map(r =>
      `${r.p};${r.m};${TYPE_LABEL[r.type]||r.type};${r.kg||'no data'};${r.url}`
    );
    const csv  = [header, ...lines].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'poziomki_baza.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  // ============================================================
  // BUDOWANIE UI
  // ============================================================
  function build() {
    const wrap = document.createElement('div');
    wrap.id = 'pdb-wrap';
    if (state.collapsed) wrap.classList.add('col');

    const producers = ['all', ...new Set(DB.map(r => r.p))].sort((a,b) => a === 'all' ? -1 : a.localeCompare(b,'pl'));

    wrap.innerHTML = `
      <div id="pdb-hdr">
        <span class="icon">🚴</span>
        <span class="title">Poziomki — baza</span>
        <span class="badge" id="pdb-cnt">${DB.length}</span>
        <span id="pdb-arr">${state.collapsed ? '▲' : '▼'}</span>
        <button class="xbtn" id="pdb-x">✕</button>
      </div>
      <div id="pdb-body">
        <div class="pdb-ctrl">
          <select id="pdb-prod">
            ${producers.map(p => `<option value="${p}"${p===state.filterProd?' selected':''}>${p==='all'?'Wszyscy producenci':p}</option>`).join('')}
          </select>
          <select id="pdb-type">
            <option value="all"${state.filterType==='all'?' selected':''}>All types</option>
            <option value="tadpole"${state.filterType==='tadpole'?' selected':''}>Tadpole</option>
            <option value="delta"${state.filterType==='delta'?' selected':''}>Delta</option>
            <option value="bike"${state.filterType==='bike'?' selected':''}>2-wheel</option>
            <option value="quad"${state.filterType==='quad'?' selected':''}>Quad / inne</option>
          </select>
          <input type="number" id="pdb-kg" placeholder="Min. load (kg)" min="0" step="5"
            value="${state.minKg || ''}" style="max-width:140px">
        </div>
        <div class="pdb-stat" id="pdb-stat"></div>
        <table id="pdb-tbl">
          <thead>
            <tr>
              <th id="th-p"  onclick="pdbSort('p')">Producer <span id="si-p"></span></th>
              <th id="th-m"  onclick="pdbSort('m')">Model <span id="si-m"></span></th>
              <th id="th-type" onclick="pdbSort('type')">Typ <span id="si-type"></span></th>
              <th id="th-kg" onclick="pdbSort('kg')">Load kg <span id="si-kg">↓</span></th>
              <th style="text-align:center">Link</th>
            </tr>
          </thead>
          <tbody id="pdb-tbody"></tbody>
        </table>
        <div id="pdb-nores" class="pdb-nores" style="display:none">No models match the selected filters.</div>
        <div class="pdb-foot">
          Data: manufacturer websites &nbsp;·&nbsp; <strong>kg=0</strong> = no data &nbsp;·&nbsp; Author: <strong>MBFeniks</strong> (Michał Berliński) &nbsp;·&nbsp; errors/additions → <a href="mailto:phenix29@gmail.com" style="color:#4a90c0">phenix29@gmail.com</a>
          <a class="pdb-csv" id="pdb-dl" href="#">⬇ CSV</a>
        </div>
      </div>`;

    document.body.appendChild(wrap);

    // Header toggle
    document.getElementById('pdb-hdr').addEventListener('click', e => {
      if (e.target.id === 'pdb-x') return;
      state.collapsed = !state.collapsed;
      wrap.classList.toggle('col', state.collapsed);
      document.getElementById('pdb-arr').textContent = state.collapsed ? '▲' : '▼';
      save();
    });
    document.getElementById('pdb-x').addEventListener('click', e => {
      e.stopPropagation(); wrap.remove();
    });

    // Filtry
    ['pdb-prod','pdb-type','pdb-kg'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => {
        state.filterProd = document.getElementById('pdb-prod').value;
        state.filterType = document.getElementById('pdb-type').value;
        state.minKg      = parseInt(document.getElementById('pdb-kg').value) || 0;
        save(); render();
      });
    });
    document.getElementById('pdb-kg').addEventListener('input', () => {
      state.minKg = parseInt(document.getElementById('pdb-kg').value) || 0;
      save(); render();
    });

    // CSV export
    document.getElementById('pdb-dl').addEventListener('click', e => {
      e.preventDefault(); exportCSV(getFiltered());
    });

    // Sortowanie — globalna funkcja bo jest w onclick
    window.pdbSort = function(col) {
      if (state.sortCol === col) state.sortDir *= -1;
      else { state.sortCol = col; state.sortDir = col === 'kg' ? -1 : 1; }
      save(); render();
    };

    render();
  }

  // ============================================================
  // RENDEROWANIE TABELI
  // ============================================================
  function render() {
    const rows   = getFiltered();
    const tbody  = document.getElementById('pdb-tbody');
    const nores  = document.getElementById('pdb-nores');
    const tbl    = document.getElementById('pdb-tbl');
    const stat   = document.getElementById('pdb-stat');
    const cnt    = document.getElementById('pdb-cnt');

    // Aktualizuj ikony sortowania
    ['p','m','type','kg'].forEach(col => {
      const el = document.getElementById(`si-${col}`);
      const th = document.getElementById(`th-${col}`);
      if (!el || !th) return;
      th.classList.toggle('sorted', state.sortCol === col);
      if (state.sortCol === col) {
        el.textContent = state.sortDir > 0 ? '↑' : '↓';
      } else {
        el.textContent = '';
      }
    });

    if (cnt) cnt.textContent = rows.length;

    const prods = new Set(rows.map(r => r.p));
    if (stat) stat.textContent =
      `${rows.length} models · ${prods.size} producers · ` +
      `(${rows.filter(r=>r.kg>=150).length} ≥ 150 kg · ` +
      `${rows.filter(r=>r.arch).length} archived · ` +
      `${rows.filter(r=>!r.kg).length} bez danych nośności)`;

    if (!rows.length) {
      tbl.style.display = 'none';
      nores.style.display = 'block';
      return;
    }
    tbl.style.display = '';
    nores.style.display = 'none';

    tbody.innerHTML = rows.map(r => {
      const collabStatus = COLLAB[r.p] || '';
      const rowClass = collabStatus === 'yes' ? 'row-collab-yes'
                     : collabStatus === 'closed' ? 'row-collab-closed'
                     : '';
      return `
      <tr class="${rowClass}">
        <td class="pdb-prod">${r.p}</td>
        <td class="pdb-model">${r.m}</td>
        <td><span class="pdb-type ${TYPE_CLASS[r.type]||''}">${TYPE_LABEL[r.type]||r.type}</span></td>
        <td><span class="pdb-kg ${kgClass(r.kg)}">${r.kg ? r.kg+' kg' : 'no data'}</span></td>
        <td class="pdb-link">${r.arch
        ? '<span class="pdb-arch" title="Archived model — available second-hand"><a href="' + r.url + '" target="_blank" rel="noopener">📦 archive</a></span>'
        : r.check
          ? '<span class="pdb-check" title="URL unverified — contact manufacturer to confirm"><a href="' + r.url + '" target="_blank" rel="noopener">❓ check</a></span>'
          : '<a href="' + r.url + '" target="_blank" rel="noopener" title="' + r.p + ' ' + r.m + '">↗ page</a>'
      }</td>
      </tr>`;
    }).join('');
  }

  // ============================================================
  // START
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

})();