import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Pressable,
    FlatList,
    Image,
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
import { useAuth } from "../../../src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { updateUserProfile, uploadProfilePhoto } from "../../../src/api/userService";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
    DateTimePickerAndroid,
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { COUNTRIES } from "../../../src/constants/countries";

type IoniconName = keyof typeof Ionicons.glyphMap;

const DEFAULT_BIRTHDATE = new Date(2000, 0, 1);
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ?? "";

const parseBirthDate = (value?: string): Date | null => {
    if (!value) return null;
    const normalized = value.includes("T") ? value : `${value}T00:00:00`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatBirthDateDisplay = (value?: string): string => {
    const parsed = parseBirthDate(value);
    if (!parsed) return "Sélectionner";
    return parsed.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

const formatBirthDatePayload = (date: Date): string => date.toISOString().split("T")[0];

const sanitizeUsername = (value?: string): string => {
    if (typeof value !== "string") {
        return "";
    }
    return value.replace(/@/g, "").trim();
};

const resolvePhotoPreview = (value?: string | null): string | null => {
    if (!value) {
        return null;
    }
    if (/^https?:\/\//i.test(value)) {
        return value;
    }
    if (!API_BASE_URL) {
        return value;
    }
    const normalized = value.startsWith("/") ? value : `/${value}`;
    return `${API_BASE_URL}${normalized}`;
};

export default function PersonalInfoScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();

    const [formData, setFormData] = useState({
        username: sanitizeUsername(user?.username),
        gender: user?.gender || "",
        birthDate: user?.birthDate || "",
        country: user?.country || "",
    });

    const [loading, setLoading] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [tempBirthDate, setTempBirthDate] = useState<Date>(
        parseBirthDate(formData.birthDate) ?? DEFAULT_BIRTHDATE
    );
    const [countryPickerVisible, setCountryPickerVisible] = useState(false);
    const [countryQuery, setCountryQuery] = useState("");
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(resolvePhotoPreview(user?.photoUrl));

    const headerHeight = useHeaderHeight();
    const birthDateDisplay = formatBirthDateDisplay(formData.birthDate);
    const filteredCountries = useMemo(() => {
        const query = countryQuery.trim().toLowerCase();
        if (!query) return COUNTRIES;
        return COUNTRIES.filter((country) =>
            country.name.toLowerCase().includes(query)
        );
    }, [countryQuery]);

    const identitySignals = useMemo(
        () => [
            { key: "username", label: "Nom d'utilisateur", value: formData.username?.trim() },
            { key: "gender", label: "Genre", value: formData.gender },
            { key: "birthDate", label: "Date de naissance", value: formData.birthDate },
            { key: "country", label: "Pays", value: formData.country },
        ],
        [formData.birthDate, formData.country, formData.gender, formData.username],
    );

    const missingFields = useMemo(
        () => identitySignals.filter((signal) => !signal.value).map((signal) => signal.label),
        [identitySignals],
    );

    useEffect(() => {
        if (!user) {
            setPhotoPreview(null);
            return;
        }

        setFormData({
            username: sanitizeUsername(user.username),
            gender: user.gender || "",
            birthDate: user.birthDate || "",
            country: user.country || "",
        });

        setTempBirthDate(parseBirthDate(user.birthDate) ?? DEFAULT_BIRTHDATE);
        setPhotoPreview(resolvePhotoPreview(user.photoUrl));
    }, [user]);

    useEffect(() => {
        return () => {
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }
        };
    }, []);

    const handleChange = (key: string, value: string) => {
        const nextValue = key === "username" ? sanitizeUsername(value) : value;
        setFormData((prev) => ({ ...prev, [key]: nextValue }));
    };

    const handlePickProfilePhoto = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Accès requis", "Autorise TracknField à accéder à ta galerie pour changer la photo.");
                return;
            }

            const pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (pickerResult.canceled || !pickerResult.assets?.length) {
                return;
            }

            const selected = pickerResult.assets[0];
            if (!selected?.uri) {
                return;
            }

            setPhotoPreview(selected.uri);
            setPhotoUploading(true);
            const uploadedUrl = await uploadProfilePhoto(selected.uri);
            setPhotoPreview(resolvePhotoPreview(uploadedUrl));
            await refreshProfile();
        } catch (error: any) {
            console.error("Erreur upload photo", error);
            Alert.alert("❌ Erreur", "Impossible de mettre à jour ta photo de profil.");
        } finally {
            setPhotoUploading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                gender:
                    formData.gender === "male" || formData.gender === "female"
                        ? (formData.gender as "male" | "female")
                        : undefined,
            };

            await updateUserProfile(payload);
            await refreshProfile();
            setSuccessModalVisible(true);
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }
            successTimerRef.current = setTimeout(() => {
                setSuccessModalVisible(false);
                router.replace("/(main)/account");
            }, 1600);
        } catch (error: any) {
            console.error(error);
            Alert.alert(
                "❌ Erreur",
                error.message || "Impossible de mettre à jour vos informations."
            );
        } finally {
            setLoading(false);
        }
    };

    const openBirthDatePicker = () => {
        const currentDate = parseBirthDate(formData.birthDate) ?? DEFAULT_BIRTHDATE;

        if (Platform.OS === "android") {
            DateTimePickerAndroid.open({
                value: currentDate,
                mode: "date",
                display: "calendar",
                maximumDate: new Date(),
                onChange: (event, selectedDate) => {
                    if (event.type === "dismissed" || !selectedDate) {
                        return;
                    }
                    handleChange("birthDate", formatBirthDatePayload(selectedDate));
                },
            });
            return;
        }

        setTempBirthDate(currentDate);
        setDatePickerVisible(true);
    };

    const handleBirthDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (selectedDate) {
            setTempBirthDate(selectedDate);
        }
    };

    const handleBirthDateConfirm = () => {
        handleChange("birthDate", formatBirthDatePayload(tempBirthDate));
        setDatePickerVisible(false);
    };

    const openCountryPicker = () => {
        setCountryQuery("");
        setCountryPickerVisible(true);
    };

    const handleCountrySelect = (countryName: string) => {
        handleChange("country", countryName);
        setCountryPickerVisible(false);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={[styles.container, { paddingTop: headerHeight + 12 }]}>
                    <View style={styles.photoCard}>
                        <View style={styles.photoVisual}>
                            {photoPreview ? (
                                <>
                                    <Image source={{ uri: photoPreview }} style={styles.photoImage} />
                                    {photoUploading ? (
                                        <View style={styles.photoOverlay}>
                                            <ActivityIndicator animating color="#fff" />
                                        </View>
                                    ) : null}
                                </>
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Ionicons name="person-circle-outline" size={52} color="#94a3b8" />
                                </View>
                            )}
                        </View>
                        <View style={styles.photoContent}>
                            <Text style={styles.photoTitle}>Photo de profil</Text>

                            <Button
                                mode="outlined"
                                onPress={handlePickProfilePhoto}
                                style={styles.photoButton}
                                textColor="#22d3ee"
                                disabled={photoUploading}
                            >
                                {photoUploading ? "Chargement..." : "Modifier la photo"}
                            </Button>
                        </View>
                    </View>

                    <View style={styles.identitySummaryCard}>
                        <View style={styles.identitySummaryHeader}>
                            <Text style={styles.identitySummaryTitle}>Identité vérifiée</Text>
                            <Ionicons name="shield-checkmark-outline" size={18} color="#22d3ee" />
                        </View>
                        <View style={styles.identitySummaryGrid}>
                            <View style={styles.identitySummaryItem}>
                                <Text style={styles.identitySummaryLabel}>Nom complet</Text>
                                <Text style={styles.identitySummaryValue}>{user?.fullName || "—"}</Text>
                            </View>
                            <View style={styles.identitySummaryItem}>
                                <Text style={styles.identitySummaryLabel}>Email</Text>
                                <Text style={styles.identitySummaryValue}>{user?.email || "—"}</Text>
                            </View>
                        </View>
                    </View>

                    {missingFields.length ? (
                        <View style={styles.checklistCard}>
                            <View style={styles.checklistHeader}>
                                <Ionicons name="star-outline" size={18} color="#facc15" />
                                <Text style={styles.checklistTitle}>À compléter</Text>
                            </View>
                            {missingFields.map((item) => (
                                <View key={item} style={styles.checklistRow}>
                                    <View style={styles.checklistBullet}>
                                        <Ionicons name="ellipse" size={7} color="#facc15" />
                                    </View>
                                    <Text style={styles.checklistText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Profil public</Text>
                            <Text style={styles.sectionSubtitle}>Ce que ta communauté voit.</Text>
                        </View>
                        <View style={styles.sectionChipsRow}>
                            <Chip
                                style={styles.sectionChip}
                                textStyle={styles.sectionChipText}
                                icon="earth"
                            >
                                {formData.country ? "Pays affiché" : "Pays manquant"}
                            </Chip>
                            <Chip
                                style={styles.sectionChip}
                                textStyle={styles.sectionChipText}
                                icon="account"
                            >
                                {formData.gender ? "Genre défini" : "Genre à préciser"}
                            </Chip>
                        </View>
                        <TextInput
                            label="Nom d’utilisateur"
                            value={formData.username}
                            onChangeText={(v) => handleChange("username", v)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Genre"
                            value={
                                formData.gender === "male"
                                    ? "Homme"
                                    : formData.gender === "female"
                                        ? "Femme"
                                        : "Non renseigné"
                            }
                            style={styles.input}
                            editable={false}
                            right={<TextInput.Icon icon="lock" />}
                        />
                        <TextInput
                            label="Date de naissance"
                            value={formData.birthDate ? birthDateDisplay : ""}
                            placeholder="Sélectionner une date"
                            placeholderTextColor="#94a3b8"
                            style={styles.input}
                            editable={false}
                            onPressIn={openBirthDatePicker}
                            right={
                                <TextInput.Icon icon="calendar-range" onPress={openBirthDatePicker} />
                            }
                        />
                        <Text style={styles.inputHelper}>
                            Utilisée pour personnaliser ton expérience et tes records.
                        </Text>
                        <TextInput
                            label="Pays"
                            value={formData.country}
                            placeholder="Choisir un pays"
                            placeholderTextColor="#94a3b8"
                            style={styles.input}
                            editable={false}
                            onPressIn={openCountryPicker}
                            right={
                                <TextInput.Icon icon="map-marker" onPress={openCountryPicker} />
                            }
                        />
                        <Text style={styles.inputHelper}>Affiche quel drapeau sera visible sur ton profil.</Text>
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

            {Platform.OS === "ios" && (
                <Modal
                    transparent
                    statusBarTranslucent
                    animationType="fade"
                    visible={datePickerVisible}
                    onRequestClose={() => setDatePickerVisible(false)}
                >
                    <View style={styles.modalBackdrop}>
                        <Pressable
                            style={StyleSheet.absoluteFillObject}
                            onPress={() => setDatePickerVisible(false)}
                        />
                        <View style={styles.modalContent}>
                            <View style={styles.modalGrabber} />
                            <Text style={styles.pickerTitle}>Sélectionne ta date</Text>
                            <Text style={styles.pickerDescription}>
                                Nous l’utilisons pour t’offrir des recommandations adaptées à ton âge.
                            </Text>
                            <View style={styles.pickerPreview}>
                                <Text style={styles.pickerPreviewLabel}>Date sélectionnée</Text>
                                <Text style={styles.pickerPreviewValue}>
                                    {tempBirthDate.toLocaleDateString("fr-FR", {
                                        weekday: "long",
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </Text>
                            </View>
                            <DateTimePicker
                                value={tempBirthDate}
                                mode="date"
                                display="spinner"
                                onChange={handleBirthDateChange}
                                maximumDate={new Date()}
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
                                    onPress={handleBirthDateConfirm}
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

            <Modal
                transparent
                statusBarTranslucent
                animationType="fade"
                visible={countryPickerVisible}
                onRequestClose={() => setCountryPickerVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <Pressable
                        style={StyleSheet.absoluteFillObject}
                        onPress={() => setCountryPickerVisible(false)}
                    />
                    <View style={[styles.modalContent, styles.countryModal]}>
                        <View style={styles.modalGrabber} />
                        <Text style={styles.pickerTitle}>Choisis ton pays</Text>
                        <Text style={styles.pickerDescription}>
                            Utilisé pour tes classements, ton avatar et les recommandations locales.
                        </Text>
                        <TextInput
                            mode="outlined"
                            placeholder="Rechercher"
                            value={countryQuery}
                            onChangeText={setCountryQuery}
                            left={<TextInput.Icon icon="magnify" />}
                            style={styles.searchInput}
                            autoFocus
                        />
                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item.code}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={styles.countryList}
                            initialNumToRender={20}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => handleCountrySelect(item.name)}
                                    style={styles.countryRow}
                                >
                                    <View>
                                        <Text style={styles.countryName}>{item.name}</Text>
                                        <Text style={styles.countryCode}>{item.code}</Text>
                                    </View>
                                    {formData.country === item.name && (
                                        <Ionicons name="checkmark-circle" size={20} color="#22d3ee" />
                                    )}
                                </Pressable>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.emptyState}>
                                    Aucun pays trouvé, ajuste ta recherche.
                                </Text>
                            }
                        />
                    </View>
                </View>
            </Modal>
            <Modal
                transparent
                animationType="fade"
                visible={successModalVisible}
                onRequestClose={() => setSuccessModalVisible(false)}
            >
                <View style={styles.successModalBackdrop}>
                    <LinearGradient
                        colors={["rgba(34,211,238,0.95)", "rgba(59,130,246,0.9)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.successModalCard}
                    >
                        <View style={styles.successModalIconBadge}>
                            <Ionicons name="checkmark-done" size={20} color="#0f172a" />
                        </View>
                        <Text style={styles.successModalTitle}>Profil mis à jour</Text>
                        <Text style={styles.successModalSubtitle}>Vos informations personnelles ont été mises à jour !</Text>
                    </LinearGradient>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "transparent" },
    container: { padding: 20, paddingBottom: 60, gap: 20 },
    photoCard: {
        borderRadius: 26,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        backgroundColor: "rgba(15,23,42,0.65)",
        flexDirection: "row",
        gap: 16,
        alignItems: "center",
    },
    photoVisual: {
        width: 96,
        height: 96,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "rgba(15,23,42,0.85)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        justifyContent: "center",
        alignItems: "center",
    },
    photoImage: { width: "100%", height: "100%" },
    photoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(15,23,42,0.55)",
        justifyContent: "center",
        alignItems: "center",
    },
    photoPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
    photoContent: { flex: 1, gap: 8 },
    photoTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "700" },
    photoSubtitle: { color: "#94a3b8", fontSize: 13 },
    photoButton: {
        borderColor: "#22d3ee",
        borderWidth: 1,
        borderRadius: 14,
    },
    identitySummaryCard: {
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        backgroundColor: "rgba(15,23,42,0.6)",
        gap: 12,
    },
    identitySummaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    identitySummaryTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "700" },
    identitySummaryGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    identitySummaryItem: {
        flex: 1,
        padding: 12,
        borderRadius: 18,
        backgroundColor: "rgba(2,6,23,0.65)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
    },
    identitySummaryLabel: {
        color: "#94a3b8",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    identitySummaryValue: { color: "#f8fafc", fontSize: 15, fontWeight: "600", marginTop: 4 },
    sectionChipsRow: {
        flexDirection: "row",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 12,
    },
    sectionChip: {
        backgroundColor: "rgba(15,23,42,0.45)",
        borderColor: "rgba(148,163,184,0.35)",
    },
    sectionChipText: { color: "#e2e8f0", fontSize: 11 },
    checklistCard: {
        borderRadius: 22,
        padding: 16,
        backgroundColor: "rgba(15,23,42,0.6)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 10,
    },
    checklistHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    checklistTitle: { color: "#facc15", fontWeight: "700", fontSize: 13 },
    checklistRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    checklistBullet: {
        width: 20,
        alignItems: "center",
    },
    checklistText: { color: "#e2e8f0", fontSize: 13 },
    chip: { backgroundColor: "rgba(15,23,42,0.5)", borderColor: "rgba(148,163,184,0.3)" },
    chipText: { color: "#e2e8f0", fontSize: 12 },
    sectionCard: {
        borderRadius: 22,
        backgroundColor: "rgba(15,23,42,0.55)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        padding: 18,
    },
    sectionHeader: { marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: "#f8fafc" },
    sectionSubtitle: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
    input: {
        backgroundColor: "rgba(15,23,42,0.45)",
        marginBottom: 14,
    },
    inputHelper: { fontSize: 12, color: "#94a3b8", marginTop: -6, marginBottom: 12 },
    button: {
        borderRadius: 16,
        backgroundColor: "#22d3ee",
        marginBottom: 30,
    },
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
        gap: 18,
    },
    modalGrabber: {
        width: 60,
        height: 5,
        borderRadius: 999,
        backgroundColor: "rgba(148,163,184,0.4)",
        alignSelf: "center",
    },
    pickerTitle: { fontSize: 18, fontWeight: "700", color: "#f8fafc", textAlign: "center" },
    pickerDescription: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
    pickerPreview: {
        padding: 14,
        borderRadius: 18,
        backgroundColor: "rgba(15,23,42,0.7)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
    },
    pickerPreviewLabel: { fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 },
    pickerPreviewValue: { fontSize: 16, fontWeight: "600", color: "#f8fafc", marginTop: 6 },
    pickerActions: { flexDirection: "row", gap: 12 },
    pickerCancel: { flex: 1, borderRadius: 14, borderColor: "rgba(148,163,184,0.4)" },
    pickerButton: { flex: 1, borderRadius: 14 },
    countryModal: { maxHeight: "80%" },
    searchInput: {
        backgroundColor: "rgba(15,23,42,0.65)",
        marginTop: 4,
    },
    countryList: { paddingTop: 8 },
    countryRow: {
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(148,163,184,0.25)",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    countryName: { color: "#f8fafc", fontSize: 14, fontWeight: "600" },
    countryCode: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase" },
    emptyState: {
        color: "#94a3b8",
        textAlign: "center",
        paddingVertical: 20,
    },
    successModalBackdrop: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "rgba(2,6,23,0.65)",
    },
    successModalCard: {
        width: "100%",
        borderRadius: 26,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(240,253,250,0.35)",
        alignItems: "center",
        gap: 10,
    },
    successModalIconBadge: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: "rgba(248,250,252,0.95)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    successModalTitle: { color: "#ecfeff", fontSize: 18, fontWeight: "800" },
    successModalSubtitle: { color: "#e0f2fe", fontSize: 14, textAlign: "center" },
});
