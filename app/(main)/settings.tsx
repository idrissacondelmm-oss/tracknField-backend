import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { deleteAccount } from "../../src/api/userService";

type ActionKey = "logout" | "delete" | null;

type ActionItem = {
    key: Exclude<ActionKey, null>;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    description: string;
    tone?: "default" | "danger";
    onPress: () => void;
};

export default function SettingsScreen() {
    const { logout } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loadingAction, setLoadingAction] = useState<ActionKey>(null);

    const finishSession = async () => {
        await logout();
        router.replace("/(auth)/login");
    };

    const handleLogout = async () => {
        if (loadingAction) return;
        setLoadingAction("logout");
        try {
            await finishSession();
        } catch (error: any) {
            Alert.alert("Déconnexion impossible", error?.message || "Réessaie dans un instant.");
        } finally {
            setLoadingAction(null);
        }
    };

    const confirmDeletion = () => {
        if (loadingAction) return;
        Alert.alert(
            "Supprimer mon compte",
            "Cette action est définitive. Toutes tes données TracknField seront supprimées.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        setLoadingAction("delete");
                        try {
                            await deleteAccount();
                            await finishSession();
                        } catch (error: any) {
                            Alert.alert(
                                "Suppression impossible",
                                error?.message || "Merci de réessayer plus tard.",
                            );
                        } finally {
                            setLoadingAction(null);
                        }
                    },
                },
            ],
        );
    };

    const actions: ActionItem[] = [
        {
            key: "logout",
            icon: "log-out-outline",
            label: "Se déconnecter",
            description: "Fermer ta session sur cet appareil",
            onPress: handleLogout,
        },
        {
            key: "delete",
            icon: "trash-outline",
            label: "Supprimer mon compte",
            description: "Effacer définitivement ton profil et tes données",
            tone: "danger",
            onPress: confirmDeletion,
        },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: Math.max(insets.top + 12, 20),
                    paddingBottom: Math.max(insets.bottom + 24, 36),
                }}
                contentInsetAdjustmentBehavior="automatic"
            >
                <View style={styles.headerCard}>
                    <View style={styles.headerIconWrap}>
                        <Ionicons name="settings-outline" size={22} color="#e2e8f0" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Paramètres du compte</Text>
                        <Text style={styles.headerSubtitle}>
                            Gère ta session et la fermeture de ton compte.
                        </Text>
                    </View>
                </View>



                <View style={styles.actionsStack}>
                    {actions.map((action) => {
                        const isLoading = loadingAction === action.key;
                        return (
                            <TouchableOpacity
                                key={action.key}
                                style={[styles.actionCard, action.tone === "danger" && styles.actionCardDanger]}
                                activeOpacity={0.85}
                                disabled={Boolean(loadingAction)}
                                onPress={action.onPress}
                            >
                                <View style={[styles.actionIcon, action.tone === "danger" && styles.actionIconDanger]}>
                                    <Ionicons
                                        name={action.icon}
                                        size={18}
                                        color={action.tone === "danger" ? "#fca5a5" : "#cbd5f5"}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.actionLabel}>{action.label}</Text>
                                    <Text style={styles.actionDescription}>{action.description}</Text>
                                </View>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#cbd5f5" />
                                ) : (
                                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
    },
    headerCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#0b1224",
        borderRadius: 16,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: "#1f2937",
        marginBottom: 14,
    },
    headerIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    headerTitle: {
        color: "#e5e7eb",
        fontSize: 18,
        fontWeight: "700",
    },
    headerSubtitle: {
        color: "#cbd5e1",
        fontSize: 14,
        marginTop: 4,
    },
    infoCard: {
        backgroundColor: "#0f172a",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#1f2937",
        marginBottom: 18,
    },
    infoTitle: {
        color: "#e2e8f0",
        fontSize: 16,
        fontWeight: "700",
    },
    infoSubtitle: {
        color: "#cbd5e1",
        fontSize: 14,
        marginTop: 4,
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    infoRowText: {
        color: "#cbd5e1",
        fontSize: 13,
        flex: 1,
    },
    actionsStack: {
        gap: 10,
    },
    actionCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#0b1224",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    actionCardDanger: {
        borderColor: "#7f1d1d",
        backgroundColor: "#150b0b",
    },
    actionIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    actionIconDanger: {
        backgroundColor: "#1c0b0b",
        borderColor: "#7f1d1d",
    },
    actionLabel: {
        color: "#e5e7eb",
        fontSize: 15,
        fontWeight: "700",
    },
    actionDescription: {
        color: "#cbd5e1",
        fontSize: 13,
        marginTop: 4,
    },
});
