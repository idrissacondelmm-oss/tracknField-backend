import React, { useMemo, useState } from "react";
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
import { updateUserProfile } from "../../../src/api/userService";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker, {
    DateTimePickerAndroid,
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { COUNTRIES } from "../../../src/constants/countries";

const DEFAULT_BIRTHDATE = new Date(2000, 0, 1);

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

export default function PersonalInfoScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();

    const [formData, setFormData] = useState({
        username: user?.username || "",
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

    const headerHeight = useHeaderHeight();
    const birthDateDisplay = formatBirthDateDisplay(formData.birthDate);
    const filteredCountries = useMemo(() => {
        const query = countryQuery.trim().toLowerCase();
        if (!query) return COUNTRIES;
        return COUNTRIES.filter((country) =>
            country.name.toLowerCase().includes(query)
        );
    }, [countryQuery]);

    const handleChange = (key: string, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
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
            Alert.alert("✅ Succès", "Vos informations ont été mises à jour !");
            router.replace("/(main)/account");
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
                    <LinearGradient
                        colors={["rgba(34,211,238,0.25)", "rgba(76,29,149,0.25)", "rgba(15,23,42,0.85)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        <View style={styles.heroIconWrapper}>
                            <Ionicons name="id-card-outline" size={28} color="#0f172a" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heroTitle}>Informations personnelles</Text>
                            <Text style={styles.heroSubtitle}>
                                Assure-toi que ton identité et ton pays sont à jour pour un profil fiable.
                            </Text>
                            <View style={styles.heroChips}>
                                <Chip icon="shield-account" textStyle={styles.chipText} style={styles.chip}>
                                    Sécurisé
                                </Chip>
                                <Chip icon="star" textStyle={styles.chipText} style={styles.chip}>
                                    Public
                                </Chip>
                            </View>
                        </View>
                    </LinearGradient>

                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Identité</Text>
                            <Text style={styles.sectionSubtitle}>Ces champs proviennent de ton inscription.</Text>
                        </View>
                        <TextInput
                            label="Nom complet"
                            value={user?.fullName || ""}
                            disabled
                            style={styles.input}
                        />
                        <TextInput
                            label="Email"
                            value={user?.email || ""}
                            disabled
                            style={styles.input}
                        />
                    </View>

                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Profil public</Text>
                            <Text style={styles.sectionSubtitle}>Ce que ta communauté voit.</Text>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "transparent" },
    container: { padding: 20, paddingBottom: 60, gap: 20 },
    heroCard: {
        borderRadius: 26,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        backgroundColor: "rgba(15,23,42,0.65)",
        flexDirection: "row",
        gap: 16,
    },
    heroIconWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#22d3ee",
        alignItems: "center",
        justifyContent: "center",
    },
    heroTitle: { fontSize: 20, fontWeight: "700", color: "#f8fafc" },
    heroSubtitle: { color: "#cbd5e1", fontSize: 13, marginTop: 6 },
    heroChips: { flexDirection: "row", gap: 10, marginTop: 14 },
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
});
