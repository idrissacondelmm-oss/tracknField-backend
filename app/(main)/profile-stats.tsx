import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ProfileStats from "../../src/components/profile/ProfileStats";
import ProfilePerformanceTimeline from "../../src/components/profile/ProfilePerformanceTimeline";
import { useAuth } from "../../src/context/AuthContext";
import { getFfaMergedByEvent } from "../../src/api/userService";
import { PerformancePoint } from "../../src/types/User";

type FamilyKey = "Courses" | "Sauts" | "Lancers" | "Épreuves combinées" | "Autres";

const normalizeDisciplineLabel = (value: string) =>
    value
        .normalize("NFD")
        .replace(/\p{Diacritic}+/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .trim();

const classifyDiscipline = (name: string): FamilyKey => {
    const n = normalizeDisciplineLabel(name);
    const compact = n.replace(/\s+/g, "");
    if (/decathlon|heptathlon|pentathlon/.test(n)) return "Épreuves combinées";
    if (/longueur|hauteur|perche|triple/.test(n)) return "Sauts";
    if (/javelot|disque|marteau|poids/.test(n)) return "Lancers";
    if (
        /(sprint|fond|demifond|course|haies|relais|relay|km|route|marathon|cross|100m|200m|400m|800m|1500m|5000m|10000m)/.test(n)
        || /(60m|60msalle)/.test(compact)
    ) {
        return "Courses";
    }
    return "Autres";
};

const normalizeTimelineFromPayload = (payload: any): PerformancePoint[] => {
    const list: PerformancePoint[] = [];

    const pushEntry = (entry: any, disciplineHint?: string) => {
        if (!entry) return;
        const item: any = entry;
        console.log("Processing entry:", item);
        if (!item.date || item.value === undefined || item.value === null) return;

        const numericValue = Number(item.value);
        const hasNumeric = Number.isFinite(numericValue);
        const rawPerformance = item.performance ?? item.value;

        const parseWindLoose = (val: any, requireMarker = false): number | undefined => {
            if (val === undefined || val === null) return undefined;
            if (typeof val === "number" && Number.isFinite(val)) return val;
            const str = String(val).replace(/,/g, ".");
            if (requireMarker && !(/vent/i.test(str) || /m\/?s/i.test(str) || /[+-]/.test(str))) return undefined;
            // match "2.5 m/s" or "+2.5" etc.
            const mps = str.match(/([+-]?\d+(?:\.\d+)?)\s*m\/?s/i);
            const signed = str.match(/[+-]\d+(?:\.\d+)?/);
            const raw = mps?.[1] ?? signed?.[0];
            if (!raw) return undefined;
            const n = parseFloat(raw);
            return Number.isFinite(n) ? n : undefined;
        };

        const wind =
            parseWindLoose(item.wind) ??
            parseWindLoose(item.vent) ??
            parseWindLoose(item.meeting, true) ??
            parseWindLoose(item.notes, true) ??
            parseWindLoose(rawPerformance, true);

        list.push({
            ...item,
            value: hasNumeric ? numericValue : item.value,
            rawPerformance,
            wind,
            discipline: item.discipline || disciplineHint,
        } as PerformancePoint & { rawPerformance?: string });
    };

    if (Array.isArray(payload)) {
        payload.forEach((entry) => pushEntry(entry));
    } else if (payload && typeof payload === "object") {
        Object.entries(payload).forEach(([disciplineKey, value]) => {
            if (Array.isArray(value)) {
                value.forEach((entry) => pushEntry(entry, disciplineKey));
            } else if (value && typeof value === "object") {
                pushEntry(value, disciplineKey);
            }
        });
    }

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export default function ProfileStatsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [timeline, setTimeline] = useState<PerformancePoint[]>(user?.performanceTimeline || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getFfaMergedByEvent();
                const normalized = normalizeTimelineFromPayload(data);
                if (!cancelled && normalized.length > 0) {
                    setTimeline(normalized);
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError(e?.message || "Erreur de chargement des performances");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchData();
        return () => {
            cancelled = true;
        };
    }, []);

    const groupedDisciplines = useMemo(() => {
        const groups: Record<FamilyKey, string[]> = {
            Courses: [],
            Sauts: [],
            Lancers: [],
            "Épreuves combinées": [],
            Autres: [],
        };

        const set = new Set<string>();
        timeline.forEach((point) => {
            if (point.discipline) set.add(point.discipline);
        });
        if (user?.mainDiscipline) set.add(user.mainDiscipline);

        Array.from(set).forEach((name) => {
            const family = classifyDiscipline(name);
            groups[family].push(name);
        });

        (Object.keys(groups) as FamilyKey[]).forEach((key) => {
            groups[key] = groups[key].sort((a, b) => a.localeCompare(b));
        });

        return groups;
    }, [timeline, user?.mainDiscipline]);

    const allFamilies: FamilyKey[] = ["Courses", "Sauts", "Lancers", "Épreuves combinées", "Autres"];

    const [selectedFamily, setSelectedFamily] = useState<FamilyKey | undefined>(() => allFamilies[0]);

    const [selectedDiscipline, setSelectedDiscipline] = useState<string | undefined>(undefined);
    const [familySelectorOpen, setFamilySelectorOpen] = useState(false);
    const [disciplineSelectorOpen, setDisciplineSelectorOpen] = useState(false);

    useEffect(() => {
        if (!selectedFamily || !allFamilies.includes(selectedFamily)) {
            setSelectedFamily(allFamilies[0]);
            return;
        }
    }, [allFamilies, selectedFamily]);

    useEffect(() => {
        if (!selectedFamily) {
            setSelectedDiscipline(undefined);
            return;
        }
        const list = groupedDisciplines[selectedFamily] || [];
        if (list.length === 0) {
            setSelectedDiscipline(undefined);
            return;
        }
        if (!selectedDiscipline || !list.includes(selectedDiscipline)) {
            setSelectedDiscipline(list[0]);
        }
    }, [groupedDisciplines, selectedFamily, selectedDiscipline]);

    if (!user) return null;

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.replace("/(main)/user-profile")} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={22} color="#e2e8f0" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>Performances</Text>
                        <Text style={styles.subtitle}>Toutes tes stats Track&Field</Text>
                    </View>
                </View>

                <ProfileStats user={user} />

                {loading ? <ActivityIndicator color="#22d3ee" style={{ marginBottom: 12 }} /> : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}

                {allFamilies.length > 0 && (
                    <View style={styles.familyCard}>
                        <Text style={styles.familyHeader}>Disciplines</Text>
                        <View style={styles.selectorRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.selectorLabel}>Famille</Text>
                                <TouchableOpacity style={styles.selectButton} onPress={() => setFamilySelectorOpen(true)}>
                                    <Text style={styles.selectLabel}>{selectedFamily || "Choisir une famille"}</Text>
                                    <Ionicons name="chevron-down" size={18} color="#e2e8f0" />
                                </TouchableOpacity>
                            </View>
                            <View style={{ width: 10 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.selectorLabel}>Discipline</Text>
                                <TouchableOpacity
                                    style={[styles.selectButton, (!selectedFamily || !(groupedDisciplines[selectedFamily]?.length)) && styles.selectButtonDisabled]}
                                    onPress={() => selectedFamily && groupedDisciplines[selectedFamily]?.length && setDisciplineSelectorOpen(true)}
                                    disabled={!selectedFamily || !(groupedDisciplines[selectedFamily]?.length)}
                                >
                                    <Text style={styles.selectLabel}>
                                        {selectedDiscipline || "Choisir une discipline"}
                                    </Text>
                                    <Ionicons name="chevron-down" size={18} color="#e2e8f0" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                <Modal transparent visible={familySelectorOpen} animationType="fade" onRequestClose={() => setFamilySelectorOpen(false)}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setFamilySelectorOpen(false)}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Sélectionne une famille</Text>
                            {allFamilies.map((family) => {
                                const isActive = selectedFamily === family;
                                return (
                                    <TouchableOpacity
                                        key={family}
                                        style={[styles.modalRow, isActive && styles.modalRowActive]}
                                        onPress={() => {
                                            setSelectedFamily(family);
                                            setFamilySelectorOpen(false);
                                        }}
                                    >
                                        <Text style={[styles.modalRowText, isActive && styles.modalRowTextActive]}>{family}</Text>
                                        {isActive ? <Ionicons name="checkmark" size={16} color="#02131d" /> : null}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Pressable>
                </Modal>

                <Modal transparent visible={disciplineSelectorOpen} animationType="fade" onRequestClose={() => setDisciplineSelectorOpen(false)}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setDisciplineSelectorOpen(false)}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Sélectionne une discipline</Text>
                            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingBottom: 12 }}>
                                {(selectedFamily ? groupedDisciplines[selectedFamily] : []).map((discipline) => {
                                    const isActive = selectedDiscipline === discipline;
                                    return (
                                        <TouchableOpacity
                                            key={`${selectedFamily}-${discipline}`}
                                            style={[styles.modalRow, isActive && styles.modalRowActive]}
                                            onPress={() => {
                                                setSelectedDiscipline(discipline);
                                                setDisciplineSelectorOpen(false);
                                            }}
                                        >
                                            <Text style={[styles.modalRowText, isActive && styles.modalRowTextActive]}>{discipline}</Text>
                                            {isActive ? <Ionicons name="checkmark" size={16} color="#02131d" /> : null}
                                        </TouchableOpacity>
                                    );
                                })}
                                {(selectedFamily && (groupedDisciplines[selectedFamily]?.length ?? 0) === 0) ? (
                                    <Text style={styles.emptyDisciplineText}>Aucune discipline dans cette famille.</Text>
                                ) : null}
                            </ScrollView>
                        </View>
                    </Pressable>
                </Modal>

                {selectedDiscipline ? (
                    <ProfilePerformanceTimeline timeline={timeline} discipline={selectedDiscipline} title={`${selectedDiscipline}`} />
                ) : (
                    <View style={styles.emptyDisciplineBox}>
                        <Text style={styles.emptyDisciplineText}>Aucune performance disponible pour afficher la progression.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
    },
    container: {
        padding: 12,
        paddingBottom: 80,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
        gap: 14,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(15,23,42,0.7)",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#f8fafc",
    },
    subtitle: {
        color: "#94a3b8",
        fontSize: 14,
    },
    disciplineChipsWrapper: {
        marginBottom: 16,
    },
    disciplineChips: {
        paddingRight: 24,
    },
    familyCard: {
        backgroundColor: "rgba(15,23,42,0.75)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        padding: 10,
        gap: 10,
        marginBottom: 16,
    },
    selectorRow: {
        flexDirection: "row",
        gap: 2,
    },
    selectorLabel: {
        color: "#94a3b8",
        fontSize: 12,
        marginBottom: 6,
        letterSpacing: 0.2,
    },
    familyHeader: {
        color: "#e2e8f0",
        fontWeight: "700",
        fontSize: 16,
        letterSpacing: 0.3,
    },
    familiesWrapper: {
        gap: 12,
    },
    familyBlock: {
        gap: 8,
    },
    familyTitle: {
        color: "#cbd5e1",
        fontWeight: "700",
        fontSize: 13,
        letterSpacing: 0.2,
    },
    familyChips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    selectButton: {
        marginTop: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        backgroundColor: "rgba(226,232,240,0.06)",
        padding: 10,
    },
    selectButtonDisabled: {
        opacity: 0.5,
    },
    selectLabel: {
        color: "#e2e8f0",
        fontWeight: "600",
        fontSize: 10,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        padding: 18,
    },
    modalCard: {
        backgroundColor: "#0f172a",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        gap: 12,
    },
    modalTitle: {
        color: "#e2e8f0",
        fontSize: 16,
        fontWeight: "700",
    },
    modalFamilyBlock: {
        marginBottom: 10,
        gap: 6,
    },
    modalFamilyTitle: {
        color: "#cbd5e1",
        fontWeight: "700",
        fontSize: 13,
        letterSpacing: 0.2,
    },
    modalRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: "rgba(226,232,240,0.04)",
        marginBottom: 6,
    },
    modalRowActive: {
        backgroundColor: "#22d3ee",
    },
    modalRowText: {
        color: "#e2e8f0",
        fontWeight: "600",
        fontSize: 13,
    },
    modalRowTextActive: {
        color: "#02131d",
    },
    disciplineChip: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "rgba(226,232,240,0.06)",
    },
    disciplineChipActive: {
        backgroundColor: "#22d3ee",
        borderColor: "#22d3ee",
    },
    disciplineChipText: {
        color: "#e2e8f0",
        fontWeight: "600",
        fontSize: 13,
    },
    disciplineChipTextActive: {
        color: "#02131d",
    },
    emptyDisciplineBox: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: "rgba(15,23,42,0.4)",
    },
    emptyDisciplineText: {
        color: "#cbd5e1",
        textAlign: "center",
    },
    error: {
        color: "#f87171",
        fontWeight: "600",
        marginBottom: 10,
    },
});
