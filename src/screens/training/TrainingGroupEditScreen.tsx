import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text, TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteTrainingGroup, getTrainingGroup, updateTrainingGroup } from "../../api/groupService";
import { useAuth } from "../../context/AuthContext";
import { TrainingGroupSummary } from "../../types/trainingGroup";

export default function TrainingGroupEditScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const tabBarHeight = useBottomTabBarHeight();
    // Tab bar height already accounts for the bottom safe area inset.
    // Adding insets.bottom again can create a large dark gap above the nav bar.
    const bottomSpacing = tabBarHeight + 16;

    const [group, setGroup] = useState<TrainingGroupSummary | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const previewInitial = useMemo(() => (name.trim().charAt(0) || "G").toUpperCase(), [name]);

    const isOwner = useMemo(() => {
        if (!group || !user) return false;
        const owner = group.owner;
        const ownerId = typeof owner === "string" ? owner : owner?.id || owner?._id;
        const userId = (user as any)?.id || (user as any)?._id;
        return Boolean(ownerId && userId && ownerId.toString() === userId.toString());
    }, [group, user]);

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
            const status = error?.response?.status;
            if (status === 404) {
                router.replace("/(main)/training/groups");
                return;
            }

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

    const handleDeleteGroup = useCallback(async () => {
        if (!id) return;
        try {
            setDeleting(true);
            await deleteTrainingGroup(id.toString());
            setDeleteDialogVisible(false);

            const state = navigation.getState?.();
            const routes = state?.routes ?? [];
            const routeNames = routes.map((route: any) => route?.name);
            const lastGroupsIndex = routeNames.lastIndexOf("groups/index");

            let nextRoutes =
                lastGroupsIndex >= 0
                    ? routes.slice(0, lastGroupsIndex + 1)
                    : routes.filter(
                        (route: any) =>
                            route?.name !== "groups/[id]/index" && route?.name !== "groups/[id]/edit",
                    );

            if (!nextRoutes.length) {
                nextRoutes = [{ name: "groups/index" }];
            }

            const last = nextRoutes[nextRoutes.length - 1];
            nextRoutes[nextRoutes.length - 1] = {
                ...last,
                params: { ...(last?.params ?? {}), toast: "Groupe supprimé" },
            };

            navigation.reset({
                index: nextRoutes.length - 1,
                routes: nextRoutes,
            });
        } catch (error: any) {
            console.error("Erreur suppression groupe", error);
            const message = error?.response?.data?.message || error?.message || "Impossible de supprimer ce groupe";
            Alert.alert("Erreur", message);
        } finally {
            setDeleting(false);
        }
    }, [id, navigation]);

    return (
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
            <Portal>
                <Dialog
                    visible={deleteDialogVisible}
                    onDismiss={() => setDeleteDialogVisible(false)}
                    style={styles.deleteDialog}
                >
                    <Dialog.Title>
                        <View style={styles.deleteDialogTitleRow}>
                            <Text style={styles.deleteDialogIcon}>⚠️</Text>
                            <Text style={styles.deleteDialogTitle}>Supprimer le groupe</Text>
                        </View>
                    </Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.deleteDialogText}>
                            Cette action est définitive. Les séances associées ne seront plus liées au groupe.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDeleteDialogVisible(false)} textColor="#67e8f9" disabled={deleting}>
                            Annuler
                        </Button>
                        <Button onPress={handleDeleteGroup} textColor="#fca5a5" loading={deleting} disabled={deleting}>
                            Supprimer
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={80}
            >
                <ScrollView
                    contentContainerStyle={[styles.container, { paddingBottom: bottomSpacing + 24 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <LinearGradient colors={["#0f172a", "#0b1220"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                        <Text style={styles.heroOverline}>Mettre à jour le groupe</Text>

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

                            {isOwner ? (
                                <Button
                                    mode="outlined"
                                    onPress={() => setDeleteDialogVisible(true)}
                                    disabled={loading || saving || deleting}
                                    textColor="#fca5a5"
                                    style={styles.deleteButton}
                                >
                                    Supprimer le groupe
                                </Button>
                            ) : null}
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
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 0,
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
    submitButton: {
        borderRadius: 16,
        paddingVertical: 4,
        marginTop: 4,
    },
    deleteButton: {
        borderRadius: 16,
        borderColor: "rgba(248,113,113,0.45)",
        borderWidth: 1,
        marginTop: 6,
    },
    deleteDialog: {
        backgroundColor: "rgba(15,23,42,0.98)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
    },
    deleteDialogTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    deleteDialogIcon: {
        fontSize: 16,
    },
    deleteDialogTitle: {
        color: "#f8fafc",
        fontSize: 16,
        fontWeight: "700",
    },
    deleteDialogText: {
        color: "#cbd5e1",
        lineHeight: 20,
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
});
