import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, TextInput, Text, IconButton } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTraining } from "../../context/TrainingContext";
import { buildTrainingSeriesBlock, buildTrainingSeriesSegment, useTrainingForm } from "../../hooks/useTrainingForm";
import { TrainingTypeSelect } from "../../components/training/TrainingTypeSelect";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { TrainingSeries, TrainingSeriesSegment } from "../../types/training";

const DEFAULT_SESSION_DATE = new Date();

const parseSessionDate = (value?: string): Date | null => {
    if (!value) return null;
    const normalized = value.includes("T") ? value : `${value}T00:00:00`;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatSessionDateDisplay = (value?: string): string => {
    const parsed = parseSessionDate(value);
    if (!parsed) return "Choisir";
    return parsed.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

const formatSessionDatePayload = (date: Date): string => date.toISOString();
const MAX_SERIES = 11;
const MAX_REST_MINUTES = 59;
const REST_MINUTE_OPTIONS = Array.from({ length: MAX_REST_MINUTES + 1 }, (_, index) => index);
const REST_SECOND_OPTIONS = Array.from({ length: 60 }, (_, index) => index);
const DISTANCE_HUNDRED_OPTIONS = Array.from({ length: 10 }, (_, index) => index);
const DISTANCE_REMAINDER_OPTIONS = Array.from({ length: 100 }, (_, index) => index);
const MAX_DISTANCE_METERS = DISTANCE_HUNDRED_OPTIONS[DISTANCE_HUNDRED_OPTIONS.length - 1] * 100 + 99; // 999m
const MAX_DISTANCE_KILOMETERS =
    DISTANCE_HUNDRED_OPTIONS[DISTANCE_HUNDRED_OPTIONS.length - 1] + 99 / 100; // 9.99km
const DISTANCE_UNIT_OPTIONS = ["m", "km"] as const;
const REPETITION_MAX = 50;
const REPETITION_OPTIONS = Array.from({ length: REPETITION_MAX }, (_, index) => index + 1);
const SERIES_REPEAT_MAX = 50;
const SERIES_REPEAT_OPTIONS = Array.from({ length: SERIES_REPEAT_MAX }, (_, index) => index + 1);
const DEFAULT_SERIES_PACE_PERCENT = 90;
const PACE_PERCENT_OPTIONS = Array.from({ length: 11 }, (_, index) => 50 + index * 5); // 50% -> 100%
const PACE_REFERENCE_DISTANCE_OPTIONS = ["60m", "100m", "200m", "400m"] as const;
type PaceReferenceDistanceValue = (typeof PACE_REFERENCE_DISTANCE_OPTIONS)[number];
const PACE_REFERENCE_DISTANCE_VALUES: Record<PaceReferenceDistanceValue, number> = {
    "60m": 60,
    "100m": 100,
    "200m": 200,
    "400m": 400,
};
const DEFAULT_PACE_REFERENCE_DISTANCE: PaceReferenceDistanceValue = "100m";

type DistanceUnit = (typeof DISTANCE_UNIT_OPTIONS)[number];

type RestPickerState = {
    visible: boolean;
    context: "segment" | "series";
    serieId?: string;
    segmentId?: string;
    minutes: number;
    seconds: number;
};

type DistancePickerState = {
    visible: boolean;
    serieId?: string;
    segmentId?: string;
    hundreds: number;
    remainder: number;
    unit: DistanceUnit;
};

type RepetitionPickerState = {
    visible: boolean;
    serieId?: string;
    segmentId?: string;
    value: number;
};

type SeriesRepeatPickerState = {
    visible: boolean;
    serieId?: string;
    value: number;
};

type PacePickerState = {
    visible: boolean;
    serieId?: string;
    value: number;
};

type PaceReferencePickerState = {
    visible: boolean;
    serieId?: string;
    value: PaceReferenceDistanceValue;
};

const clampRestMinutes = (value: number) => Math.max(0, Math.min(MAX_REST_MINUTES, value));
const clampRestSeconds = (value: number) => Math.max(0, Math.min(59, value));
const clampDistanceHundreds = (value: number) => Math.max(0, Math.min(DISTANCE_HUNDRED_OPTIONS.length - 1, value));
const clampDistanceRemainder = (value: number) => Math.max(0, Math.min(99, value));
const clampRepetitionValue = (value: number) => Math.max(1, Math.min(REPETITION_MAX, value));
const clampSeriesRepeatValue = (value: number) => Math.max(1, Math.min(SERIES_REPEAT_MAX, value));
const clampPacePercentValue = (value: number) => {
    if (!PACE_PERCENT_OPTIONS.length) return value;
    const min = PACE_PERCENT_OPTIONS[0];
    const max = PACE_PERCENT_OPTIONS[PACE_PERCENT_OPTIONS.length - 1];
    return Math.max(min, Math.min(max, value));
};

const splitRestInterval = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
        return { minutes: 0, seconds: 0 };
    }
    const totalSeconds = Math.min(value, MAX_REST_MINUTES * 60 + 59);
    const minutes = clampRestMinutes(Math.floor(totalSeconds / 60));
    const seconds = clampRestSeconds(totalSeconds % 60);
    return { minutes, seconds };
};

const formatRestIntervalLabel = (value?: number) => {
    const { minutes, seconds } = splitRestInterval(value);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

const computePickerValues = (value: number, unit: DistanceUnit) => {
    if (unit === "km") {
        const kmValue = Math.min(value / 1000, MAX_DISTANCE_KILOMETERS);
        let hundreds = clampDistanceHundreds(Math.floor(kmValue));
        let remainder = clampDistanceRemainder(Math.round((kmValue - hundreds) * 100));
        if (remainder === 100) {
            remainder = 0;
            hundreds = clampDistanceHundreds(hundreds + 1);
        }
        return { hundreds, remainder };
    }
    const meters = Math.min(value, MAX_DISTANCE_METERS);
    let hundreds = clampDistanceHundreds(Math.floor(meters / 100));
    let remainder = clampDistanceRemainder(Math.round(meters % 100));
    if (remainder === 100) {
        remainder = 0;
        hundreds = clampDistanceHundreds(hundreds + 1);
    }
    return { hundreds, remainder };
};

const splitDistanceValue = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
        return { hundreds: 0, remainder: 0, unit: "m" as DistanceUnit };
    }
    if (value > MAX_DISTANCE_METERS) {
        const picker = computePickerValues(value, "km");
        return { ...picker, unit: "km" as DistanceUnit };
    }
    const picker = computePickerValues(value, "m");
    return { ...picker, unit: "m" as DistanceUnit };
};

const formatDistanceLabel = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
        return "Choisir";
    }
    const { hundreds, remainder, unit } = splitDistanceValue(value);
    if (unit === "km") {
        const remainderLabel = remainder.toString().padStart(2, "0");
        return `${hundreds}.${remainderLabel} km`;
    }
    const meters = hundreds * 100 + remainder;
    return `${meters} m`;
};

const combineDistanceValue = (hundreds: number, remainder: number, unit: DistanceUnit) => {
    if (unit === "km") {
        const kmValue = clampDistanceHundreds(hundreds) + clampDistanceRemainder(remainder) / 100;
        return Math.round(kmValue * 1000);
    }
    return clampDistanceHundreds(hundreds) * 100 + clampDistanceRemainder(remainder);
};

const formatRepetitionLabel = (value?: number) => {
    if (!value || Number.isNaN(value)) {
        return "Choisir";
    }
    return `${value}`;
};

const formatSeriesRepeatLabel = (value?: number) => {
    if (!value || Number.isNaN(value)) {
        return "Choisir";
    }
    return `${value}`;
};

const formatPacePercentLabel = (value?: number) => {
    if (!value || Number.isNaN(value)) {
        return "Choisir";
    }
    return `${value} %`;
};

const formatPaceReferenceDistanceLabel = (value?: TrainingSeries["paceReferenceDistance"]) => {
    if (!value) {
        return "Choisir";
    }
    return value;
};

const parseRecordTimeToSeconds = (value?: string) => {
    if (!value) return null;
    const sanitized = value.trim().toLowerCase().replace(/[^0-9:.,]/g, "");
    if (!sanitized) return null;
    const normalize = (part: string) => parseFloat(part.replace(/,/g, "."));

    if (sanitized.includes(":")) {
        const parts = sanitized.split(":").map(normalize);
        if (parts.some((part) => Number.isNaN(part))) return null;
        let seconds = 0;
        for (let i = 0; i < parts.length; i += 1) {
            const part = parts[parts.length - 1 - i];
            seconds += part * Math.pow(60, i);
        }
        return seconds;
    }

    const numericValue = normalize(sanitized);
    return Number.isFinite(numericValue) ? numericValue : null;
};

const formatSecondsDuration = (value: number) => {
    if (!Number.isFinite(value)) {
        return "—";
    }
    if (value >= 60) {
        const minutes = Math.floor(value / 60);
        const seconds = value - minutes * 60;
        const secondsLabel = seconds.toFixed(2).padStart(5, "0");
        return `${minutes}:${secondsLabel} s`;
    }
    return `${value.toFixed(2)} s`;
};

type SegmentPaceInfo =
    | { type: "success"; value: string; detail: string; distanceLabel: string }
    | { type: "warning"; message: string };

export default function CreateTrainingSessionScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const athleteId = useMemo(() => user?._id || user?.id || "", [user]);
    const inputTheme = useMemo(
        () => ({
            colors: {
                primary: "#22d3ee",
                onSurface: "#f8fafc",
                onSurfaceVariant: "#94a3b8",
                surface: "rgba(15,23,42,0.75)",
                background: "rgba(15,23,42,0.75)",
                outline: "rgba(148,163,184,0.35)",
            },
        }),
        []
    );
    const { createSession } = useTraining();
    const { values, setField, reset, canSubmit } = useTrainingForm(athleteId);
    const [loading, setLoading] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [tempSessionDate, setTempSessionDate] = useState<Date>(parseSessionDate(values.date) ?? DEFAULT_SESSION_DATE);
    const [restPickerState, setRestPickerState] = useState<RestPickerState>({
        visible: false,
        context: "segment",
        minutes: 0,
        seconds: 30,
    });
    const [distancePickerState, setDistancePickerState] = useState<DistancePickerState>({
        visible: false,
        hundreds: 0,
        remainder: 0,
        unit: "m",
    });
    const [repetitionPickerState, setRepetitionPickerState] = useState<RepetitionPickerState>({
        visible: false,
        value: 1,
    });
    const [seriesRepeatPickerState, setSeriesRepeatPickerState] = useState<SeriesRepeatPickerState>({
        visible: false,
        value: 1,
    });
    const [pacePickerState, setPacePickerState] = useState<PacePickerState>({
        visible: false,
        value: DEFAULT_SERIES_PACE_PERCENT,
    });
    const [paceReferencePickerState, setPaceReferencePickerState] = useState<PaceReferencePickerState>({
        visible: false,
        value: DEFAULT_PACE_REFERENCE_DISTANCE,
    });
    const sessionDateDisplay = useMemo(() => formatSessionDateDisplay(values.date), [values.date]);

    useEffect(() => {
        const syncedDate = parseSessionDate(values.date);
        if (syncedDate) {
            setTempSessionDate(syncedDate);
        }
    }, [values.date]);

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        try {
            const session = await createSession({ ...values, status: "planned" });
            Alert.alert("Séance créée", "La séance a été enregistrée.");
            reset();
            router.push({ pathname: "/(main)/training/[id]", params: { id: session.id } });
        } catch (error: any) {
            Alert.alert("Erreur", error?.message || "Impossible de créer la séance");
        } finally {
            setLoading(false);
        }
    };

    const updateSeries = (serieId: string, updater: (serie: TrainingSeries) => TrainingSeries) => {
        setField(
            "series",
            values.series.map((serie) => (serie.id === serieId ? updater(serie) : serie))
        );
    };

    const openSeriesRepeatPicker = (serie: TrainingSeries) => {
        setSeriesRepeatPickerState({
            visible: true,
            serieId: serie.id,
            value: clampSeriesRepeatValue(serie.repeatCount),
        });
    };

    const closeSeriesRepeatPicker = () => {
        setSeriesRepeatPickerState((prev) => ({
            ...prev,
            visible: false,
            serieId: undefined,
        }));
    };

    const handleSeriesRepeatValueChange = (value: number) => {
        setSeriesRepeatPickerState((prev) => ({ ...prev, value: clampSeriesRepeatValue(value) }));
    };

    const handleSeriesRepeatPickerConfirm = () => {
        if (!seriesRepeatPickerState.serieId) {
            closeSeriesRepeatPicker();
            return;
        }
        updateSeries(seriesRepeatPickerState.serieId, (serie) => ({
            ...serie,
            repeatCount: clampSeriesRepeatValue(seriesRepeatPickerState.value),
        }));
        closeSeriesRepeatPicker();
    };

    const handleSeriesPaceToggle = (serie: TrainingSeries) => {
        updateSeries(serie.id, (current) => {
            const nextEnabled = !current.enablePace;
            return {
                ...current,
                enablePace: nextEnabled,
                pacePercent: nextEnabled ? current.pacePercent ?? DEFAULT_SERIES_PACE_PERCENT : undefined,
                paceReferenceDistance: nextEnabled
                    ? current.paceReferenceDistance ?? DEFAULT_PACE_REFERENCE_DISTANCE
                    : undefined,
            };
        });
    };

    const openPacePicker = (serie: TrainingSeries) => {
        const baseValue = clampPacePercentValue(serie.pacePercent ?? DEFAULT_SERIES_PACE_PERCENT);
        setPacePickerState({
            visible: true,
            serieId: serie.id,
            value: baseValue,
        });
    };

    const closePacePicker = () => {
        setPacePickerState((prev) => ({ ...prev, visible: false, serieId: undefined }));
    };

    const handlePacePickerValueChange = (value: number) => {
        setPacePickerState((prev) => ({ ...prev, value: clampPacePercentValue(value) }));
    };

    const handlePacePickerConfirm = () => {
        if (!pacePickerState.serieId) {
            closePacePicker();
            return;
        }
        updateSeries(pacePickerState.serieId, (serie) => ({
            ...serie,
            pacePercent: clampPacePercentValue(pacePickerState.value),
        }));
        closePacePicker();
    };

    const getReferenceRecordData = (reference?: PaceReferenceDistanceValue) => {
        if (!reference) return null;
        const recordValue =
            user?.records?.[reference] ??
            user?.performances?.find((perf) => perf.epreuve?.toLowerCase() === reference.toLowerCase())?.record;
        if (!recordValue) return null;
        const seconds = parseRecordTimeToSeconds(recordValue);
        if (!seconds || !Number.isFinite(seconds)) {
            return null;
        }
        return { seconds, raw: recordValue };
    };

    const computeSegmentPaceInfo = (serie: TrainingSeries, segment: TrainingSeriesSegment): SegmentPaceInfo | null => {
        if (!serie.enablePace) {
            return null;
        }
        const percent = serie.pacePercent;
        const reference = serie.paceReferenceDistance;
        const segmentDistance = segment.distance;
        if (!percent || !reference || !segmentDistance) {
            return null;
        }
        const referenceMeters = PACE_REFERENCE_DISTANCE_VALUES[reference];
        if (!referenceMeters) {
            return null;
        }
        const recordData = getReferenceRecordData(reference);
        if (!recordData) {
            return {
                type: "warning",
                message: `Ajoute ton record ${reference} pour obtenir le temps cible.`,
            };
        }
        const baseSpeed = referenceMeters / recordData.seconds;
        if (!Number.isFinite(baseSpeed) || baseSpeed <= 0) {
            return null;
        }
        const targetSpeed = baseSpeed * (percent / 100);
        if (!Number.isFinite(targetSpeed) || targetSpeed <= 0) {
            return null;
        }
        const targetSeconds = segmentDistance / targetSpeed;
        if (!Number.isFinite(targetSeconds) || targetSeconds <= 0) {
            return null;
        }
        return {
            type: "success",
            value: formatSecondsDuration(targetSeconds),
            detail: `À ${percent}% de ta vitesse ${reference} (record ${recordData.raw})`,
            distanceLabel: formatDistanceLabel(segmentDistance),
        };
    };

    const openPaceReferencePicker = (serie: TrainingSeries) => {
        setPaceReferencePickerState({
            visible: true,
            serieId: serie.id,
            value: serie.paceReferenceDistance ?? DEFAULT_PACE_REFERENCE_DISTANCE,
        });
    };

    const closePaceReferencePicker = () => {
        setPaceReferencePickerState((prev) => ({ ...prev, visible: false, serieId: undefined }));
    };

    const handlePaceReferencePickerValueChange = (value: PaceReferenceDistanceValue) => {
        setPaceReferencePickerState((prev) => ({ ...prev, value }));
    };

    const handlePaceReferencePickerConfirm = () => {
        if (!paceReferencePickerState.serieId) {
            closePaceReferencePicker();
            return;
        }
        updateSeries(paceReferencePickerState.serieId, (serie) => ({
            ...serie,
            paceReferenceDistance: paceReferencePickerState.value,
        }));
        closePaceReferencePicker();
    };

    const handleSegmentFieldChange = <K extends keyof TrainingSeriesSegment>(
        serieId: string,
        segmentId: string,
        key: K,
        value: TrainingSeriesSegment[K]
    ) => {
        updateSeries(serieId, (serie) => ({
            ...serie,
            segments: serie.segments.map((segment) =>
                segment.id === segmentId ? { ...segment, [key]: value } : segment
            ),
        }));
    };

    const openSegmentRestPicker = (serieId: string, segment: TrainingSeriesSegment) => {
        const { minutes, seconds } = splitRestInterval(segment.restInterval);
        setRestPickerState({
            visible: true,
            context: "segment",
            serieId,
            segmentId: segment.id,
            minutes,
            seconds,
        });
    };

    const openSeriesRestPicker = () => {
        const { minutes, seconds } = splitRestInterval(values.seriesRestInterval);
        setRestPickerState({
            visible: true,
            context: "series",
            minutes,
            seconds,
        });
    };

    const closeRestPicker = () => {
        setRestPickerState((prev) => ({
            ...prev,
            visible: false,
            context: "segment",
            serieId: undefined,
            segmentId: undefined,
        }));
    };

    const handleRestPickerValueChange = (type: "minutes" | "seconds", value: number) => {
        setRestPickerState((prev) => ({
            ...prev,
            [type]: type === "minutes" ? clampRestMinutes(value) : clampRestSeconds(value),
        }));
    };

    const handleRestPickerConfirm = () => {
        const totalSeconds = restPickerState.minutes * 60 + restPickerState.seconds;
        if (
            restPickerState.context === "segment" &&
            restPickerState.serieId &&
            restPickerState.segmentId
        ) {
            handleSegmentFieldChange(restPickerState.serieId, restPickerState.segmentId, "restInterval", totalSeconds);
        }
        if (restPickerState.context === "series") {
            setField("seriesRestInterval", totalSeconds);
            setField("seriesRestUnit", "s");
        }
        closeRestPicker();
    };

    const openDistancePicker = (serieId: string, segment: TrainingSeriesSegment) => {
        const selection = splitDistanceValue(segment.distance);
        setDistancePickerState({
            visible: true,
            serieId,
            segmentId: segment.id,
            ...selection,
        });
    };

    const closeDistancePicker = () => {
        setDistancePickerState((prev) => ({
            ...prev,
            visible: false,
            serieId: undefined,
            segmentId: undefined,
        }));
    };

    const handleDistancePickerValueChange = (type: "hundreds" | "remainder", value: number) => {
        setDistancePickerState((prev) => ({
            ...prev,
            [type]: type === "hundreds" ? clampDistanceHundreds(value) : clampDistanceRemainder(value),
        }));
    };

    const handleDistanceUnitChange = (unit: DistanceUnit) => {
        setDistancePickerState((prev) => {
            const currentMeters = combineDistanceValue(prev.hundreds, prev.remainder, prev.unit);
            const nextPicker = computePickerValues(currentMeters, unit);
            return {
                ...prev,
                unit,
                ...nextPicker,
            };
        });
    };

    const handleDistancePickerConfirm = () => {
        if (!distancePickerState.serieId || !distancePickerState.segmentId) {
            closeDistancePicker();
            return;
        }
        const numericDistance = combineDistanceValue(
            distancePickerState.hundreds,
            distancePickerState.remainder,
            distancePickerState.unit
        );
        handleSegmentFieldChange(distancePickerState.serieId, distancePickerState.segmentId, "distance", numericDistance);
        closeDistancePicker();
    };

    const openRepetitionPicker = (serieId: string, segment: TrainingSeriesSegment) => {
        const baseValue = clampRepetitionValue(segment.repetitions ?? 1);
        setRepetitionPickerState({
            visible: true,
            serieId,
            segmentId: segment.id,
            value: baseValue,
        });
    };

    const closeRepetitionPicker = () => {
        setRepetitionPickerState((prev) => ({
            ...prev,
            visible: false,
            serieId: undefined,
            segmentId: undefined,
        }));
    };

    const handleRepetitionValueChange = (value: number) => {
        setRepetitionPickerState((prev) => ({ ...prev, value: clampRepetitionValue(value) }));
    };

    const handleRepetitionPickerConfirm = () => {
        if (!repetitionPickerState.serieId || !repetitionPickerState.segmentId) {
            closeRepetitionPicker();
            return;
        }
        handleSegmentFieldChange(
            repetitionPickerState.serieId,
            repetitionPickerState.segmentId,
            "repetitions",
            clampRepetitionValue(repetitionPickerState.value)
        );
        closeRepetitionPicker();
    };

    const handleAddSegment = (serieId: string) => {
        const newSegment = buildTrainingSeriesSegment();
        updateSeries(serieId, (serie) => ({
            ...serie,
            segments: [...serie.segments, newSegment],
        }));
    };

    const handleRemoveSegment = (serieId: string, segmentId: string) => {
        updateSeries(serieId, (serie) => {
            if (serie.segments.length <= 1) {
                Alert.alert("Impossible", "Chaque série doit contenir au moins une distance.");
                return serie;
            }
            return {
                ...serie,
                segments: serie.segments.filter((segment) => segment.id !== segmentId),
            };
        });
    };

    const handleAddSeries = () => {
        if (values.series.length >= MAX_SERIES) {
            Alert.alert("Limite atteinte", `Tu peux ajouter jusqu'à ${MAX_SERIES} séries.`);
            return;
        }
        setField("series", [...values.series, buildTrainingSeriesBlock(values.series.length)]);
    };

    const handleRemoveSeries = (serieId: string) => {
        if (values.series.length <= 1) {
            Alert.alert("Impossible", "Il doit rester au moins une série.");
            return;
        }
        setField(
            "series",
            values.series.filter((serie) => serie.id !== serieId)
        );
    };

    const renderSegmentBlock = (serie: TrainingSeries, segment: TrainingSeriesSegment, segmentIndex: number) => {
        const paceInfo = computeSegmentPaceInfo(serie, segment);
        return (
            <View key={segment.id} style={styles.segmentBlock}>
                <View style={styles.segmentHeader}>
                    <Text style={styles.segmentTitle}>Distance {segmentIndex + 1}</Text>
                    {serie.segments.length > 1 ? (
                        <IconButton
                            icon="close"
                            size={18}
                            iconColor="#94a3b8"
                            onPress={() => handleRemoveSegment(serie.id, segment.id)}
                        />
                    ) : null}
                </View>
                <View style={styles.segmentFieldsRow}>
                    <View style={styles.segmentField}>
                        <Text style={styles.segmentFieldLabel}>Distance</Text>
                        <Pressable
                            style={styles.distancePickerTrigger}
                            onPress={() => openDistancePicker(serie.id, segment)}
                            accessibilityLabel="Sélectionner la distance"
                        >
                            <Text style={styles.distancePickerValue}>{formatDistanceLabel(segment.distance)}</Text>
                        </Pressable>
                    </View>
                    <View style={styles.segmentField}>
                        <Text style={styles.segmentFieldLabel}>Répétitions</Text>
                        <Pressable
                            style={styles.repetitionPickerTrigger}
                            onPress={() => openRepetitionPicker(serie.id, segment)}
                        >
                            <View style={styles.repetitionPickerContent}>
                                <View style={styles.repetitionPickerTextBlock}>
                                    <Text style={styles.repetitionPickerValue}>
                                        {formatRepetitionLabel(segment.repetitions)}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-down" size={20} color="#94a3b8" />
                            </View>
                        </Pressable>
                    </View>
                    <View style={styles.segmentField}>
                        <Text style={styles.segmentFieldLabel}>Repos (mm:ss)</Text>
                        <Pressable
                            style={styles.restPickerTrigger}
                            onPress={() => openSegmentRestPicker(serie.id, segment)}
                            accessibilityLabel="Sélectionner le temps de repos"
                        >
                            <Text style={styles.restPickerValue}>{formatRestIntervalLabel(segment.restInterval)}</Text>
                        </Pressable>
                    </View>
                </View>
                {paceInfo ? (
                    <View style={styles.segmentPaceField}>
                        <Text style={styles.segmentFieldLabel}>
                            {paceInfo.type === "success" ? `Temps cible (${paceInfo.distanceLabel})` : "Temps cible"}
                        </Text>
                        {paceInfo.type === "success" ? (
                            <>
                                <Text style={styles.segmentPaceValue}>{paceInfo.value}</Text>
                                <Text style={styles.segmentPaceHint}>{paceInfo.detail}</Text>
                            </>
                        ) : (
                            <Text style={[styles.segmentPaceHint, styles.segmentPaceHintWarning]}>
                                {paceInfo.message}
                            </Text>
                        )}
                    </View>
                ) : null}
            </View>
        );
    };

    const openSessionDatePicker = () => {
        const currentDate = parseSessionDate(values.date) ?? DEFAULT_SESSION_DATE;

        if (Platform.OS === "android") {
            DateTimePickerAndroid.open({
                value: currentDate,
                mode: "date",
                display: "calendar",
                onChange: (event, selectedDate) => {
                    if (event.type === "dismissed" || !selectedDate) return;
                    setField("date", formatSessionDatePayload(selectedDate));
                },
            });
            return;
        }

        setTempSessionDate(currentDate);
        setDatePickerVisible(true);
    };

    const handleSessionDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (selectedDate) {
            setTempSessionDate(selectedDate);
        }
    };

    const handleSessionDateConfirm = () => {
        setField("date", formatSessionDatePayload(tempSessionDate));
        setDatePickerVisible(false);
    };

    return (
        <>
            <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
                <ScrollView
                    contentContainerStyle={[styles.container, { paddingBottom: 70 + insets.bottom }]}
                    contentInsetAdjustmentBehavior="always"
                >
                    <View style={styles.panel}>
                        <Text style={styles.title}>Nouvelle séance</Text>
                        <TextInput
                            label="Date de séance"
                            value={sessionDateDisplay}
                            placeholder="Choisir une date"
                            placeholderTextColor="#94a3b8"
                            mode="outlined"
                            style={styles.input}
                            theme={inputTheme}
                            textColor="#f8fafc"
                            editable={false}
                            onPressIn={openSessionDatePicker}
                            right={<TextInput.Icon icon="calendar-range" onPress={openSessionDatePicker} />}
                        />
                        <TrainingTypeSelect value={values.type} onChange={(type) => setField("type", type)} />
                        <TextInput
                            label="Titre"
                            value={values.title}
                            onChangeText={(text) => setField("title", text)}
                            mode="outlined"
                            style={styles.input}
                            theme={inputTheme}
                            textColor="#f8fafc"
                        />
                        <TextInput
                            label="Description"
                            value={values.description}
                            onChangeText={(text) => setField("description", text)}
                            mode="outlined"
                            multiline
                            style={styles.input}
                            theme={inputTheme}
                            textColor="#f8fafc"
                        />
                        <View style={styles.sessionRestField}>
                            <Text style={styles.sessionRestLabel}>Repos entre les séries (mm:ss)</Text>
                            <Pressable
                                style={styles.restPickerTrigger}
                                onPress={openSeriesRestPicker}
                                accessibilityLabel="Sélectionner le repos entre les séries"
                            >
                                <Text style={styles.restPickerValue}>
                                    {formatRestIntervalLabel(values.seriesRestInterval)}
                                </Text>
                            </Pressable>
                            <Text style={styles.sessionRestHelper}>Appliqué après chaque série complète.</Text>
                        </View>
                        <View style={styles.seriesSectionHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>Séries</Text>
                            </View>
                            <Button
                                mode="text"
                                textColor="#22d3ee"
                                icon="plus"
                                onPress={handleAddSeries}
                                compact
                            >
                                Série
                            </Button>
                        </View>
                        {values.series.map((serie, index) => (
                            <View key={serie.id} style={styles.seriesCard}>
                                <View style={styles.seriesCardHeader}>
                                    <Text style={styles.seriesTitle}>Série {index + 1}</Text>
                                    <View style={styles.seriesHeaderActions}>
                                        <Pressable
                                            style={styles.seriesRepeatControl}
                                            onPress={() => openSeriesRepeatPicker(serie)}
                                        >
                                            <View style={styles.seriesRepeatContent}>
                                                <View style={styles.seriesRepeatTextBlock}>
                                                    <Text style={styles.seriesRepeatLabel}>
                                                        {formatSeriesRepeatLabel(serie.repeatCount)} fois
                                                    </Text>
                                                </View>
                                                <MaterialCommunityIcons name="chevron-down" size={22} color="#94a3b8" />
                                            </View>
                                        </Pressable>
                                        {values.series.length > 1 ? (
                                            <IconButton
                                                icon="close"
                                                size={18}
                                                iconColor="#94a3b8"
                                                onPress={() => handleRemoveSeries(serie.id)}
                                            />
                                        ) : null}
                                    </View>
                                </View>
                                <Text style={styles.seriesHelperText}>Nombre de répétitions de la série complète.</Text>
                                <View style={styles.seriesPaceRow}>
                                    <Pressable
                                        style={[styles.seriesPaceToggle, serie.enablePace && styles.seriesPaceToggleActive]}
                                        onPress={() => handleSeriesPaceToggle(serie)}
                                        accessibilityLabel="Activer la définition de l'allure pour cette série"
                                    >
                                        <MaterialCommunityIcons
                                            name={serie.enablePace ? "checkbox-marked" : "checkbox-blank-outline"}
                                            size={22}
                                            color={serie.enablePace ? "#22d3ee" : "#94a3b8"}
                                        />
                                        <View style={styles.seriesPaceToggleTexts}>
                                            <Text style={styles.seriesPaceToggleLabel}>Définir l{"'"}allure</Text>
                                            <Text style={styles.seriesPaceToggleHint}>Temps cible pour la distance</Text>
                                        </View>
                                    </Pressable>
                                    {serie.enablePace ? (
                                        <View style={styles.seriesPaceSelectors}>
                                            <Pressable
                                                style={[styles.pacePickerTrigger, styles.pacePickerTriggerGrow]}
                                                onPress={() => openPacePicker(serie)}
                                                accessibilityLabel="Sélectionner le pourcentage de référence"
                                            >
                                                <Text style={styles.pacePickerLabel}>Référence</Text>
                                                <View style={styles.pacePickerValueRow}>
                                                    <Text style={styles.pacePickerValue}>
                                                        {formatPacePercentLabel(serie.pacePercent)}
                                                    </Text>
                                                    <MaterialCommunityIcons
                                                        name="chevron-down"
                                                        size={20}
                                                        color="#94a3b8"
                                                    />
                                                </View>
                                            </Pressable>
                                            <Pressable
                                                style={[styles.pacePickerTrigger, styles.pacePickerTriggerGrow]}
                                                onPress={() => openPaceReferencePicker(serie)}
                                                accessibilityLabel="Sélectionner la distance de référence"
                                            >
                                                <Text style={styles.pacePickerLabel}>Distance réf</Text>
                                                <View style={styles.pacePickerValueRow}>
                                                    <Text style={styles.pacePickerValue}>
                                                        {formatPaceReferenceDistanceLabel(serie.paceReferenceDistance)}
                                                    </Text>
                                                    <MaterialCommunityIcons
                                                        name="chevron-down"
                                                        size={20}
                                                        color="#94a3b8"
                                                    />
                                                </View>
                                            </Pressable>
                                        </View>
                                    ) : null}
                                </View>
                                {serie.segments.map((segment, segmentIndex) =>
                                    renderSegmentBlock(serie, segment, segmentIndex)
                                )}
                                <Button
                                    mode="outlined"
                                    icon="plus"
                                    onPress={() => handleAddSegment(serie.id)}
                                    textColor="#22d3ee"
                                    style={styles.addDistanceButton}
                                >
                                    Distance supplémentaire
                                </Button>
                            </View>
                        ))}
                        <TextInput
                            label="Notes coach"
                            value={values.coachNotes}
                            onChangeText={(text) => setField("coachNotes", text)}
                            mode="outlined"
                            multiline
                            style={styles.input}
                            theme={inputTheme}
                            textColor="#f8fafc"
                        />
                        <View style={[styles.buttonRow, { marginBottom: insets.bottom + 8 }]}>
                            <Button
                                mode="outlined"
                                onPress={reset}
                                disabled={loading}
                                style={{ flex: 1 }}
                                textColor="#f8fafc"
                            >
                                Réinitialiser
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleSubmit}
                                loading={loading}
                                disabled={!canSubmit || loading || !athleteId}
                                style={{ flex: 1 }}
                                buttonColor="#22d3ee"
                                textColor="#02111f"
                            >
                                Enregistrer
                            </Button>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>

            <Modal
                transparent
                statusBarTranslucent
                animationType="fade"
                visible={distancePickerState.visible}
                onRequestClose={closeDistancePicker}
            >
                <View style={styles.distancePickerBackdrop}>
                    <Pressable style={StyleSheet.absoluteFillObject} onPress={closeDistancePicker} />
                    <View style={styles.distancePickerModal}>
                        <Text style={styles.distancePickerTitle}>Distance</Text>
                        <Text style={styles.distancePickerSubtitle}>Compose la valeur exacte</Text>
                        <View style={styles.distancePickerColumns}>
                            <View style={styles.distancePickerColumn}>
                                <Text style={styles.distancePickerColumnLabel}>
                                    {distancePickerState.unit === "km" ? "Kilomètres" : "Centaines (x100m)"}
                                </Text>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.distancePickerOptionList}
                                    style={styles.distancePickerColumnScroll}
                                >
                                    {DISTANCE_HUNDRED_OPTIONS.map((option) => {
                                        const isSelected = option === distancePickerState.hundreds;
                                        return (
                                            <Pressable
                                                key={`hundreds-${option}`}
                                                onPress={() => handleDistancePickerValueChange("hundreds", option)}
                                                style={[
                                                    styles.distancePickerOption,
                                                    isSelected && styles.distancePickerOptionSelected,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.distancePickerOptionText,
                                                        isSelected && styles.distancePickerOptionTextSelected,
                                                    ]}
                                                >
                                                    {option}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                            <View style={styles.distancePickerColumn}>
                                <Text style={styles.distancePickerColumnLabel}>
                                    {distancePickerState.unit === "km" ? "Décimales" : "Complément (m)"}
                                </Text>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.distancePickerOptionList}
                                    style={styles.distancePickerColumnScroll}
                                >
                                    {DISTANCE_REMAINDER_OPTIONS.map((option) => {
                                        const isSelected = option === distancePickerState.remainder;
                                        const optionLabel = distancePickerState.unit === "km"
                                            ? `.${option.toString().padStart(2, "0")}`
                                            : option.toString().padStart(2, "0");
                                        return (
                                            <Pressable
                                                key={`remainder-${option}`}
                                                onPress={() => handleDistancePickerValueChange("remainder", option)}
                                                style={[
                                                    styles.distancePickerOption,
                                                    isSelected && styles.distancePickerOptionSelected,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.distancePickerOptionText,
                                                        isSelected && styles.distancePickerOptionTextSelected,
                                                    ]}
                                                >
                                                    {optionLabel}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                            <View style={styles.distancePickerColumn}>
                                <Text style={styles.distancePickerColumnLabel}>Unité</Text>
                                <View style={styles.distancePickerUnitList}>
                                    {DISTANCE_UNIT_OPTIONS.map((unit) => {
                                        const isSelected = unit === distancePickerState.unit;
                                        return (
                                            <Pressable
                                                key={`unit-${unit}`}
                                                onPress={() => handleDistanceUnitChange(unit)}
                                                style={[
                                                    styles.distancePickerOption,
                                                    isSelected && styles.distancePickerOptionSelected,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.distancePickerOptionText,
                                                        isSelected && styles.distancePickerOptionTextSelected,
                                                    ]}
                                                >
                                                    {unit}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                        <View style={styles.distancePickerActions}>
                            <Button mode="text" textColor="#94a3b8" onPress={closeDistancePicker} style={{ flex: 1 }}>
                                Fermer
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleDistancePickerConfirm}
                                buttonColor="#22d3ee"
                                textColor="#02111f"
                                style={{ flex: 1 }}
                            >
                                Valider
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent
                statusBarTranslucent
                animationType="fade"
                visible={repetitionPickerState.visible}
                onRequestClose={closeRepetitionPicker}
            >
                <View style={styles.repetitionPickerBackdrop}>
                    <Pressable style={StyleSheet.absoluteFillObject} onPress={closeRepetitionPicker} />
                    <View style={styles.repetitionPickerModal}>
                        <Text style={styles.repetitionPickerTitle}>Répétitions</Text>
                        <Text style={styles.repetitionPickerSubtitle}>Choisis entre 1 et 50 répétitions</Text>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.repetitionPickerOptionList}
                            style={styles.repetitionPickerScroll}
                        >
                            {REPETITION_OPTIONS.map((option) => {
                                const isSelected = option === repetitionPickerState.value;
                                return (
                                    <Pressable
                                        key={`repetition-${option}`}
                                        onPress={() => handleRepetitionValueChange(option)}
                                        style={[
                                            styles.repetitionPickerOption,
                                            isSelected && styles.repetitionPickerOptionSelected,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.repetitionPickerOptionText,
                                                isSelected && styles.repetitionPickerOptionTextSelected,
                                            ]}
                                        >
                                            {option}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                        <View style={styles.repetitionPickerActions}>
                            <Button mode="text" textColor="#94a3b8" onPress={closeRepetitionPicker} style={{ flex: 1 }}>
                                Fermer
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleRepetitionPickerConfirm}
                                buttonColor="#22d3ee"
                                textColor="#02111f"
                                style={{ flex: 1 }}
                            >
                                Valider
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent
                statusBarTranslucent
                animationType="fade"
                visible={seriesRepeatPickerState.visible}
                onRequestClose={closeSeriesRepeatPicker}
            >
                <View style={styles.repetitionPickerBackdrop}>
                    <Pressable style={StyleSheet.absoluteFillObject} onPress={closeSeriesRepeatPicker} />
                    <View style={styles.repetitionPickerModal}>
                        <Text style={styles.repetitionPickerTitle}>Répétitions de série</Text>
                        <Text style={styles.repetitionPickerSubtitle}>Définis entre 1 et 50 fois la répétition de la série</Text>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.repetitionPickerOptionList}
                            style={styles.repetitionPickerScroll}
                        >
                            {SERIES_REPEAT_OPTIONS.map((option) => {
                                const isSelected = option === seriesRepeatPickerState.value;
                                return (
                                    <Pressable
                                        key={`series-repeat-${option}`}
                                        onPress={() => handleSeriesRepeatValueChange(option)}
                                        style={[
                                            styles.repetitionPickerOption,
                                            isSelected && styles.repetitionPickerOptionSelected,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.repetitionPickerOptionText,
                                                isSelected && styles.repetitionPickerOptionTextSelected,
                                            ]}
                                        >
                                            {formatSeriesRepeatLabel(option)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                        <View style={styles.repetitionPickerActions}>
                            <Button
                                mode="text"
                                textColor="#94a3b8"
                                onPress={closeSeriesRepeatPicker}
                                style={{ flex: 1 }}
                            >
                                Fermer
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleSeriesRepeatPickerConfirm}
                                buttonColor="#22d3ee"
                                textColor="#02111f"
                                style={{ flex: 1 }}
                            >
                                Valider
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent
                statusBarTranslucent
                animationType="fade"
                visible={pacePickerState.visible}
                onRequestClose={closePacePicker}
            >
                <View style={styles.repetitionPickerBackdrop}>
                    <Pressable style={StyleSheet.absoluteFillObject} onPress={closePacePicker} />
                    <View style={styles.repetitionPickerModal}>
                        <Text style={styles.repetitionPickerTitle}>Allure cible</Text>
                        <Text style={styles.repetitionPickerSubtitle}>Sélectionne un pourcentage de référence</Text>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.repetitionPickerOptionList}
                            style={styles.repetitionPickerScroll}
                        >
                            {PACE_PERCENT_OPTIONS.map((option) => {
                                const isSelected = option === pacePickerState.value;
                                return (
                                    <Pressable
                                        key={`pace-${option}`}
                                        onPress={() => handlePacePickerValueChange(option)}
                                        style={[
                                            styles.repetitionPickerOption,
                                            isSelected && styles.repetitionPickerOptionSelected,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.repetitionPickerOptionText,
                                                isSelected && styles.repetitionPickerOptionTextSelected,
                                            ]}
                                        >
                                            {option} %
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                        <View style={styles.repetitionPickerActions}>
                            <Button mode="text" textColor="#94a3b8" onPress={closePacePicker} style={{ flex: 1 }}>
                                Fermer
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handlePacePickerConfirm}
                                buttonColor="#22d3ee"
                                textColor="#02111f"
                                style={{ flex: 1 }}
                            >
                                Valider
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent
                statusBarTranslucent
                animationType="fade"
                visible={paceReferencePickerState.visible}
                onRequestClose={closePaceReferencePicker}
            >
                <View style={styles.repetitionPickerBackdrop}>
                    <Pressable style={StyleSheet.absoluteFillObject} onPress={closePaceReferencePicker} />
                    <View style={styles.repetitionPickerModal}>
                        <Text style={styles.repetitionPickerTitle}>Distance de référence</Text>
                        <Text style={styles.repetitionPickerSubtitle}>Choisis 60m, 100m, 200m ou 400m</Text>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.repetitionPickerOptionList}
                            style={styles.repetitionPickerScroll}
                        >
                            {PACE_REFERENCE_DISTANCE_OPTIONS.map((option) => {
                                const isSelected = option === paceReferencePickerState.value;
                                return (
                                    <Pressable
                                        key={`pace-ref-${option}`}
                                        onPress={() => handlePaceReferencePickerValueChange(option)}
                                        style={[
                                            styles.repetitionPickerOption,
                                            isSelected && styles.repetitionPickerOptionSelected,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.repetitionPickerOptionText,
                                                isSelected && styles.repetitionPickerOptionTextSelected,
                                            ]}
                                        >
                                            {option}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                        <View style={styles.repetitionPickerActions}>
                            <Button mode="text" textColor="#94a3b8" onPress={closePaceReferencePicker} style={{ flex: 1 }}>
                                Fermer
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handlePaceReferencePickerConfirm}
                                buttonColor="#22d3ee"
                                textColor="#02111f"
                                style={{ flex: 1 }}
                            >
                                Valider
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent
                statusBarTranslucent
                animationType="fade"
                visible={restPickerState.visible}
                onRequestClose={closeRestPicker}
            >
                <View style={styles.restPickerBackdrop}>
                    <Pressable style={StyleSheet.absoluteFillObject} onPress={closeRestPicker} />
                    <View style={styles.restPickerModal}>
                        <Text style={styles.restPickerTitle}>Temps de repos</Text>
                        <Text style={styles.restPickerSubtitle}>Ajuste les minutes et secondes</Text>
                        <View style={styles.restPickerColumns}>
                            <View style={styles.restPickerColumn}>
                                <Text style={styles.restPickerColumnLabel}>Minutes</Text>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.restPickerOptionList}
                                    style={styles.restPickerColumnScroll}
                                >
                                    {REST_MINUTE_OPTIONS.map((option) => {
                                        const isSelected = option === restPickerState.minutes;
                                        return (
                                            <Pressable
                                                key={`minutes-${option}`}
                                                onPress={() => handleRestPickerValueChange("minutes", option)}
                                                style={[
                                                    styles.restPickerOption,
                                                    isSelected && styles.restPickerOptionSelected,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.restPickerOptionText,
                                                        isSelected && styles.restPickerOptionTextSelected,
                                                    ]}
                                                >
                                                    {option.toString().padStart(2, "0")}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                            <Text style={styles.restPickerSeparator}>:</Text>
                            <View style={styles.restPickerColumn}>
                                <Text style={styles.restPickerColumnLabel}>Secondes</Text>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.restPickerOptionList}
                                    style={styles.restPickerColumnScroll}
                                >
                                    {REST_SECOND_OPTIONS.map((option) => {
                                        const isSelected = option === restPickerState.seconds;
                                        return (
                                            <Pressable
                                                key={`seconds-${option}`}
                                                onPress={() => handleRestPickerValueChange("seconds", option)}
                                                style={[
                                                    styles.restPickerOption,
                                                    isSelected && styles.restPickerOptionSelected,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.restPickerOptionText,
                                                        isSelected && styles.restPickerOptionTextSelected,
                                                    ]}
                                                >
                                                    {option.toString().padStart(2, "0")}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </View>
                        <View style={styles.restPickerActions}>
                            <Button
                                mode="text"
                                textColor="#94a3b8"
                                onPress={closeRestPicker}
                                style={{ flex: 1 }}
                            >
                                Fermer
                            </Button>
                            <Button
                                mode="contained"
                                onPress={handleRestPickerConfirm}
                                buttonColor="#22d3ee"
                                textColor="#02111f"
                                style={{ flex: 1 }}
                            >
                                Valider
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {Platform.OS === "ios" && (
                <Modal
                    transparent
                    statusBarTranslucent
                    animationType="fade"
                    visible={datePickerVisible}
                    onRequestClose={() => setDatePickerVisible(false)}
                >
                    <View style={styles.modalBackdrop}>
                        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setDatePickerVisible(false)} />
                        <View style={styles.modalContent}>
                            <View style={styles.modalGrabber} />
                            <Text style={styles.pickerTitle}>Choisis la date de séance</Text>
                            <Text style={styles.pickerDescription}>
                                Utilise la même précision que dans la section Informations personnelles.
                            </Text>
                            <View style={styles.pickerPreview}>
                                <Text style={styles.pickerPreviewLabel}>Date sélectionnée</Text>
                                <Text style={styles.pickerPreviewValue}>
                                    {tempSessionDate.toLocaleDateString("fr-FR", {
                                        weekday: "long",
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </Text>
                            </View>
                            <DateTimePicker
                                value={tempSessionDate}
                                mode="date"
                                display="spinner"
                                onChange={handleSessionDateChange}
                                themeVariant="dark"
                            />
                            <View style={styles.pickerActions}>
                                <Button
                                    mode="outlined"
                                    onPress={() => setDatePickerVisible(false)}
                                    textColor="#e2e8f0"
                                    style={styles.pickerCancel}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={handleSessionDateConfirm}
                                    buttonColor="#22d3ee"
                                    textColor="#0f172a"
                                    style={styles.pickerButton}
                                >
                                    Confirmer
                                </Button>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#010920",
    },
    container: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        flexGrow: 1,
    },
    panel: {
        backgroundColor: "rgba(2,6,23,0.82)",
        borderRadius: 28,
        padding: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        shadowColor: "#000",
        shadowOpacity: 0.4,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#f8fafc",
        marginBottom: 4,
    },
    sessionRestField: {
        gap: 6,
    },
    sessionRestLabel: {
        color: "#94a3b8",
        fontSize: 14,
    },
    sessionRestHelper: {
        color: "#64748b",
        fontSize: 12,
    },
    input: {
        backgroundColor: "rgba(15,23,42,0.55)",
        borderRadius: 16,
    },
    restPickerTrigger: {
        backgroundColor: "rgba(15,23,42,0.55)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 56,
        justifyContent: "center",
    },
    distancePickerTrigger: {
        backgroundColor: "rgba(15,23,42,0.55)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 56,
        justifyContent: "center",
    },
    repetitionPickerTrigger: {
        backgroundColor: "rgba(15,23,42,0.55)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 56,
        justifyContent: "center",
    },
    repetitionPickerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    repetitionPickerTextBlock: {
        flex: 1,
        gap: 2,
    },
    repetitionPickerLabel: {
        fontSize: 10,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    restPickerValue: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    distancePickerValue: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    repetitionPickerValue: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    restPickerHint: {
        color: "#94a3b8",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginTop: 2,
    },
    distancePickerHint: {
        color: "#94a3b8",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginTop: 2,
    },
    seriesSectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#f8fafc",
    },
    sectionSubtitle: {
        fontSize: 12,
        color: "#94a3b8",
        marginTop: 2,
    },
    seriesCard: {
        backgroundColor: "rgba(15,23,42,0.65)",
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 12,
    },
    seriesCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    seriesTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#f8fafc",
    },
    seriesHeaderActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    seriesRepeatControl: {
        backgroundColor: "rgba(15,23,42,0.7)",
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        minWidth: 120,
    },
    seriesRepeatContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    seriesRepeatTextBlock: {
        flex: 1,
        gap: 2,
    },
    seriesRepeatControlLabel: {
        fontSize: 10,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    seriesRepeatLabel: {
        color: "#f8fafc",
        fontWeight: "600",
        fontSize: 16,
    },
    seriesPaceRow: {
        flexDirection: "column",
        alignItems: "stretch",
        gap: 12,
    },
    seriesPaceSelectors: {
        flexDirection: "row",
        gap: 12,
        flexWrap: "wrap",
        width: "100%",
    },
    seriesPaceToggle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "rgba(15,23,42,0.55)",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        alignSelf: "stretch",
    },
    seriesPaceToggleActive: {
        borderColor: "rgba(34,211,238,0.6)",
        backgroundColor: "rgba(34,211,238,0.08)",
    },
    seriesPaceToggleTexts: {
        flex: 1,
        gap: 2,
    },
    seriesPaceToggleLabel: {
        color: "#f8fafc",
        fontWeight: "600",
    },
    seriesPaceToggleHint: {
        color: "#94a3b8",
        fontSize: 12,
    },
    pacePickerTrigger: {
        backgroundColor: "rgba(15,23,42,0.55)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        paddingHorizontal: 14,
        paddingVertical: 10,
        minWidth: 140,
        flexShrink: 0,
        gap: 4,
    },
    pacePickerTriggerGrow: {
        flex: 1,
        minWidth: 0,
    },
    pacePickerLabel: {
        fontSize: 10,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    pacePickerValueRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    pacePickerValue: {
        color: "#f8fafc",
        fontSize: 16,
        fontWeight: "600",
    },
    seriesHelperText: {
        fontSize: 12,
        color: "#94a3b8",
        marginBottom: 4,
    },
    segmentBlock: {
        backgroundColor: "rgba(3,7,18,0.5)",
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        gap: 10,
    },
    segmentHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    segmentTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#e2e8f0",
    },
    segmentFieldsRow: {
        flexDirection: "row",
        gap: 12,
        flexWrap: "wrap",
    },
    segmentField: {
        flex: 1,
        minWidth: 120,
        gap: 6,
    },
    segmentFieldLabel: {
        fontSize: 12,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    segmentPaceField: {
        marginTop: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        backgroundColor: "rgba(4,8,20,0.55)",
        gap: 4,
    },
    segmentPaceValue: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    segmentPaceHint: {
        color: "#94a3b8",
        fontSize: 12,
    },
    segmentPaceHintWarning: {
        color: "#f87171",
    },
    addDistanceButton: {
        borderColor: "rgba(34,211,238,0.4)",
        borderRadius: 999,
        alignSelf: "flex-start",
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 12,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(2,6,23,0.85)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#020617",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        gap: 16,
    },
    modalGrabber: {
        alignSelf: "center",
        width: 60,
        height: 5,
        borderRadius: 999,
        backgroundColor: "rgba(148,163,184,0.45)",
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#f8fafc",
        textAlign: "center",
    },
    pickerDescription: {
        fontSize: 14,
        color: "#94a3b8",
        textAlign: "center",
    },
    pickerPreview: {
        backgroundColor: "rgba(15,23,42,0.6)",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        gap: 4,
    },
    pickerPreviewLabel: {
        fontSize: 12,
        textTransform: "uppercase",
        color: "#94a3b8",
        letterSpacing: 0.8,
    },
    pickerPreviewValue: {
        fontSize: 16,
        fontWeight: "600",
        color: "#f8fafc",
    },
    pickerActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 12,
    },
    pickerCancel: {
        flex: 1,
        borderColor: "rgba(148,163,184,0.3)",
    },
    pickerButton: {
        flex: 1,
    },
    distancePickerBackdrop: {
        flex: 1,
        backgroundColor: "rgba(2,6,23,0.85)",
        justifyContent: "flex-end",
    },
    distancePickerModal: {
        backgroundColor: "#020617",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 18,
    },
    distancePickerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#f8fafc",
        textAlign: "center",
    },
    distancePickerSubtitle: {
        fontSize: 13,
        color: "#94a3b8",
        textAlign: "center",
    },
    distancePickerColumns: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    distancePickerColumn: {
        flex: 1,
        backgroundColor: "rgba(15,23,42,0.6)",
        borderRadius: 20,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
    },
    distancePickerColumnLabel: {
        fontSize: 12,
        color: "#94a3b8",
        textAlign: "center",
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 8,
    },
    distancePickerOptionList: {
        paddingHorizontal: 12,
        paddingBottom: 8,
    },
    distancePickerColumnScroll: {
        maxHeight: 220,
        flexGrow: 0,
    },
    distancePickerOption: {
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: "center",
        marginBottom: 8,
    },
    distancePickerOptionSelected: {
        backgroundColor: "rgba(34,211,238,0.15)",
    },
    distancePickerOptionText: {
        fontSize: 16,
        color: "#cbd5f5",
        fontWeight: "500",
    },
    distancePickerOptionTextSelected: {
        color: "#22d3ee",
        fontWeight: "700",
    },
    distancePickerUnitList: {
        paddingHorizontal: 12,
    },
    distancePickerActions: {
        flexDirection: "row",
        gap: 12,
    },
    repetitionPickerBackdrop: {
        flex: 1,
        backgroundColor: "rgba(2,6,23,0.85)",
        justifyContent: "flex-end",
    },
    repetitionPickerModal: {
        backgroundColor: "#020617",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 18,
    },
    repetitionPickerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#f8fafc",
        textAlign: "center",
    },
    repetitionPickerSubtitle: {
        fontSize: 13,
        color: "#94a3b8",
        textAlign: "center",
    },
    repetitionPickerScroll: {
        maxHeight: 260,
    },
    repetitionPickerOptionList: {
        paddingHorizontal: 12,
        paddingBottom: 8,
    },
    repetitionPickerOption: {
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: "center",
        marginBottom: 8,
    },
    repetitionPickerOptionSelected: {
        backgroundColor: "rgba(34,211,238,0.15)",
    },
    repetitionPickerOptionText: {
        fontSize: 16,
        color: "#cbd5f5",
        fontWeight: "500",
    },
    repetitionPickerOptionTextSelected: {
        color: "#22d3ee",
        fontWeight: "700",
    },
    repetitionPickerActions: {
        flexDirection: "row",
        gap: 12,
    },
    restPickerBackdrop: {
        flex: 1,
        backgroundColor: "rgba(2,6,23,0.85)",
        justifyContent: "flex-end",
    },
    restPickerModal: {
        backgroundColor: "#020617",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        gap: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
    },
    restPickerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#f8fafc",
        textAlign: "center",
    },
    restPickerSubtitle: {
        fontSize: 13,
        color: "#94a3b8",
        textAlign: "center",
    },
    restPickerColumns: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 16,
    },
    restPickerColumn: {
        flex: 1,
        backgroundColor: "rgba(15,23,42,0.6)",
        borderRadius: 20,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
    },
    restPickerColumnLabel: {
        fontSize: 12,
        color: "#94a3b8",
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
    },
    restPickerOptionList: {
        paddingHorizontal: 12,
        paddingBottom: 8,
    },
    restPickerColumnScroll: {
        maxHeight: 220,
        flexGrow: 0,
    },
    restPickerOption: {
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: "center",
        marginBottom: 8,
    },
    restPickerOptionSelected: {
        backgroundColor: "rgba(34,211,238,0.15)",
    },
    restPickerOptionText: {
        fontSize: 16,
        color: "#cbd5f5",
        fontWeight: "500",
    },
    restPickerOptionTextSelected: {
        color: "#22d3ee",
        fontWeight: "700",
    },
    restPickerSeparator: {
        alignSelf: "stretch",
        textAlign: "center",
        fontSize: 24,
        fontWeight: "700",
        color: "#f8fafc",
        paddingTop: 44,
    },
    restPickerActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 4,
    },
});
