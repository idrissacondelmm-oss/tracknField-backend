import { useCallback, useEffect, useState } from "react";
import { useTraining } from "../context/TrainingContext";
import { TrainingSession } from "../types/training";

export const useTrainingSession = (id?: string) => {
    const { sessions, getSessionFromCache, fetchSession } = useTraining();
    const hasId = Boolean(id);

    const [session, setSession] = useState<TrainingSession | undefined>(() => (id ? getSessionFromCache(id) : undefined));
    const [loading, setLoading] = useState(hasId && !session);
    const [error, setError] = useState<string | null>(hasId ? null : "Identifiant de séance manquant");

    const load = useCallback(async () => {
        if (!id) {
            setError("Identifiant de séance manquant");
            return;
        }

        try {
            setLoading(true);
            const fetched = await fetchSession(id);
            setSession(fetched);
            setError(null);
        } catch (err: any) {
            setError(err?.message || "Impossible de récupérer la séance");
        } finally {
            setLoading(false);
        }
    }, [fetchSession, id]);

    useEffect(() => {
        if (!id || session) {
            return;
        }
        load();
    }, [id, session, load]);

    useEffect(() => {
        if (!id) {
            return;
        }
        const cached = sessions[id];
        if (cached && cached !== session) {
            setSession(cached);
            setError(null);
        }
    }, [id, sessions, session]);

    return {
        session,
        loading: hasId ? loading : false,
        error,
        refresh: load,
    };
};
