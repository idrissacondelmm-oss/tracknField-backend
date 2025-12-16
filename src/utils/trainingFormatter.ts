import {
    TrainingBlockType,
    TrainingDistanceUnit,
    TrainingSeriesSegment,
    TrainingSession,
} from "../types/training";

const formatDisplayDate = (value?: string) => {
    if (!value) return "Date inconnue";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
    });
};

const toMeters = (distance?: number, unit?: TrainingDistanceUnit) => {
    if (!distance || distance <= 0) {
        return 0;
    }
    return unit === "km" ? distance * 1000 : distance;
};

const resolveBlockType = (segment: TrainingSeriesSegment, fallback: TrainingBlockType = "vitesse") => {
    const type = segment.blockType as TrainingBlockType | undefined;
    const allowed: TrainingBlockType[] = ["vitesse", "cotes", "ppg", "start", "recup", "custom"];
    return type && allowed.includes(type) ? type : fallback;
};

export const getSegmentPlannedDistanceMeters = (
    segment: TrainingSeriesSegment,
    blockType?: TrainingBlockType
) => {
    const type = blockType ?? resolveBlockType(segment);
    if (type === "ppg" || type === "start" || type === "recup") {
        return 0;
    }
    if (type === "cotes" && segment.cotesMode === "duration") {
        return 0;
    }
    if (type === "custom") {
        if (segment.customMetricEnabled && segment.customMetricKind === "distance") {
            return toMeters(segment.customMetricDistance, segment.distanceUnit);
        }
        return 0;
    }
    return toMeters(segment.distance, segment.distanceUnit);
};

export const getSegmentPlannedRepetitions = (
    segment: TrainingSeriesSegment,
    blockType?: TrainingBlockType
) => {
    const type = blockType ?? resolveBlockType(segment);
    if (type === "custom" && segment.customMetricEnabled && segment.customMetricKind === "distance") {
        return segment.customMetricRepetitions ?? segment.repetitions ?? 1;
    }
    return segment.repetitions ?? 1;
};

export const formatSessionSummary = (session: TrainingSession) => {
    const series = session.series || [];
    // totalSeries = somme des repeatCount
    const totalSeries = series.reduce((sum, serie) => sum + (serie.repeatCount ?? 1), 0);
    // totalBlocs = somme des blocs (segments) de toutes les séries (sans repeatCount)
    const totalBlocs = series.reduce((sum, serie) => sum + (serie.segments?.length ?? 0), 0);
    const totalMeters = series.reduce((sum, serie) => {
        const repeat = serie.repeatCount ?? 1;
        const serieMeters = (serie.segments || []).reduce((serieSum, segment) => {
            const blockType = resolveBlockType(segment);
            const baseDistance = getSegmentPlannedDistanceMeters(segment, blockType);
            const reps = getSegmentPlannedRepetitions(segment, blockType);
            return serieSum + baseDistance * reps;
        }, 0);
        return sum + serieMeters * repeat;
    }, 0);

    const volumeLabel = totalMeters >= 1000 ? `${(totalMeters / 1000).toFixed(1)} km` : `${Math.round(totalMeters)} m`;

    return {
        date: formatDisplayDate(session.date),
        type: session.type,
        seriesLabel: `${totalSeries} séries / ${totalBlocs} blocs`,
        volumeLabel,
        place: session.place,
    };
};
