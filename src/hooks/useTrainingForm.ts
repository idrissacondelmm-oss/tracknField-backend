import { useMemo, useState } from "react";
import {
    CreateTrainingSessionPayload,
    TrainingSeries,
    TrainingSeriesSegment,
    TrainingType,
} from "../types/training";

export const trainingTypeOptions: Array<{ label: string; value: TrainingType }> = [
    { label: "Sprint", value: "sprint" },
    { label: "Endurance", value: "endurance" },
    { label: "Force", value: "force" },
    { label: "Technique", value: "technique" },
    { label: "Récupération", value: "récupération" },
];

const createSeriesId = () => `serie-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
const createSegmentId = () => `segment-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`;

export const buildTrainingSeriesSegment = (overrides: Partial<TrainingSeriesSegment> = {}): TrainingSeriesSegment => ({
    id: createSegmentId(),
    distance: 200,
    distanceUnit: "m",
    restInterval: 90,
    restUnit: "s",
    repetitions: 4,
    targetPace: "",
    recordReferencePercent: 95,
    ...overrides,
});

export const buildTrainingSeriesBlock = (index = 0): TrainingSeries => ({
    id: createSeriesId(),
    repeatCount: 1,
    enablePace: false,
    pacePercent: 95,
    paceReferenceDistance: "100m",
    segments: [
        buildTrainingSeriesSegment(
            index === 0
                ? { distance: 200, repetitions: 4 }
                : { distance: 150, repetitions: 3, restInterval: 75 }
        ),
    ],
});

export const buildDefaultTrainingFormValues = (athleteId: string): CreateTrainingSessionPayload => ({
    athleteId,
    date: new Date().toISOString(),
    type: "sprint",
    title: "",
    description: "",
    series: [buildTrainingSeriesBlock()],
    seriesRestInterval: 120,
    seriesRestUnit: "s",
    targetIntensity: 5,
    coachNotes: "",
});

export const useTrainingForm = (athleteId: string) => {
    const [values, setValues] = useState<CreateTrainingSessionPayload>(() =>
        buildDefaultTrainingFormValues(athleteId)
    );

    const setField = <K extends keyof CreateTrainingSessionPayload>(key: K, value: CreateTrainingSessionPayload[K]) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const reset = () => {
        setValues(buildDefaultTrainingFormValues(athleteId));
    };

    const canSubmit = useMemo(() => {
        const hasBasics = Boolean(values.date && values.type && values.title.trim() && values.description.trim());
        const hasSeriesRest = (values.seriesRestInterval ?? 0) > 0;
        const hasSeries = values.series && values.series.length > 0;
        const seriesValid = hasSeries
            ? values.series.every((serie) => {
                if (serie.repeatCount < 1 || !serie.segments.length) {
                    return false;
                }
                return serie.segments.every((segment, _idx, segments) => {
                    const hasDistance = segment.distance > 0;
                    const hasRest = segment.restInterval > 0;
                    const requireReps = segments.length === 1;
                    const repsValid = requireReps ? (segment.repetitions ?? 0) > 0 : true;
                    return hasDistance && hasRest && repsValid;
                });
            })
            : false;
        return hasBasics && seriesValid && hasSeriesRest;
    }, [values]);

    return {
        values,
        setField,
        reset,
        canSubmit,
    };
};
