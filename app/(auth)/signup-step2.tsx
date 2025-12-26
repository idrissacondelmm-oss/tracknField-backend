import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerAndroid,
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useSignupWizard } from "../../src/context/SignupWizardContext";
import { useAuth } from "../../src/context/AuthContext";

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
const parseBirthDate = (value?: string) => {
    if (!value) return null;
    const normalized = value.includes("T") ? value : `${value}T00:00:00`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
};
const formatBirthDatePayload = (date: Date) => date.toISOString().split("T")[0];
const formatBirthDateDisplay = (value?: string) => {
    const parsed = parseBirthDate(value);
    if (!parsed) return "Sélectionner une date";
    return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};
const DEFAULT_BIRTHDATE = new Date(2000, 0, 1);

export default function SignupStep2Screen() {
    const router = useRouter();
    const { draft, setStep2, reset } = useSignupWizard();
    const { signup } = useAuth();

    const [birthDate, setBirthDate] = useState("");
    const [gender, setGender] = useState<"male" | "female" | "">("");
    const [role, setRole] = useState<"athlete" | "coach" | "">("");
    const [errors, setErrors] = useState<{ birthDate?: string; gender?: string; role?: string }>({});
    const [loading, setLoading] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [tempDate, setTempDate] = useState<Date>(parseBirthDate(birthDate) ?? DEFAULT_BIRTHDATE);

    const step1Ready = useMemo(
        () => Boolean(draft.firstName && draft.lastName && draft.email && draft.password),
        [draft]
    );

    useEffect(() => {
        if (!step1Ready) {
            router.replace("/(auth)/signup");
        }
    }, [step1Ready, router]);

    const validate = () => {
        const next: typeof errors = {};
        if (!birthDate || !isIsoDate(birthDate)) {
            next.birthDate = "Format AAAA-MM-JJ requis";
        }
        if (!gender) {
            next.gender = "Choisis un genre";
        }
        if (!role) {
            next.role = "Sélectionne un rôle";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async () => {
        if (!step1Ready) return;
        if (!validate()) return;
        setLoading(true);
        try {
            setStep2({ birthDate, gender: gender as any, role: role as any });
            await signup({
                firstName: draft.firstName || "",
                lastName: draft.lastName || "",
                email: draft.email || "",
                password: draft.password || "",
                birthDate,
                gender: gender as any,
                role: role as any,
            });
            reset();
            router.replace("/(main)/home");
        } catch (error) {
            console.error("Signup step2 error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBirthDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (!selectedDate) return;
        setTempDate(selectedDate);
        setBirthDate(formatBirthDatePayload(selectedDate));
    };

    const openDatePicker = () => {
        const currentDate = parseBirthDate(birthDate) ?? DEFAULT_BIRTHDATE;
        if (Platform.OS === "android") {
            DateTimePickerAndroid.open({
                value: currentDate,
                mode: "date",
                display: "calendar",
                maximumDate: new Date(),
                onChange: (event, selectedDate) => {
                    if (event.type === "dismissed" || !selectedDate) return;
                    handleBirthDateChange(event, selectedDate);
                },
            });
            return;
        }
        setTempDate(currentDate);
        setDatePickerVisible(true);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            <LinearGradient
                colors={["#0f172a", "#0b1120"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.container}>
                <LinearGradient
                    colors={["rgba(34,211,238,0.18)", "rgba(14,165,233,0.12)", "rgba(99,102,241,0.12)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.card}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.stepPill}>
                            <Text style={styles.stepText}>Étape 2 / 2</Text>
                        </View>
                        <View style={styles.headerTitleRow}>
                            <Ionicons name="sparkles-outline" size={18} color="#e0f2fe" />
                            <Text style={styles.title}>Complète ton profil</Text>
                        </View>
                        <Text style={styles.subtitle}>Date de naissance, genre, rôle</Text>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.sectionLabel}>Date de naissance</Text>
                        <Pressable
                            onPress={openDatePicker}
                            style={[styles.dateField, errors.birthDate ? styles.dateFieldError : null]}
                        >
                            <View style={styles.dateIconBadge}>
                                <Ionicons name="calendar-outline" size={18} color="#0f172a" />
                            </View>
                            <Text style={[styles.dateValue, !birthDate ? styles.datePlaceholder : null]}>
                                {formatBirthDateDisplay(birthDate)}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                        </Pressable>
                        {errors.birthDate ? <Text style={styles.error}>{errors.birthDate}</Text> : null}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.sectionLabel}>Genre</Text>
                        <View style={styles.chipRow}>
                            {[
                                { value: "male" as const, label: "Homme", icon: "man-outline" },
                                { value: "female" as const, label: "Femme", icon: "woman-outline" },
                            ].map((opt) => (
                                <Pressable
                                    key={opt.value}
                                    onPress={() => setGender(opt.value)}
                                    style={[styles.chip, gender === opt.value ? styles.chipActive : null]}
                                >
                                    <Ionicons
                                        name={opt.icon as any}
                                        size={16}
                                        color={gender === opt.value ? "#0f172a" : "#cbd5e1"}
                                    />
                                    <Text style={[styles.chipText, gender === opt.value ? styles.chipTextActive : null]}>
                                        {opt.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        {errors.gender ? <Text style={styles.error}>{errors.gender}</Text> : null}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.sectionLabel}>Tu es ?</Text>
                        <View style={styles.chipRow}>
                            {[
                                { value: "athlete" as const, label: "Athlète", icon: "body-outline" },
                                { value: "coach" as const, label: "Coach", icon: "school-outline" },
                            ].map((opt) => (
                                <Pressable
                                    key={opt.value}
                                    onPress={() => setRole(opt.value)}
                                    style={[styles.chip, role === opt.value ? styles.chipActive : null]}
                                >
                                    <Ionicons
                                        name={opt.icon as any}
                                        size={16}
                                        color={role === opt.value ? "#0f172a" : "#cbd5e1"}
                                    />
                                    <Text style={[styles.chipText, role === opt.value ? styles.chipTextActive : null]}>
                                        {opt.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        {errors.role ? <Text style={styles.error}>{errors.role}</Text> : null}
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                        contentStyle={{ paddingVertical: 10 }}
                    >
                        Terminer l'inscription
                    </Button>

                    {Platform.OS === "ios" && datePickerVisible ? (
                        <View style={styles.iosPickerCard}>
                            <DateTimePicker
                                value={tempDate}
                                mode="date"
                                display="spinner"
                                maximumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                    if (!selectedDate) {
                                        setDatePickerVisible(false);
                                        return;
                                    }
                                    handleBirthDateChange(event, selectedDate);
                                }}
                                style={{ alignSelf: "stretch" }}
                            />
                            <Button
                                mode="contained"
                                onPress={() => setDatePickerVisible(false)}
                                style={styles.iosPickerButton}
                                textColor="#0f172a"
                            >
                                Valider
                            </Button>
                        </View>
                    ) : null}
                </LinearGradient>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
    },
    container: {
        flex: 1,
        paddingHorizontal: 18,
        paddingVertical: 24,
        justifyContent: "center",
    },
    card: {
        borderRadius: 26,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        backgroundColor: "rgba(15,23,42,0.65)",
        gap: 14,
        shadowColor: "#0ea5e9",
        shadowOpacity: 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
    },
    cardHeader: {
        gap: 6,
    },
    stepPill: {
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: "rgba(34,211,238,0.18)",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.35)",
    },
    stepText: {
        color: "#e0f2fe",
        fontWeight: "700",
        fontSize: 12,
        letterSpacing: 0.5,
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
        color: "#f8fafc",
    },
    subtitle: {
        fontSize: 14,
        color: "#cbd5e1",
        marginBottom: 2,
    },
    fieldGroup: {
        gap: 4,
    },
    input: {
        backgroundColor: "rgba(15,23,42,0.45)",
    },
    inputOutline: {
        borderRadius: 16,
        borderColor: "rgba(148,163,184,0.4)",
    },
    sectionLabel: {
        color: "#e2e8f0",
        fontWeight: "700",
        marginTop: 2,
    },
    chipRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 8,
        marginBottom: 4,
        flexWrap: "wrap",
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.4)",
        backgroundColor: "rgba(15,23,42,0.35)",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    chipActive: {
        borderColor: "#22d3ee",
        backgroundColor: "rgba(34,211,238,0.2)",
    },
    chipText: {
        color: "#cbd5e1",
        fontWeight: "600",
    },
    chipTextActive: {
        color: "#0f172a",
    },
    dateField: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.4)",
        backgroundColor: "rgba(15,23,42,0.45)",
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    dateFieldError: {
        borderColor: "#ef4444",
    },
    dateIconBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#22d3ee",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(15,23,42,0.2)",
    },
    dateValue: {
        flex: 1,
        color: "#f8fafc",
        fontWeight: "700",
        fontSize: 14,
    },
    datePlaceholder: {
        color: "#cbd5e1",
        fontStyle: "italic",
        fontWeight: "600",
    },
    button: {
        marginTop: 12,
        borderRadius: 16,
        backgroundColor: "#22d3ee",
    },
    error: {
        color: "#ef4444",
        fontSize: 13,
        marginBottom: 4,
    },
    iosPickerCard: {
        marginTop: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        backgroundColor: "rgba(15,23,42,0.85)",
        padding: 12,
        gap: 8,
    },
    iosPickerButton: {
        borderRadius: 12,
        backgroundColor: "#22d3ee",
    },
});
