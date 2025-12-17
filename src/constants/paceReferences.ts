export const DISTANCE_PACE_REFERENCE_OPTIONS = ["60m", "100m", "200m", "400m"] as const;
export const LOAD_PACE_REFERENCE_OPTIONS = ["bodyweight", "max-muscu", "max-chariot"] as const;

export const PACE_REFERENCE_DISTANCE_OPTIONS = [
    ...DISTANCE_PACE_REFERENCE_OPTIONS,
    ...LOAD_PACE_REFERENCE_OPTIONS,
] as const;

export type DistancePaceReferenceValue = (typeof DISTANCE_PACE_REFERENCE_OPTIONS)[number];
export type LoadPaceReferenceValue = (typeof LOAD_PACE_REFERENCE_OPTIONS)[number];
export type PaceReferenceValue = (typeof PACE_REFERENCE_DISTANCE_OPTIONS)[number];

export const PACE_REFERENCE_LABELS: Record<PaceReferenceValue, string> = {
    "60m": "60 m",
    "100m": "100 m",
    "200m": "200 m",
    "400m": "400 m",
    "bodyweight": "Poids du corps",
    "max-muscu": "Max muscu",
    "max-chariot": "Max chariot",
};

export const PACE_REFERENCE_DISTANCE_VALUES: Record<DistancePaceReferenceValue, number> = {
    "60m": 60,
    "100m": 100,
    "200m": 200,
    "400m": 400,
};

export const isDistanceReference = (
    value: PaceReferenceValue
): value is DistancePaceReferenceValue => {
    switch (value) {
        case "60m":
        case "100m":
        case "200m":
        case "400m":
            return true;
        default:
            return false;
    }
};

export const isLoadReference = (value: PaceReferenceValue): value is LoadPaceReferenceValue => {
    switch (value) {
        case "bodyweight":
        case "max-muscu":
        case "max-chariot":
            return true;
        default:
            return false;
    }
};
