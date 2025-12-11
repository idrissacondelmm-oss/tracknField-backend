#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL = "https://www.athle.fr";
const DEFAULT_ATHLETE_ID = "3134018";
const DEFAULT_ROUTE = (athleteId) => `${BASE_URL}/athletes/${athleteId}/resultats`;

const HELP_TEXT = `Usage: npm run scrape-athle-results [-- --athlete=<id>] [--url=<fully-qualified-url>] [--output=<file>] [--compact]

Options:
  --athlete=<id>     Athlete identifier used by athle.fr (default: ${DEFAULT_ATHLETE_ID}).
  --url=<url>        Override the resolved URL entirely (takes precedence over --athlete).
  --output=<file>    Write the JSON payload to the provided file instead of stdout.
  --compact          Print minified JSON instead of pretty formatting.
  --help             Display this message.
`;

function parseArgs(argv) {
    const options = {
        athleteId: DEFAULT_ATHLETE_ID,
        pretty: true,
    };

    for (const arg of argv) {
        if (!arg.startsWith("--")) {
            continue;
        }

        const [flag, value] = arg.slice(2).split("=");

        switch (flag) {
            case "athlete":
                if (value) {
                    options.athleteId = value;
                }
                break;
            case "url":
                if (value) {
                    options.url = value;
                }
                break;
            case "output":
                if (value) {
                    options.output = value;
                }
                break;
            case "compact":
                options.pretty = false;
                break;
            case "help":
                options.help = true;
                break;
            default:
                console.warn(`Warning: ignoring unknown flag --${flag}`);
        }
    }

    return options;
}

function cleanText(value = "") {
    return value.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

function buildEntry($, row) {
    const cells = row.find("td");
    if (cells.length < 9) {
        return null;
    }

    const discipline = cleanText(cells.eq(1).text());
    if (!discipline) {
        return null;
    }

    const locationCell = cells.eq(8);
    const relativeHref = locationCell.find("a").attr("href");
    const competitionUrl = relativeHref ? new URL(relativeHref, BASE_URL).href : null;

    return {
        date: cleanText(cells.eq(0).text()),
        discipline,
        performance: cleanText(cells.eq(2).text()),
        wind: cleanText(cells.eq(3).text()) || null,
        round: cleanText(cells.eq(4).text()) || null,
        place: cleanText(cells.eq(5).text()) || null,
        level: cleanText(cells.eq(6).text()) || null,
        points: cleanText(cells.eq(7).text()) || null,
        location: cleanText(locationCell.text()) || null,
        competitionUrl,
    };
}

function groupByDiscipline($) {
    const grouped = {};

    $("#res_athlete tbody tr").each((_, element) => {
        const row = $(element);
        if (row.hasClass("detail-row")) {
            return;
        }

        const entry = buildEntry($, row);
        if (!entry) {
            return;
        }

        if (!grouped[entry.discipline]) {
            grouped[entry.discipline] = [];
        }

        grouped[entry.discipline].push(entry);
    });

    return grouped;
}

async function fetchHtml(targetUrl) {
    const response = await axios.get(targetUrl, {
        headers: {
            "User-Agent": "tracknfield-mobile-scraper/1.0 (+https://github.com/idrissa73/tracknfield-mobile)",
            Accept: "text/html,application/xhtml+xml",
        },
    });

    return response.data;
}

async function writeOutput(payload, options) {
    const json = JSON.stringify(payload, null, options.pretty ? 2 : 0);

    if (!options.output) {
        console.log(json);
        return;
    }

    const outputPath = path.resolve(process.cwd(), options.output);
    await fs.writeFile(outputPath, json, "utf8");
    console.log(`Saved ${payload.summary.entryCount} results to ${outputPath}`);
}

async function main() {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        console.log(HELP_TEXT);
        return;
    }

    const targetUrl = options.url || DEFAULT_ROUTE(options.athleteId);

    try {
        const html = await fetchHtml(targetUrl);
        const $ = cheerio.load(html);
        const grouped = groupByDiscipline($);
        const entryCount = Object.values(grouped).reduce((total, rows) => total + rows.length, 0);

        const payload = {
            source: targetUrl,
            scrapedAt: new Date().toISOString(),
            summary: {
                athleteId: options.athleteId,
                disciplineCount: Object.keys(grouped).length,
                entryCount,
            },
            disciplines: grouped,
        };

        await writeOutput(payload, options);
    } catch (error) {
        console.error("Unable to scrape athle.fr:", error.message);
        process.exitCode = 1;
    }
}

main();
