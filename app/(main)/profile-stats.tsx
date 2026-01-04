import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import ProfileStats from "../../src/components/profile/ProfileStats";
import ProfilePerformanceTimeline from "../../src/components/profile/ProfilePerformanceTimeline";
import { useAuth } from "../../src/context/AuthContext";
import { getFfaMergedByEvent } from "../../src/api/userService";
import { PerformancePoint } from "../../src/types/User";
import { parseTimeToSeconds } from "../../src/utils/performance";

type FamilyKey = "Courses" | "Sauts" | "Lancers" | "Épreuves combinées" | "Autres";

const ALL_FAMILIES: FamilyKey[] = ["Courses", "Sauts", "Lancers", "Épreuves combinées", "Autres"];

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
        if (!item.date || item.value === undefined || item.value === null) return;

        const numericValue = Number(item.value);
        const hasNumeric = Number.isFinite(numericValue);
        const rawPerformance = item.rawPerformance ?? item.performance ?? item.value;

        // Some sources provide a rounded numeric `value` (e.g. 6) but keep the real chrono in `performance` (e.g. "6''70").
        // Prefer the most precise representation when we can safely parse it.
        const getPreciseValue = () => {
            if (typeof rawPerformance !== "string") return hasNumeric ? numericValue : item.value;

            const rawText = String(rawPerformance).trim();
            if (!rawText) return hasNumeric ? numericValue : item.value;

            const normalized = rawText
                .replace(/\u00A0/g, " ")
                .replace(/\u2032/g, "'")
                .replace(/\u2033/g, '"')
                .replace(/[’´`]/g, "'")
                .replace(/[″”“]/g, '"')
                .trim();

            const withoutParens = normalized.replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim();

            const valueIsInteger = hasNumeric && Number.isFinite(numericValue) && Number.isInteger(numericValue);
            const looksLikeTime = /:|''|\b\d+\s*'|"/.test(withoutParens);
            const hasDecimal = /\d\s*[.,]\s*\d/.test(withoutParens);

            if (looksLikeTime) {
                // Try to extract the actual chrono token from strings like "2'03''33 (+1.2)".
                const timeToken =
                    withoutParens.match(/\d{1,2}:\d{2}:\d{2}(?:[.,]\d{1,2})?/)?.[0] ??
                    withoutParens.match(/\d{1,3}:\d{2}(?:[.,]\d{1,2})?/)?.[0] ??
                    withoutParens.match(/\d+\s*'\s*\d{1,2}\s*(?:''|")\s*\d{1,2}/)?.[0] ??
                    withoutParens.match(/\d+\s*'\s*\d{1,2}(?:\s*(?:''|"))?(?:\s*\d{1,2})?/)?.[0] ??
                    withoutParens.match(/\d+\s*(?:''|")\s*\d{1,2}/)?.[0];

                const parsed = parseTimeToSeconds(timeToken ?? withoutParens);
                if (parsed !== null && Number.isFinite(parsed) && parsed > 0) return parsed;
            }

            if (valueIsInteger && hasDecimal) {
                const match = withoutParens.match(/[+-]?\d+(?:[.,]\d+)?/);
                if (match) {
                    const parsed = parseFloat(match[0].replace(/,/g, "."));
                    if (Number.isFinite(parsed) && parsed > 0) return parsed;
                }
            }

            return hasNumeric ? numericValue : item.value;
        };

        const preciseValue = getPreciseValue();

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
            value: typeof preciseValue === "number" && Number.isFinite(preciseValue) ? preciseValue : item.value,
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
    const role = user?.role ? String(user.role).toLowerCase() : "";
    const hasLicense = Boolean(user?.licenseNumber?.trim());
    const [timeline, setTimeline] = useState<PerformancePoint[]>(user?.performanceTimeline || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        if (!hasLicense) {
            setTimeline([]);
            setLoading(false);
            return;
        }

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
    }, [hasLicense]);

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
        // Only list disciplines that actually exist in the synced performance timeline.
        // (The main discipline is a profile preference and can be shown elsewhere.)

        Array.from(set).forEach((name) => {
            const family = classifyDiscipline(name);
            groups[family].push(name);
        });

        (Object.keys(groups) as FamilyKey[]).forEach((key) => {
            groups[key] = groups[key].sort((a, b) => a.localeCompare(b));
        });

        return groups;
    }, [timeline]);

    const availableFamilies = useMemo(
        () => ALL_FAMILIES.filter((family) => (groupedDisciplines[family]?.length ?? 0) > 0),
        [groupedDisciplines],
    );

    const [selectedFamily, setSelectedFamily] = useState<FamilyKey | undefined>(() => {
        if (user?.mainDiscipline) {
            return classifyDiscipline(user.mainDiscipline);
        }
        return ALL_FAMILIES[0];
    });

    const [selectedDiscipline, setSelectedDiscipline] = useState<string | undefined>(undefined);
    const [familySelectorOpen, setFamilySelectorOpen] = useState(false);
    const [disciplineSelectorOpen, setDisciplineSelectorOpen] = useState(false);

    useEffect(() => {
        if (availableFamilies.length === 0) {
            if (selectedFamily !== undefined) setSelectedFamily(undefined);
            if (selectedDiscipline !== undefined) setSelectedDiscipline(undefined);
            if (familySelectorOpen) setFamilySelectorOpen(false);
            if (disciplineSelectorOpen) setDisciplineSelectorOpen(false);
            return;
        }

        if (!selectedFamily || !availableFamilies.includes(selectedFamily)) {
            const preferredFamily = user?.mainDiscipline ? classifyDiscipline(user.mainDiscipline) : undefined;
            setSelectedFamily(
                preferredFamily && availableFamilies.includes(preferredFamily)
                    ? preferredFamily
                    : availableFamilies[0],
            );
        }
    }, [availableFamilies, selectedFamily, selectedDiscipline, user?.mainDiscipline, familySelectorOpen, disciplineSelectorOpen]);

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
            const preferred = user?.mainDiscipline;
            if (preferred && list.includes(preferred)) {
                setSelectedDiscipline(preferred);
            } else {
                setSelectedDiscipline(list[0]);
            }
        }
    }, [groupedDisciplines, selectedFamily, selectedDiscipline, user?.mainDiscipline]);

    if (!user || role === "coach") return <Redirect href="/(main)/home" />;

    if (!hasLicense) {
        return (
            <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
                <ScrollView contentContainerStyle={styles.container}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.replace("/(main)/user-profile")} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={22} color="#e2e8f0" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.title}>Performances</Text>
                            <Text style={styles.subtitle}>Ajoute ton numéro de licence</Text>
                        </View>
                    </View>

                    <View style={styles.licenseBlock}>
                        <View style={styles.licenseIconBadge}>
                            <Ionicons name="card-outline" size={22} color="#f1f3f8ff" />
                            <Text style={styles.licenseTitle}>Renseigne ton numéro de licence</Text>

                        </View>
                        <Text style={styles.licenseText}>
                            Ajoute ton numéro de licence pour synchroniser et afficher tes performances.
                        </Text>
                        <TouchableOpacity
                            style={styles.licenseButton}
                            activeOpacity={0.9}
                            onPress={() => router.push("/(main)/edit-profile/sport")}
                        >
                            <Ionicons name="create-outline" size={16} color="#010617" />
                            <Text style={styles.licenseButtonText}>Compléter maintenant</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

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

                {availableFamilies.length > 0 && (
                    <View style={styles.familyCard}>
                        <Text style={styles.familyHeader}>Disciplines</Text>
                        <View style={styles.selectorRow}>
                            <View style={{ flex: 1, }}>
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
                            {availableFamilies.map((family) => {
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
        paddingHorizontal: 10,
        paddingVertical: 10,
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
    licenseBlock: {
        backgroundColor: "rgba(15,23,42,0.5)",
        borderRadius: 20,
        padding: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    licenseIconBadge: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    licenseTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#f8fafc",
    },
    licenseText: {
        color: "#cbd5e1",
        fontSize: 13,
        lineHeight: 18,
    },
    licenseButton: {
        marginTop: 6,
        borderRadius: 16,
        paddingVertical: 12,
        backgroundColor: "#22d3ee",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: "rgba(15,23,42,0.15)",
    },
    licenseButtonText: {
        color: "#0f172a",
        fontWeight: "700",
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
        gap: 1,
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
        paddingHorizontal: 20,
        paddingVertical: 14,
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
