#!/usr/bin/env node
// Usage:
//   node scripts/ffa-lookup.js --firstName="Idrissa" --lastName="Conde" --years=2025,2024,2023
//   node scripts/ffa-lookup.js --firstName="Lucie" --lastName="Montferran"   (récupère toutes les années)
// Description: fetch FFA autocomplete + résultats + records par épreuve, sans créer d'utilisateur.

const { fetchFfaByName } = require("../services/ffaService");

const args = process.argv.slice(2).reduce((acc, cur) => {
    const [k, v] = cur.replace(/^--/, "").split("=");
    acc[k] = v;
    return acc;
}, {});

const firstName = args.firstName || args.fn;
const lastName = args.lastName || args.ln;
const years = (args.years ? args.years.split(",") : []).map((y) => y.trim()).filter(Boolean);

if (!firstName || !lastName) {
    console.error("Missing args. Example: node scripts/ffa-lookup.js --firstName=Idrissa --lastName=Conde --years=2025,2024,2023");
    process.exit(1);
}

(async () => {
    try {
        const ffa = await fetchFfaByName(firstName, lastName, years);
        console.log("Autocomplete:");
        console.log(JSON.stringify(ffa?.autocomplete ?? [], null, 2));
        console.log("\nactseq:", ffa?.actseq);
        const availableYears = Object.keys(ffa?.resultsByYear || {});
        if (availableYears.length) {
            console.log("Années détectées:", availableYears.join(", "));
        }
        console.log("\nRecords par épreuve (priorité vent ≤ +2.0 quand disponible):");
        console.log(JSON.stringify(ffa?.recordsByEvent ?? {}, null, 2));
        const loopYears = years.length ? years : availableYears;
        for (const year of loopYears) {
            console.log(`\nRésultats ${year} (structurés par épreuve):`);
            console.log(JSON.stringify(ffa?.resultsByYear?.[year] ?? {}, null, 2));
        }
    } catch (err) {
        console.error("FFA lookup failed:", err.message);
        process.exitCode = 1;
    }
})();
