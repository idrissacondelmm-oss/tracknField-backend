export type TrainingType = "endurance" | "force" | "technique" | "récupération" | "vitesse";

export type TrainingStatus = "planned" | "done";

export type TrainingDistanceUnit = "m" | "km";
export type TrainingRestUnit = "s" | "min";
export type TrainingBlockType = "vitesse" | "cotes" | "ppg" | "start" | "recup" | "custom";
export type TrainingRecoveryType = "marche" | "footing" | "passive" | "active";
export type CustomBlockMetricKind = "distance" | "duration" | "reps" | "exo";

export interface TrainingSeriesSegment {
    id: string;
    distance: number;
    distanceUnit: TrainingDistanceUnit;
    restInterval: number;
    restUnit: TrainingRestUnit;
    blockName?: string;
    blockType?: TrainingBlockType;
    cotesMode?: "distance" | "duration";
    durationSeconds?: number;
    ppgExercises?: string[];
    ppgDurationSeconds?: number;
    ppgRestSeconds?: number;
    recoveryMode?: TrainingRecoveryType;
    recoveryDurationSeconds?: number;
    startCount?: number;
    startExitDistance?: number;
    repetitions?: number;
    targetPace?: string;
    recordReferenceDistance?: string;
    recordReferencePercent?: number;
    customGoal?: string;
    customMetricEnabled?: boolean;
    customMetricKind?: CustomBlockMetricKind;
    customMetricDistance?: number;
    customMetricDurationSeconds?: number;
    customMetricRepetitions?: number;
    customNotes?: string;
    customExercises?: string[];
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
    place?: string;
    description: string;
    series: TrainingSeries[];
    seriesRestInterval?: number;
    seriesRestUnit?: TrainingRestUnit;
    targetIntensity?: number;
    coachNotes?: string;
    athleteFeedback?: string;
    equipment?: string;
    status: TrainingStatus;
}

export type CreateTrainingSessionPayload = Omit<TrainingSession, "id" | "status"> & {
    status?: TrainingStatus;
    equipment?: string;
};
