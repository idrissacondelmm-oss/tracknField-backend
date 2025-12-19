import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";

type ProfilePath =
    | "/(main)/edit-profile/personal"
    | "/(main)/edit-profile/sport"
    | "/(main)/edit-profile/preferences";

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    if (!user) return null;

    const handleNavigate = (path: ProfilePath) => {
        router.push(path);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: Math.max(insets.bottom, 12) },
                ]}
            >
                <View style={styles.optionsCard}>
                    <OptionRow
                        icon="person-outline"
                        label="Informations personnelles"
                        description="Nom, email, pays"
                        color="#22d3ee"
                        onPress={() => handleNavigate("/(main)/edit-profile/personal")}
                    />
                    <OptionRow
                        icon="barbell-outline"
                        label="Profil sportif"
                        description="Disciplines, club, objectifs"
                        color="#10b981"
                        onPress={() => handleNavigate("/(main)/edit-profile/sport")}
                    />
                    <OptionRow
                        icon="settings-outline"
                        label="Préférences & réseaux"
                        description="Visibilité, notifications, liens"
                        color="#fbbf24"
                        onPress={() => handleNavigate("/(main)/edit-profile/preferences")}
                        isLast
                    />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Ionicons name="log-out-outline" size={20} color="#f87171" />
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

type OptionRowProps = {
    icon: IoniconName;
    label: string;
    description: string;
    color: string;
    onPress: () => void;
    isLast?: boolean;
};

function OptionRow({ icon, label, description, color, onPress, isLast }: OptionRowProps) {
    return (
        <TouchableOpacity style={[styles.optionRow, !isLast && styles.optionDivider]} onPress={onPress}>
            <View style={[styles.optionIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{label}</Text>
                <Text style={styles.optionDescription}>{description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
    },
    content: {
        padding: 20,
        paddingBottom: 20,
        gap: 20,
    },
    sectionHeader: {
        gap: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#f8fafc",
    },
    sectionSubtitle: {
        color: "#94a3b8",
        fontSize: 13,
    },
    optionsCard: {
        borderRadius: 24,
        backgroundColor: "rgba(15,23,42,0.55)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 16,
        gap: 16,
    },
    optionDivider: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(148,163,184,0.15)",
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    optionLabel: {
        color: "#f8fafc",
        fontSize: 15,
        fontWeight: "600",
    },
    optionDescription: {
        color: "#94a3b8",
        fontSize: 12,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "rgba(248,113,113,0.12)",
        borderRadius: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: "rgba(248,113,113,0.3)",
    },
    logoutText: {
        color: "#f87171",
        fontWeight: "700",
    },
});
