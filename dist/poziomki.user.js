// ==UserScript==
// @name         Recumbent Fleet Viewer & Manager
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Bezpieczny menedżer katalogu floty (tylko na Google)
// @author       MBFeniks
// @match        *://www.google.com/*
// @match        *://www.google.pl/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // 1. KONFIGURACJA I ADRESY BAZOWE
    // ==========================================
    // Twój dokładny adres z GitHuba do folderu 'producers'
    const manifestBaseUrl = "https://raw.githubusercontent.com/phenix1/poziomki-db/main/producers/";

    // Pełna lista Twoich firm (zgodna z nazwami plików .json)
    const fleetMakers = [
        "Aerorider", "Alligt", "Avatar 2000", "Avenue Trikes", "Azub", "Bacchetta", "BamBuk", "Barcroft",
        "BerkelBike", "BikeE", "Birk", "Blackbird Bikes", "Burley", "Catrike", "Challenge", "Cruzbike",
        "Cycle Genius", "Cycles JV Fenioux", "Dekers Bike", "Drymer", "Easy Racers", "ENVO", "Flevobike",
        "Flux", "Go-One", "GreenSpeed", "Haluzak", "Hase Bikes", "HP Velotechnik", "ICE Trikes", "IN Trikes",
        "InterCityBike", "Kamrad", "Katanga", "KMX", "Leiba", "Leitra", "Lightfoot Cycles", "Lightning", "Linear",
        "M5", "Matix Bike", "Maxarya", "Nazca", "Optima", "ORSA Cycles", "Pacific Cycles", "Pelso", "Performer",
        "Podbike", "PonyFour", "RAD-Innovations", "RANS", "ReActive Adaptations", "Räderwerk", "Sinner", "Slyway",
        "Snoek", "SpecBikeTechnics", "Sport-On", "Steintrikes", "SunSeeker", "TerraTrike", "Trice", "Trident",
        "TrikExplor", "Trisled", "Utah Trikes", "Varibike", "Velomobiel.nl", "Velomobile World", "Vision",
        "Wolf & Wolf", "Zockra"
    ];

    // Generowanie gotowych linków (encodeURIComponent dba o spacje w nazwach np. "Hase Bikes")
    const fleetSources = fleetMakers.map(maker => `${manifestBaseUrl}${encodeURIComponent(maker)}.json`);

    // ==========================================
    // 2. SŁOWNIK KRAJÓW POCHODZENIA (FLAGI)
    // ==========================================
    const originMap = {
        "Azub": { c: "CZ", f: "🇨🇿" },
        "Bacchetta": { c: "US", f: "🇺🇸" },
        "Burley": { c: "US", f: "🇺🇸" },
        "Catrike": { c: "US", f: "🇺🇸" },
        "Challenge": { c: "NL", f: "🇳🇱" },
        "Cruzbike": { c: "US", f: "🇺🇸" },
        "Flevobike": { c: "NL", f: "🇳🇱" },
        "Flux": { c: "DE", f: "🇩🇪" },
        "Hase Bikes": { c: "DE", f: "🇩🇪" },
        "HP Velotechnik": { c: "DE", f: "🇩🇪" },
        "ICE Trikes": { c: "GB", f: "🇬🇧" },
        "Trice": { c: "GB", f: "🇬🇧" },
        "Matix Bike": { c: "PL", f: "🇵🇱" },
        "Dekers Bike": { c: "PL", f: "🇵🇱" },
        "Kamrad": { c: "PL", f: "🇵🇱" },
        "Sport-On": { c: "PL", f: "🇵🇱" },
        "Nazca": { c: "NL", f: "🇳🇱" },
        "Optima": { c: "NL", f: "🇳🇱" },
        "TerraTrike": { c: "US", f: "🇺🇸" },
        "Velomobiel.nl": { c: "NL", f: "🇳🇱" },
        "Velomobile World": { c: "RO", f: "🇷🇴" },
        "M5": { c: "NL", f: "🇳🇱" },
        "Performer": { c: "TW", f: "🇹🇼" },
        "Podbike": { c: "NO", f: "🇳🇴" },
        "Steintrikes": { c: "RS", f: "🇷🇸" },
        "default": { c: "UN", f: "🏳️" } // Flaga domyślna dla brakujących w słowniku
    };

    let globalFleet = [];

    // ==========================================
    // 3. SILNIK ASYNCHRONICZNEGO POBIERANIA
    // ==========================================
    function fetchFleetPart(url) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            let parsed = JSON.parse(response.responseText);
                            resolve(parsed);
                        } catch (e) {
                            console.warn("Nie udało się sparsować:", url);
                            resolve([]);
                        }
                    } else {
                        resolve([]); // Ignorujemy pliki 404 (np. gdy zapomnisz wrzucić plik na GitHuba)
                    }
                },
                onerror: function() {
                    resolve([]);
                }
            });
        });
    }

    async function initializeSystem() {
        // Tworzymy szkielet interfejsu (Status: Ładowanie)
        buildUI();
        updateUIStatus("Pobieranie plików floty...", "#ffa500");

        // Promise.all -> Pobieramy wszystkie kilkadziesiąt plików JEDNOCZEŚNIE
        let allPromises = fleetSources.map(url => fetchFleetPart(url));
        let results = await Promise.all(allPromises);

        // Łączymy wyniki w jedną wielką tablicę i filtrujemy puste wyniki
        let loadedFilesCount = 0;
        results.forEach(part => {
            if (Array.isArray(part) && part.length > 0) {
                globalFleet = globalFleet.concat(part);
                loadedFilesCount++;
            }
        });

        // Wypisujemy sukces do UI
        renderFinalUI(loadedFilesCount, globalFleet.length);
    }

    // ==========================================
    // 4. GENEROWANIE PŁYWAJĄCEGO INTERFEJSU (UI)
    // ==========================================
    function buildUI() {
        GM_addStyle(`
            #fleet-dashboard {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(30, 30, 30, 0.95);
                color: #e0e0e0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                z-index: 999999;
                border: 1px solid #444;
                min-width: 280px;
                backdrop-filter: blur(5px);
            }
            #fleet-dashboard h3 {
                margin: 0 0 10px 0;
                font-size: 16px;
                color: #4CAF50;
                border-bottom: 1px solid #555;
                padding-bottom: 5px;
            }
            .fleet-stat {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 14px;
            }
            .fleet-val {
                font-weight: bold;
                color: #fff;
            }
            #fleet-status {
                font-size: 12px;
                margin-top: 10px;
                text-align: right;
            }
        `);

        let panel = document.createElement('div');
        panel.id = "fleet-dashboard";
        panel.innerHTML = `
            <h3>🚲 Fleet Manager</h3>
            <div id="fleet-content">
                <div class="fleet-stat"><span>Status:</span> <span id="fleet-status-text" class="fleet-val">Inicjalizacja...</span></div>
            </div>
        `;
        document.body.appendChild(panel);
    }

    function updateUIStatus(msg, color) {
        let statusEl = document.getElementById('fleet-status-text');
        if (statusEl) {
            statusEl.innerText = msg;
            statusEl.style.color = color;
        }
    }

    function renderFinalUI(filesLoaded, totalModels) {
        let contentEl = document.getElementById('fleet-content');
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="fleet-stat"><span>Pliki producentów:</span> <span class="fleet-val" style="color: #4db8ff;">${filesLoaded} / ${fleetMakers.length}</span></div>
                <div class="fleet-stat"><span>Zliczone modele:</span> <span class="fleet-val" style="color: #ff5252;">${totalModels}</span></div>
                <div id="fleet-status" style="color: #4CAF50;">✓ Baza w pełni załadowana</div>
            `;
        }
        console.log(`[Fleet Manager] Zakończono sukcesem. Wczytano modeli: ${totalModels}.`);
        console.log(globalFleet); // Pełna baza dostępna w konsoli!
    }

    // Uruchomienie maszyny
    window.addEventListener('load', initializeSystem);

})();
