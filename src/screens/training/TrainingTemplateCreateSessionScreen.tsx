import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { createSessionFromTemplate, getTrainingTemplate } from "../../api/trainingTemplateService";
import { TrainingTemplate } from "../../types/trainingTemplate";
import { formatDurationLabel } from "../../utils/trainingFormatter";

const normalizeTime = (value: string) => {
    const trimmed = value.trim();
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed) ? trimmed : null;
};

const parseTimeToDate = (value: string): Date | null => {
    const normalized = normalizeTime(value);
    if (!normalized) return null;
    const [hours, minutes] = normalized.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return date;
};

const formatTimeValue = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
};

const clampDurationMinutes = (value: number) => {
    if (!Number.isFinite(value)) return 60;
    return Math.max(1, Math.min(23 * 60 + 59, Math.round(value)));
};

const buildDurationDate = (durationMinutes: number): Date => {
    const safe = clampDurationMinutes(durationMinutes);
    const date = new Date();
    date.setHours(Math.floor(safe / 60), safe % 60, 0, 0);
    return date;
};

const minutesFromDate = (date: Date): number => clampDurationMinutes(date.getHours() * 60 + date.getMinutes());

export default function TrainingTemplateCreateSessionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string }>();
    const templateId = params?.id;
    const insets = useSafeAreaInsets();

    const [template, setTemplate] = useState<TrainingTemplate | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [date, setDate] = useState<Date>(() => new Date());
    const [time, setTime] = useState("09:00");
    const [durationMinutes, setDurationMinutes] = useState<number>(60);
    const [place, setPlace] = useState("");

    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [durationPickerVisible, setDurationPickerVisible] = useState(false);
    const [timePickerVisible, setTimePickerVisible] = useState(false);

    const load = useCallback(async () => {
        if (!templateId) return;
        try {
            setLoading(true);
            const data = await getTrainingTemplate(templateId);
            setTemplate(data);
        } catch (err: any) {
            Alert.alert("Erreur", err?.response?.data?.message || err?.message || "Impossible de charger le template");
        } finally {
            setLoading(false);
        }
    }, [templateId]);

    useEffect(() => {
        load();
    }, [load]);

    const canSubmit = useMemo(() => {
        if (!templateId) return false;
        if (!normalizeTime(time)) return false;
        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return false;
        if (!place.trim()) return false;
        return true;
    }, [templateId, time, durationMinutes, place]);

    const handleSubmit = async () => {
        if (!templateId) return;
        const normalizedTime = normalizeTime(time);
        const normalizedDuration = clampDurationMinutes(durationMinutes);
        const normalizedPlace = place.trim();
        if (!normalizedTime || !normalizedDuration || !normalizedPlace) {
            Alert.alert("Champs invalides", "Vérifie l'heure, la durée, et le lieu.");
            return;
        }

        try {
            setSubmitting(true);
            const session = await createSessionFromTemplate(templateId, {
                date,
                startTime: normalizedTime,
                durationMinutes: normalizedDuration,
                place: normalizedPlace,
            });
            router.replace(`/(main)/training/${session.id}`);
        } catch (err: any) {
            Alert.alert("Erreur", err?.response?.data?.message || err?.message || "Impossible de créer la séance");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Planifier une séance</Text>
                    <Text style={styles.subtitle}>
                        {template ? `Template: ${template.title}` : "Chargement du template…"}
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="small" color="#22d3ee" />
                    </View>
                ) : null}

                <View style={styles.card}>
                    <View style={{ gap: 6 }}>
                        <Text style={styles.fieldLabel}>Date</Text>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => setDatePickerVisible(true)}
                            style={({ pressed }) => [styles.pickerTrigger, pressed && styles.pickerTriggerPressed]}
                        >
                            <Text style={styles.pickerValue}>
                                {date.toLocaleDateString("fr-FR", {
                                    weekday: "long",
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </Text>
                            <MaterialCommunityIcons name="pencil-outline" size={16} color="#94a3b8" />
                        </Pressable>
                    </View>

                    {datePickerVisible ? (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                                setDatePickerVisible(false);
                                if (event.type === "set" && selectedDate) {
                                    setDate(selectedDate);
                                }
                            }}
                        />
                    ) : null}

                    {durationPickerVisible ? (
                        <DateTimePicker
                            value={buildDurationDate(durationMinutes)}
                            mode="time"
                            display="default"
                            is24Hour
                            onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                                setDurationPickerVisible(false);
                                if (event.type === "set" && selectedDate) {
                                    setDurationMinutes(minutesFromDate(selectedDate));
                                }
                            }}
                        />
                    ) : null}

                    {timePickerVisible ? (
                        <DateTimePicker
                            value={parseTimeToDate(time) ?? new Date()}
                            mode="time"
                            display="default"
                            is24Hour
                            onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                                setTimePickerVisible(false);
                                if (event.type === "set" && selectedDate) {
                                    setTime(formatTimeValue(selectedDate));
                                }
                            }}
                        />
                    ) : null}

                    <View style={[styles.pickerRow, { marginTop: 14 }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>Heure de début</Text>
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => setTimePickerVisible(true)}
                                style={({ pressed }) => [styles.pickerTrigger, pressed && styles.pickerTriggerPressed]}
                            >
                                <Text style={styles.pickerValue}>{normalizeTime(time) ?? "Choisir"}</Text>
                                <MaterialCommunityIcons name="pencil-outline" size={16} color="#94a3b8" />
                            </Pressable>
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>Durée</Text>
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => setDurationPickerVisible(true)}
                                style={({ pressed }) => [styles.pickerTrigger, pressed && styles.pickerTriggerPressed]}
                            >
                                <Text style={styles.pickerValue}>
                                    {formatDurationLabel(durationMinutes) ?? `${durationMinutes}min`}
                                </Text>
                                <MaterialCommunityIcons name="pencil-outline" size={16} color="#94a3b8" />
                            </Pressable>
                        </View>
                    </View>

                    <Text style={[styles.cardTitle, { marginTop: 14 }]}>Lieu</Text>
                    <TextInput
                        mode="outlined"
                        value={place}
                        onChangeText={setPlace}
                        placeholder="Stade, piste, salle…"
                        autoCapitalize="sentences"
                        autoCorrect={false}
                        style={styles.input}
                    />

                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        disabled={!canSubmit || submitting}
                        loading={submitting}
                        buttonColor="#22d3ee"
                        textColor="#02111f"
                        style={styles.submit}
                    >
                        Créer la séance
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#020617",
    },
    scroll: {
        flex: 1,
        backgroundColor: "#020617",
    },
    container: {
        paddingHorizontal: 12,
        gap: 18,
    },
    header: {
        gap: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#f8fafc",
    },
    subtitle: {
        color: "#cbd5e1",
        lineHeight: 20,
    },
    loadingBox: {
        paddingVertical: 12,
        alignItems: "center",
    },
    card: {
        borderRadius: 22,
        padding: 18,
        backgroundColor: "rgba(15,23,42,0.75)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
        gap: 8,
    },
    cardTitle: {
        color: "#f8fafc",
        fontSize: 14,
        fontWeight: "700",
    },
    pickerRow: {
        flexDirection: "row",
        gap: 12,
    },
    fieldLabel: {
        color: "#94a3b8",
        fontSize: 11,
        fontWeight: "800",
        marginBottom: 6,
    },
    pickerTrigger: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.22)",
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: "rgba(2,6,23,0.22)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    pickerTriggerPressed: {
        opacity: 0.9,
    },
    pickerValue: {
        color: "#e7e9f0ff",
        fontWeight: "700",
        flex: 1,
    },
    input: {
        backgroundColor: "rgba(2,6,23,0.2)",
    },
    submit: {
        marginTop: 16,
    },
});
