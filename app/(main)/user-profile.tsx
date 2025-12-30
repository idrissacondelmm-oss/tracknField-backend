import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import ProfileHeader from "../../src/components/profile/ProfileHeader";
import ProfileHighlightsCard from "../../src/components/profile/ProfileHighlightsCard";
import ProfileSocialLinks from "../../src/components/profile/ProfileSocialLinks";
import CoachProfilePanel from "../../src/components/profile/CoachProfilePanel";

export default function UserProfileScreen() {
    const { user, refreshProfile } = useAuth();
    const router = useRouter();
    const isCoach = user?.role === "coach";

    useFocusEffect(
        useCallback(() => {
            refreshProfile();
        }, [refreshProfile]),
    );

    if (!user) return null;

    const goal = user.goals?.trim() || "";
    const hasGoal = Boolean(goal);
    const goalDisplay = goal || "Définis ton objectif de saison";

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
            <ScrollView contentContainerStyle={styles.container}>
                <ProfileHeader user={user} />
                {isCoach ? <CoachProfilePanel /> : null}
                <Pressable
                    style={({ pressed }) => [styles.goalCard, !hasGoal ? styles.goalCardPlaceholder : null, pressed ? { opacity: 0.85 } : null]}
                    onPress={() => router.push("/(main)/edit-profile/sport")}
                    accessibilityRole="button"
                    accessibilityLabel={hasGoal ? "Mettre à jour ton objectif de saison" : "Définir ton objectif de saison"}
                >
                    <View style={styles.goalIconWrapper}>
                        <Ionicons name="flag-outline" size={18} color="#e2e8f0" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.goalLabel}>Objectif de la saison</Text>
                        <Text
                            style={[styles.goalText, !hasGoal ? styles.goalPlaceholderText : null]}
                            numberOfLines={3}
                            ellipsizeMode="tail"
                        >
                            {goalDisplay}
                        </Text>
                    </View>
                    {!hasGoal ? (
                        <Ionicons name="create-outline" size={18} color="#e2e8f0" />
                    ) : null}
                </Pressable>
                {!isCoach ? <ProfileHighlightsCard user={user} /> : null}
                <ProfileSocialLinks user={user} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "transparent" },
    container: {
        padding: 10,
        paddingBottom: 0,
    },
    goalCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.4)",
        backgroundColor: "rgba(2,6,23,0.9)",
        paddingHorizontal: 18,
        paddingVertical: 16,
        marginTop: 16,
        marginBottom: 20,
    },
    goalCardPlaceholder: {
        borderColor: "rgba(148,163,184,0.4)",
        backgroundColor: "rgba(15,23,42,0.65)",
    },
    goalIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(34,211,238,0.25)",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.5)",
        alignItems: "center",
        justifyContent: "center",
    },
    goalLabel: {
        color: "#bae6fd",
        fontSize: 11,
        letterSpacing: 1,
        textTransform: "uppercase",
        fontWeight: "700",
    },
    goalText: {
        color: "#f8fafc",
        fontSize: 12,
        fontWeight: "700",
        marginTop: 4,
        lineHeight: 20,
        fontStyle: "italic",
    },
    goalPlaceholderText: {
        color: "#cbd5e1",
    },
});
