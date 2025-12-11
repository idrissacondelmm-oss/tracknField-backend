import { TrainingSession } from "../types/training";

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

export const formatSessionSummary = (session: TrainingSession) => {
    const series = session.series || [];
    const totalSeries = series.length;
    const totalSegments = series.reduce((count, serie) => count + (serie.segments?.length ?? 0), 0);
    const totalMeters = series.reduce((sum, serie) => {
        const repeat = serie.repeatCount ?? 1;
        const serieMeters = (serie.segments || []).reduce((serieSum, segment) => {
            const baseDistance = segment.distanceUnit === "km" ? (segment.distance ?? 0) * 1000 : segment.distance ?? 0;
            const reps = segment.repetitions ?? 1;
            return serieSum + baseDistance * reps;
        }, 0);
        return sum + serieMeters * repeat;
    }, 0);

    const volumeLabel = totalMeters >= 1000 ? `${(totalMeters / 1000).toFixed(1)} km` : `${Math.round(totalMeters)} m`;

    return {
        date: formatDisplayDate(session.date),
        type: session.type,
        seriesLabel: `${totalSeries} séries / ${totalSegments} segments`,
        volumeLabel,
    };
};
