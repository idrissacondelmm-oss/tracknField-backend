import { useEffect, useMemo, useState } from "react";
import { useTraining } from "../context/TrainingContext";
import { TrainingSession } from "../types/training";

export const useTrainingSessionsList = () => {
    const { sessions, fetchAllSessions } = useTraining();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const orderedSessions = useMemo(() => {
        const values = Object.values(sessions);
        return values.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sessions]);

    const load = async () => {
        try {
            setLoading(true);
            await fetchAllSessions();
            setError(null);
        } catch (err: any) {
            setError(err?.message || "Impossible de récupérer les séances");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!orderedSessions.length) {
            load();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        sessions: orderedSessions,
        loading,
        error,
        refresh: load,
    };
};
