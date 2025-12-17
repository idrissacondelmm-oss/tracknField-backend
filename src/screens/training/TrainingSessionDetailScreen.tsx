import React, { useCallback, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

import { PACE_REFERENCE_LABELS } from "../../constants/paceReferences";
import { useTrainingSession } from "../../hooks/useTrainingSession";
import { useTraining } from "../../context/TrainingContext";
import { TrainingBlockType, TrainingSeries, TrainingSeriesSegment } from "../../types/training";
import {
    getSegmentPlannedDistanceMeters,
    getSegmentPlannedRepetitions,
} from "../../utils/trainingFormatter";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
    // Toujours afficher l'unité en 'm' minuscule
    return `${distance}m`;
};

const formatReferenceLabel = (value?: TrainingSeries["paceReferenceDistance"]) => {
    if (!value) return null;
    return PACE_REFERENCE_LABELS[value] ?? value;
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

const formatVolumeLabel = (meters: number) => {
    if (meters >= 1000) {
        const kmValue = meters / 1000;
        return `${kmValue.toFixed(kmValue >= 10 ? 1 : 2)} km`;
    }
    return `${Math.round(meters)} m`;
};

const BLOCK_TYPE_LABELS: Record<TrainingBlockType, string> = {
    vitesse: "Vitesse",
    cotes: "Côtes",
    ppg: "PPG",
    start: "Starting Block",
    recup: "Récupération",
    custom: "Bloc personnalisé",
};

const NON_DISTANCE_BLOCK_TYPES: TrainingBlockType[] = ["ppg", "start", "recup"];

const isDistanceDrivenSegment = (segment: TrainingSeriesSegment, blockType: TrainingBlockType) => {
    if (blockType === "cotes" && segment.cotesMode === "duration") {
        return false;
    }
    return !NON_DISTANCE_BLOCK_TYPES.includes(blockType);
};

const resolveBlockType = (segment?: TrainingSeriesSegment): TrainingBlockType => {
    if (!segment || !segment.blockType) {
        return "vitesse";
    }
    const type = segment.blockType as TrainingBlockType;
    return BLOCK_TYPE_LABELS[type] ? type : "vitesse";
};

const getSegmentBlockLabel = (segment: TrainingSeriesSegment): string => {
    const type = resolveBlockType(segment);
    return segment.blockName?.trim() || BLOCK_TYPE_LABELS[type] || BLOCK_TYPE_LABELS.vitesse;
};

const formatCustomMetricChip = (segment: TrainingSeriesSegment): string | null => {
    if (!segment.customMetricEnabled) {
        return null;
    }
    if (segment.customMetricKind === "duration") {
        return `Repère durée ${formatRestDisplay(segment.customMetricDurationSeconds, "s")}`;
    }
    if (segment.customMetricKind === "exo") {
        const exercises = Array.isArray(segment.customExercises)
            ? segment.customExercises.filter((exercise) => Boolean(exercise && exercise.trim()))
            : [];
        const count = exercises.length;
        if (!count) {
            return "Repère exercices";
        }
        const suffix = count > 1 ? "s" : "";
        return `${count} exercice${suffix}`;
    }
    if (segment.customMetricKind === "reps") {
        const reps = segment.customMetricRepetitions ?? 0;
        if (!reps) {
            return "Objectif répétitions";
        }
        return `Objectif ${reps} rép`;
    }
    return `Repère distance ${formatDistanceDisplay(segment.customMetricDistance, segment.distanceUnit)}`;
};

const formatOptionalRepetitions = (value?: number) => {
    if (!value) {
        return null;
    }
    const suffix = value > 1 ? "s" : "";
    return `${value} répétition${suffix}`;
};

export default function TrainingSessionDetailScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const sessionId = Array.isArray(params.id) ? params.id[0] : params.id || "";
    const router = useRouter();
    const { session, loading, error, refresh } = useTrainingSession(sessionId);
    const { deleteSession: deleteSessionFromContext } = useTraining();
    const [deleteLoading, setDeleteLoading] = useState(false);
    const insets = useSafeAreaInsets();

    const handleRefresh = useCallback(() => {
        refresh();
    }, [refresh]);

    const performDeleteSession = useCallback(async () => {
        if (!sessionId) {
            return;
        }
        try {
            setDeleteLoading(true);
            await deleteSessionFromContext(sessionId);
            Alert.alert("Séance supprimée", "La séance a été supprimée.");
            router.back();
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || "Impossible de supprimer la séance";
            Alert.alert("Erreur", message);
        } finally {
            setDeleteLoading(false);
        }
    }, [deleteSessionFromContext, router, sessionId]);

    const confirmDeleteSession = useCallback(() => {
        if (!sessionId) {
            return;
        }
        Alert.alert("Supprimer la séance", "Cette action est définitive.", [
            { text: "Annuler", style: "cancel" },
            { text: "Supprimer", style: "destructive", onPress: () => performDeleteSession() },
        ]);
    }, [performDeleteSession, sessionId]);

    const handleEditSession = useCallback(() => {
        if (!sessionId) {
            return;
        }
        router.push({ pathname: "/(main)/training/edit/[id]", params: { id: sessionId } });
    }, [router, sessionId]);

    if (loading && !session) {
        return (
            <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
                <View style={styles.stateContainer}>
                    <ActivityIndicator color="#22d3ee" />
                </View>
            </SafeAreaView>
        );
    }

    if (!session) {
        return (
            <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
                <View style={styles.stateContainer}>
                    <Text style={styles.stateText}>{error || "Séance introuvable"}</Text>
                    <Button onPress={handleRefresh} style={{ marginTop: 12 }} textColor="#f8fafc">
                        Réessayer
                    </Button>
                </View>
            </SafeAreaView>
        );
    }

    const formattedDate = formatDisplayDate(session.date);
    const statusLabel = formatStatusLabel(session.status);
    const series = session.series || [];
    const aggregate = series.reduce(
        (acc, serie) => {
            const repeatCount = serie.repeatCount ?? 1;
            const segments = serie.segments || [];
            acc.segments += segments.length;
            acc.seriesRepeats += repeatCount;
            if (serie.enablePace) {
                acc.paceEnabled += 1;
            }
            const serieVolume = segments.reduce((segmentSum, segment) => {
                const blockType = resolveBlockType(segment);
                const reps = getSegmentPlannedRepetitions(segment, blockType);
                const segmentMeters = getSegmentPlannedDistanceMeters(segment, blockType);
                return segmentSum + segmentMeters * reps;
            }, 0);
            acc.volume += serieVolume * repeatCount;
            return acc;
        },
        { segments: 0, seriesRepeats: 0, volume: 0, paceEnabled: 0 }
    );

    const seriesCount = series.length;
    const totalSeriesExecutions = aggregate.seriesRepeats || 0;
    const seriesMetricValue =
        seriesCount > 0 && totalSeriesExecutions !== seriesCount
            ? `${totalSeriesExecutions}`
            : String(totalSeriesExecutions || 0);
    // Vérifie s'il existe au moins un segment avec une distance > 0
    const hasDistanceInAnySegment = series.some(serie =>
        (serie.segments || []).some(segment => {
            const blockType = resolveBlockType(segment);
            const meters = getSegmentPlannedDistanceMeters(segment, blockType);
            return typeof meters === "number" && meters > 0;
        })
    );
    const hasVolumePlanned = aggregate.volume > 0 && hasDistanceInAnySegment;
    const expressMetrics: { label: string; value: string }[] = [
        { label: "Séries", value: seriesMetricValue },
        { label: "Blocs", value: String(aggregate.segments) },
    ];
    if (hasVolumePlanned) {
        expressMetrics.push({ label: "Volume", value: formatVolumeLabel(aggregate.volume) });
    }

    // Affiche le repos entre séries dans le récap express si au moins 2 séries (en tenant compte des répétitions)
    const restBetweenSeriesLabel = typeof session.seriesRestInterval === "number"
        ? formatRestDisplay(session.seriesRestInterval, session.seriesRestUnit)
        : "—";
    if (totalSeriesExecutions >= 2) {
        expressMetrics.push({ label: "Repos séries", value: restBetweenSeriesLabel });
    }

    const renderStandardSegmentDetails = (segment: TrainingSeriesSegment, blockType: TrainingBlockType) => {
        const chips: string[] = [];
        let chipsToShow: string[] = [];
        let extraExercises: string[] = [];
        if (blockType === "ppg") {
            // Exercices d'abord
            extraExercises = Array.isArray(segment.ppgExercises)
                ? segment.ppgExercises.filter((exercise): exercise is string => Boolean(exercise && exercise.trim()))
                : [];
            // Durée
            if (segment.ppgDurationSeconds) {
                chipsToShow.push(`Durée: ${formatRestDisplay(segment.ppgDurationSeconds, "s")}`);
            }
            // Récup
            chipsToShow.push(`Récup: ${formatRestDisplay(segment.ppgRestSeconds, "s")}`);
        } else if (blockType === "start") {
            // Sortie d'abord (avec bulle)
            if (typeof segment.startExitDistance === "number") {
                chipsToShow.push(`Sortie sur ${formatDistanceDisplay(segment.startExitDistance, segment.distanceUnit)}`);
            }
            // Puis récup (avec bulle)
            chipsToShow.push(`Récup: ${formatRestDisplay(segment.restInterval, segment.restUnit)}`);
            if (segment.targetPace) {
                chipsToShow.push(`Allure ${segment.targetPace}`);
            }
        } else if (blockType === "recup") {
            // Affichage spécifique pour le bloc récup : mode, durée, récup rep
            if (segment.recoveryMode) {
                chipsToShow.push(`Mode de récup : ${segment.recoveryMode}`);
            }
            if (segment.recoveryDurationSeconds) {
                chipsToShow.push(`Durée: ${formatRestDisplay(segment.recoveryDurationSeconds, "s")}`);
            }
            chipsToShow.push(`Récup rep: ${formatRestDisplay(segment.restInterval, segment.restUnit)}`);
        } else {
            chipsToShow.push(`Récup: ${formatRestDisplay(segment.restInterval, segment.restUnit)}`);
            if (segment.targetPace) {
                chipsToShow.push(`Allure ${segment.targetPace}`);
            }
        }

        const isDistanceDriven = isDistanceDrivenSegment(segment, blockType);
        const showDistance = isDistanceDriven && typeof segment.distance === "number" && segment.distance > 0;
        const showDurationForCotes = blockType === "cotes" && segment.cotesMode === "duration";
        const formattedDuration = showDurationForCotes ? formatRestDisplay(segment.durationSeconds, "s") : null;
        const durationLabelPrefix = showDurationForCotes ? "Durée" : null;

        return (
            <>
                {showDurationForCotes ? (
                    <Text style={styles.segmentDistance}>
                        {durationLabelPrefix} {formattedDuration ?? "—"}
                    </Text>
                ) : showDistance ? (
                    <Text style={styles.segmentDistance}>
                        {formatDistanceDisplay(segment.distance, segment.distanceUnit)}
                    </Text>
                ) : null}
                <View style={styles.segmentMetaRow}>
                    {chipsToShow.map((chip, idx) => (
                        <View key={`${segment.id}-chip-${idx}`} style={styles.segmentMetaChip}>
                            <Text style={styles.segmentMetaChipText}>{chip}</Text>
                        </View>
                    ))}
                </View>
                {blockType === "ppg" && extraExercises.length ? (
                    <View style={styles.segmentMetaChip}>
                        <Text style={styles.segmentMetaChipText}>exo: {extraExercises.join(", ")}</Text>
                    </View>
                ) : null}
            </>
        );
    };

    const renderCustomSegmentDetails = (segment: TrainingSeriesSegment) => {
        const chips: string[] = [];
        const primaryChip = formatCustomMetricChip(segment);
        if (primaryChip) {
            chips.push(primaryChip);
        }
        const optionalReps = formatOptionalRepetitions(segment.customMetricRepetitions);
        const isExerciseMetric = segment.customMetricKind === "exo";
        if (isExerciseMetric && segment.customMetricRepetitions) {
            const tours = segment.customMetricRepetitions;
            const suffix = tours > 1 ? "s" : "";
            chips.push(`${tours} tour${suffix}`);
        } else if (optionalReps) {
            chips.push(optionalReps);
        }
        if (isExerciseMetric && segment.customMetricDurationSeconds) {
            chips.push(`Durée ${formatRestDisplay(segment.customMetricDurationSeconds, "s")}`);
        }
        chips.push(`Repos ${formatRestDisplay(segment.restInterval, segment.restUnit)}`);

        const goalText = segment.customGoal?.trim() || "Objectif libre";
        const notes = segment.customNotes?.trim();
        const exercises =
            isExerciseMetric && Array.isArray(segment.customExercises)
                ? segment.customExercises.filter((exercise) => Boolean(exercise && exercise.trim()))
                : [];

        return (
            <>
                <Text style={segment.customGoal ? styles.segmentGoal : styles.segmentGoalMuted}>{goalText}</Text>
                <View style={styles.segmentMetaRow}>
                    {chips.map((chip, idx) => (
                        <View key={`${segment.id}-custom-chip-${idx}`} style={styles.segmentMetaChip}>
                            <Text style={styles.segmentMetaChipText}>{chip}</Text>
                        </View>
                    ))}
                </View>
                {exercises.length ? (
                    <View style={styles.segmentExtraList}>
                        {exercises.map((exercise, idx) => (
                            <View key={`${segment.id}-custom-exercise-${idx}`} style={styles.segmentExtraChip}>
                                <Text style={styles.segmentExtraChipText}>{exercise}</Text>
                            </View>
                        ))}
                    </View>
                ) : null}
                {notes ? <Text style={styles.segmentNote}>{notes}</Text> : null}
            </>
        );
    };


    const navClearance = 68 + Math.max(insets.bottom, 10);
    const contentPaddingBottom = navClearance + 24;
    const footerPaddingBottom = Math.max(insets.bottom + 10, 18);

    return (
        <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
            <ScrollView
                contentContainerStyle={[styles.container, { paddingBottom: contentPaddingBottom }]}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={handleRefresh}
                        tintColor="#22d3ee"
                        colors={["#22d3ee"]}
                    />
                }
            >
                {/* HERO CARD */}
                <View style={[styles.heroCard, { borderColor: '#38bdf8', shadowColor: '#38bdf8' }]}>
                    <View style={styles.heroHeaderRow}>
                        {/* Date à gauche, Type à droite */}
                        <View style={{ flex: 1 }}>
                            <View style={styles.heroHeaderItemRow}>
                                <MaterialCommunityIcons name="calendar-range" size={14} color="#22d3ee" style={{ marginRight: 3 }} />
                                <Text style={styles.heroHeaderDate}>{formattedDate}</Text>
                            </View>
                            <View style={styles.heroHeaderItemRow}>
                                <MaterialCommunityIcons name="map-marker" size={13} color="#e01010ff" style={{ marginRight: 3 }} />
                                <Text style={styles.heroHeaderPlace}>{session.place?.trim() || "—"}</Text>
                            </View>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <View style={styles.heroHeaderItemRow}>
                                <MaterialCommunityIcons name="run-fast" size={14} color="#38bdf8" style={{ marginRight: 3 }} />
                                <Text style={styles.heroHeaderType}>{session.type}</Text>
                            </View>
                            <View style={styles.heroHeaderItemRow}>
                                <MaterialCommunityIcons name={session.status === 'done' ? 'check-circle-outline' : 'clock-outline'} size={13} color={session.status === 'done' ? '#10b981' : '#facc15'} style={{ marginRight: 3 }} />
                                <Text style={styles.heroHeaderStatus}>{statusLabel}</Text>
                            </View>
                        </View>
                    </View>
                    <Text style={styles.heroTitle}>{session.title}</Text>
                    {session.description ? <Text style={styles.heroSubtitle}>{session.description}</Text> : null}
                    {/* Affichage des équipements supprimé */}
                </View>

                {/* METRICS CARD */}
                <View style={[styles.metricsCard, { borderColor: '#818cf8' }]}>
                    <Text style={styles.sectionHeading}>Récap express de la séance</Text>
                    <View style={styles.metricsGrid}>
                        {expressMetrics.map((metric, idx) => (
                            <View key={metric.label} style={[styles.metricItem, { backgroundColor: idx === 1 ? 'rgba(250,204,21,0.08)' : 'rgba(56,189,248,0.08)' }]}>
                                <Text style={[styles.metricValue, idx === 1 && { color: '#facc15' }]}>{metric.value}</Text>
                                <Text style={styles.metricLabel}>{metric.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* SÉRIES ET BLOCS */}
                {series.length ? (
                    <View style={[styles.blockCard, { borderColor: '#38bdf8' }]}>
                        <View style={styles.blockHeader}>
                            <Text style={styles.sectionHeading}>Déroulement de la séance</Text>
                            {/* Suppression de l'affichage du volume */}
                        </View>
                        {/* Suppression de l'affichage du repos entre séries */}
                        <View style={styles.seriesList}>
                            {series.map((serie, index) => {
                                const referenceLabel = formatReferenceLabel(serie.paceReferenceDistance);
                                return (
                                    <View key={serie.id ?? index} style={[styles.seriesCard, { borderColor: '#818cf8' }]}>
                                        <View style={styles.seriesHeader}>
                                            <View>
                                                <Text style={styles.seriesBadge}>Série {index + 1}</Text>
                                                <Text style={styles.seriesTitle}>
                                                    {(serie.segments || []).length || 1} {((serie.segments || []).length || 1) === 1 ? 'bloc' : 'blocs'}
                                                </Text>
                                            </View>
                                            <View style={[styles.seriesRepeatPill, { backgroundColor: 'rgba(56,189,248,0.10)', borderColor: '#38bdf8' }]}>
                                                <Text style={styles.seriesRepeatValue}>×{serie.repeatCount ?? 1} fois</Text>
                                            </View>
                                        </View>
                                        {serie.enablePace ? (
                                            <View style={styles.paceRow}>
                                                <View style={styles.paceChip}>
                                                    <Text style={styles.paceChipText}>Allure {serie.pacePercent ?? "—"}%</Text>
                                                </View>
                                                {referenceLabel ? (
                                                    <View style={styles.paceChip}>
                                                        <Text style={styles.paceChipText}>Réf {referenceLabel}</Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                        ) : null}
                                        <View style={styles.segmentList}>
                                            {(serie.segments || []).map((segment, segmentIndex) => {
                                                const blockType = resolveBlockType(segment);
                                                const blockLabel = getSegmentBlockLabel(segment);
                                                const isCustom = blockType === "custom";
                                                const repetitionLabel = (() => {
                                                    if (blockType === "start" && typeof segment.startCount === "number") {
                                                        const suffix = segment.startCount > 1 ? "s" : "";
                                                        return `${segment.startCount} départ${suffix}`;
                                                    }
                                                    if (segment.repetitions) {
                                                        return `×${segment.repetitions} fois`;
                                                    }
                                                    return null;
                                                })();
                                                return (
                                                    <View key={segment.id ?? segmentIndex} style={[styles.segmentItem, { borderColor: '#334155' }]}>
                                                        <View style={styles.segmentItemRow}>
                                                            <Text style={styles.segmentBadge}>
                                                                Bloc {segmentIndex + 1}: {blockLabel}
                                                            </Text>
                                                            {repetitionLabel ? (
                                                                <Text style={styles.segmentRepeat}>{repetitionLabel}</Text>
                                                            ) : null}
                                                        </View>
                                                        {isCustom
                                                            ? renderCustomSegmentDetails(segment)
                                                            : renderStandardSegmentDetails(segment, blockType)}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ) : null}

                {/* NOTES */}
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

                {/* ACTIONS */}
                <View style={[styles.footerActions, { paddingBottom: footerPaddingBottom }]}>
                    <Button
                        mode="contained"
                        onPress={handleEditSession}
                        style={styles.footerButton}
                        buttonColor="#38bdf8"
                        textColor="#02111f"
                        icon="pencil"
                    >
                        Modifier la séance
                    </Button>
                    <Button
                        mode="contained"
                        onPress={confirmDeleteSession}
                        style={[styles.deleteButton, styles.footerButton]}
                        buttonColor="#ef4444"
                        textColor="#fff"
                        icon="delete-outline"
                        loading={deleteLoading}
                        disabled={deleteLoading}
                    >
                        Supprimer la séance
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    equipmentListRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginLeft: 8,
    },
    equipmentChip: {
        backgroundColor: 'rgba(250,204,21,0.10)',
        borderColor: '#facc15',
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
        color: '#facc15',
        fontSize: 12,
        marginBottom: 4,
    },
    heroHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
        gap: 8,
    },
    heroHeaderItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginBottom: 1,
    },
    heroHeaderDate: {
        color: '#22d3ee',
        fontSize: 11,
        fontWeight: '600',
    },
    heroHeaderPlace: {
        color: '#e6e6e3ff',
        fontSize: 10,
        fontWeight: '500',
    },
    heroHeaderType: {
        color: '#38bdf8',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'right',
    },
    heroHeaderStatus: {
        color: '#10b981',
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'right',
    },
    safeArea: {
        flex: 1,
        backgroundColor: "#010617",
    },
    container: {
        paddingHorizontal: 20,
        paddingVertical: 28,
        flexGrow: 1,
        gap: 20,
        backgroundColor: "#010617",
    },
    heroCard: {
        borderRadius: 18,
        padding: 12,
        backgroundColor: "rgba(2,6,23,0.92)",
        borderWidth: 1,
        borderColor: "rgba(45,212,191,0.35)",
        shadowColor: "#0891b2",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        gap: 4,
    },
    heroOverline: {
        fontSize: 10,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: "#67e8f9",
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#f8fafc",
    },
    heroSubtitle: {
        color: "#cbd5e1",
        lineHeight: 16,
        fontSize: 12,
    },
    heroMetaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "flex-start",
        gap: 6,
        marginTop: 6,

    },
    metaChip: {
        flexGrow: 1,
        minWidth: 90,
        backgroundColor: "rgba(15,23,42,0.75)",
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        gap: 1,
    },
    metaLabel: {
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "#94a3b8",
    },
    metaValue: {
        color: "#f8fafc",
        fontWeight: "600",
        fontSize: 12,
    },
    metricsCard: {
        borderRadius: 14,
        padding: 8,
        backgroundColor: "rgba(4,9,24,0.9)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 7,
    },
    sectionHeading: {
        fontSize: 13,
        fontWeight: "600",
        color: "#f8fafc",
    },
    metricsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    metricItem: {
        flexGrow: 1,
        minWidth: 70,
        padding: 6,
        borderRadius: 8,
        backgroundColor: "rgba(15,23,42,0.65)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        gap: 2,
    },
    metricValue: {
        fontSize: 14,
        fontWeight: "700",
        color: "#22d3ee",
    },
    metricLabel: {
        color: "#94a3b8",
        fontSize: 10,
    },
    blockCard: {
        borderRadius: 14,
        padding: 8,
        backgroundColor: "rgba(2,6,23,0.85)",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.25)",
        gap: 7,
    },
    blockHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 2,
    },
    blockHint: {
        color: "#94a3b8",
        fontSize: 10,
    },
    seriesList: {
        gap: 6,
    },
    seriesCard: {
        borderRadius: 10,
        padding: 6,
        backgroundColor: "rgba(3,7,18,0.7)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        gap: 4,
    },
    seriesHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    seriesBadge: {
        fontSize: 9,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        color: "#94a3b8",
    },
    seriesTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: "#f8fafc",
        marginTop: 1,
    },
    seriesRepeatPill: {
        backgroundColor: "rgba(14,165,233,0.15)",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: "rgba(14,165,233,0.4)",
        alignItems: "center",
    },
    seriesRepeatValue: {
        fontSize: 11,
        fontWeight: "700",
        color: "#38bdf8",
    },
    seriesRepeatHint: {
        fontSize: 9,
        color: "#bae6fd",
    },
    paceRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "flex-start",
        marginTop: 6,
    },
    paceChip: {
        backgroundColor: "rgba(8,145,178,0.18)",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginRight: 6,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: "rgba(8,145,178,0.35)",
    },
    paceChipText: {
        color: "#67e8f9",
        fontWeight: "600",
        fontSize: 11,
    },
    segmentList: {
        gap: 4,
    },
    segmentItem: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: "rgba(2,8,23,0.8)",
        borderWidth: 1,
        borderColor: "rgba(71,85,105,0.45)",
        gap: 3,
    },
    segmentItemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    segmentBadge: {
        fontSize: 9,
        color: "#94a3b8",
        letterSpacing: 0.3,
    },
    segmentRepeat: {
        color: "#fbbf24",
        fontWeight: "700",
        fontSize: 11,
    },
    segmentTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    segmentTitle: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.45)",
        backgroundColor: "rgba(34,211,238,0.15)",
        color: "#67e8f9",
        fontSize: 10,
        fontWeight: "600",
    },
    segmentTypeChip: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.45)",
        backgroundColor: "rgba(34,211,238,0.15)",
        color: "#67e8f9",
        fontSize: 10,
        fontWeight: "600",
    },
    segmentDistance: {
        fontSize: 13,
        fontWeight: "700",
        color: "#f8fafc",
    },
    segmentMetaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    segmentMetaChip: {
        backgroundColor: "rgba(34,197,94,0.15)",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(34,197,94,0.4)",
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 6,
        marginBottom: 6,
    },
    segmentMetaChipText: {
        color: "#dcfce7",
        fontSize: 11,
        fontWeight: "600",
    },
    segmentGoal: {
        fontSize: 11,
        fontWeight: "600",
        color: "#bed0e2ff",
    },
    segmentGoalMuted: {
        fontSize: 11,
        fontWeight: "500",
        color: "#cbd5f5",
    },
    segmentNote: {
        color: "#94a3b8",
        lineHeight: 14,
        fontSize: 10,
    },
    segmentExtraList: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    segmentExtraChip: {
        backgroundColor: "rgba(15,23,42,0.7)",
        borderRadius: 999,
        paddingHorizontal: 7,
        paddingVertical: 2,
        marginRight: 6,
        marginBottom: 6,
    },
    segmentExtraChipText: {
        color: "#e2e8f0",
        fontSize: 10,
        fontWeight: "600",
    },
    noteCard: {
        borderRadius: 12,
        padding: 8,
        backgroundColor: "rgba(15,23,42,0.85)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 3,
    },
    noteBody: {
        color: "#e2e8f0",
        lineHeight: 14,
        fontSize: 10,
    },
    refreshButton: {
        alignSelf: "flex-start",
        borderColor: "rgba(148,163,184,0.4)",
        minHeight: 28,
        paddingVertical: 2,
        paddingHorizontal: 8,
    },
    footerActions: {
        flexDirection: "column",
        gap: 6,
        marginTop: 4,
    },
    footerButton: {
        alignSelf: "stretch",
        minHeight: 28,
        paddingVertical: 2,
        paddingHorizontal: 8,
        fontSize: 12,
    },
    deleteButton: {
        borderRadius: 10,
    },
    stateContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        gap: 6,
    },
    stateText: {
        color: "#f8fafc",
        textAlign: "center",
        fontSize: 12,
    },
});
