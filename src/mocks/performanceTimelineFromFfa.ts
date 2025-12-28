import { PerformancePoint } from "../types/User";

export type FfaMergedByEvent = Record<
    string,
    {
        date: string;
        performance: string;
        vent?: string;
        tour?: string;
        place?: string;
        niveau?: string;
        points?: string | number;
        lieu?: string;
        year?: string | number;
    }[]
>;

const monthMap: Record<string, number> = {
    janv: 1,
    jan: 1,
    fev: 2,
    fevr: 2,
    fevrier: 2,
    mar: 3,
    mars: 3,
    avr: 4,
    avril: 4,
    mai: 5,
    juin: 6,
    juil: 7,
    juillet: 7,
    aout: 8,
    sept: 9,
    septembre: 9,
    oct: 10,
    octobre: 10,
    nov: 11,
    novembre: 11,
    dec: 12,
    decembre: 12,
};

const normalizeMonth = (value = "") => {
    const key = value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[^a-z.]/g, "");
    return monthMap[key] || null;
};

const toIsoDate = (raw: string, yearHint?: number | string | null) => {
    if (!raw) return null;
    const cleaned = raw.replace(/\s+/g, " ").trim().replace(/\.$/, "");
    const parts = cleaned.split(" ");
    const day = Number.parseInt(parts[0], 10);
    const month = normalizeMonth(parts[1]);
    const year = Number(yearHint) || new Date().getFullYear();
    if (!Number.isFinite(day) || !month) return null;
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString();
};

const parsePerformanceToSeconds = (raw: string) => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (/dnf|np|nr/i.test(trimmed)) return null;

    const paren = trimmed.match(/\(([^)]+)\)/);
    const base = paren ? paren[1].trim() : trimmed;

    const mmss = base.match(/^(\d+)[’'](\d{1,2})(?:[.’'](\d{1,2}))?/);
    if (mmss) {
        const m = Number.parseInt(mmss[1], 10);
        const s = Number.parseInt(mmss[2], 10);
        const dec = mmss[3] ? Number.parseInt(mmss[3], 10) / 100 : 0;
        return m * 60 + s + dec;
    }

    const ss = base.match(/^(\d{1,3})(?:[’']{2}|[’'])(\d{0,2})?$/);
    if (ss) {
        const whole = Number.parseInt(ss[1], 10);
        const dec = ss[2] ? Number.parseInt(ss[2], 10) / 100 : 0;
        return whole + dec;
    }

    const num = Number.parseFloat(base.replace(/,/g, "."));
    return Number.isFinite(num) ? num : null;
};

const parseWind = (raw?: string | number | null) => {
    if (raw === null || raw === undefined) return undefined;
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : undefined;
    const cleaned = String(raw).replace(/,/g, ".").replace(/m\/?s/i, "").trim();
    const match = cleaned.match(/-?\d+(?:\.\d+)?/);
    if (!match) return undefined;
    const value = parseFloat(match[0]);
    return Number.isFinite(value) ? value : undefined;
};

export const buildPerformanceTimelineFromFfa = (ffaMergedByEvent: FfaMergedByEvent): PerformancePoint[] => {
    const points: PerformancePoint[] = [];

    for (const [discipline, entries] of Object.entries(ffaMergedByEvent || {})) {
        if (!Array.isArray(entries)) continue;
        for (const entry of entries) {
            const parsedValue = parsePerformanceToSeconds(entry.performance);
            const date = toIsoDate(entry.date, entry.year);
            if (!date) continue;
            if (parsedValue === null && !entry.place) continue;

            const numericValue = parsedValue === null ? Number.NaN : parsedValue;
            const wind = parseWind(entry.vent);
            points.push({
                discipline,
                date,
                value: numericValue,
                rawPerformance: entry.performance || undefined,
                place: entry.place,
                wind,
                meeting: `${entry.tour || ""}${entry.niveau ? ` (${entry.niveau})` : ""}${entry.vent ? `, vent ${entry.vent}` : ""}`.trim(),
                city: entry.lieu || undefined,
                points: entry.points ? Number.parseInt(String(entry.points), 10) : undefined,
            });
        }
    }

    const sorted = points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    console.log("[performanceTimelineFromFfa] built points count=", sorted.length, {
        sample: sorted.slice(0, 3),
        disciplines: Array.from(new Set(sorted.map((p) => p.discipline))).slice(0, 5),
    });
    return sorted;
};

// Example usage (replace with real data if needed)
// export const performanceTimelineFromFfaMock = buildPerformanceTimelineFromFfa(ffaMergedByEventMock);
