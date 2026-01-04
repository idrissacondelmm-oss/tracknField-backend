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

export const parseTimeToSeconds = (value?: string): number | null => {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;

    // Normalize common quote characters to simplify parsing.
    const normalized = raw
        .replace(/\u00A0/g, " ")
        .replace(/\u2032/g, "'")
        .replace(/\u2033/g, '"')
        .replace(/[’´`]/g, "'")
        .replace(/[″”“]/g, '"')
        .replace(/\s+/g, " ")
        .trim();

    // 1) h:mm:ss(.cc)
    if (normalized.includes(":")) {
        const parts = normalized
            .split(":")
            .map((p) => p.trim())
            .filter(Boolean);
        if (parts.length === 3) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            const seconds = parseFloat(parts[2].replace(",", ".").replace(/[^0-9.]/g, ""));
            if (![hours, minutes, seconds].every(Number.isFinite)) return null;
            return hours * 3600 + minutes * 60 + seconds;
        }
        if (parts.length === 2) {
            const minutes = parseInt(parts[0], 10);
            const seconds = parseFloat(parts[1].replace(",", ".").replace(/[^0-9.]/g, ""));
            if (![minutes, seconds].every(Number.isFinite)) return null;
            return minutes * 60 + seconds;
        }
    }

    // 2) m'ss''cc (French athletics style)
    // Examples: 1'48''0, 1'48''32, 1'48"32
    const minuteMatch = normalized.match(/^(\d+)\s*'\s*(\d{1,2})(?:\s*(?:''|"))?\s*(\d{1,2})?$/);
    if (minuteMatch) {
        const minutes = parseInt(minuteMatch[1], 10);
        const secondsWhole = parseInt(minuteMatch[2], 10);
        const centisRaw = minuteMatch[3];
        const centis = centisRaw ? parseInt(centisRaw, 10) : 0;
        if (![minutes, secondsWhole, centis].every(Number.isFinite)) return null;
        return minutes * 60 + secondsWhole + centis / 100;
    }

    // 3) ss''cc (French athletics style)
    // Examples: 10''58, 6"64
    const shortMatch = normalized.match(/^(\d+)\s*(?:''|")\s*(\d{1,2})$/);
    if (shortMatch) {
        const secondsWhole = parseInt(shortMatch[1], 10);
        const centis = parseInt(shortMatch[2], 10);
        if (![secondsWhole, centis].every(Number.isFinite)) return null;
        return secondsWhole + centis / 100;
    }

    // 4) Fallback: plain seconds (6.64, 6,64, 6.64s)
    const numeric = parseFloat(normalized.replace(",", ".").replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
};

const formatShortTimeFrench = (value: number) => {
    if (!Number.isFinite(value)) return "-";
    const rounded = Math.max(Math.round(value * 100) / 100, 0);
    let secondsWhole = Math.floor(rounded);
    let centis = Math.round((rounded - secondsWhole) * 100);
    if (centis >= 100) {
        secondsWhole += 1;
        centis = 0;
    }
    return `${secondsWhole}''${String(centis).padStart(2, "0")}`;
};

const formatLongTimeFrench = (value: number) => {
    if (!Number.isFinite(value)) return "-";
    const rounded = Math.max(Math.round(value * 100) / 100, 0);
    let minutes = Math.floor(rounded / 60);
    let remainder = Math.max(rounded - minutes * 60, 0);
    if (remainder >= 59.995) {
        minutes += 1;
        remainder = 0;
    }
    const secondsWhole = Math.floor(remainder);
    const centis = Math.round((remainder - secondsWhole) * 100);
    return `${minutes}'${String(secondsWhole).padStart(2, "0")}''${String(centis).padStart(2, "0")}`;
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
        const recordTime = parseTimeToSeconds(record);
        const seasonTime = parseTimeToSeconds(season);
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
    if (typeof value !== "string") return null;

    const trimmed = value.replace(/\u00A0/g, " ").trim();
    if (!trimmed) return null;

    // Many feeds store athletics times as strings like `6''70`, `1'48''0`, `1:48.0`.
    // parseFloat() would truncate at the first quote, losing hundredths.
    if (/[":]|''|'|s\b/i.test(trimmed)) {
        const parsedTime = parseTimeToSeconds(trimmed);
        if (parsedTime !== null) return parsedTime;
    }

    // Generic numeric fallback (also fixes points like "8 520 pts" -> 8520).
    const cleaned = trimmed
        .replace(/\s+/g, "")
        .replace(/,/g, ".")
        .replace(/[^0-9.\-]/g, "");
    const numeric = parseFloat(cleaned);
    return Number.isFinite(numeric) ? numeric : null;
};

export const getDisciplineTimeline = (
    timeline: PerformancePoint[] | undefined,
    discipline?: string
): DisciplineTimelinePoint[] => {
    if (!timeline || timeline.length === 0 || !discipline) {
        return [];
    }

    const normalizedDiscipline = discipline.trim().toLowerCase();
    const isDistance = isDistanceDiscipline(discipline);

    return timeline
        .filter((point) => point.discipline?.trim().toLowerCase() === normalizedDiscipline)
        .map((point) => {
            const shortDate = toShortISODate(point.date);
            const enriched = point as PerformancePoint & { rawPerformance?: unknown; performance?: unknown };
            const candidateValue =
                enriched.rawPerformance !== undefined && enriched.rawPerformance !== null
                    ? enriched.rawPerformance
                    : enriched.performance !== undefined && enriched.performance !== null
                        ? enriched.performance
                        : point.value;
            const rawValue = parseNumericValue(candidateValue as any);
            const numericValue = isDistance && rawValue !== null ? normalizeDistanceValue(rawValue) : rawValue;
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
const normalizeDisciplineLabel = (value: string) =>
    removeDiacritics(value.trim().toLowerCase())
        .replace(/[\s'\-]/g, "") // harmonise "100 m", "100m", "100-m"
        .replace(/[^a-z0-9]/g, ""); // retire la ponctuation résiduelle

const distanceDisciplineNames = new Set(
    [
        "saut en longueur",
        "saut en hauteur",
        "triple saut",
        "saut a la perche",
        "poids",
        "disque",
        "marteau",
        "javelot",
    ].map(normalizeDisciplineLabel)
);

const distanceKeywordFragments = [
    "saut",
    "lancer",
    "longueur",
    "hauteur",
    "javelot",
    "poids",
    "marteau",
    "disque",
];

const pointsKeywordFragments = [
    "points",
    "point",
    "pts",
    "triathlon",
    "tetrathlon",
    "quadrathlon",
    "hexathlon",
    "octathlon",
    "nonathlon",
    "athlon",
];

const isDistanceDiscipline = (discipline?: string) => {
    if (!discipline) return false;
    const normalized = normalizeDisciplineLabel(discipline);
    if (distanceDisciplineNames.has(normalized)) return true;
    return distanceKeywordFragments.some((fragment) => normalized.includes(fragment));
};

const isPointsDiscipline = (discipline?: string) => {
    if (!discipline) return false;
    const normalized = normalizeDisciplineLabel(discipline);
    if (pointsDisciplineNames.has(normalized)) return true;
    return pointsKeywordFragments.some((fragment) => normalized.includes(fragment));
};

const getSeasonStartDate = (ref: Date = new Date()) => {
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const seasonYear = month >= 8 ? year : year - 1; // saison démarre 1er sept
    return new Date(seasonYear, 8, 1);
};

const pointsDisciplineNames = new Set(["decathlon", "heptathlon", "pentathlon"]);

type ValueFormatVariant = "default" | "compact";

const formatSecondsValue = (value: number | undefined) => {
    if (value === undefined || value === null || !Number.isFinite(value)) return "-";
    // Apply minutes format for all chronos above 60 seconds (even if the discipline is classified as "time-short").
    if (value > 60) return formatLongTimeFrench(value);
    return formatShortTimeFrench(value);
};

const normalizeDistanceValue = (value: number) => {
    // Some feeds store centimeters (e.g., 153 for 1m53). Convert back to meters when clearly oversized.
    if (!Number.isFinite(value)) return value;
    if (value >= 100) {
        return value / 100;
    }
    return value;
};

const formatMetersValue = (value: number, variant: ValueFormatVariant = "default") => {
    const normalized = normalizeDistanceValue(value);
    const base = normalized.toFixed(2);
    return variant === "compact" ? `${base}m` : `${base} m`;
};

const formatPointsValue = (value: number, variant: ValueFormatVariant = "default") => {
    const rounded = Math.round(value);
    const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(rounded);
    return variant === "compact" ? `${formatted} pts` : `${formatted} pts`;
};

const formatMinutesSecondsValue = (value: number) => {
    return formatLongTimeFrench(value);
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
    formatValue: (value) => formatSecondsValue(value),
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

    if (isPointsDiscipline(discipline)) return pointsMeta;
    if (isDistanceDiscipline(discipline)) return distanceMeta;

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

const computeSeasonValue = (
    points: DisciplineTimelinePoint[],
    direction: DisciplineMetricMeta["direction"],
    seasonStart: Date
): number | undefined => {
    const seasonTs = seasonStart?.getTime?.();
    if (!Number.isFinite(seasonTs)) return undefined;

    const seasonPoints = points.filter((point) => Number.isFinite(point.timestamp) && point.timestamp >= (seasonTs as number));
    if (seasonPoints.length === 0) return undefined;

    return getExtrema(
        seasonPoints.map((point) => point.value),
        direction
    );
};

const buildDisciplineStats = (
    discipline: string,
    points: DisciplineTimelinePoint[],
    meta: DisciplineMetricMeta,
    seasonStart: Date
): DisciplineStats | null => {
    if (points.length === 0) return null;
    const values = points.map((point) => point.value);
    if (values.length === 0) return null;

    const recordValue = getExtrema(values, meta.direction);
    const recordFormatted = meta.formatValue(recordValue, "compact");

    const bestSeasonValue = computeSeasonValue(points, meta.direction, seasonStart);
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

const buildTimelineStatsMap = (timeline?: PerformancePoint[], seasonStart: Date = getSeasonStartDate(new Date())): Map<string, DisciplineStats> => {
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
        const stat = buildDisciplineStats(discipline, points, meta, seasonStart);
        if (!stat) return;
        stats.set(normalizeDisciplineLabel(discipline), stat);
    });

    return stats;
};

export const buildPerformanceHighlights = (
    performances?: Performance[],
    timeline?: PerformancePoint[],
    limit: number = 3,
    records?: Record<string, string>,
    _targetYear?: number
): Performance[] => {
    const stats = buildTimelineStatsMap(timeline, getSeasonStartDate(new Date()));
    const seen = new Set<string>();

    const findRecordValue = (disciplineKey: string): string | undefined => {
        if (!records) return undefined;
        for (const [k, v] of Object.entries(records)) {
            if (normalizeDisciplineLabel(k) === disciplineKey) return v as string;
        }
        return undefined;
    };

    const merged = (performances || []).map((perf) => {
        const key = normalizeDisciplineLabel(perf.epreuve);
        seen.add(key);
        const stat = stats.get(key);
        const recordFromMap = findRecordValue(key);
        const record = recordFromMap || perf.record || stat?.recordFormatted || "-";
        const bestSeason = stat?.bestSeasonFormatted;
        return {
            ...perf,
            record,
            bestSeason,
        } as Performance;
    });

    const additions: Performance[] = [];
    stats.forEach((stat, key) => {
        if (seen.has(key)) return;
        additions.push({
            epreuve: stat.discipline,
            record: findRecordValue(key) || stat.recordFormatted || "-",
            bestSeason: stat.bestSeasonFormatted,
        });
    });

    const combined = [...merged, ...additions];
    return limit > 0 ? combined.slice(0, limit) : combined;
};
