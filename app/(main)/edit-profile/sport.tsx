import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
    TextInput,
    Button,
    Text,
} from "react-native-paper";
import { Stack, useRouter } from "expo-router";
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

const DAY_TIME_OPTIONS = [
    { value: "morning", label: "Matin", icon: "sunny-outline" as const },
    { value: "afternoon", label: "Après-midi", icon: "partly-sunny-outline" as const },
    { value: "evening", label: "Soir", icon: "moon-outline" as const },
    { value: "night", label: "Nuit", icon: "moon" as const },
];

export default function SportInfoScreen() {
    const router = useRouter();
    const { user, refreshProfile, setUser } = useAuth();

    const [formData, setFormData] = useState({
        mainDiscipline: user?.mainDiscipline || "",
        otherDisciplines: user?.otherDisciplines?.join(", ") || "",
        club: user?.club || "",
        licenseNumber: user?.licenseNumber || "",
        category: user?.category || "",
        goals: user?.goals || "",
        preferredTrainingTime: user?.preferredTrainingTime || "morning",
        weeklySessions: (user?.weeklySessions ?? 3).toString(),
        bodyWeightKg: user?.bodyWeightKg ? String(user.bodyWeightKg) : "",
        maxMuscuKg: user?.maxMuscuKg ? String(user.maxMuscuKg) : "",
        maxChariotKg: user?.maxChariotKg ? String(user.maxChariotKg) : "",
    });


    const initialFamilyId = useMemo(() => {
        return findFamilyByDiscipline(user?.mainDiscipline)?.id ?? DISCIPLINE_GROUPS[0]?.id;
    }, [user?.mainDiscipline]);

    const [selectedFamilyId, setSelectedFamilyId] = useState<string | undefined>(initialFamilyId);

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
    const [familyPickerVisible, setFamilyPickerVisible] = useState(false);
    const [primaryPickerVisible, setPrimaryPickerVisible] = useState(false);

    const primaryOptions = useMemo(() => getPrimaryOptionsForFamily(selectedFamily), [selectedFamily]);

    const primaryDisciplineSet = useMemo(() => {
        if (!selectedFamily) return [] as string[];
        return getDisciplinesForPrimary(selectedFamily, selectedDiscipline);
    }, [selectedFamily, selectedDiscipline]);

    const secondaryOptions = useMemo(() => {
        const primarySet = new Set(primaryDisciplineSet);
        return ALL_DISCIPLINES.filter((discipline) => !primarySet.has(discipline));
    }, [primaryDisciplineSet]);

    type SportSnapshot = {
        mainDiscipline: string;
        otherDisciplines: string[];
        club: string;
        category: string;
        goals: string;
        preferredTrainingTime: string;
        weeklySessions: number;
        bodyWeightKg: number | null;
        maxMuscuKg: number | null;
        maxChariotKg: number | null;
    };

    const buildSnapshot = useCallback(
        (data: typeof formData, secondary: string[]): SportSnapshot => {
            const parseNum = (value: string) => {
                const trimmed = value.trim();
                if (!trimmed) return null;
                const n = Number(trimmed);
                return Number.isFinite(n) ? n : null;
            };

            return {
                mainDiscipline: (data.mainDiscipline || "").trim(),
                otherDisciplines: [...secondary].map((d) => d.trim()).filter(Boolean).sort(),
                club: (data.club || "").trim(),
                category: (data.category || "").trim(),
                goals: (data.goals || "").trim(),
                preferredTrainingTime: (data.preferredTrainingTime || "").trim(),
                weeklySessions: Number(data.weeklySessions) || 0,
                bodyWeightKg: parseNum(data.bodyWeightKg),
                maxMuscuKg: parseNum(data.maxMuscuKg),
                maxChariotKg: parseNum(data.maxChariotKg),
            };
        },
        [],
    );

    const handleFamilyPress = (familyId: string) => {
        setSelectedFamilyId(familyId);
    };

    const openFamilyPicker = () => setFamilyPickerVisible(true);
    const closeFamilyPicker = () => setFamilyPickerVisible(false);
    const handleFamilySelect = (familyId: string) => {
        handleFamilyPress(familyId);
        closeFamilyPicker();
    };
    const openPrimaryPicker = () => setPrimaryPickerVisible(true);
    const closePrimaryPicker = () => setPrimaryPickerVisible(false);
    const handlePrimarySelect = (discipline: string) => {
        setSelectedDiscipline(discipline);
        closePrimaryPicker();
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
    const [clubEditorVisible, setClubEditorVisible] = useState(false);
    const [clubDraft, setClubDraft] = useState(formData.club);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const baselineSnapshotRef = useRef<SportSnapshot | null>(null);
    const baselineReady = useMemo(() => {
        const primarySet = new Set(primaryDisciplineSet);
        return selectedSecondary.every((item) => !primarySet.has(item));
    }, [primaryDisciplineSet, selectedSecondary]);

    useEffect(() => {
        if (baselineSnapshotRef.current) return;
        if (!baselineReady) return;
        baselineSnapshotRef.current = buildSnapshot(formData, selectedSecondary);
    }, [baselineReady, buildSnapshot, formData, selectedSecondary]);

    const isDirty = useMemo(() => {
        if (!baselineSnapshotRef.current) return false;
        return JSON.stringify(buildSnapshot(formData, selectedSecondary)) !== JSON.stringify(baselineSnapshotRef.current);
    }, [buildSnapshot, formData, selectedSecondary]);

    const saveDisabled = loading || !isDirty;

    const handleChange = (key: string, value: string) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    const openClubEditor = () => {
        setClubDraft(formData.club);
        setClubEditorVisible(true);
    };

    const closeClubEditor = () => setClubEditorVisible(false);

    const handleClubEditorSave = () => {
        handleChange("club", clubDraft.trim());
        setClubEditorVisible(false);
    };

    useEffect(() => {
        return () => {
            if (successTimerRef.current) {
                clearTimeout(successTimerRef.current);
            }
        };
    }, []);

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
            const { licenseNumber: _licenseNumber, ...restFormData } = formData;
            const payload = {
                ...restFormData,
                otherDisciplines: selectedSecondary,
                preferredTrainingTime: formData.preferredTrainingTime,
                weeklySessions: Number(formData.weeklySessions) || 0,
                bodyWeightKg: formData.bodyWeightKg ? Number(formData.bodyWeightKg) : undefined,
                maxMuscuKg: formData.maxMuscuKg ? Number(formData.maxMuscuKg) : undefined,
                maxChariotKg: formData.maxChariotKg ? Number(formData.maxChariotKg) : undefined,
            };

            const updated = await updateUserProfile(payload);
            if (updated) {
                setUser(updated);
            }
            await refreshProfile();
            baselineSnapshotRef.current = buildSnapshot(formData, selectedSecondary);
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
                error.message || "Impossible de mettre à jour vos informations sportives."
            );
        } finally {
            setLoading(false);
        }
    };

    const insets = useSafeAreaInsets();

    return (
        <>
            <Stack.Screen
                options={{
                    title: "Informations sportives",
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

            <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 12 : 0}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={[
                            styles.container,
                            { paddingTop: 12, paddingBottom: insets.bottom + 120 },
                        ]}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                    >
                        <LinearGradient
                            colors={["rgba(94,234,212,0.25)", "rgba(79,70,229,0.25)", "rgba(15,23,42,0.85)"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroCard}
                        >
                            <View >
                                <Text style={styles.heroSubtitle}>
                                    Numéro de licence : {formData.licenseNumber?.trim() ? formData.licenseNumber.trim() : "—"}
                                </Text>
                            </View>
                        </LinearGradient>

                        <View style={styles.highlightRow}>
                            <Pressable
                                style={styles.highlightPressable}
                                onPress={openClubEditor}
                                accessibilityRole="button"
                                accessibilityLabel="Modifier le nom de ton club"
                            >
                                <LinearGradient
                                    colors={["rgba(59,130,246,0.25)", "rgba(14,165,233,0.08)"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.highlightCard}
                                >
                                    <View style={styles.highlightHeader}>
                                        <Text style={styles.highlightLabel}>Club</Text>
                                        <View style={styles.highlightAction}>
                                            <Ionicons name="create-outline" size={16} color="#0f172a" />
                                            <Text style={styles.highlightActionText}>Modifier</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.highlightValue}>{formData.club || "Ajoute ton club"}</Text>
                                </LinearGradient>
                            </Pressable>
                        </View>

                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Objectifs de la saison</Text>
                            </View>
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
                                <Text style={styles.sectionTitle}>Disciplines</Text>
                            </View>
                            <Text style={styles.sectionLabel}>Famille de discipline</Text>
                            <Pressable style={styles.selectorDropdown} onPress={openFamilyPicker}>
                                <View style={styles.selectorDropdownContent}>
                                    <View style={styles.selectorDropdownIcon}>
                                        <Ionicons name="layers-outline" size={18} color="#0f172a" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.selectorDropdownLabel}>{selectedFamily?.label}</Text>
                                        <Text style={styles.selectorDropdownMeta}>
                                            {selectedFamily?.disciplines.length ?? 0} épreuves proposées
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-down" size={18} color="#e2e8f0" />
                            </Pressable>

                            <View style={styles.disciplinePanel}>
                                <View style={styles.disciplinePanelHeader}>
                                    <Text style={styles.panelTitle}>{selectedFamily?.label}</Text>
                                    <Text style={styles.panelSubtitle}>
                                        Choisis une discipline principale puis complète avec des épreuves secondaires.
                                    </Text>
                                </View>

                                <Text style={styles.sectionLabel}>Discipline principale</Text>
                                <Pressable
                                    style={[
                                        styles.selectorDropdown,
                                        !primaryOptions.length && styles.selectorDropdownDisabled,
                                    ]}
                                    onPress={openPrimaryPicker}
                                    disabled={!primaryOptions.length}
                                >
                                    <View style={styles.selectorDropdownContent}>
                                        <View style={styles.selectorDropdownIcon}>
                                            <Ionicons name="flag-outline" size={18} color="#0f172a" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.selectorDropdownLabel}>
                                                {selectedDiscipline || "Aucune discipline disponible"}
                                            </Text>
                                            <Text style={styles.selectorDropdownMeta}>
                                                {primaryOptions.length
                                                    ? `${primaryOptions.length} possibilités`
                                                    : "Sélectionne d'abord une famille"}
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-down" size={18} color="#e2e8f0" />
                                </Pressable>

                                {selectedFamily?.subGroups?.length ? (
                                    <View style={styles.primaryDisciplinesBlock}>
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
                                                    style={[styles.secondaryChip, isActive && styles.secondaryChipActive]}
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

                        </View>
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Préférences entraînement</Text>
                                <Text style={styles.sectionSubtitle}>Ces infos nous aident à calibrer les séances.</Text>
                            </View>
                            <Text style={styles.sectionLabel}>Moment préféré</Text>
                            <View style={styles.surfaceToggleRow}>
                                {DAY_TIME_OPTIONS.map((option) => {
                                    const isActive = formData.preferredTrainingTime === option.value;
                                    return (
                                        <Pressable
                                            key={option.value}
                                            style={[styles.surfaceChip, isActive && styles.surfaceChipActive]}
                                            onPress={() => handleChange("preferredTrainingTime", option.value)}
                                        >
                                            <Ionicons
                                                name={option.icon}
                                                size={16}
                                                color={isActive ? "#0f172a" : "#cbd5e1"}
                                            />
                                            <Text
                                                style={[styles.surfaceChipText, isActive && styles.surfaceChipTextActive]}
                                            >
                                                {option.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>

                            <TextInput
                                label="Séances par semaine"
                                value={formData.weeklySessions}
                                keyboardType="number-pad"
                                onChangeText={(value) => handleChange("weeklySessions", value.replace(/[^0-9]/g, ""))}
                                style={styles.input}
                                placeholder="Ex: 4"
                            />
                            <Text style={styles.inputHelper}>Nous ajustons les charges en fonction du volume hebdo.</Text>
                        </View>

                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Profil physique</Text>
                                <Text style={styles.sectionSubtitle}>Utilisé pour les charges et recommandations.</Text>
                            </View>
                            <View style={styles.metricsRow}>
                                <View style={styles.metricsColumn}>
                                    <TextInput
                                        label="Poids de corps (kg)"
                                        value={formData.bodyWeightKg}
                                        keyboardType="numeric"
                                        onChangeText={(value) => handleChange("bodyWeightKg", value.replace(/[^0-9.]/g, ""))}
                                        style={styles.input}
                                        placeholder="68"
                                    />
                                </View>
                                <View style={styles.metricsColumn}>
                                    <TextInput
                                        label="Max muscu (kg)"
                                        value={formData.maxMuscuKg}
                                        keyboardType="numeric"
                                        onChangeText={(value) => handleChange("maxMuscuKg", value.replace(/[^0-9.]/g, ""))}
                                        style={styles.input}
                                        placeholder="120"
                                    />
                                </View>
                            </View>
                            <TextInput
                                label="Max chariot (kg)"
                                value={formData.maxChariotKg}
                                keyboardType="numeric"
                                onChangeText={(value) => handleChange("maxChariotKg", value.replace(/[^0-9.]/g, ""))}
                                style={styles.input}
                                placeholder="40"
                            />
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
                <Modal
                    visible={clubEditorVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={closeClubEditor}
                >
                    <View style={styles.clubModalOverlay}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={closeClubEditor} />
                        <LinearGradient
                            colors={["rgba(15,23,42,0.95)", "rgba(79,70,229,0.85)"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.clubModalCard}
                        >
                            <View style={styles.clubModalHeader}>
                                <Text style={styles.clubModalTitle}>Modifier ton club</Text>
                                <Pressable style={styles.clubModalCloseButton} onPress={closeClubEditor}>
                                    <Ionicons name="close" size={18} color="#e2e8f0" />
                                </Pressable>
                            </View>
                            <Text style={styles.clubModalDescription}>
                                Mets à jour ton club ou ton collectif actuel. Cette info apparaîtra sur ton profil public.
                            </Text>
                            <TextInput
                                mode="outlined"
                                label="Nom du club"
                                value={clubDraft}
                                onChangeText={setClubDraft}
                                style={styles.clubModalInput}
                                placeholder="Entre le nom complet"
                            />
                            <View style={styles.clubModalActions}>
                                <Button mode="text" onPress={closeClubEditor} textColor="#cbd5e1">
                                    Annuler
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={handleClubEditorSave}
                                    buttonColor="#22d3ee"
                                    disabled={!clubDraft.trim()}
                                >
                                    Enregistrer
                                </Button>
                            </View>
                        </LinearGradient>
                    </View>
                </Modal>
                <Modal
                    transparent
                    animationType="fade"
                    visible={familyPickerVisible}
                    onRequestClose={closeFamilyPicker}
                >
                    <View style={styles.selectorModalOverlay}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={closeFamilyPicker} />
                        <View style={styles.selectorModalCard}>
                            <Text style={styles.selectorModalTitle}>Choisis ta famille</Text>
                            <Text style={styles.selectorModalSubtitle}>
                                Nous utiliserons cette sélection pour personnaliser les disciplines proposées.
                            </Text>
                            <ScrollView style={styles.selectorModalList}>
                                {DISCIPLINE_GROUPS.map((group) => {
                                    const isActive = selectedFamily?.id === group.id;
                                    return (
                                        <Pressable
                                            key={group.id}
                                            style={[styles.selectorOptionRow, isActive && styles.selectorOptionRowActive]}
                                            onPress={() => handleFamilySelect(group.id)}
                                        >
                                            <View>
                                                <Text
                                                    style={[styles.selectorOptionLabel, isActive && styles.selectorOptionLabelActive]}
                                                >
                                                    {group.label}
                                                </Text>
                                                <Text style={styles.selectorOptionMeta}>
                                                    {group.disciplines.length} disciplines principales
                                                </Text>
                                            </View>
                                            {isActive ? (
                                                <Ionicons name="checkmark-circle" size={20} color="#22d3ee" />
                                            ) : null}
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
                <Modal
                    transparent
                    animationType="fade"
                    visible={primaryPickerVisible}
                    onRequestClose={closePrimaryPicker}
                >
                    <View style={styles.selectorModalOverlay}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={closePrimaryPicker} />
                        <View style={styles.selectorModalCard}>
                            <Text style={styles.selectorModalTitle}>Discipline principale</Text>
                            <Text style={styles.selectorModalSubtitle}>
                                Choisis une épreuve centrale qui représente le mieux ton profil actuel.
                            </Text>
                            {primaryOptions.length ? (
                                <ScrollView style={styles.selectorModalList}>
                                    {primaryOptions.map((discipline) => {
                                        const isActive = selectedDiscipline === discipline;
                                        return (
                                            <Pressable
                                                key={discipline}
                                                style={[styles.selectorOptionRow, isActive && styles.selectorOptionRowActive]}
                                                onPress={() => handlePrimarySelect(discipline)}
                                            >
                                                <Text
                                                    style={[styles.selectorOptionLabel, isActive && styles.selectorOptionLabelActive]}
                                                >
                                                    {discipline}
                                                </Text>
                                                {isActive ? (
                                                    <Ionicons name="checkmark-circle" size={20} color="#22d3ee" />
                                                ) : null}
                                            </Pressable>
                                        );
                                    })}
                                </ScrollView>
                            ) : (
                                <Text style={styles.secondaryEmptyText}>
                                    Aucune discipline disponible pour cette famille. Sélectionne une autre famille.
                                </Text>
                            )}
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
                            colors={["rgba(94,234,212,0.95)", "rgba(14,165,233,0.9)"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.successModalCard}
                        >
                            <View style={styles.successModalIconBadge}>
                                <Ionicons name="trophy" size={20} color="#0f172a" />
                            </View>
                            <Text style={styles.successModalTitle}>Profil sportif synchronisé</Text>
                            <Text style={styles.successModalSubtitle}>Vos informations sportives ont été mises à jour !</Text>
                        </LinearGradient>
                    </View>
                </Modal>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "transparent" },
    container: { paddingHorizontal: 10, paddingTop: 0, paddingBottom: 0, gap: 5 },
    heroCard: {
        borderRadius: 10,
        justifyContent: "center",
        padding: 5,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        backgroundColor: "rgba(15,23,42,0.65)",

    },
    heroIconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#5eead4",
        alignItems: "center",
        justifyContent: "center",
    },
    heroTitle: { fontSize: 18, fontWeight: "700", color: "#f8fafc" },
    heroSubtitle: { color: "#cbd5e1", fontSize: 13, marginTop: 6, textAlign: "center" },
    heroChips: { flexDirection: "row", gap: 10, marginTop: 14 },
    chip: { backgroundColor: "rgba(15,23,42,0.45)", borderColor: "rgba(148,163,184,0.3)" },
    chipText: { color: "#e2e8f0", fontSize: 12 },
    highlightRow: { flexDirection: "row", gap: 12 },
    highlightPressable: { flex: 1 },
    highlightCard: {
        flex: 1,
        borderRadius: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: "rgba(248,250,252,0.08)",
    },
    highlightHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    highlightLabel: { color: "#cbd5e1", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
    highlightAction: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(248,250,252,0.8)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    highlightActionText: { color: "#0f172a", fontSize: 12, fontWeight: "700" },
    highlightValue: { color: "#f8fafc", fontSize: 14, fontWeight: "700", marginTop: 6, fontStyle: "italic" },
    sectionCard: {
        borderRadius: 24,
        backgroundColor: "rgba(15,23,42,0.6)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        padding: 10,
        gap: 6,
    },
    sectionHeader: { marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: "#f8fafc" },
    sectionSubtitle: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
    sectionLabel: { color: "#94a3b8", fontSize: 10, marginTop: 6, marginBottom: 8 },
    input: { backgroundColor: "rgba(15,23,42,0.45)", marginBottom: 10, fontSize: 10 },
    readOnlyHint: { color: "#94a3b8", fontSize: 11, marginTop: -8, marginBottom: 12 },
    inputHelper: { color: "#94a3b8", fontSize: 12, marginTop: -6, marginBottom: 12 },
    selectorDropdown: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        backgroundColor: "rgba(15,23,42,0.55)",
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    selectorDropdownDisabled: {
        opacity: 0.55,
    },
    selectorDropdownContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
        marginRight: 12,
    },
    selectorDropdownIcon: {
        width: 40,
        height: 40,
        borderRadius: 16,
        backgroundColor: "rgba(94,234,212,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    selectorDropdownLabel: { color: "#f8fafc", fontSize: 15, fontWeight: "700" },
    selectorDropdownMeta: { color: "#94a3b8", fontSize: 12 },
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
    surfaceToggleRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 12,
    },
    surfaceChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: "rgba(15,23,42,0.45)",
    },
    surfaceChipActive: {
        backgroundColor: "rgba(94,234,212,0.25)",
        borderColor: "#5eead4",
    },
    surfaceChipText: { color: "#e2e8f0", fontSize: 13, fontWeight: "600" },
    surfaceChipTextActive: { color: "#0f172a" },
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
    metricsRow: {
        flexDirection: "row",
        gap: 12,
    },
    metricsColumn: {
        flex: 1,
    },
    clubModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(2,6,23,0.85)",
        padding: 24,
        justifyContent: "center",
    },
    clubModalCard: {
        borderRadius: 28,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.4)",
        padding: 22,
        gap: 12,
    },
    clubModalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    clubModalTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
    clubModalCloseButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15,23,42,0.35)",
    },
    clubModalDescription: { color: "#cbd5e1", fontSize: 13 },
    clubModalInput: { backgroundColor: "rgba(15,23,42,0.35)" },
    clubModalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 4,
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
        borderColor: "rgba(240,253,250,0.3)",
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
    successModalTitle: { color: "#f0fdfa", fontSize: 18, fontWeight: "800" },
    successModalSubtitle: { color: "#e0f2fe", fontSize: 14, textAlign: "center" },
    selectorModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(2,6,23,0.85)",
        padding: 20,
        justifyContent: "center",
    },
    selectorModalCard: {
        borderRadius: 26,
        backgroundColor: "rgba(15,23,42,0.95)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        padding: 20,
        gap: 10,
        maxHeight: "80%",
    },
    selectorModalTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
    selectorModalSubtitle: { color: "#94a3b8", fontSize: 13 },
    selectorModalList: { marginTop: 6 },
    selectorOptionRow: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        padding: 14,
        marginBottom: 10,
        backgroundColor: "rgba(15,23,42,0.7)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    selectorOptionRowActive: {
        borderColor: "#22d3ee",
        backgroundColor: "rgba(34,211,238,0.15)",
    },
    selectorOptionLabel: { color: "#f8fafc", fontSize: 15, fontWeight: "700" },
    selectorOptionLabelActive: { color: "#22d3ee" },
    selectorOptionMeta: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
});
