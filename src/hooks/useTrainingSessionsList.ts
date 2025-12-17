import { useCallback, useEffect, useMemo, useState } from "react";
import { useTraining } from "../context/TrainingContext";
import { TrainingSession } from "../types/training";

export type TrainingSessionScope = "owned" | "participating";

export const useTrainingSessionsList = (scope: TrainingSessionScope = "owned") => {
    const {
        sessions,
        fetchAllSessions,
        fetchParticipantSessions,
        ownedSessionIds,
        participatingSessionIds,
        ownedSessionsLoaded,
        participatingSessionsLoaded,
    } = useTraining();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const relevantIds = scope === "owned" ? ownedSessionIds : participatingSessionIds;

    const orderedSessions = useMemo(() => {
        const list: TrainingSession[] = [];
        relevantIds.forEach((id) => {
            const session = sessions[id];
            if (session) {
                list.push(session);
            }
        });
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [relevantIds, sessions]);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            if (scope === "owned") {
                await fetchAllSessions();
            } else {
                await fetchParticipantSessions();
            }
            setError(null);
        } catch (err: any) {
            setError(err?.message || "Impossible de récupérer les séances");
        } finally {
            setLoading(false);
        }
    }, [fetchAllSessions, fetchParticipantSessions, scope]);

    useEffect(() => {
        const alreadyLoaded = scope === "owned" ? ownedSessionsLoaded : participatingSessionsLoaded;
        if (!alreadyLoaded) {
            load();
        }
    }, [scope, ownedSessionsLoaded, participatingSessionsLoaded, load]);

    return {
        sessions: orderedSessions,
        loading,
        error,
        refresh: load,
    };
};
