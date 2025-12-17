import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getTrainingGroup, updateTrainingGroup } from "../../api/groupService";
import { TrainingGroupSummary } from "../../types/trainingGroup";

export default function TrainingGroupEditScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [group, setGroup] = useState<TrainingGroupSummary | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const previewInitial = useMemo(() => (name.trim().charAt(0) || "G").toUpperCase(), [name]);

    const fetchGroup = useCallback(async () => {
        if (!id) {
            setLoading(false);
            Alert.alert("Groupe introuvable", "Identifiant manquant pour cette modification.", [
                { text: "OK", onPress: () => router.back() },
            ]);
            return;
        }
        try {
            const data = await getTrainingGroup(id.toString());
            setGroup(data);
            setName(data.name);
            setDescription(data.description ?? "");
        } catch (error: any) {
            console.error("Erreur chargement groupe", error);
            const message = error?.response?.data?.message || "Impossible de charger ce groupe";
            Alert.alert("Erreur", message, [{ text: "OK", onPress: () => router.back() }]);
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchGroup();
    }, [fetchGroup]);

    const handleSubmit = useCallback(async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            Alert.alert("Nom requis", "Merci de renseigner un nom de groupe.");
            return;
        }
        if (!id) {
            return;
        }
        try {
            setSaving(true);
            await updateTrainingGroup(id.toString(), {
                name: trimmedName,
                description: description.trim() || undefined,
            });
            Alert.alert("Groupe mis à jour", "Les modifications sont enregistrées.", [
                {
                    text: "OK",
                    onPress: () => router.back(),
                },
            ]);
        } catch (error: any) {
            console.error("Erreur mise à jour groupe", error);
            const message = error?.response?.data?.message || "Impossible de mettre à jour ce groupe";
            Alert.alert("Erreur", message);
        } finally {
            setSaving(false);
        }
    }, [description, id, name, router]);

    return (
        <SafeAreaView style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 16) }]} edges={["left", "right", "bottom"]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={80}
            >
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <LinearGradient colors={["#0f172a", "#0b1220"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                        <Text style={styles.heroOverline}>Groupes d’entraînement</Text>
                        <Text style={styles.heroTitle}>Mettre à jour le groupe</Text>
                        <Text style={styles.heroSubtitle}>
                            Ajustez le nom ou la description pour garder vos membres alignés sur l’identité du club.
                        </Text>
                        {group ? (
                            <View style={styles.heroSummary}>
                                <View style={styles.heroSummaryIcon}>
                                    <Text style={styles.heroSummaryInitial}>{previewInitial}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.heroSummaryName}>{group.name}</Text>
                                    <Text style={styles.heroSummaryMeta}>
                                        Créé le {new Date(group.createdAt || Date.now()).toLocaleDateString("fr-FR")}
                                    </Text>
                                </View>
                            </View>
                        ) : null}
                    </LinearGradient>

                    <View style={styles.formSection}>
                        <View style={styles.formHeader}>
                            <View style={styles.formHeaderIcon}>
                                <MaterialCommunityIcons name="pencil" size={20} color="#0f172a" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.formTitle}>Identité</Text>
                                <Text style={styles.formSubtitle}>Le nom permet aux athlètes de retrouver votre collectif.</Text>
                            </View>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.inputLabel}>Nom du groupe</Text>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                mode="outlined"
                                style={styles.input}
                                placeholder="Ex: Sprint Club Lyon"
                                autoCapitalize="words"
                                autoCorrect
                                disabled={loading || saving}
                            />
                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                mode="outlined"
                                style={[styles.input, styles.textarea]}
                                multiline
                                numberOfLines={4}
                                placeholder="Objectifs, ambiance, niveau, créneaux…"
                                disabled={loading || saving}
                            />

                            <View style={styles.tipsCard}>
                                <MaterialCommunityIcons name="lightbulb-on" size={18} color="#facc15" />
                                <Text style={styles.tipsText}>Un ton clair inspire confiance aux futurs membres.</Text>
                            </View>

                            <Button
                                mode="contained"
                                onPress={handleSubmit}
                                disabled={loading || saving}
                                loading={saving}
                                buttonColor="#22d3ee"
                                textColor="#02111f"
                                style={styles.submitButton}
                            >
                                Sauvegarder les modifications
                            </Button>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#020617",
    },
    container: {
        paddingHorizontal: 22,
        paddingTop: 24,
        paddingBottom: 40,
        gap: 24,
    },
    hero: {
        borderRadius: 30,
        padding: 24,
        gap: 14,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
    },
    heroOverline: {
        color: "#67e8f9",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        fontSize: 12,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: "#f8fafc",
    },
    heroSubtitle: {
        color: "#cbd5e1",
        lineHeight: 20,
    },
    heroSummary: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingTop: 6,
    },
    heroSummaryIcon: {
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: "rgba(34,211,238,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    heroSummaryInitial: {
        color: "#22d3ee",
        fontWeight: "700",
        fontSize: 20,
    },
    heroSummaryName: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "700",
    },
    heroSummaryMeta: {
        color: "#94a3b8",
        fontSize: 13,
    },
    formSection: {
        gap: 12,
    },
    formHeader: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
    },
    formHeaderIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#22d3ee",
        alignItems: "center",
        justifyContent: "center",
    },
    formTitle: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "700",
    },
    formSubtitle: {
        color: "#94a3b8",
    },
    card: {
        borderRadius: 20,
        padding: 16,
        backgroundColor: "rgba(15,23,42,0.85)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 14,
    },
    input: {
        backgroundColor: "transparent",
    },
    textarea: {
        minHeight: 120,
        textAlignVertical: "top",
    },
    inputLabel: {
        color: "#cbd5e1",
        fontWeight: "600",
    },
    tipsCard: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        borderRadius: 14,
        padding: 12,
        backgroundColor: "rgba(250,204,21,0.1)",
        borderWidth: 1,
        borderColor: "rgba(250,204,21,0.4)",
    },
    tipsText: {
        color: "#fef9c3",
        flex: 1,
    },
    submitButton: {
        marginTop: 4,
        borderRadius: 16,
        paddingVertical: 4,
    },
});
