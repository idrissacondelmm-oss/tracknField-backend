import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import {
    TextInput,
    Button,
    Text,
    ActivityIndicator,
    Chip,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../src/context/AuthContext";
import { updateUserProfile } from "../../../src/api/userService";
import { LinearGradient } from "expo-linear-gradient";
import { DISCIPLINE_GROUPS, getDisciplinesForPrimary } from "../../../src/constants/disciplineGroups";

const ALL_DISCIPLINES = DISCIPLINE_GROUPS.flatMap((group) => group.disciplines);

const normalizeValue = (value?: string) => value?.trim().toLowerCase() ?? "";

const findFamilyByDiscipline = (discipline?: string) => {
    if (!discipline) return undefined;
    const needle = normalizeValue(discipline);
    return DISCIPLINE_GROUPS.find((group) => {
        if (group.disciplines.some((entry) => normalizeValue(entry) === needle)) return true;
        if (group.subGroups?.some((sub) => normalizeValue(sub.label) === needle)) return true;
        return false;
    });
};

const getPrimaryOptionsForFamily = (family?: (typeof DISCIPLINE_GROUPS)[number]) => {
    if (!family) return [];
    if (family.subGroups?.length) {
        return family.subGroups.map((sub) => sub.label);
    }
    return family.disciplines;
};

const normalizeOtherDisciplines = (value?: string | string[]) => {
    if (!value) return [] as string[];
    if (Array.isArray(value)) return value;
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
};

export default function SportInfoScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();

    const [formData, setFormData] = useState({
        mainDiscipline: user?.mainDiscipline || "",
        otherDisciplines: user?.otherDisciplines?.join(", ") || "",
        club: user?.club || "",
        category: user?.category || "",
        goals: user?.goals || "",
    });

    const initialFamilyId = useMemo(() => {
        return findFamilyByDiscipline(user?.mainDiscipline)?.id ?? DISCIPLINE_GROUPS[0]?.id;
    }, [user?.mainDiscipline]);

    const [selectedFamilyId, setSelectedFamilyId] = useState<string | undefined>(initialFamilyId);
    const [expandedFamilyId, setExpandedFamilyId] = useState<string | undefined>(() =>
        user?.mainDiscipline ? initialFamilyId : undefined
    );

    const selectedFamily = useMemo(() => {
        if (!selectedFamilyId) return DISCIPLINE_GROUPS[0];
        return DISCIPLINE_GROUPS.find((group) => group.id === selectedFamilyId) ?? DISCIPLINE_GROUPS[0];
    }, [selectedFamilyId]);

    const [selectedDiscipline, setSelectedDiscipline] = useState<string | undefined>(() => {
        const options = getPrimaryOptionsForFamily(selectedFamily);
        if (user?.mainDiscipline && options.includes(user.mainDiscipline)) {
            return user.mainDiscipline;
        }
        return options[0];
    });

    const [selectedSecondary, setSelectedSecondary] = useState<string[]>(() =>
        normalizeOtherDisciplines(user?.otherDisciplines)
    );

    const primaryOptions = useMemo(() => getPrimaryOptionsForFamily(selectedFamily), [selectedFamily]);

    const primaryDisciplineSet = useMemo(() => {
        if (!selectedFamily) return [] as string[];
        return getDisciplinesForPrimary(selectedFamily, selectedDiscipline);
    }, [selectedFamily, selectedDiscipline]);

    const secondaryOptions = useMemo(() => {
        const primarySet = new Set(primaryDisciplineSet);
        return ALL_DISCIPLINES.filter((discipline) => !primarySet.has(discipline));
    }, [primaryDisciplineSet]);

    const isFamilyExpanded = expandedFamilyId === selectedFamily?.id;

    const handleFamilyPress = (familyId: string) => {
        setSelectedFamilyId(familyId);
        setExpandedFamilyId(familyId);
    };

    const toggleSecondary = (discipline: string) => {
        setSelectedSecondary((prev) => {
            if (prev.includes(discipline)) {
                return prev.filter((item) => item !== discipline);
            }
            return [...prev, discipline];
        });
    };

    const [loading, setLoading] = useState(false);

    const handleChange = (key: string, value: string) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    useEffect(() => {
        if (user?.mainDiscipline && initialFamilyId) {
            setExpandedFamilyId(initialFamilyId);
        }
    }, [user?.mainDiscipline, initialFamilyId]);

    useEffect(() => {
        if (!selectedFamily) return;
        const options = getPrimaryOptionsForFamily(selectedFamily);
        if (options.length === 0) return;
        if (selectedDiscipline && options.includes(selectedDiscipline)) return;
        setSelectedDiscipline(options[0]);
    }, [selectedFamily, selectedDiscipline]);

    useEffect(() => {
        if (selectedDiscipline) {
            setFormData((prev) => ({ ...prev, mainDiscipline: selectedDiscipline }));
        }
    }, [selectedDiscipline]);

    useEffect(() => {
        const joined = selectedSecondary.join(", ");
        setFormData((prev) => {
            if (prev.otherDisciplines === joined) return prev;
            return { ...prev, otherDisciplines: joined };
        });
    }, [selectedSecondary]);

    useEffect(() => {
        const primarySet = new Set(primaryDisciplineSet);
        setSelectedSecondary((prev) => prev.filter((item) => !primarySet.has(item)));
    }, [primaryDisciplineSet]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                otherDisciplines: selectedSecondary,
            };

            await updateUserProfile(payload);
            await refreshProfile();
            Alert.alert("✅ Succès", "Vos informations sportives ont été mises à jour !");
            router.replace("/(main)/account");
        } catch (error: any) {
            console.error(error);
            Alert.alert(
                "❌ Erreur",
                error.message || "Impossible de mettre à jour vos informations sportives."
            );
        } finally {
            setLoading(false);
        }
    };

    const headerHeight = useHeaderHeight();

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={[styles.container, { paddingTop: headerHeight + 12 }]}>
                    <LinearGradient
                        colors={["rgba(94,234,212,0.25)", "rgba(79,70,229,0.25)", "rgba(15,23,42,0.85)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        <View style={styles.heroIconWrapper}>
                            <Ionicons name="barbell-outline" size={32} color="#0f172a" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heroTitle}>Informations sportives</Text>
                            <Text style={styles.heroSubtitle}>
                                Ajuste tes disciplines et ce qui t’anime sur la piste.
                            </Text>
                            <View style={styles.heroChips}>
                                <Chip icon="lightning-bolt" textStyle={styles.chipText} style={styles.chip}>
                                    Explosivité
                                </Chip>
                                <Chip icon="trophy" textStyle={styles.chipText} style={styles.chip}>
                                    Objectifs
                                </Chip>
                            </View>
                        </View>
                    </LinearGradient>

                    <View style={styles.highlightRow}>
                        <LinearGradient colors={["rgba(59,130,246,0.25)", "rgba(14,165,233,0.08)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.highlightCard}>
                            <Text style={styles.highlightLabel}>Club</Text>
                            <Text style={styles.highlightValue}>{formData.club || "Libre"}</Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Disciplines</Text>
                            <Text style={styles.sectionSubtitle}>Tout ce qui compose ton profil athlétique.</Text>
                        </View>
                        <Text style={styles.sectionLabel}>Famille de discipline</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.familyChipsRow}
                        >
                            {DISCIPLINE_GROUPS.map((group) => {
                                const isActive = selectedFamily?.id === group.id;
                                const isExpanded = expandedFamilyId === group.id;
                                return (
                                    <Pressable
                                        key={group.id}
                                        style={[styles.familyChip, isActive && styles.familyChipActive]}
                                        onPress={() => handleFamilyPress(group.id)}
                                    >
                                        <View style={styles.familyChipHeader}>
                                            <Text
                                                style={[styles.familyChipText, isActive && styles.familyChipTextActive]}
                                            >
                                                {group.label}
                                            </Text>
                                            <Ionicons
                                                name={isExpanded ? "chevron-down" : "chevron-forward"}
                                                size={16}
                                                color={isActive ? "#02131d" : "#e2e8f0"}
                                            />
                                        </View>
                                        <Text style={[styles.familyChipCount, isActive && styles.familyChipCountActive]}>
                                            {group.disciplines.length} épreuves
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>

                        {isFamilyExpanded ? (
                            <View style={styles.disciplinePanel}>
                                <View style={styles.disciplinePanelHeader}>
                                    <Text style={styles.panelTitle}>{selectedFamily?.label}</Text>
                                    <Text style={styles.panelSubtitle}>
                                        Choisis une discipline principale puis complète avec des épreuves secondaires.
                                    </Text>
                                </View>

                                <Text style={styles.sectionLabel}>Discipline principale</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.disciplineChipsRow}
                                >
                                    {primaryOptions.map((discipline) => {
                                        const isActive = selectedDiscipline === discipline;
                                        return (
                                            <Pressable
                                                key={discipline}
                                                style={[styles.disciplineChip, isActive && styles.disciplineChipActive]}
                                                onPress={() => setSelectedDiscipline(discipline)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.disciplineChipText,
                                                        isActive && styles.disciplineChipTextActive,
                                                    ]}
                                                >
                                                    {discipline}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>

                                {selectedFamily?.subGroups?.length ? (
                                    <View style={styles.primaryDisciplinesBlock}>
                                        <Text style={styles.sectionLabel}>Discipline sélectionnée</Text>
                                        <Text style={styles.primaryDisciplineName}>{selectedDiscipline}</Text>
                                        <Text style={styles.primaryDisciplineHint}>Épreuves incluses :</Text>
                                        <View style={styles.primaryDisciplineRow}>
                                            {primaryDisciplineSet.map((event) => (
                                                <View key={event} style={styles.primaryDisciplineChip}>
                                                    <Text style={styles.primaryDisciplineChipText}>{event}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ) : null}

                                <View style={styles.panelDivider} />

                                <Text style={styles.sectionLabel}>Disciplines secondaires</Text>
                                <View style={styles.secondaryChipsWrapper}>
                                    {secondaryOptions.length > 0 ? (
                                        secondaryOptions.map((discipline) => {
                                            const isActive = selectedSecondary.includes(discipline);
                                            return (
                                                <Pressable
                                                    key={discipline}
                                                    style={[
                                                        styles.secondaryChip,
                                                        isActive && styles.secondaryChipActive,
                                                    ]}
                                                    onPress={() => toggleSecondary(discipline)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.secondaryChipText,
                                                            isActive && styles.secondaryChipTextActive,
                                                        ]}
                                                    >
                                                        {discipline}
                                                    </Text>
                                                    {isActive && <Ionicons name="checkmark" size={14} color="#0f172a" />}
                                                </Pressable>
                                            );
                                        })
                                    ) : (
                                        <Text style={styles.secondaryEmptyText}>Toutes les disciplines disponibles sont incluses dans ta sélection principale.</Text>
                                    )}
                                </View>
                                <Text style={styles.secondaryHint}>
                                    {selectedSecondary.length > 0
                                        ? `Sélection actuelle : ${selectedSecondary.join(", ")}`
                                        : "Sélectionne une ou plusieurs disciplines secondaires."}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.collapsedHint}>
                                Sélectionne une famille pour afficher les disciplines principales et secondaires.
                            </Text>
                        )}

                        <TextInput
                            label="Club"
                            value={formData.club}
                            onChangeText={(v) => handleChange("club", v)}
                            style={styles.input}
                            placeholder="Club ou équipe"
                        />
                    </View>

                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Ambitions</Text>
                            <Text style={styles.sectionSubtitle}>Partage ta catégorie et ce que tu vises.</Text>
                        </View>
                        <TextInput
                            label="Catégorie"
                            value={formData.category}
                            style={styles.input}
                            placeholder="U20, Senior..."
                            disabled
                        />
                        <Text style={styles.readOnlyHint}>La catégorie est déterminée automatiquement selon ton âge.</Text>
                        <TextInput
                            label="Objectifs"
                            value={formData.goals}
                            onChangeText={(v) => handleChange("goals", v)}
                            multiline
                            numberOfLines={4}
                            style={styles.input}
                            placeholder="Ex: passer sous les 21s, intégrer l'équipe nationale"
                        />
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleSave}
                        disabled={loading}
                        style={styles.button}
                        contentStyle={{ paddingVertical: 6 }}
                    >
                        {loading ? (
                            <ActivityIndicator animating color="#fff" />
                        ) : (
                            "Enregistrer les modifications"
                        )}
                    </Button>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "transparent" },
    container: { padding: 20, paddingBottom: 60, gap: 20 },
    heroCard: {
        borderRadius: 30,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        backgroundColor: "rgba(15,23,42,0.65)",
        flexDirection: "row",
        gap: 16,
    },
    heroIconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#5eead4",
        alignItems: "center",
        justifyContent: "center",
    },
    heroTitle: { fontSize: 20, fontWeight: "700", color: "#f8fafc" },
    heroSubtitle: { color: "#cbd5e1", fontSize: 13, marginTop: 6 },
    heroChips: { flexDirection: "row", gap: 10, marginTop: 14 },
    chip: { backgroundColor: "rgba(15,23,42,0.45)", borderColor: "rgba(148,163,184,0.3)" },
    chipText: { color: "#e2e8f0", fontSize: 12 },
    highlightRow: { flexDirection: "row", gap: 12 },
    highlightCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(248,250,252,0.08)",
    },
    highlightLabel: { color: "#cbd5e1", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
    highlightValue: { color: "#f8fafc", fontSize: 18, fontWeight: "700", marginTop: 6 },
    sectionCard: {
        borderRadius: 24,
        backgroundColor: "rgba(15,23,42,0.6)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        padding: 18,
        gap: 6,
    },
    sectionHeader: { marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: "#f8fafc" },
    sectionSubtitle: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
    sectionLabel: { color: "#94a3b8", fontSize: 13, marginTop: 6, marginBottom: 8 },
    input: { backgroundColor: "rgba(15,23,42,0.45)", marginBottom: 12 },
    readOnlyHint: { color: "#94a3b8", fontSize: 11, marginTop: -8, marginBottom: 12 },
    familyChipsRow: { gap: 14, paddingVertical: 6, paddingRight: 20 },
    familyChip: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        paddingHorizontal: 18,
        paddingVertical: 12,
        backgroundColor: "rgba(15,23,42,0.55)",
        marginRight: 14,
        width: 180,
        gap: 6,
    },
    familyChipActive: {
        backgroundColor: "#22d3ee",
        borderColor: "#22d3ee",
    },
    familyChipHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    familyChipText: { color: "#e2e8f0", fontWeight: "700", fontSize: 13, letterSpacing: 0.3 },
    familyChipTextActive: { color: "#02131d" },
    familyChipCount: { color: "#94a3b8", fontSize: 11 },
    familyChipCountActive: { color: "#02131d" },
    disciplineChipsRow: { gap: 10, paddingVertical: 4, paddingRight: 12 },
    disciplineChip: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: "rgba(15,23,42,0.45)",
        marginRight: 10,
    },
    disciplineChipActive: {
        backgroundColor: "#5eead4",
        borderColor: "#5eead4",
    },
    disciplineChipText: { color: "#e2e8f0", fontWeight: "600" },
    disciplineChipTextActive: { color: "#0f172a" },
    disciplinePanel: {
        marginTop: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        backgroundColor: "rgba(15,23,42,0.55)",
        padding: 16,
        gap: 8,
    },
    disciplinePanelHeader: { marginBottom: 4 },
    panelTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "700" },
    panelSubtitle: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
    panelDivider: {
        height: 1,
        backgroundColor: "rgba(148,163,184,0.3)",
        marginVertical: 4,
    },
    collapsedHint: { color: "#94a3b8", fontSize: 12, marginTop: 8 },
    primaryDisciplinesBlock: {
        gap: 6,
        marginBottom: 8,
    },
    primaryDisciplineName: {
        color: "#f8fafc",
        fontSize: 15,
        fontWeight: "700",
    },
    primaryDisciplineHint: {
        color: "#94a3b8",
        fontSize: 12,
    },
    primaryDisciplineRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 4,
    },
    primaryDisciplineChip: {
        borderRadius: 14,
        paddingVertical: 4,
        paddingHorizontal: 10,
        backgroundColor: "rgba(94,234,212,0.15)",
        borderWidth: 1,
        borderColor: "rgba(94,234,212,0.4)",
    },
    primaryDisciplineChipText: {
        color: "#5eead4",
        fontSize: 12,
        fontWeight: "600",
    },
    secondaryChipsWrapper: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 4,
        marginBottom: 6,
    },
    secondaryChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: "rgba(15,23,42,0.45)",
    },
    secondaryChipActive: {
        backgroundColor: "rgba(94,234,212,0.2)",
        borderColor: "#5eead4",
    },
    secondaryChipText: { color: "#e2e8f0", fontSize: 13, fontWeight: "600" },
    secondaryChipTextActive: { color: "#0f172a" },
    secondaryHint: { color: "#94a3b8", fontSize: 12, marginBottom: 12 },
    secondaryEmptyText: { color: "#94a3b8", fontSize: 12 },
    button: { borderRadius: 16, backgroundColor: "#22d3ee", marginBottom: 30 },
});
