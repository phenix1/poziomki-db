# 🚲 Poziomki DB - Recumbent Fleet Manager

**Poziomki DB** is a powerful, fully modular, and lightning-fast database of recumbent bikes, trikes (tadpole/delta), quads, handbikes, and velomobiles. The project consists of a distributed JSON database (over 90 manufacturers worldwide) and an advanced Tampermonkey script that renders a modern, floating user interface.

The database is designed for maximum performance and resistance to ad blockers (AdBlock/uBlock) using Stealth Mode techniques.

> ⚠️ **IMPORTANT NOTICE / DISCLAIMER**
> The "Poziomki Archive & Lab" database is a private, community-focused archive of models, weight limits, and technical specifications for recumbent trikes, quads, velomobiles, and other specialized cycles. 
> 
> While we make every effort to ensure accuracy, **this data is compiled from various historical archives, manuals, and correspondence, and may contain errors, discrepancies, or outdated information.** Manufacturer specifications are subject to change without notice.
> **You must always verify all technical specifications—especially weight capacities—on the manufacturer's official website before making any purchase, modification, or safety decisions.**

## ✨ Key Features

* 🚀 **Asynchronous Engine (Promise.all):** Fetches dozens of manufacturer `.json` files simultaneously, loading a database of hundreds of models in a fraction of a second without slowing down your browser.
* 🕵️ **Stealth Mode (Google Only):** To avoid interfering with your daily web browsing, the script runs and integrates its interface **exclusively on the `google.com` and `google.pl` homepages**.
* 🌍 **Integrated Flag Dictionary:** Automatically detects the manufacturer's country of origin and assigns the appropriate national flag (e.g., 🇵🇱, 🇳🇱, 🇺🇸, 🇩🇪).
* 🔍 **Advanced Filtering and Sorting:** Filter entries by manufacturer, vehicle type (tadpole, velomobile, 2-wheel, etc.), and minimum weight capacity (kg).
* 🏷️ **Tagging System:** Clear visual tags for discontinued models (`ARCHIWUM`), off-road machines (`OFFROAD`), and entries requiring further verification (`❓ Check`).
* 🎨 **Floating Interface (Shadow DOM):** A modern, Drag & Drop window interface that is completely isolated and resistant to CSS conflicts with the main page.
* 📢 **Banner Management:** Built-in system for displaying custom information and banners fetched from an external `ads.json` file.

---

## 🛠️ 1-Click Installation (For Users)

To use **Poziomki DB** in your own browser, follow these simple steps:

1. **Install the Tampermonkey extension** for your browser:
   * [Chrome / Edge / Opera](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   * [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
2. **Install the Script via Greasy Fork:**
   * 👉 **[CLICK HERE TO INSTALL FROM GREASY FORK](https://greasyfork.org/pl/scripts/577223-poziomki-db-v3-0-fleet-edition)** 👈
   * Click the green **"Install this script"** button.
3. **Launch the Database:**
   * Go to [www.google.com](https://www.google.com) or [www.google.pl](https://www.google.pl).
   * The **Poziomki DB** panel will appear on the screen. Click on it to expand and browse the database!

---

## 📁 Repository Structure

The database has moved away from a single "monolithic" file approach in favor of full modularity.

* `/producers/` - Directory containing `.json` files. Each manufacturer (e.g., `Azub.json`, `ICE Trikes.json`) has its own dedicated file. This makes updating easier and prevents critical errors across the entire database.
* `/data/ads.json` - Configuration file for top and bottom banners (supports raw HTML or image links).
* `/assets/` - Directory for graphic assets (logo, avatars).

---

## ✍️ How to add a new model or company? (For Editors)

Every file in the `/producers/` folder must follow a strict JSON structure (starting and ending with square brackets `[ ]`).

**Single model schema:**
```json
[
  {
    "p": "Manufacturer Name",
    "m": "Model Name",
    "type": "tadpole | delta | bike | quad | velomobile | handcycle",
    "kg": 130,
    "url": "[https://link-to-manufacturer-website.com](https://link-to-manufacturer-website.com)",
    "arch": false,
    "offroad": true,
    "check": false
  }
]
