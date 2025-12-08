import { Performance, PerformancePoint } from "../types/User";

type MetricType = "time" | "distance" | null;

const timeKeywords = [
    "sprint",
    "fond",
    "demi-fond",
    "course",
    "haies",
    "relay",
    "relais",
    "marathon",
    "km",
    "mile",
];

const distanceKeywords = [
    "saut",
    "lancer",
    "longueur",
    "hauteur",
    "javelot",
    "poids",
    "marteau",
    "disque",
];

const LOW_PROGRESS_COLOR = "#ef4444"; // rouge
const HIGH_PROGRESS_COLOR = "#22c55e"; // vert

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const hexToRgb = (hex: string): [number, number, number] => {
    const normalized = hex.replace("#", "");
    const bigint = parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
};

const rgbToHex = ([r, g, b]: [number, number, number]) => {
    const toHex = (value: number) => value.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const mixColors = (from: string, to: string, ratio: number) => {
    const t = clamp01(ratio);
    const [fr, fg, fb] = hexToRgb(from);
    const [tr, tg, tb] = hexToRgb(to);
    const r = Math.round(fr + (tr - fr) * t);
    const g = Math.round(fg + (tg - fg) * t);
    const b = Math.round(fb + (tb - fb) * t);
    return rgbToHex([r, g, b]);
};

const parseTime = (value?: string) => {
    if (!value) return null;
    const num = parseFloat(value.replace(/[^\d.]/g, ""));
    return isNaN(num) ? null : num;
};

const detectMetricType = (label?: string): MetricType => {
    if (!label) return null;
    const normalized = label.toLowerCase();

    if (/\d{2,4}m\b/.test(normalized) || normalized.endsWith("m")) {
        return "time";
    }

    if (timeKeywords.some((keyword) => normalized.includes(keyword))) {
        return "time";
    }

    if (distanceKeywords.some((keyword) => normalized.includes(keyword))) {
        return "distance";
    }

    return null;
};

export const computePerformanceProgress = (
    discipline: string = "Sprint",
    record?: string,
    season?: string
): number => {
    const metricType = detectMetricType(discipline);

    if (metricType === "time" || metricType === null) {
        const recordTime = parseTime(record);
        const seasonTime = parseTime(season);
        if (!recordTime || !seasonTime) return 0;

        const ratio = recordTime / seasonTime;
        return Math.min(ratio, 1);
    }

    const recordDist = parseFloat(record || "0");
    const seasonDist = parseFloat(season || "0");
    if (!recordDist || !seasonDist) return 0;

    const ratio = seasonDist / recordDist;
    return Math.min(ratio, 1);
};

export const getPerformanceColor = (progress: number) => {
    return mixColors(LOW_PROGRESS_COLOR, HIGH_PROGRESS_COLOR, clamp01(progress));
};

export const getPerformanceGradient = (progress: number) => {
    const base = mixColors(LOW_PROGRESS_COLOR, HIGH_PROGRESS_COLOR, clamp01(progress));
    const faded = mixColors("#ffffff", base, 0.3);
    return [faded, base] as [string, string];
};

export type DisciplineTimelinePoint = {
    date: string;
    value: number;
    year: string;
    timestamp: number;
};

const toShortISODate = (value?: string) => {
    if (!value) return null;
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) return null;
    return new Date(timestamp).toISOString().split("T")[0];
};

const parseNumericValue = (value: number | string | undefined | null) => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
        const sanitized = parseFloat(value.replace(/,/g, "."));
        return Number.isFinite(sanitized) ? sanitized : null;
    }
    return null;
};

export const getDisciplineTimeline = (
    timeline: PerformancePoint[] | undefined,
    discipline?: string
): DisciplineTimelinePoint[] => {
    if (!timeline || timeline.length === 0 || !discipline) {
        return [];
    }

    const normalizedDiscipline = discipline.trim().toLowerCase();

    return timeline
        .filter((point) => point.discipline?.trim().toLowerCase() === normalizedDiscipline)
        .map((point) => {
            const shortDate = toShortISODate(point.date);
            const numericValue = parseNumericValue(point.value);
            if (!shortDate || numericValue === null) return null;
            const timestamp = Date.parse(point.date || "");
            return {
                date: shortDate,
                value: numericValue,
                timestamp,
                year: shortDate.split("-")[0] ?? "",
            };
        })
        .filter((point): point is DisciplineTimelinePoint => {
            if (!point) return false;
            return Number.isFinite(point.timestamp);
        })
        .sort((a, b) => a.timestamp - b.timestamp);
};

const removeDiacritics = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normalizeDisciplineLabel = (value: string) => removeDiacritics(value.trim().toLowerCase());

const distanceDisciplineNames = new Set([
    "saut en longueur",
    "saut en hauteur",
    "triple saut",
    "saut a la perche",
    "poids",
    "disque",
    "marteau",
    "javelot",
]);

const pointsDisciplineNames = new Set(["decathlon", "heptathlon", "pentathlon"]);

type ValueFormatVariant = "default" | "compact";

const formatSecondsValue = (value: number, variant: ValueFormatVariant = "default") => {
    const base = value.toFixed(2);
    return variant === "compact" ? `${base}s` : `${base} s`;
};

const formatMetersValue = (value: number, variant: ValueFormatVariant = "default") => {
    const base = value.toFixed(2);
    return variant === "compact" ? `${base}m` : `${base} m`;
};

const formatPointsValue = (value: number, variant: ValueFormatVariant = "default") => {
    const base = Math.round(value).toString();
    return variant === "compact" ? `${base}pts` : `${base} pts`;
};

const formatMinutesSecondsValue = (value: number) => {
    let minutes = Math.floor(value / 60);
    let remainder = Math.max(value - minutes * 60, 0);
    if (remainder >= 59.995) {
        minutes += 1;
        remainder = 0;
    }
    const secondsStr = remainder.toFixed(2);
    const [whole, decimals] = secondsStr.split(".");
    const paddedWhole = whole.padStart(2, "0");
    return decimals && decimals !== "00" ? `${minutes}:${paddedWhole}.${decimals}` : `${minutes}:${paddedWhole}`;
};

const formatHoursMinutesSecondsValue = (value: number) => {
    const rounded = Math.max(Math.round(value), 0);
    const hours = Math.floor(rounded / 3600);
    const minutes = Math.floor((rounded % 3600) / 60)
        .toString()
        .padStart(2, "0");
    const seconds = String(rounded % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
};

const parseDistanceFromLabel = (discipline?: string): number | null => {
    if (!discipline) return null;
    const sanitized = removeDiacritics(discipline.toLowerCase());
    const compactName = sanitized.replace(/[\s-]/g, "");

    const relayMatch = sanitized.match(/(\d+)x(\d+)m/);
    if (relayMatch) {
        const legs = parseInt(relayMatch[1], 10);
        const distance = parseInt(relayMatch[2], 10);
        if (Number.isFinite(legs) && Number.isFinite(distance)) {
            return legs * distance;
        }
    }

    const genericMatch = sanitized.match(/(\d+(?:[.,]\d+)?)\s*(km|m)/);
    if (genericMatch) {
        const value = parseFloat(genericMatch[1].replace(",", "."));
        if (!Number.isFinite(value)) return null;
        return genericMatch[2] === "km" ? value * 1000 : value;
    }

    if (compactName.includes("semimarathon")) return 21097;
    if (compactName.endsWith("marathon")) return 42195;
    return null;
};

type MetricKind = "time-short" | "time-long" | "time-marathon" | "distance" | "points";

export type DisciplineMetricMeta = {
    kind: MetricKind;
    direction: "lower" | "higher";
    subtitle: string;
    tableLabel: string;
    deltaThreshold: number;
    formatValue: (value: number, variant?: ValueFormatVariant) => string;
};

const shortTimeMeta: DisciplineMetricMeta = {
    kind: "time-short",
    direction: "lower",
    subtitle: "Dates ISO, chrono en secondes",
    tableLabel: "Chrono (s)",
    deltaThreshold: 0.01,
    formatValue: (value, variant) => formatSecondsValue(value, variant),
};

const longTimeMeta: DisciplineMetricMeta = {
    kind: "time-long",
    direction: "lower",
    subtitle: "Dates ISO, chrono mm:ss",
    tableLabel: "Chrono (min:s)",
    deltaThreshold: 0.1,
    formatValue: (value) => formatMinutesSecondsValue(value),
};

const marathonMeta: DisciplineMetricMeta = {
    kind: "time-marathon",
    direction: "lower",
    subtitle: "Dates ISO, chrono h:min:s",
    tableLabel: "Chrono (h:min:s)",
    deltaThreshold: 1,
    formatValue: (value) => formatHoursMinutesSecondsValue(value),
};

const distanceMeta: DisciplineMetricMeta = {
    kind: "distance",
    direction: "higher",
    subtitle: "Dates ISO, distance en mètres",
    tableLabel: "Performance (m)",
    deltaThreshold: 0.01,
    formatValue: (value, variant) => formatMetersValue(value, variant),
};

const pointsMeta: DisciplineMetricMeta = {
    kind: "points",
    direction: "higher",
    subtitle: "Dates ISO, total points",
    tableLabel: "Points",
    deltaThreshold: 5,
    formatValue: (value, variant) => formatPointsValue(value, variant),
};

export const getDisciplineMetricMeta = (discipline?: string): DisciplineMetricMeta => {
    if (!discipline) return shortTimeMeta;

    const sanitized = normalizeDisciplineLabel(discipline);

    if (pointsDisciplineNames.has(sanitized)) return pointsMeta;
    if (distanceDisciplineNames.has(sanitized)) return distanceMeta;

    const distanceMeters = parseDistanceFromLabel(sanitized);
    if (distanceMeters && distanceMeters > 400) {
        return sanitized.includes("marathon") ? marathonMeta : longTimeMeta;
    }

    return shortTimeMeta;
};

type DisciplineStats = {
    discipline: string;
    recordValue: number;
    recordFormatted: string;
    bestSeasonValue?: number;
    bestSeasonFormatted?: string;
};

const getExtrema = (values: number[], direction: "lower" | "higher") => {
    return direction === "lower" ? Math.min(...values) : Math.max(...values);
};

const computeLatestSeasonValue = (
    points: DisciplineTimelinePoint[],
    direction: DisciplineMetricMeta["direction"]
): number | undefined => {
    const latestYear = points.reduce<number | null>((acc, point) => {
        const parsed = Number(point.year);
        if (!Number.isFinite(parsed)) return acc;
        if (acc === null || parsed > acc) return parsed;
        return acc;
    }, null);

    if (latestYear === null) return undefined;

    const seasonPoints = points.filter((point) => Number(point.year) === latestYear);
    if (seasonPoints.length === 0) return undefined;

    return getExtrema(
        seasonPoints.map((point) => point.value),
        direction
    );
};

const buildDisciplineStats = (
    discipline: string,
    points: DisciplineTimelinePoint[],
    meta: DisciplineMetricMeta
): DisciplineStats | null => {
    if (points.length === 0) return null;
    const values = points.map((point) => point.value);
    if (values.length === 0) return null;

    const recordValue = getExtrema(values, meta.direction);
    const recordFormatted = meta.formatValue(recordValue, "compact");

    const bestSeasonValue = computeLatestSeasonValue(points, meta.direction);
    const bestSeasonFormatted =
        bestSeasonValue !== undefined ? meta.formatValue(bestSeasonValue, "compact") : undefined;

    return {
        discipline,
        recordValue,
        recordFormatted,
        bestSeasonValue,
        bestSeasonFormatted,
    };
};

const buildTimelineStatsMap = (timeline?: PerformancePoint[]): Map<string, DisciplineStats> => {
    const stats = new Map<string, DisciplineStats>();
    if (!timeline || timeline.length === 0) return stats;

    const disciplines = Array.from(
        new Set(
            timeline
                .map((point) => point.discipline)
                .filter((name): name is string => Boolean(name && name.trim()))
        )
    );

    disciplines.forEach((discipline) => {
        const points = getDisciplineTimeline(timeline, discipline);
        if (points.length === 0) return;
        const meta = getDisciplineMetricMeta(discipline);
        const stat = buildDisciplineStats(discipline, points, meta);
        if (!stat) return;
        stats.set(normalizeDisciplineLabel(discipline), stat);
    });

    return stats;
};

export const buildPerformanceHighlights = (
    performances?: Performance[],
    timeline?: PerformancePoint[],
    limit: number = 3
): Performance[] => {
    const stats = buildTimelineStatsMap(timeline);
    const seen = new Set<string>();

    const merged = (performances || []).map((perf) => {
        const key = normalizeDisciplineLabel(perf.epreuve);
        seen.add(key);
        const stat = stats.get(key);
        if (!stat) return perf;
        return {
            ...perf,
            record: stat.recordFormatted,
            bestSeason: stat.bestSeasonFormatted || perf.bestSeason || stat.recordFormatted,
        };
    });

    const additions: Performance[] = [];
    stats.forEach((stat, key) => {
        if (seen.has(key)) return;
        additions.push({
            epreuve: stat.discipline,
            record: stat.recordFormatted,
            bestSeason: stat.bestSeasonFormatted || stat.recordFormatted,
        });
    });

    const combined = [...merged, ...additions];
    return limit > 0 ? combined.slice(0, limit) : combined;
};
