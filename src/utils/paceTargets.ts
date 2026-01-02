import {
    PACE_REFERENCE_DISTANCE_VALUES,
    PACE_REFERENCE_LABELS,
    isDistanceReference,
    isLoadReference,
    LoadPaceReferenceValue,
    PaceReferenceValue,
} from "../constants/paceReferences";
import { TrainingDistanceUnit, TrainingSeries, TrainingSeriesSegment } from "../types/training";
import { Performance } from "../types/User";

export type PaceComputationProfile = {
    records?: Record<string, string | undefined>;
    performances?: Performance[];
    bodyWeightKg?: number;
    maxMuscuKg?: number;
    maxChariotKg?: number;
};

export type SegmentPacePreview = {
    mode: "time" | "load";
    value: string;
    detail: string;
    distanceLabel: string;
};

export type PacePreviewOptions = {
    distanceLabelFormatter?: (segment: TrainingSeriesSegment) => string | undefined;
    allowSeriesFallback?: boolean;
};

export const LOAD_REFERENCE_SERIES_FIELD_MAP: Record<LoadPaceReferenceValue, keyof TrainingSeries> = {
    bodyweight: "paceReferenceBodyWeightKg",
    "max-muscu": "paceReferenceMaxMuscuKg",
    "max-chariot": "paceReferenceMaxChariotKg",
};

export const LOAD_REFERENCE_PLACEHOLDER: Record<LoadPaceReferenceValue, string> = {
    bodyweight: "Poids (kg)",
    "max-muscu": "Charge max (kg)",
    "max-chariot": "Charge chariot max (kg)",
};

export const LOAD_REFERENCE_UNITS: Record<LoadPaceReferenceValue, string> = {
    bodyweight: "kg",
    "max-muscu": "kg",
    "max-chariot": "kg",
};

const toMeters = (distance?: number, unit?: TrainingDistanceUnit) => {
    if (!distance || distance <= 0) {
        return 0;
    }
    return unit === "km" ? distance * 1000 : distance;
};

const parseRecordTimeToSeconds = (value?: string) => {
    if (!value) return null;
    const normalizedValue = value
        .trim()
        .toLowerCase()
        // Normalize common French athletics formats:
        // - 10''23 (10.23s)
        // - 1'52''34 (1:52.34)
        // - 1'52"34 (1:52.34)
        .replace(/[’‘]/g, "'")
        .replace(/[“”″]/g, '"')
        .replace(/''/g, ".")
        .replace(/"/g, ".")
        .replace(/'/g, ":");

    const sanitized = normalizedValue.replace(/[^0-9:.,]/g, "");
    if (!sanitized) return null;

    const normalize = (part: string) => parseFloat(part.replace(/,/g, "."));

    if (sanitized.includes(":")) {
        const parts = sanitized.split(":").map(normalize);
        if (parts.some((part) => Number.isNaN(part))) return null;
        let seconds = 0;
        for (let i = 0; i < parts.length; i += 1) {
            const part = parts[parts.length - 1 - i];
            seconds += part * Math.pow(60, i);
        }
        return seconds;
    }

    const numericValue = normalize(sanitized);
    return Number.isFinite(numericValue) ? numericValue : null;
};

const formatSecondsDuration = (value: number) => {
    if (!Number.isFinite(value)) {
        return "—";
    }
    if (value >= 60) {
        const minutes = Math.floor(value / 60);
        const seconds = value - minutes * 60;
        const secondsLabel = seconds.toFixed(2).padStart(5, "0");
        return `${minutes}:${secondsLabel} s`;
    }
    return `${value.toFixed(2)} s`;
};

export const formatLoadValue = (value: number): string => {
    if (!Number.isFinite(value)) {
        return "0";
    }
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
};

const resolveRecordData = (
    reference: PaceReferenceValue,
    profile: PaceComputationProfile,
): { seconds: number; raw?: string } | null => {
    const recordValue =
        profile.records?.[reference] ??
        profile.performances?.find((perf) => perf.epreuve?.toLowerCase() === reference.toLowerCase())?.record;
    if (!recordValue) {
        return null;
    }
    const seconds = parseRecordTimeToSeconds(recordValue);
    if (!seconds || !Number.isFinite(seconds)) {
        return null;
    }
    return { seconds, raw: recordValue };
};

const resolveProfileLoad = (reference: LoadPaceReferenceValue, profile: PaceComputationProfile) => {
    switch (reference) {
        case "bodyweight":
            return profile.bodyWeightKg;
        case "max-muscu":
            return profile.maxMuscuKg;
        case "max-chariot":
            return profile.maxChariotKg;
        default:
            return undefined;
    }
};

const resolveSerieStoredLoad = (serie: TrainingSeries, reference: LoadPaceReferenceValue) => {
    const field = LOAD_REFERENCE_SERIES_FIELD_MAP[reference];
    return serie[field] as number | undefined;
};

const buildDistanceLabel = (
    segment: TrainingSeriesSegment,
    formatter?: (segment: TrainingSeriesSegment) => string | undefined,
    fallback?: string,
) => {
    if (formatter) {
        const custom = formatter(segment);
        if (custom) {
            return custom;
        }
    }
    if (segment.distance && segment.distance > 0) {
        const unit = segment.distanceUnit === "km" ? "km" : "m";
        if (unit === "km") {
            return `${segment.distance} km`;
        }
        return `${segment.distance} m`;
    }
    return fallback ?? "Bloc";
};

export const computeSegmentPacePreview = (
    serie: TrainingSeries,
    segment: TrainingSeriesSegment,
    profile: PaceComputationProfile,
    options?: PacePreviewOptions,
): SegmentPacePreview | null => {
    if (!serie.enablePace) {
        return null;
    }
    const percent = serie.pacePercent;
    const reference = serie.paceReferenceDistance;
    if (!percent || !reference) {
        return null;
    }

    if (isDistanceReference(reference)) {
        const recordData = resolveRecordData(reference, profile);
        if (!recordData) {
            return null;
        }
        const referenceMeters = PACE_REFERENCE_DISTANCE_VALUES[reference];
        const segmentMeters = toMeters(segment.distance, segment.distanceUnit);
        if (!referenceMeters || !segmentMeters) {
            return null;
        }
        const baseSpeed = referenceMeters / recordData.seconds;
        if (!Number.isFinite(baseSpeed) || baseSpeed <= 0) {
            return null;
        }
        const targetSpeed = baseSpeed * (percent / 100);
        if (!Number.isFinite(targetSpeed) || targetSpeed <= 0) {
            return null;
        }
        const targetSeconds = segmentMeters / targetSpeed;
        if (!Number.isFinite(targetSeconds) || targetSeconds <= 0) {
            return null;
        }
        const distanceLabel = buildDistanceLabel(segment, options?.distanceLabelFormatter, PACE_REFERENCE_LABELS[reference]);
        const recordLabel = recordData.raw ? ` (record ${recordData.raw})` : "";
        return {
            mode: "time",
            value: formatSecondsDuration(targetSeconds),
            detail: `À ${percent}% de votre ${PACE_REFERENCE_LABELS[reference].toLowerCase()}${recordLabel}`,
            distanceLabel,
        };
    }

    if (isLoadReference(reference)) {
        const profileLoad = resolveProfileLoad(reference, profile);
        const baseLoad =
            profileLoad != null && Number.isFinite(profileLoad)
                ? profileLoad
                : options?.allowSeriesFallback
                    ? resolveSerieStoredLoad(serie, reference)
                    : undefined;
        if (!baseLoad || baseLoad <= 0) {
            return null;
        }
        const targetLoad = baseLoad * (percent / 100);
        const unit = LOAD_REFERENCE_UNITS[reference];
        const distanceLabel = PACE_REFERENCE_LABELS[reference];
        return {
            mode: "load",
            value: `${formatLoadValue(targetLoad)} ${unit}`,
            detail: `À ${percent}% de votre ${distanceLabel.toLowerCase()} (${formatLoadValue(baseLoad)} ${unit})`,
            distanceLabel,
        };
    }

    return null;
};
