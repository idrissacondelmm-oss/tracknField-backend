import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createTrainingSession, getTrainingSession, listTrainingSessions } from "../api/trainingService";
import { CreateTrainingSessionPayload, TrainingSession } from "../types/training";

interface TrainingContextValue {
    sessions: Record<string, TrainingSession>;
    createSession: (payload: CreateTrainingSessionPayload) => Promise<TrainingSession>;
    fetchSession: (id: string) => Promise<TrainingSession>;
    getSessionFromCache: (id: string) => TrainingSession | undefined;
    fetchAllSessions: () => Promise<TrainingSession[]>;
}

const TrainingContext = createContext<TrainingContextValue | undefined>(undefined);

export const TrainingProvider = ({ children }: { children: React.ReactNode }) => {
    const [sessions, setSessions] = useState<Record<string, TrainingSession>>({});

    const mergeSession = useCallback((session: TrainingSession) => {
        setSessions((prev) => ({ ...prev, [session.id]: session }));
    }, []);

    const createSession = useCallback(
        async (payload: CreateTrainingSessionPayload) => {
            const created = await createTrainingSession(payload);
            mergeSession(created);
            return created;
        },
        [mergeSession]
    );

    const fetchSession = useCallback(
        async (id: string) => {
            const fetched = await getTrainingSession(id);
            mergeSession(fetched);
            return fetched;
        },
        [mergeSession]
    );

    const fetchAllSessions = useCallback(async () => {
        const fetched = await listTrainingSessions();
        setSessions((prev) => {
            const next = { ...prev };
            fetched.forEach((session) => {
                next[session.id] = session;
            });
            return next;
        });
        return fetched;
    }, []);

    const value = useMemo(
        () => ({
            sessions,
            createSession,
            fetchSession,
            getSessionFromCache: (id: string) => sessions[id],
            fetchAllSessions,
        }),
        [sessions, createSession, fetchSession, fetchAllSessions]
    );

    return <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>;
};

export const useTraining = () => {
    const ctx = useContext(TrainingContext);
    if (!ctx) {
        throw new Error("useTraining doit être utilisé dans un TrainingProvider");
    }
    return ctx;
};
