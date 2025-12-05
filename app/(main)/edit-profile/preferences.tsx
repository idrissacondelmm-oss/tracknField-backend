import React, { useState } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Modal,
} from "react-native";
import {
    TextInput,
    Button,
    Text,
    ActivityIndicator,
    Switch,
    Chip,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import { updateUserProfile } from "../../../src/api/userService";
import { LinearGradient } from "expo-linear-gradient";

const THEME_OPTIONS: Array<{ value: "light" | "dark" | "system"; label: string; accent: string }> = [
    { value: "light", label: "Clair", accent: "rgba(250,204,21,0.35)" },
    { value: "dark", label: "Sombre", accent: "rgba(59,130,246,0.35)" },
    { value: "system", label: "Système", accent: "rgba(16,185,129,0.35)" },
];

export default function PreferencesScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();

    const [formData, setFormData] = useState({
        isProfilePublic: user?.isProfilePublic ?? true,
        notificationsEnabled: user?.notificationsEnabled ?? true,
        autoSharePerformance: user?.autoSharePerformance ?? false,
        theme: user?.theme || "system",
        instagram: user?.instagram || "",
        strava: user?.strava || "",
        tiktok: user?.tiktok || "",
        website: user?.website || "",
    });

    const [loading, setLoading] = useState(false);
    const [themePickerVisible, setThemePickerVisible] = useState(false);

    const handleToggle = (key: keyof typeof formData) =>
        setFormData((prev) => ({ ...prev, [key]: !prev[key] }));

    const handleChange = (key: string, value: string) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateUserProfile(formData);
            await refreshProfile();
            Alert.alert("✅ Succès", "Vos préférences ont été mises à jour !");
            router.replace("/(main)/account");
        } catch (error: any) {
            console.error(error);
            Alert.alert(
                "❌ Erreur",
                error.message || "Impossible de mettre à jour vos préférences."
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
                        colors={["rgba(251,191,36,0.25)", "rgba(59,130,246,0.18)", "rgba(15,23,42,0.85)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        <View style={styles.heroIconWrapper}>
                            <Ionicons name="settings-outline" size={30} color="#0f172a" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heroTitle}>Préférences & Réseaux</Text>
                            <Text style={styles.heroSubtitle}>
                                Garde le contrôle sur ta visibilité, tes alertes et ta vibe en ligne.
                            </Text>
                            <View style={styles.heroChips}>
                                <Chip icon="shield-half-full" textStyle={styles.chipText} style={styles.chip}>
                                    Vie privée
                                </Chip>
                                <Chip icon="bell-ring" textStyle={styles.chipText} style={styles.chip}>
                                    Alertes
                                </Chip>
                            </View>
                        </View>
                    </LinearGradient>

                    <View style={styles.highlightRow}>
                        <LinearGradient
                            colors={["rgba(251,191,36,0.25)", "rgba(245,158,11,0.08)"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.highlightCard}
                        >
                            <Text style={styles.highlightLabel}>Visibilité</Text>
                            <Text style={styles.highlightValue}>
                                {formData.isProfilePublic ? "Profil public" : "Profil privé"}
                            </Text>
                        </LinearGradient>
                        <LinearGradient
                            colors={["rgba(59,130,246,0.25)", "rgba(37,99,235,0.08)"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.highlightCard}
                        >
                            <Text style={styles.highlightLabel}>Notifications</Text>
                            <Text style={styles.highlightValue}>
                                {formData.notificationsEnabled ? "Activées" : "Coupées"}
                            </Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Préférences générales</Text>
                            <Text style={styles.sectionSubtitle}>Ajuste ce qui est visible et ce qui bippe.</Text>
                        </View>

                        <View style={styles.preferenceRow}>
                            <View>
                                <Text style={styles.preferenceLabel}>Profil public</Text>
                                <Text style={styles.preferenceHint}>
                                    Permet aux autres athlètes de découvrir ton profil.
                                </Text>
                            </View>
                            <Switch
                                value={formData.isProfilePublic}
                                onValueChange={() => handleToggle("isProfilePublic")}
                            />
                        </View>

                        <View style={styles.preferenceRow}>
                            <View>
                                <Text style={styles.preferenceLabel}>Notifications</Text>
                                <Text style={styles.preferenceHint}>
                                    Résultats, invitations et rappels d’entraînement.
                                </Text>
                            </View>
                            <Switch
                                value={formData.notificationsEnabled}
                                onValueChange={() => handleToggle("notificationsEnabled")}
                            />
                        </View>

                        <View style={styles.preferenceRow}>
                            <View>
                                <Text style={styles.preferenceLabel}>Partage automatique</Text>
                                <Text style={styles.preferenceHint}>
                                    Publie automatiquement tes records sur ton profil.
                                </Text>
                            </View>
                            <Switch
                                value={formData.autoSharePerformance}
                                onValueChange={() => handleToggle("autoSharePerformance")}
                            />
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Thème</Text>
                            <Text style={styles.sectionSubtitle}>Choisis comment TracknField s’affiche.</Text>
                        </View>
                        <Pressable style={styles.themeSelector} onPress={() => setThemePickerVisible(true)}>
                            <View style={styles.themeInfo}>
                                <Text style={styles.themeLabelSelected}>
                                    {THEME_OPTIONS.find((opt) => opt.value === formData.theme)?.label || "Système"}
                                </Text>
                                <Text style={styles.themeHint}>Tap pour modifier</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                        </Pressable>
                    </View>

                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Réseaux sociaux</Text>
                            <Text style={styles.sectionSubtitle}>
                                Ajoute tes comptes pour booster ta visibilité.
                            </Text>
                        </View>
                        <TextInput
                            label="Instagram"
                            value={formData.instagram}
                            onChangeText={(v) => handleChange("instagram", v)}
                            style={styles.input}
                            left={<TextInput.Icon icon="instagram" />}
                        />
                        <TextInput
                            label="Strava"
                            value={formData.strava}
                            onChangeText={(v) => handleChange("strava", v)}
                            style={styles.input}
                            left={<TextInput.Icon icon="run" />}
                        />
                        <TextInput
                            label="TikTok"
                            value={formData.tiktok}
                            onChangeText={(v) => handleChange("tiktok", v)}
                            style={styles.input}
                            left={<TextInput.Icon icon="music" />}
                        />
                        <TextInput
                            label="Site web"
                            value={formData.website}
                            onChangeText={(v) => handleChange("website", v)}
                            style={styles.input}
                            left={<TextInput.Icon icon="web" />}
                            placeholder="https://"
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
            <Modal
                transparent
                statusBarTranslucent
                animationType="fade"
                visible={themePickerVisible}
                onRequestClose={() => setThemePickerVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setThemePickerVisible(false)} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalGrabber} />
                        <Text style={styles.modalTitle}>Sélectionne un thème</Text>
                        <Text style={styles.modalSubtitle}>Adapte l’interface à ton environnement.</Text>
                        {THEME_OPTIONS.map((option) => (
                            <Pressable
                                key={option.value}
                                onPress={() => {
                                    handleChange("theme", option.value);
                                    setThemePickerVisible(false);
                                }}
                                style={[
                                    styles.modalOption,
                                    formData.theme === option.value && styles.modalOptionSelected,
                                ]}
                            >
                                <View style={styles.modalOptionLeft}>
                                    <View style={[styles.themeAccent, { backgroundColor: option.accent }]} />
                                    <Text style={styles.modalOptionLabel}>{option.label}</Text>
                                </View>
                                {formData.theme === option.value && (
                                    <Ionicons name="checkmark-circle" size={20} color="#22d3ee" />
                                )}
                            </Pressable>
                        ))}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "transparent" },
    container: { padding: 20, paddingBottom: 60, gap: 20 },
    heroCard: {
        borderRadius: 28,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        backgroundColor: "rgba(15,23,42,0.7)",
        flexDirection: "row",
        gap: 16,
    },
    heroIconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#fcd34d",
        alignItems: "center",
        justifyContent: "center",
    },
    heroTitle: { fontSize: 20, fontWeight: "700", color: "#f8fafc" },
    heroSubtitle: { color: "#cbd5e1", fontSize: 13, marginTop: 6 },
    heroChips: { flexDirection: "row", gap: 10, marginTop: 14 },
    chip: { backgroundColor: "rgba(15,23,42,0.45)", borderColor: "rgba(148,163,184,0.3)" },
    chipText: { color: "#f1f5f9", fontSize: 12 },
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
        gap: 12,
    },
    sectionHeader: { gap: 4 },
    sectionTitle: { fontWeight: "700", fontSize: 16, color: "#f8fafc" },
    sectionSubtitle: { fontSize: 12, color: "#94a3b8" },
    preferenceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(148,163,184,0.2)",
    },
    preferenceLabel: { color: "#f8fafc", fontSize: 15, fontWeight: "600" },
    preferenceHint: { color: "#94a3b8", fontSize: 12, marginTop: 2, maxWidth: 220 },
    themeSelector: {
        marginTop: 4,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(15,23,42,0.5)",
    },
    themeInfo: { gap: 2 },
    themeLabelSelected: { color: "#f8fafc", fontSize: 16, fontWeight: "600" },
    themeHint: { color: "#94a3b8", fontSize: 12 },
    themeAccent: { width: 10, height: 32, borderRadius: 12 },
    input: { backgroundColor: "rgba(15,23,42,0.45)", marginBottom: 12 },
    button: { borderRadius: 16, backgroundColor: "#fbbf24", marginBottom: 30 },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(2,6,23,0.75)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "rgba(15,23,42,0.95)",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        gap: 12,
    },
    modalGrabber: {
        width: 60,
        height: 5,
        borderRadius: 999,
        backgroundColor: "rgba(148,163,184,0.4)",
        alignSelf: "center",
    },
    modalTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "700", textAlign: "center" },
    modalSubtitle: { color: "#94a3b8", fontSize: 13, textAlign: "center" },
    modalOption: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "rgba(15,23,42,0.45)",
    },
    modalOptionSelected: {
        borderColor: "#22d3ee",
        backgroundColor: "rgba(34,211,238,0.15)",
    },
    modalOptionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    modalOptionLabel: { color: "#f8fafc", fontSize: 15, fontWeight: "600" },
});
