import React, { useCallback } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { useTrainingSession } from "../../hooks/useTrainingSession";

const formatDisplayDate = (value?: string) => {
    if (!value) return "Date non définie";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
        ? value
        : parsed.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
};

const formatStatusLabel = (status?: string) => {
    switch (status) {
        case "planned":
            return "Planifiée";
        case "done":
            return "Terminée";
        default:
            return status || "—";
    }
};

const formatDistanceDisplay = (distance?: number, unit?: string) => {
    if (!distance) return "—";
    const normalizedUnit = unit ? unit.toUpperCase() : "M";
    return `${distance}${normalizedUnit}`;
};

const formatRestDisplay = (interval?: number, unit?: string) => {
    if (!interval && interval !== 0) return "—";
    if (unit === "min") {
        return `${interval} min`;
    }
    const minutes = Math.floor((interval ?? 0) / 60);
    const seconds = (interval ?? 0) % 60;
    if (minutes === 0) {
        return `${seconds}s`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

const distanceToMeters = (distance?: number, unit?: string) => {
    if (!distance) return 0;
    if (unit === "km") return distance * 1000;
    return distance;
};

const formatVolumeLabel = (meters: number) => {
    if (meters >= 1000) {
        const kmValue = meters / 1000;
        return `${kmValue.toFixed(kmValue >= 10 ? 1 : 2)} km`;
    }
    return `${Math.round(meters)} m`;
};

export default function TrainingSessionDetailScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const sessionId = Array.isArray(params.id) ? params.id[0] : params.id || "";
    const { session, loading, error, refresh } = useTrainingSession(sessionId);

    const handleRefresh = useCallback(() => {
        refresh();
    }, [refresh]);

    if (loading && !session) {
        return (
            <View style={styles.stateContainer}>
                <ActivityIndicator color="#22d3ee" />
            </View>
        );
    }

    if (!session) {
        return (
            <View style={styles.stateContainer}>
                <Text style={styles.stateText}>{error || "Séance introuvable"}</Text>
                <Button onPress={handleRefresh} style={{ marginTop: 12 }} textColor="#f8fafc">
                    Réessayer
                </Button>
            </View>
        );
    }

    const formattedDate = formatDisplayDate(session.date);
    const statusLabel = formatStatusLabel(session.status);
    const series = session.series || [];
    const aggregates = series.reduce(
        (acc, serie) => {
            const repeatCount = serie.repeatCount ?? 1;
            const segments = serie.segments || [];
            acc.segments += segments.length;
            acc.seriesRepeats += repeatCount;
            if (serie.enablePace) {
                acc.paceEnabled += 1;
            }
            const serieVolume = segments.reduce((segmentSum, segment) => {
                const reps = segment.repetitions ?? 1;
                return segmentSum + distanceToMeters(segment.distance, segment.distanceUnit) * reps;
            }, 0);
            acc.volume += serieVolume * repeatCount;
            return acc;
        },
        { segments: 0, seriesRepeats: 0, volume: 0, paceEnabled: 0 }
    );

    const seriesCount = series.length;
    const volumeLabel = formatVolumeLabel(aggregates.volume);
    const restBetweenSeriesLabel = formatRestDisplay(session.seriesRestInterval, session.seriesRestUnit);
    const expressMetrics = [
        { label: "Séries", value: String(seriesCount || 0) },
        { label: "Volume", value: volumeLabel },
        { label: "Repos séries", value: restBetweenSeriesLabel },
    ];

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={loading}
                    onRefresh={handleRefresh}
                    tintColor="#22d3ee"
                    colors={["#22d3ee"]}
                />
            }
        >
            <View style={styles.heroCard}>
                <Text style={styles.heroOverline}>Séance enregistrée</Text>
                <Text style={styles.heroTitle}>{session.title}</Text>
                {session.description ? <Text style={styles.heroSubtitle}>{session.description}</Text> : null}
                <View style={styles.heroMetaRow}>
                    <View style={styles.metaChip}>
                        <Text style={styles.metaLabel}>Type</Text>
                        <Text style={styles.metaValue}>{session.type}</Text>
                    </View>
                    <View style={styles.metaChip}>
                        <Text style={styles.metaLabel}>Statut</Text>
                        <Text style={styles.metaValue}>{statusLabel}</Text>
                    </View>
                    <View style={styles.metaChip}>
                        <Text style={styles.metaLabel}>Date</Text>
                        <Text style={styles.metaValue}>{formattedDate}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.metricsCard}>
                <Text style={styles.sectionHeading}>Récap express</Text>
                <View style={styles.metricsGrid}>
                    {expressMetrics.map((metric) => (
                        <View key={metric.label} style={styles.metricItem}>
                            <Text style={styles.metricValue}>{metric.value}</Text>
                            <Text style={styles.metricLabel}>{metric.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {series.length ? (
                <View style={styles.blockCard}>
                    <View style={styles.blockHeader}>
                        <Text style={styles.sectionHeading}>Déroulement</Text>
                        <Text style={styles.blockHint}>{volumeLabel} prévus</Text>
                    </View>
                    <View style={styles.seriesList}>
                        {series.map((serie, index) => (
                            <View key={serie.id ?? index} style={styles.seriesCard}>
                                <View style={styles.seriesHeader}>
                                    <View>
                                        <Text style={styles.seriesBadge}>Série {index + 1}</Text>
                                        <Text style={styles.seriesTitle}>
                                            {(serie.segments || []).length || 1} bloc(s)
                                        </Text>
                                    </View>
                                    <View style={styles.seriesRepeatPill}>
                                        <Text style={styles.seriesRepeatValue}>×{serie.repeatCount ?? 1}</Text>
                                        <Text style={styles.seriesRepeatHint}>cycles</Text>
                                    </View>
                                </View>
                                {serie.enablePace ? (
                                    <View style={styles.paceRow}>
                                        <Text style={styles.paceChip}>Allure {serie.pacePercent ?? "—"}%</Text>
                                        {serie.paceReferenceDistance ? (
                                            <Text style={styles.paceChip}>Réf {serie.paceReferenceDistance}</Text>
                                        ) : null}
                                    </View>
                                ) : null}
                                <View style={styles.segmentList}>
                                    {(serie.segments || []).map((segment, segmentIndex) => (
                                        <View key={segment.id ?? segmentIndex} style={styles.segmentItem}>
                                            <View style={styles.segmentItemRow}>
                                                <Text style={styles.segmentBadge}>Bloc {segmentIndex + 1}</Text>
                                                {segment.repetitions ? (
                                                    <Text style={styles.segmentRepeat}>×{segment.repetitions}</Text>
                                                ) : null}
                                            </View>
                                            <Text style={styles.segmentDistance}>
                                                {formatDistanceDisplay(segment.distance, segment.distanceUnit)}
                                            </Text>
                                            <View style={styles.segmentMetaRow}>
                                                <Text style={styles.segmentMetaChip}>
                                                    Repos {formatRestDisplay(segment.restInterval, segment.restUnit)}
                                                </Text>
                                                {segment.targetPace ? (
                                                    <Text style={styles.segmentMetaChip}>Allure {segment.targetPace}</Text>
                                                ) : null}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            ) : null}

            {session.coachNotes ? (
                <View style={styles.noteCard}>
                    <Text style={styles.sectionHeading}>Notes coach</Text>
                    <Text style={styles.noteBody}>{session.coachNotes}</Text>
                </View>
            ) : null}

            {session.athleteFeedback ? (
                <View style={styles.noteCard}>
                    <Text style={styles.sectionHeading}>Feedback athlète</Text>
                    <Text style={styles.noteBody}>{session.athleteFeedback}</Text>
                </View>
            ) : null}

            <Button mode="outlined" onPress={handleRefresh} style={styles.refreshButton} textColor="#f8fafc">
                Actualiser
            </Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 28,
        paddingBottom: 120,
        flexGrow: 1,
        gap: 20,
    },
    heroCard: {
        borderRadius: 30,
        padding: 24,
        backgroundColor: "rgba(2,6,23,0.92)",
        borderWidth: 1,
        borderColor: "rgba(45,212,191,0.35)",
        shadowColor: "#0891b2",
        shadowOpacity: 0.35,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 20 },
        gap: 8,
    },
    heroOverline: {
        fontSize: 12,
        letterSpacing: 1.8,
        textTransform: "uppercase",
        color: "#67e8f9",
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: "700",
        color: "#f8fafc",
    },
    heroSubtitle: {
        color: "#cbd5e1",
        lineHeight: 20,
    },
    heroMetaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 12,
    },
    metaChip: {
        flexGrow: 1,
        minWidth: 140,
        backgroundColor: "rgba(15,23,42,0.75)",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        gap: 2,
    },
    metaLabel: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        color: "#94a3b8",
    },
    metaValue: {
        color: "#f8fafc",
        fontWeight: "600",
    },
    metricsCard: {
        borderRadius: 26,
        padding: 18,
        backgroundColor: "rgba(4,9,24,0.9)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 14,
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: "600",
        color: "#f8fafc",
    },
    metricsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    metricItem: {
        flexGrow: 1,
        minWidth: 130,
        padding: 14,
        borderRadius: 18,
        backgroundColor: "rgba(15,23,42,0.65)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        gap: 4,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: "700",
        color: "#22d3ee",
    },
    metricLabel: {
        color: "#94a3b8",
        fontSize: 13,
    },
    blockCard: {
        borderRadius: 26,
        padding: 18,
        backgroundColor: "rgba(2,6,23,0.85)",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.25)",
        gap: 16,
    },
    blockHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    blockHint: {
        color: "#94a3b8",
        fontSize: 13,
    },
    seriesList: {
        gap: 14,
    },
    seriesCard: {
        borderRadius: 20,
        padding: 14,
        backgroundColor: "rgba(3,7,18,0.7)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        gap: 10,
    },
    seriesHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    seriesBadge: {
        fontSize: 12,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        color: "#94a3b8",
    },
    seriesTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#f8fafc",
        marginTop: 2,
    },
    seriesRepeatPill: {
        backgroundColor: "rgba(14,165,233,0.15)",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "rgba(14,165,233,0.4)",
        alignItems: "center",
    },
    seriesRepeatValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#38bdf8",
    },
    seriesRepeatHint: {
        fontSize: 11,
        color: "#bae6fd",
    },
    paceRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    paceChip: {
        backgroundColor: "rgba(8,145,178,0.18)",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 6,
        color: "#67e8f9",
        fontWeight: "600",
    },
    segmentList: {
        gap: 12,
    },
    segmentItem: {
        padding: 12,
        borderRadius: 16,
        backgroundColor: "rgba(2,8,23,0.8)",
        borderWidth: 1,
        borderColor: "rgba(71,85,105,0.45)",
        gap: 8,
    },
    segmentItemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    segmentBadge: {
        fontSize: 12,
        color: "#94a3b8",
        letterSpacing: 0.5,
    },
    segmentRepeat: {
        color: "#fbbf24",
        fontWeight: "700",
    },
    segmentDistance: {
        fontSize: 18,
        fontWeight: "700",
        color: "#f8fafc",
    },
    segmentMetaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    segmentMetaChip: {
        backgroundColor: "rgba(15,23,42,0.8)",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
        color: "#cbd5f5",
        fontSize: 13,
    },
    noteCard: {
        borderRadius: 22,
        padding: 18,
        backgroundColor: "rgba(15,23,42,0.85)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 8,
    },
    noteBody: {
        color: "#e2e8f0",
        lineHeight: 20,
    },
    refreshButton: {
        alignSelf: "flex-start",
        borderColor: "rgba(148,163,184,0.4)",
    },
    stateContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
        gap: 12,
    },
    stateText: {
        color: "#f8fafc",
        textAlign: "center",
    },
});
