import { useCallback, useEffect, useState } from "react";
import { listTrainingTemplates } from "../api/trainingTemplateService";
import { TrainingTemplate } from "../types/trainingTemplate";

export const useTrainingTemplatesList = () => {
    const [templates, setTemplates] = useState<TrainingTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const data = await listTrainingTemplates();
            setTemplates(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || "Impossible de récupérer les templates");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { templates, loading, error, refresh };
};
