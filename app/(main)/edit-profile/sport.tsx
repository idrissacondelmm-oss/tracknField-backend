import React, { useState } from "react";
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

const LEVEL_OPTIONS = [
    { value: "beginner", label: "Débutant", hint: "Découverte" },
    { value: "intermediate", label: "Intermédiaire", hint: "Régulier" },
    { value: "advanced", label: "Avancé", hint: "Compétition" },
    { value: "pro", label: "Pro", hint: "Élite" },
];

const LEG_OPTIONS = [
    { value: "left", label: "Gauche" },
    { value: "right", label: "Droite" },
    { value: "unknown", label: "Non spécifié" },
];

export default function SportInfoScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();

    const [formData, setFormData] = useState({
        mainDiscipline: user?.mainDiscipline || "",
        otherDisciplines: user?.otherDisciplines?.join(", ") || "",
        club: user?.club || "",
        level: user?.level || "",
        category: user?.category || "",
        goals: user?.goals || "",
        dominantLeg: user?.dominantLeg || "",
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (key: string, value: string) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                otherDisciplines: formData.otherDisciplines
                    ? formData.otherDisciplines.split(",").map((s) => s.trim())
                    : [],
                level:
                    ["beginner", "intermediate", "advanced", "pro"].includes(formData.level)
                        ? (formData.level as "beginner" | "intermediate" | "advanced" | "pro")
                        : undefined,
                dominantLeg:
                    ["left", "right", "unknown"].includes(formData.dominantLeg)
                        ? (formData.dominantLeg as "left" | "right" | "unknown")
                        : undefined,
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

    const selectedLevel = LEVEL_OPTIONS.find((opt) => opt.value === formData.level)?.label;
    const selectedLeg = LEG_OPTIONS.find((opt) => opt.value === formData.dominantLeg)?.label;

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
                                Ajuste tes disciplines, ton niveau et ce qui t’anime sur la piste.
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
                        <LinearGradient colors={["rgba(34,197,94,0.25)", "rgba(16,185,129,0.08)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.highlightCard}>
                            <Text style={styles.highlightLabel}>Niveau</Text>
                            <Text style={styles.highlightValue}>{selectedLevel || "À définir"}</Text>
                        </LinearGradient>
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
                        <TextInput
                            label="Discipline principale"
                            value={formData.mainDiscipline}
                            onChangeText={(v) => handleChange("mainDiscipline", v)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Autres disciplines (séparées par des virgules)"
                            value={formData.otherDisciplines}
                            onChangeText={(v) => handleChange("otherDisciplines", v)}
                            style={styles.input}
                            placeholder="Sprint 200m, relais 4x100"
                        />
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
                            <Text style={styles.sectionTitle}>Performance</Text>
                            <Text style={styles.sectionSubtitle}>Positionne-toi et partage tes ambitions.</Text>
                        </View>
                        <Text style={styles.sectionLabel}>Niveau</Text>
                        <View style={styles.optionGrid}>
                            {LEVEL_OPTIONS.map((option) => (
                                <Pressable
                                    key={option.value}
                                    style={[
                                        styles.optionChip,
                                        formData.level === option.value && styles.optionChipSelected,
                                    ]}
                                    onPress={() => handleChange("level", option.value)}
                                >
                                    <Text style={styles.optionChipLabel}>{option.label}</Text>
                                    <Text style={styles.optionChipHint}>{option.hint}</Text>
                                </Pressable>
                            ))}
                        </View>
                        <TextInput
                            label="Catégorie"
                            value={formData.category}
                            onChangeText={(v) => handleChange("category", v)}
                            style={styles.input}
                            placeholder="U20, Senior..."
                        />
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

                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Biomécanique</Text>
                            <Text style={styles.sectionSubtitle}>Des détails qui aident les coachs à te suivre.</Text>
                        </View>
                        <Text style={styles.sectionLabel}>Jambe dominante</Text>
                        <View style={styles.legOptionsRow}>
                            {LEG_OPTIONS.map((option) => (
                                <Pressable
                                    key={option.value}
                                    style={[
                                        styles.legChip,
                                        formData.dominantLeg === option.value && styles.legChipSelected,
                                    ]}
                                    onPress={() => handleChange("dominantLeg", option.value)}
                                >
                                    <Text style={styles.legChipText}>{option.label}</Text>
                                    {formData.dominantLeg === option.value && (
                                        <Ionicons name="checkmark" size={16} color="#0f172a" />
                                    )}
                                </Pressable>
                            ))}
                        </View>
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
    sectionLabel: { color: "#94a3b8", fontSize: 13, marginTop: 6, marginBottom: 4 },
    input: { backgroundColor: "rgba(15,23,42,0.45)", marginBottom: 12 },
    optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    optionChip: {
        flexBasis: "48%",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: "rgba(15,23,42,0.5)",
    },
    optionChipSelected: {
        borderColor: "#5eead4",
        backgroundColor: "rgba(94,234,212,0.18)",
    },
    optionChipLabel: { color: "#f8fafc", fontWeight: "600", fontSize: 14 },
    optionChipHint: { color: "#94a3b8", fontSize: 11, marginTop: 4 },
    legOptionsRow: { flexDirection: "row", gap: 12 },
    legChip: {
        flex: 1,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        paddingVertical: 10,
        paddingHorizontal: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    legChipSelected: {
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56,189,248,0.2)",
    },
    legChipText: { color: "#f8fafc", fontSize: 14, fontWeight: "600" },
    button: { borderRadius: 16, backgroundColor: "#22d3ee", marginBottom: 30 },
});
