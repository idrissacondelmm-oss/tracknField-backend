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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
    TextInput,
    Button,
    Text,
    ActivityIndicator,
    Chip,
} from "react-native-paper";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { updateUserProfile, uploadProfilePhoto } from "../../../src/api/userService";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
    DateTimePickerAndroid,
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

const DEFAULT_BIRTHDATE = new Date(2000, 0, 1);
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ?? "";
const IMAGE_MEDIA_TYPES: ImagePicker.MediaType[] = ["images"];

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

type PersonalFormData = {
    username: string;
    gender: string;
    birthDate: string;
    city: string;
    phoneNumber: string;
    trainingAddress: string;
};

const normalizePersonalFormData = (value: PersonalFormData): PersonalFormData => ({
    username: sanitizeUsername(value.username).trim(),
    gender: (value.gender || "").trim(),
    birthDate: (value.birthDate || "").trim(),
    city: (value.city || "").trim(),
    phoneNumber: (value.phoneNumber || "").trim(),
    trainingAddress: (value.trainingAddress || "").trim(),
});

type CityOption = {
    code: string;
    nom: string;
    codesPostaux?: string[];
    codeDepartement?: string;
};

const getDepartmentCodeFromPostalPrefix = (postalPrefix: string): string | null => {
    const digits = (postalPrefix || "").replace(/\D/g, "");
    if (digits.length < 2) return null;

    // Overseas departments use 3-digit department codes (971–976).
    if ((digits.startsWith("97") || digits.startsWith("98")) && digits.length >= 3) {
        return digits.slice(0, 3);
    }
    return digits.slice(0, 2);
};

export default function PersonalInfoScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();
    const insets = useSafeAreaInsets();

    const [formData, setFormData] = useState({
        username: sanitizeUsername(user?.username),
        gender: user?.gender || "",
        birthDate: user?.birthDate || "",
        city: user?.city || "",
        phoneNumber: user?.phoneNumber || user?.phone || "",
        trainingAddress: user?.trainingAddress || "",
    });

    const initialFormRef = useRef<PersonalFormData>(
        normalizePersonalFormData({
            username: sanitizeUsername(user?.username),
            gender: user?.gender || "",
            birthDate: user?.birthDate || "",
            city: user?.city || "",
            phoneNumber: user?.phoneNumber || user?.phone || "",
            trainingAddress: user?.trainingAddress || "",
        }),
    );

    const [loading, setLoading] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [tempBirthDate, setTempBirthDate] = useState<Date>(
        parseBirthDate(formData.birthDate) ?? DEFAULT_BIRTHDATE
    );
    const [cityPickerVisible, setCityPickerVisible] = useState(false);
    const [cityQuery, setCityQuery] = useState("");
    const [cityResults, setCityResults] = useState<CityOption[]>([]);
    const [cityLoading, setCityLoading] = useState(false);
    const [cityError, setCityError] = useState<string | null>(null);
    const cityAbortRef = useRef<AbortController | null>(null);
    const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(resolvePhotoPreview(user?.photoUrl));

    const birthDateDisplay = formatBirthDateDisplay(formData.birthDate);

    const isDirty = useMemo(() => {
        const current = normalizePersonalFormData(formData as PersonalFormData);
        return JSON.stringify(current) !== JSON.stringify(initialFormRef.current);
    }, [formData]);

    const saveDisabled = loading || photoUploading || !isDirty;
    const identitySignals = useMemo(
        () => [
            { key: "username", label: "Nom d'utilisateur", value: formData.username?.trim() },
            { key: "gender", label: "Genre", value: formData.gender },
            { key: "birthDate", label: "Date de naissance", value: formData.birthDate },
            { key: "city", label: "Ville", value: formData.city },
        ],
        [formData.birthDate, formData.city, formData.gender, formData.username],
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

        const nextFormData: PersonalFormData = {
            username: sanitizeUsername(user.username),
            gender: user.gender || "",
            birthDate: user.birthDate || "",
            city: user.city || "",
            phoneNumber: user.phoneNumber || user.phone || "",
            trainingAddress: user.trainingAddress || "",
        };

        setFormData(nextFormData);
        initialFormRef.current = normalizePersonalFormData(nextFormData);

        setTempBirthDate(parseBirthDate(user.birthDate) ?? DEFAULT_BIRTHDATE);
        setPhotoPreview(resolvePhotoPreview(user.photoUrl));
    }, [user]);

    useEffect(() => {
        return () => {
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }
            if (cityDebounceRef.current) {
                clearTimeout(cityDebounceRef.current);
            }
            if (cityAbortRef.current) {
                cityAbortRef.current.abort();
            }
        };
    }, []);

    useEffect(() => {
        if (!cityPickerVisible) return;

        const query = cityQuery.trim();
        setCityError(null);

        if (cityDebounceRef.current) {
            clearTimeout(cityDebounceRef.current);
        }

        if (!query || query.length < 2) {
            setCityResults([]);
            setCityLoading(false);
            if (cityAbortRef.current) {
                cityAbortRef.current.abort();
                cityAbortRef.current = null;
            }
            return;
        }

        cityDebounceRef.current = setTimeout(async () => {
            try {
                if (cityAbortRef.current) {
                    cityAbortRef.current.abort();
                }
                const controller = new AbortController();
                cityAbortRef.current = controller;

                setCityLoading(true);
                const isNumeric = /^\d+$/.test(query);
                const isPostalPrefix = isNumeric && query.length >= 2 && query.length <= 5;

                let url: string;
                let postalPrefixFilter: string | null = null;

                if (isPostalPrefix && query.length < 5) {
                    const dept = getDepartmentCodeFromPostalPrefix(query);
                    if (!dept) {
                        setCityResults([]);
                        setCityLoading(false);
                        return;
                    }
                    // geo.api.gouv.fr doesn't support partial codePostal matching.
                    // For prefixes (e.g. "75", "750", "7500"), fetch communes by department and filter client-side.
                    // Note: the API response order for codeDepartement isn't reliably population-sorted; with low limits,
                    // larger cities can be missing (e.g. Nancy for 54). Use a higher limit then slice after filtering.
                    url = `https://geo.api.gouv.fr/communes?codeDepartement=${encodeURIComponent(dept)}&fields=nom,code,codesPostaux,codeDepartement&limit=1000`;
                    postalPrefixFilter = query;
                } else if (isPostalPrefix && query.length === 5) {
                    url = `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,codeDepartement&boost=population&limit=20`;
                } else {
                    url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,codeDepartement&boost=population&limit=20`;
                }

                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) {
                    throw new Error("Recherche indisponible");
                }

                const json = (await res.json()) as CityOption[];
                const base = Array.isArray(json) ? json : [];
                let results = base;

                if (postalPrefixFilter) {
                    const prefix = postalPrefixFilter;
                    // If user typed 2 digits (department), show top communes directly.
                    // If user typed 3+ digits, filter by postal-code prefix.
                    if (prefix.length >= 3) {
                        results = results.filter((item) =>
                            (item.codesPostaux || []).some((cp) => String(cp).startsWith(prefix))
                        );
                    }
                    results = results.slice(0, 20);
                }

                setCityResults(results);
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                setCityResults([]);
                setCityError("Impossible de charger les villes");
            } finally {
                setCityLoading(false);
            }
        }, 250);

        return () => {
            if (cityDebounceRef.current) {
                clearTimeout(cityDebounceRef.current);
            }
        };
    }, [cityPickerVisible, cityQuery]);

    const handleChange = (key: string, value: string) => {
        const nextValue = key === "username" ? sanitizeUsername(value) : value;
        setFormData((prev) => ({ ...prev, [key]: nextValue }));
    };

    const pickAndUploadPhoto = async (source: "camera" | "library") => {
        try {
            if (source === "camera") {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert("Accès requis", "Autorise Talent-X à accéder à ta caméra pour prendre une photo.");
                    return;
                }
            } else {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert("Accès requis", "Autorise Talent-X à accéder à ta galerie pour changer la photo.");
                    return;
                }
            }

            const pickerResult =
                source === "camera"
                    ? await ImagePicker.launchCameraAsync({
                        mediaTypes: IMAGE_MEDIA_TYPES,
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.9,
                    })
                    : await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: IMAGE_MEDIA_TYPES,
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.9,
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

    const handlePickProfilePhoto = () => {
        Alert.alert(
            "Photo de profil",
            "Choisis une source",
            [
                { text: "Caméra", onPress: () => pickAndUploadPhoto("camera") },
                { text: "Galerie", onPress: () => pickAndUploadPhoto("library") },
                { text: "Annuler", style: "cancel" },
            ],
            { cancelable: true },
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                // City selection is restricted to France; keep the backend country field consistent without exposing it in the UI.
                country: "France",
                gender:
                    formData.gender === "male" || formData.gender === "female"
                        ? (formData.gender as "male" | "female")
                        : undefined,
            };

            await updateUserProfile(payload);
            await refreshProfile();
            initialFormRef.current = normalizePersonalFormData(formData as PersonalFormData);
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

    const openCityPicker = () => {
        setCityQuery("");
        setCityResults([]);
        setCityError(null);
        setCityPickerVisible(true);
    };

    const handleCitySelect = (cityName: string) => {
        handleChange("city", cityName);
        setCityPickerVisible(false);
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: "Informations personnelles",
                    headerRight: () => (
                        <Pressable
                            onPress={handleSave}
                            disabled={saveDisabled}
                            hitSlop={10}
                            style={({ pressed }) => [
                                styles.headerSaveButton,
                                saveDisabled ? styles.headerSaveButtonDisabled : null,
                                pressed && !saveDisabled ? styles.headerSaveButtonPressed : null,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Enregistrer"
                        >
                            <Ionicons
                                name="save-outline"
                                size={22}
                                color={saveDisabled ? "#94a3b8" : "#22d3ee"}
                            />
                        </Pressable>
                    ),
                }}
            />

            <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={[
                            styles.container,
                            { paddingTop: 8, paddingBottom: insets.bottom },
                        ]}
                    >
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
                                    icon="map-marker"
                                >
                                    {formData.city ? "Ville affichée" : "Ville manquante"}
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
                                label="Ville (France)"
                                value={formData.city}
                                placeholder="Nom ou code postal"
                                placeholderTextColor="#94a3b8"
                                style={styles.input}
                                editable={false}
                                onPressIn={openCityPicker}
                                right={
                                    <TextInput.Icon icon="map-marker" onPress={openCityPicker} />
                                }
                            />
                            <Text style={styles.inputHelper}>Recherche ta ville par nom ou code postal.</Text>
                            {user?.role === "coach" ? (
                                <View style={styles.subSection}>
                                    <Text style={styles.sectionSubtitle}>Coordonnées d’entraînement (coach)</Text>
                                    <TextInput
                                        label="Numéro de téléphone"
                                        value={formData.phoneNumber}
                                        onChangeText={(v) => handleChange("phoneNumber", v)}
                                        style={styles.input}
                                        keyboardType="phone-pad"
                                        placeholder="+33 6 12 34 56 78"
                                        placeholderTextColor="#94a3b8"
                                    />
                                    <TextInput
                                        label="Adresse d'entraînement"
                                        value={formData.trainingAddress}
                                        onChangeText={(v) => handleChange("trainingAddress", v)}
                                        style={styles.input}
                                        placeholder="Stade, ville…"
                                        placeholderTextColor="#94a3b8"
                                        multiline
                                    />
                                    <Text style={styles.inputHelper}>
                                        Partagées sur ton profil public pour que les athlètes puissent te contacter.
                                    </Text>
                                </View>
                            ) : null}
                        </View>

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
                    visible={cityPickerVisible}
                    onRequestClose={() => setCityPickerVisible(false)}
                >
                    <View style={styles.modalBackdrop}>
                        <Pressable
                            style={StyleSheet.absoluteFillObject}
                            onPress={() => setCityPickerVisible(false)}
                        />
                        <KeyboardAvoidingView
                            behavior="padding"
                            keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom + 12 : 0}
                            style={styles.modalAvoidingContainer}
                        >
                            <View style={[styles.modalContent, styles.countryModal]}>
                                <View style={styles.modalGrabber} />
                                <Text style={styles.pickerTitle}>Choisis ta ville</Text>
                                <Text style={styles.pickerDescription}>
                                    Recherche une ville française par nom ou code postal.
                                </Text>
                                <TextInput
                                    mode="outlined"
                                    placeholder="Nom ou code postal"
                                    value={cityQuery}
                                    onChangeText={setCityQuery}
                                    left={<TextInput.Icon icon="magnify" />}
                                    style={styles.searchInput}
                                    autoFocus
                                />
                                {cityLoading ? (
                                    <View style={{ alignItems: "center" }}>
                                        <ActivityIndicator animating color="#22d3ee" />
                                    </View>
                                ) : null}
                                <FlatList
                                    data={cityResults}
                                    keyExtractor={(item) => item.code}
                                    keyboardShouldPersistTaps="handled"
                                    contentContainerStyle={styles.countryList}
                                    initialNumToRender={20}
                                    renderItem={({ item }) => (
                                        <Pressable
                                            onPress={() => handleCitySelect(item.nom)}
                                            style={styles.countryRow}
                                        >
                                            <View>
                                                <Text style={styles.countryName}>{item.nom}</Text>
                                                <Text style={styles.countryCode}>
                                                    {(item.codesPostaux || []).slice(0, 3).join(", ") || item.codeDepartement || item.code}
                                                </Text>
                                            </View>
                                            {formData.city === item.nom && (
                                                <Ionicons name="checkmark-circle" size={20} color="#22d3ee" />
                                            )}
                                        </Pressable>
                                    )}
                                    ListEmptyComponent={
                                        <Text style={styles.emptyState}>
                                            {cityError || (cityQuery.trim().length < 2 ? "Saisis au moins 2 caractères." : "Aucune ville trouvée.")}
                                        </Text>
                                    }
                                />
                            </View>
                        </KeyboardAvoidingView>
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
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "transparent" },
    container: { paddingHorizontal: 8, paddingTop: 0, paddingBottom: 0, gap: 5 },
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
        padding: 10,
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
        gap: 8,
    },
    identitySummaryItem: {
        flex: 1,
        padding: 10,
        borderRadius: 18,
        backgroundColor: "rgba(2,6,23,0.65)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
    },
    identitySummaryLabel: {
        color: "#94a3b8",
        fontSize: 10,
        letterSpacing: 0.5,
    },
    identitySummaryValue: { color: "#f8fafc", fontSize: 11, fontWeight: "600", marginTop: 4 },
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
    subSection: {
        marginTop: 10,
        gap: 12,
    },
    input: {
        backgroundColor: "rgba(15,23,42,0.45)",
        marginBottom: 14,
    },
    inputHelper: { fontSize: 12, color: "#94a3b8", marginTop: -6, marginBottom: 12 },
    headerSaveButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
    },
    headerSaveButtonDisabled: {
        opacity: 0.6,
    },
    headerSaveButtonPressed: {
        opacity: 0.85,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(2,6,23,0.75)",
        justifyContent: "flex-end",
    },
    modalAvoidingContainer: {
        flex: 1,
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
