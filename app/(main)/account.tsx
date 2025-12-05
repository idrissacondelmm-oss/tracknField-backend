import React from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";

type ProfilePath =
    | "/(main)/edit-profile/personal"
    | "/(main)/edit-profile/sport"
    | "/(main)/edit-profile/preferences";

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    if (!user) return null;

    const handleNavigate = (path: ProfilePath) => {
        router.push(path);
    };

    const avatarUri = user.photoUrl
    return (
        <SafeAreaView style={styles.safeArea}>

            <ScrollView contentContainerStyle={styles.content}>
                <LinearGradient
                    colors={["rgba(34,211,238,0.25)", "rgba(76,29,149,0.3)", "rgba(15,23,42,0.85)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileCard}
                >
                    <View style={styles.avatarRow}>
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarGlow} />
                            <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.name}>{user.fullName || user.username}</Text>
                            <Text style={styles.email}>{user.email}</Text>
                            {user.club && (
                                <View style={styles.metaRow}>
                                    <Ionicons name="ribbon-outline" size={16} color="#fbbf24" />
                                    <Text style={styles.metaText}>{user.club}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.push("/(main)/profile-stats")}
                        >
                            <Ionicons name="speedometer-outline" size={18} color="#0f172a" />
                            <Text style={styles.primaryButtonText}>Voir mes performances</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => handleNavigate("/(main)/edit-profile/personal")}
                        >
                            <Ionicons name="create-outline" size={20} color="#e2e8f0" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Paramètres rapides</Text>
                    <Text style={styles.sectionSubtitle}>Accès direct aux informations clés</Text>
                </View>

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
        paddingBottom: 60,
        gap: 20,
    },
    profileCard: {
        borderRadius: 28,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        backgroundColor: "rgba(15,23,42,0.7)",
    },
    avatarRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
        gap: 16,
    },
    avatarWrapper: {
        width: 90,
        height: 90,
        borderRadius: 48,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarGlow: {
        position: "absolute",
        width: "100%",
        height: "100%",
        borderRadius: 48,
        backgroundColor: "rgba(34,211,238,0.35)",
        transform: [{ scale: 1.2 }],
        opacity: 0.5,
    },
    avatar: {
        width: 78,
        height: 78,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: "rgba(34,211,238,0.8)",
    },
    headerInfo: { flex: 1 },
    name: {
        fontSize: 24,
        fontWeight: "700",
        color: "#f8fafc",
    },
    email: {
        fontSize: 14,
        color: "#94a3b8",
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaText: { color: "#e2e8f0", fontSize: 13 },
    actionsRow: {
        flexDirection: "row",
        gap: 12,
    },
    primaryButton: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 12,
        backgroundColor: "#22d3ee",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    primaryButtonText: {
        color: "#0f172a",
        fontWeight: "700",
    },
    secondaryButton: {
        width: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(248,250,252,0.2)",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15,23,42,0.4)",
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
