import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Modal,
    Linking,
} from "react-native";
import {
    TextInput,
    Button,
    Text,
    ActivityIndicator,
    Switch,
    Chip,
    HelperText,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import { updateUserProfile } from "../../../src/api/userService";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

type ThemeValue = "light" | "dark" | "system";

type PreferencesFormData = {
    isProfilePublic: boolean;
    notificationsEnabled: boolean;
    autoSharePerformance: boolean;
    theme: ThemeValue;
    instagram: string;
    strava: string;
    tiktok: string;
    website: string;
};

type ThemeOption = { value: ThemeValue; label: string; accent: string };

const THEME_OPTIONS: ThemeOption[] = [
    { value: "light", label: "Clair", accent: "rgba(250,204,21,0.35)" },
    { value: "dark", label: "Sombre", accent: "rgba(59,130,246,0.35)" },
    { value: "system", label: "Système", accent: "rgba(16,185,129,0.35)" },
];

const THEME_LOOKUP = THEME_OPTIONS.reduce(
    (acc, option) => {
        acc[option.value] = option;
        return acc;
    },
    {} as Record<ThemeValue, ThemeOption>
);

const HANDLE_FIELDS: Array<keyof Pick<PreferencesFormData, "instagram" | "tiktok">> = ["instagram", "tiktok"];
const URL_FIELDS: Array<keyof Pick<PreferencesFormData, "strava" | "website">> = ["strava", "website"];

type SocialField = keyof Pick<PreferencesFormData, "instagram" | "strava" | "tiktok" | "website">;

const sanitizeHandle = (value: string) => value.replace(/@/g, "").trim();

const ensureHttps = (value: string) => {
    if (!value) return value;
    return /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
};

const validateHandle = (value: string) => {
    if (!value) return "";
    return /^[\w.]{2,30}$/.test(value) ? "" : "Handle invalide";
};

const validateUrl = (value: string) => {
    if (!value) return "";
    return /^https?:\/\/[^\s]+$/i.test(value) ? "" : "Lien invalide";
};

const getSocialUrl = (key: SocialField, rawValue: string) => {
    const value = rawValue.trim();
    if (!value) return null;
    if (key === "instagram") return `https://www.instagram.com/${sanitizeHandle(value)}/`;
    if (key === "tiktok") return `https://www.tiktok.com/@${sanitizeHandle(value)}`;
    if (key === "strava" || key === "website") return ensureHttps(value);
    return null;
};

export default function PreferencesScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();

    const baseFormData = useMemo<PreferencesFormData>(
        () => ({
            isProfilePublic: user?.isProfilePublic ?? true,
            notificationsEnabled: user?.notificationsEnabled ?? true,
            autoSharePerformance: user?.autoSharePerformance ?? false,
            theme: (user?.theme as ThemeValue) || "system",
            instagram: user?.instagram || "",
            strava: user?.strava || "",
            tiktok: user?.tiktok || "",
            website: user?.website || "",
        }),
        [user]
    );

    const [formData, setFormData] = useState<PreferencesFormData>(baseFormData);

    const [loading, setLoading] = useState(false);
    const [themePickerVisible, setThemePickerVisible] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof PreferencesFormData, string>>>({});
    const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof PreferencesFormData, boolean>>>({});

    useEffect(() => {
        setFormData(baseFormData);
        setErrors({});
        setTouchedFields({});
    }, [baseFormData]);

    const validateField = useCallback(
        (key: keyof PreferencesFormData, value: string | boolean) => {
            if (typeof value === "boolean") return "";
            if (HANDLE_FIELDS.includes(key as any)) return validateHandle(value);
            if (URL_FIELDS.includes(key as any)) return validateUrl(value);
            return "";
        },
        []
    );

    const handleToggleApply = (key: keyof PreferencesFormData, value: boolean) => {
        Haptics.selectionAsync().catch(() => undefined);
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleToggle = (key: keyof PreferencesFormData) => {
        const nextValue = !formData[key];
        if (key === "isProfilePublic" && nextValue) {
            Alert.alert(
                "Rendre ton profil public ?",
                "Ton profil sera consultable par tous les athlètes.",
                [
                    { text: "Annuler", style: "cancel" },
                    { text: "Oui", onPress: () => handleToggleApply(key, nextValue) },
                ]
            );
            return;
        }
        handleToggleApply(key, nextValue);
    };

    const handleChange = (key: keyof PreferencesFormData, value: string) => {
        const formatted = HANDLE_FIELDS.includes(key as any)
            ? sanitizeHandle(value)
            : URL_FIELDS.includes(key as any)
                ? value.trim()
                : value;

        setFormData((prev) => ({ ...prev, [key]: formatted }));
        setErrors((prev) => ({ ...prev, [key]: validateField(key, formatted) }));
    };

    const handleBlur = (key: keyof PreferencesFormData) => {
        setTouchedFields((prev) => ({ ...prev, [key]: true }));
        if (URL_FIELDS.includes(key as any)) {
            setFormData((prev) => {
                const ensured = ensureHttps(prev[key] as string);
                const updated = { ...prev, [key]: ensured };
                setErrors((prevErrors) => ({ ...prevErrors, [key]: validateField(key, ensured) }));
                return updated;
            });
        }
    };

    const canOpenSocialLink = useCallback(
        (key: SocialField) => !!getSocialUrl(key, formData[key]),
        [formData]
    );

    const handleOpenSocial = (key: SocialField) => {
        const url = getSocialUrl(key, formData[key]);
        if (!url) return;
        Linking.openURL(url).catch(() =>
            Alert.alert("Lien introuvable", "Nous n'avons pas pu ouvrir ce lien.")
        );
    };

    const handleSave = async () => {
        if (!canSubmit) return;
        setLoading(true);
        try {
            await updateUserProfile(formData);
            await refreshProfile();
            setErrors({});
            setTouchedFields({});
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
    const hasBlockingErrors = useMemo(() => Object.values(errors).some(Boolean), [errors]);
    const isDirty = useMemo(
        () => JSON.stringify(formData) !== JSON.stringify(baseFormData),
        [formData, baseFormData]
    );
    const canSubmit = !loading && isDirty && !hasBlockingErrors;
    const selectedTheme = useMemo(() => THEME_LOOKUP[formData.theme], [formData.theme]);

    const shouldShowError = useCallback(
        (key: keyof PreferencesFormData) => Boolean(errors[key]) && Boolean(touchedFields[key] || formData[key]),
        [errors, touchedFields, formData]
    );

    const renderRightIcon = (key: SocialField) => (
        <TextInput.Icon
            icon="open-in-new"
            forceTextInputFocus={false}
            color={canOpenSocialLink(key) ? "#22d3ee" : "#475569"}
            onPress={() => canOpenSocialLink(key) && handleOpenSocial(key)}
        />
    );

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
                                accessibilityRole="switch"
                                accessibilityLabel="Basculer la visibilité du profil"
                                accessibilityHint="Active pour rendre ton profil visible par tous"
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
                                accessibilityRole="switch"
                                accessibilityLabel="Activer les notifications"
                                accessibilityHint="Reçois des alertes TracknField"
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
                                accessibilityRole="switch"
                                accessibilityLabel="Activer le partage automatique"
                                accessibilityHint="Publie tes records automatiquement"
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
                                    {selectedTheme?.label || "Système"}
                                </Text>
                                <Text style={styles.themeHint}>Tap pour modifier</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                        </Pressable>
                        <View style={styles.themePreview}>
                            <LinearGradient
                                colors={[selectedTheme?.accent || "#475569", "rgba(15,23,42,0.8)"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.themePreviewGradient}
                            >
                                <Text style={styles.themePreviewTitle}>Aperçu instantané</Text>
                                <Text style={styles.themePreviewText}>Boutons & cartes s’adaptent.</Text>
                            </LinearGradient>
                        </View>
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
                            onBlur={() => handleBlur("instagram")}
                            style={styles.input}
                            left={<TextInput.Icon icon="instagram" />}
                            right={renderRightIcon("instagram")}
                            error={shouldShowError("instagram")}
                        />
                        <HelperText type="error" visible={shouldShowError("instagram")} style={styles.helper}>
                            {errors.instagram}
                        </HelperText>
                        <TextInput
                            label="Strava"
                            value={formData.strava}
                            onChangeText={(v) => handleChange("strava", v)}
                            onBlur={() => handleBlur("strava")}
                            style={styles.input}
                            left={<TextInput.Icon icon="run" />}
                            right={renderRightIcon("strava")}
                            error={shouldShowError("strava")}
                        />
                        <HelperText type="error" visible={shouldShowError("strava")} style={styles.helper}>
                            {errors.strava}
                        </HelperText>
                        <TextInput
                            label="TikTok"
                            value={formData.tiktok}
                            onChangeText={(v) => handleChange("tiktok", v)}
                            onBlur={() => handleBlur("tiktok")}
                            style={styles.input}
                            left={<TextInput.Icon icon="music" />}
                            right={renderRightIcon("tiktok")}
                            error={shouldShowError("tiktok")}
                        />
                        <HelperText type="error" visible={shouldShowError("tiktok")} style={styles.helper}>
                            {errors.tiktok}
                        </HelperText>
                        <TextInput
                            label="Site web"
                            value={formData.website}
                            onChangeText={(v) => handleChange("website", v)}
                            onBlur={() => handleBlur("website")}
                            style={styles.input}
                            left={<TextInput.Icon icon="web" />}
                            right={renderRightIcon("website")}
                            error={shouldShowError("website")}
                            placeholder="https://"
                        />
                        <HelperText type="error" visible={shouldShowError("website")} style={styles.helper}>
                            {errors.website}
                        </HelperText>
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleSave}
                        disabled={!canSubmit}
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
                        <Text style={styles.modalSubtitle}>Adapte l’interface à ton environnement.</Text>
                        <View style={styles.modalThemePreviewRow}>
                            <LinearGradient
                                colors={["rgba(15,23,42,0.9)", selectedTheme?.accent || "rgba(59,130,246,0.25)"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.modalThemeCard}
                            >
                                <Text style={styles.modalThemeCardTitle}>Mood en direct</Text>
                                <Text style={styles.modalThemeCardText}>{selectedTheme?.label}</Text>
                            </LinearGradient>
                        </View>
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
    input: { backgroundColor: "rgba(15,23,42,0.45)", marginBottom: 4 },
    helper: { marginBottom: 8 },
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
    themePreview: { marginTop: 12 },
    themePreviewGradient: {
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
    },
    themePreviewTitle: { color: "#f8fafc", fontSize: 14, fontWeight: "600" },
    themePreviewText: { color: "#cbd5e1", fontSize: 12, marginTop: 4 },
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
    modalThemePreviewRow: { marginBottom: 8 },
    modalThemeCard: {
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
    },
    modalThemeCardTitle: { color: "#f1f5f9", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 },
    modalThemeCardText: { color: "#0ea5e9", fontSize: 18, fontWeight: "700", marginTop: 6 },
});
