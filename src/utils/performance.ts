import { PerformancePoint } from "../types/User";

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

const colorSteps = {
    elite: {
        solid: "#22c55e",
        gradient: ["#facc15", "#f97316"] as [string, string],
    },
    pro: {
        solid: "#0ea5e9",
        gradient: ["#34d399", "#15803d"] as [string, string],
    },
    regular: {
        solid: "#f97316",
        gradient: ["#60a5fa", "#2563eb"] as [string, string],
    },
    low: {
        solid: "#cbd5e1",
        gradient: ["#cbd5e1", "#94a3b8"] as [string, string],
    },
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
    if (progress >= 0.95) return colorSteps.elite.solid;
    if (progress >= 0.8) return colorSteps.pro.solid;
    if (progress >= 0.6) return colorSteps.regular.solid;
    return colorSteps.low.solid;
};

export const getPerformanceGradient = (progress: number) => {
    if (progress >= 0.95) return colorSteps.elite.gradient;
    if (progress >= 0.8) return colorSteps.pro.gradient;
    if (progress >= 0.6) return colorSteps.regular.gradient;
    return colorSteps.low.gradient;
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
