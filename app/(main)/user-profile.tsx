import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import ProfileHeader from "../../src/components/profile/ProfileHeader";
import ProfileHighlightsCard from "../../src/components/profile/ProfileHighlightsCard";
import ProfileSocialLinks from "../../src/components/profile/ProfileSocialLinks";

export default function UserProfileScreen() {
    const { user, refreshProfile } = useAuth();

    useFocusEffect(
        useCallback(() => {
            refreshProfile();
        }, [refreshProfile]),
    );

    if (!user) return null;

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
            <ScrollView contentContainerStyle={styles.container}>
                <ProfileHeader user={user} />
                {user.goals && (
                    <View style={styles.goalCard}>
                        <View style={styles.goalIconWrapper}>
                            <Ionicons name="flag-outline" size={18} color="#e2e8f0" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.goalLabel}>Objectif de la saison</Text>
                            <Text style={styles.goalText} numberOfLines={3} ellipsizeMode="tail">
                                {user.goals}
                            </Text>
                        </View>
                    </View>
                )}
                <ProfileHighlightsCard user={user} />
                <ProfileSocialLinks user={user} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "transparent" },
    container: {
        padding: 16,
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
        marginBottom: 20,
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
});
