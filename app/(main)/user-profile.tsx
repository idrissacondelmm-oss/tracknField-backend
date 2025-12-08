import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import ProfileHeader from "../../src/components/profile/ProfileHeader";
import ProfileHighlightsCard from "../../src/components/profile/ProfileHighlightsCard";
import ProfileAura from "../../src/components/profile/ProfileAura";

export default function UserProfileScreen() {
    const { user } = useAuth();

    if (!user) return null;


    return (
        <SafeAreaView style={styles.safeArea}>
            <ProfileAura />
            <ScrollView contentContainerStyle={styles.container}>
                <ProfileHeader user={user} />
                <ProfileHighlightsCard user={user} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "transparent" },
    container: {
        padding: 16,
        paddingBottom: 80,
    },
});
