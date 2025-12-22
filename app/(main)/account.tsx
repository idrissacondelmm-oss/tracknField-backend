import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { Text, Avatar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

type ProfilePath =
    | "/(main)/edit-profile/personal"
    | "/(main)/edit-profile/sport"
    | "/(main)/edit-profile/preferences";

type IoniconName = keyof typeof Ionicons.glyphMap;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ?? "";

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

const getInitialsFromName = (value?: string) => {
    if (!value) {
        return "TF";
    }
    const parts = value.trim().split(" ").filter(Boolean);
    if (!parts.length) {
        return value.slice(0, 2).toUpperCase();
    }
    const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
    return initials || value.slice(0, 2).toUpperCase();
};

const computeProfileCompletion = (user: ReturnType<typeof useAuth>["user"]) => {
    if (!user) return 0;
    const completenessSignals = [
        user.photoUrl,
        user.club,
        user.country,
        user.mainDiscipline,
        user.goals,
        user.instagram,
        user.bodyWeightKg,
        user.records && Object.keys(user.records || {}).length ? "records" : null,
    ];
    const tracked = completenessSignals.length;
    const completed = completenessSignals.filter(Boolean).length;
    if (!tracked) {
        return 0;
    }
    return Math.min(100, Math.round((completed / tracked) * 100));
};

const buildProfileReminders = (user: ReturnType<typeof useAuth>["user"]) => {
    if (!user) return [];
    const reminders: string[] = [];
    if (!user.club) reminders.push("Ajoute ton club pour être visible");
    if (!user.mainDiscipline) reminders.push("Choisis ta discipline principale");
    if (!user.records || !Object.keys(user.records).length) reminders.push("Déclare au moins un record de référence");
    if (!user.instagram && !user.strava) reminders.push("Connecte un réseau social");
    if (!user.goals) reminders.push("Renseigne ton objectif de saison");
    return reminders.slice(0, 3);
};

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    if (!user) return null;

    const handleNavigate = (path: ProfilePath) => {
        router.push(path);
    };

    const safeName = user.fullName || user.username || "Athlète";
    const firstName = safeName.split(" ")[0] || safeName;
    const initials = getInitialsFromName(safeName);
    const completion = computeProfileCompletion(user);
    const reminders = buildProfileReminders(user);

    const quickActions: Array<{
        icon: IoniconName;
        label: string;
        description: string;
        color: string;
        path?: ProfilePath;
        action?: () => void;
    }> = [
            {
                icon: "person-outline",
                label: "Identité",
                description: "Photo, bio, infos",
                color: "#22d3ee",
                path: "/(main)/edit-profile/personal",
            },
            {
                icon: "barbell-outline",
                label: "Profil sportif",
                description: "Discipline, objectifs",
                color: "#10b981",
                path: "/(main)/edit-profile/sport",
            },
            {
                icon: "share-social-outline",
                label: "Réseaux & préférences",
                description: "Visibilité, notifs",
                color: "#fbbf24",
                path: "/(main)/edit-profile/preferences",
            },
            {
                icon: "log-out-outline",
                label: "Déconnexion",
                description: "Fermer la session",
                color: "#f87171",
                action: logout,
            },
        ];

    const infoChips = [
        user.club ? { icon: "ribbon-outline" as IoniconName, label: user.club } : null,
        user.country ? { icon: "earth-outline" as IoniconName, label: user.country } : null,
        user.mainDiscipline
            ? { icon: "flash-outline" as IoniconName, label: user.mainDiscipline }
            : null,
    ].filter(Boolean) as { icon: IoniconName; label: string }[];

    const progressFillWidth = completion === 0 ? 6 : completion;

    const handleQuickActionPress = (item: (typeof quickActions)[number]) => {
        if (item.action) {
            item.action();
            return;
        }
        if (item.path) {
            handleNavigate(item.path);
        }
    };

    const avatarSrc = resolvePhotoPreview(user.photoUrl);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.backgroundLayer} pointerEvents="none">
                <LinearGradient
                    colors={["#0f172a", "#020617"]}
                    style={styles.backgroundGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <View style={[styles.backgroundOrb, styles.backgroundOrbLeft]} />
                <View style={[styles.backgroundOrb, styles.backgroundOrbRight]} />
            </View>
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: Math.max(insets.bottom + 20, 32) },
                ]}
            >
                <LinearGradient
                    colors={["rgba(14,165,233,0.35)", "rgba(76,29,149,0.45)", "rgba(2,6,23,0.92)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroHeader}>
                        {avatarSrc ? (
                            <Image source={{ uri: avatarSrc }} style={styles.heroAvatarImage} />
                        ) : (
                            <Avatar.Text
                                label={initials}
                                size={56}
                                style={styles.heroAvatar}
                                color="#010617"
                            />
                        )}
                        <View style={styles.heroTextCol}>
                            <Text style={styles.heroTitle}>{safeName}</Text>
                            <Text style={styles.heroSubtitle}>{user.email}</Text>
                        </View>
                        <View style={styles.completionBadge}>
                            <Ionicons name="shield-checkmark-outline" size={16} color="#ecfccb" />
                            <Text style={styles.completionBadgeText}>{completion}%</Text>
                        </View>
                    </View>
                    {infoChips.length ? (
                        <View style={styles.heroChipsRow}>
                            {infoChips.map((chip) => (
                                <View key={chip.label} style={styles.heroChip}>
                                    <Ionicons name={chip.icon} size={14} color="#f8fafc" />
                                    <Text style={styles.heroChipText}>{chip.label}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}
                    <View style={styles.progressRow}>
                        <View style={styles.progressLabels}>
                            <Text style={styles.progressLabel}>Profil complété</Text>
                            <Text style={styles.progressValue}>{completion}%</Text>
                        </View>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${progressFillWidth}%` }]} />
                        </View>
                    </View>
                </LinearGradient>


                <View style={styles.quickActionsGrid}>
                    {quickActions.map((action) => (
                        <TouchableOpacity
                            key={action.label}
                            style={styles.quickActionCard}
                            activeOpacity={0.85}
                            onPress={() => handleQuickActionPress(action)}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                                <Ionicons name={action.icon} size={18} color={action.color} />
                            </View>
                            <Text style={styles.quickActionLabel}>{action.label}</Text>
                            <Text style={styles.quickActionDescription}>{action.description}</Text>
                            <Ionicons name="arrow-forward" size={16} color="#94a3b8" />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>À finaliser</Text>
                    <Text style={styles.sectionSubtitle}>Ce qui manque pour un profil complet</Text>
                </View>
                <View style={styles.reminderCard}>
                    {reminders.length ? (
                        reminders.map((reminder, index) => (
                            <View key={reminder} style={styles.reminderRow}>
                                <View style={styles.reminderBullet}>
                                    <Ionicons name="star-outline" size={14} color="#22d3ee" />
                                </View>
                                <Text style={styles.reminderText}>{reminder}</Text>
                                {index < reminders.length - 1 ? (
                                    <View style={styles.reminderDivider} />
                                ) : null}
                            </View>
                        ))
                    ) : (
                        <Text style={styles.reminderEmpty}>Ton profil est quasiment parfait ✨</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#020617",
    },
    backgroundLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    backgroundGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    backgroundOrb: {
        position: "absolute",
        width: 220,
        height: 220,
        borderRadius: 140,
        backgroundColor: "rgba(56,189,248,0.15)",
        opacity: 0.8,
    },
    backgroundOrbLeft: {
        top: -40,
        left: -60,
    },
    backgroundOrbRight: {
        bottom: -60,
        right: -50,
        backgroundColor: "rgba(147,51,234,0.12)",
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 20,
    },
    heroCard: {
        borderRadius: 28,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 16,
        shadowColor: "#22d3ee",
        shadowOpacity: 0.25,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
    },
    heroHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    heroAvatar: {
        backgroundColor: "rgba(248,250,252,0.9)",
    },
    heroAvatarImage: {
        width: 56,
        height: 56,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(248,250,252,0.8)",
    },
    heroTextCol: {
        flex: 1,
    },
    heroOverline: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 1.2,
        color: "#bae6fd",
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#f8fafc",
    },
    heroSubtitle: {
        color: "#cbd5f5",
        fontSize: 12,
    },
    completionBadge: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(190,242,100,0.8)",
        backgroundColor: "rgba(22,163,74,0.18)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    completionBadgeText: {
        color: "#ecfccb",
        fontWeight: "700",
        fontSize: 12,
    },
    heroChipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    heroChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        backgroundColor: "rgba(15,23,42,0.45)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
    },
    heroChipText: {
        color: "#f8fafc",
        fontSize: 11,
        fontWeight: "600",
    },
    progressRow: {
        gap: 12,
    },
    progressLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    progressLabel: {
        color: "#94a3b8",
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
    progressValue: {
        color: "#f8fafc",
        fontSize: 13,
        fontWeight: "700",
    },
    progressTrack: {
        height: 8,
        borderRadius: 999,
        backgroundColor: "rgba(148,163,184,0.35)",
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 999,
        backgroundColor: "#22d3ee",
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
        fontSize: 12,
    },
    quickActionsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginTop: 10,
    },
    quickActionCard: {
        width: "48%",
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 14,
        backgroundColor: "rgba(15,23,42,0.75)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        marginBottom: 12,
    },
    quickActionIcon: {
        width: 38,
        height: 38,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    quickActionLabel: {
        color: "#f8fafc",
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 4,
    },
    quickActionDescription: {
        color: "#94a3b8",
        fontSize: 12,
        flex: 1,
        marginBottom: 6,
    },
    reminderCard: {
        borderRadius: 22,
        padding: 16,
        backgroundColor: "rgba(15,23,42,0.8)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 10,
    },
    reminderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        position: "relative",
    },
    reminderBullet: {
        width: 30,
        height: 30,
        borderRadius: 12,
        backgroundColor: "rgba(34,211,238,0.12)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.4)",
    },
    reminderText: {
        flex: 1,
        color: "#e2e8f0",
        fontSize: 13,
    },
    reminderDivider: {
        position: "absolute",
        bottom: -5,
        left: 15,
        right: 15,
        height: 1,
        backgroundColor: "rgba(148,163,184,0.15)",
    },
    reminderEmpty: {
        color: "#cbd5f5",
        fontSize: 13,
        textAlign: "center",
    },
});
