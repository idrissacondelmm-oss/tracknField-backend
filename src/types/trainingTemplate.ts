import { TrainingRestUnit, TrainingSeries, TrainingType } from "./training";

export type TrainingTemplateVisibility = "private";

export interface TrainingTemplate {
    id: string;
    ownerId: string;
    title: string;
    type: TrainingType;
    description?: string;
    equipment?: string;
    targetIntensity?: number;
    series: TrainingSeries[];
    seriesRestInterval?: number;
    seriesRestUnit?: TrainingRestUnit;
    visibility?: TrainingTemplateVisibility;
    version: number;
    createdAt?: string;
    updatedAt?: string;
}

export type CreateTrainingTemplatePayload = Omit<
    TrainingTemplate,
    "id" | "ownerId" | "version" | "createdAt" | "updatedAt" | "visibility"
> & {
    visibility?: TrainingTemplateVisibility;
};

export type UpdateTrainingTemplatePayload = Partial<CreateTrainingTemplatePayload>;

export type CreateSessionFromTemplatePayload = {
    date: string | Date;
    startTime: string;
    durationMinutes: number;
    status?: "planned" | "ongoing" | "canceled" | "done" | "postponed";
    groupId?: string | null;
    place?: string;
    description?: string;
    coachNotes?: string;
};
