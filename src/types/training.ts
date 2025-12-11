export type TrainingType = "sprint" | "endurance" | "force" | "technique" | "récupération";

export type TrainingStatus = "planned" | "done";

export type TrainingDistanceUnit = "m" | "km";
export type TrainingRestUnit = "s" | "min";

export interface TrainingSeriesSegment {
    id: string;
    distance: number;
    distanceUnit: TrainingDistanceUnit;
    restInterval: number;
    restUnit: TrainingRestUnit;
    repetitions?: number;
    targetPace?: string;
    recordReferenceDistance?: string;
    recordReferencePercent?: number;
}

export interface TrainingSeries {
    id: string;
    repeatCount: number;
    segments: TrainingSeriesSegment[];
    enablePace?: boolean;
    pacePercent?: number;
    paceReferenceDistance?: "60m" | "100m" | "200m" | "400m";
}

export interface TrainingSession {
    id: string;
    athleteId: string;
    date: string; // ISO string
    type: TrainingType;
    title: string;
    description: string;
    series: TrainingSeries[];
    seriesRestInterval?: number;
    seriesRestUnit?: TrainingRestUnit;
    targetIntensity?: number;
    coachNotes?: string;
    athleteFeedback?: string;
    status: TrainingStatus;
}

export type CreateTrainingSessionPayload = Omit<TrainingSession, "id" | "status"> & {
    status?: TrainingStatus;
};
