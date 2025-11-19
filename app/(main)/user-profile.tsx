import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/styles/theme";
import ProfileHeader from "../../src/components/profile/ProfileHeader";
import ProfileStats from "../../src/components/profile/ProfileStats";
import ProfileDiscipline from "../../src/components/profile/ProfileDiscipline";
import ProfileBadges from "../../src/components/profile/ProfileBadges";
import ProfileActions from "../../src/components/profile/ProfileActions";

export default function UserProfileScreen() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <ProfileHeader user={user} />
                <ProfileStats user={user} />
                <ProfileDiscipline user={user} />
                <ProfileBadges user={user} />
                <ProfileActions />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: {
        padding: 16,
        paddingBottom: 80,
    },
});
