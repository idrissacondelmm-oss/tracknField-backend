import React from "react";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TrainingHubScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleCreate = () => router.push("/(main)/training/create-training");
    const handleList = () => router.push("/(main)/training/list");
    const handleGroups = () => router.push("/(main)/training/groups");

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        >
            <View style={styles.actions}>
                <Pressable style={styles.cardPrimary} onPress={handleCreate} accessibilityRole="button">
                    <View style={styles.cardPrimaryHeader}>
                        <View style={styles.cardIconPrimary}>
                            <MaterialCommunityIcons name="calendar-plus" size={26} color="#38bdf8" />
                        </View>
                        <Text style={[styles.cardTitle, styles.cardTitlePrimary]}>Créer un entraînement</Text>
                    </View>
                    <Text style={styles.cardCtaSecondary}>Commencer →</Text>
                </Pressable>
                <Pressable style={styles.cardSecondary} onPress={handleList} accessibilityRole="button">
                    <View style={styles.cardSecondaryHeader}>
                        <View style={styles.cardIconSecondary}>
                            <MaterialCommunityIcons name="playlist-check" size={24} color="#38bdf8" />
                        </View>
                        <Text style={styles.cardTitle}>Mes entraînements</Text>
                    </View>
                    <Text style={styles.cardCtaSecondary}>Consulter →</Text>
                </Pressable>
                <Pressable style={styles.cardGroup} onPress={handleGroups} accessibilityRole="button">
                    <View style={styles.cardGroupHeader}>
                        <View style={styles.cardIconGroup}>
                            <MaterialCommunityIcons name="account-group" size={24} color="#38bdf8" />
                        </View>
                        <Text style={[styles.cardTitle, styles.cardTitleGroup]}>{"Groupes & équipes"}</Text>
                    </View>
                    <View style={styles.cardGroupFooter}>
                        <Text style={styles.cardCtaSecondary}>Gérer mes groupes →</Text>
                        <MaterialCommunityIcons name="chevron-right" size={22} color="#e7e9f0ff" />
                    </View>
                </Pressable>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: "#020617",
    },
    container: {
        paddingHorizontal: 10,
        backgroundColor: "#020617",
        gap: 24,
    },
    header: {
        gap: 8,
    },
    overline: {
        color: "#38bdf8",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 1.5,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#f8fafc",
    },
    subtitle: {
        color: "#cbd5e1",
        lineHeight: 20,
    },
    actions: {
        gap: 18,
    },
    cardPrimary: {
        borderRadius: 28,
        backgroundColor: "rgba(15,23,42,0.75)",
        padding: 20,
        gap: 10,
    },
    cardPrimaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    cardIconPrimary: {
        width: 40,
        height: 40,
        borderRadius: 16,
        backgroundColor: "rgba(2,6,23,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    cardSecondary: {
        borderRadius: 24,
        padding: 18,
        backgroundColor: "rgba(15,23,42,0.75)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
        gap: 10,
    },
    cardSecondaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    cardIconSecondary: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "rgba(56,189,248,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    cardIconSecondaryAlt: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "rgba(249,115,22,0.12)",
        alignItems: "center",
        justifyContent: "center",
    },
    cardGroup: {
        borderRadius: 28,
        padding: 24,
        gap: 14,
        backgroundColor: "rgba(15,23,42,0.75)",
        borderWidth: 1,
        borderColor: "rgba(15,23,42,0.15)",
    },
    cardGroupHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    cardIconGroup: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: "rgba(32, 75, 174, 0.12)",
        alignItems: "center",
        justifyContent: "center",
    },
    cardLabel: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1.2,
        color: "#0f172a",
        textTransform: "uppercase",
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#f8fafc",
    },
    cardTitlePrimary: {
        color: "#e7e9f0ff",
    },
    cardTitleGroup: {
        fontSize: 20,
        color: "#f0f1f3ff",
    },
    cardBody: {
        color: "#cbd5e1",
        lineHeight: 20,
    },
    cardBodyPrimary: {
        color: "#0f172a",
        opacity: 0.85,
    },
    cardBodyGroup: {
        color: "#0f172a",
        opacity: 0.85,
    },
    cardCta: {
        color: "#edeff4ff",
        fontWeight: "700",
    },
    cardCtaSecondary: {
        color: "#38bdf8",
        fontWeight: "700",
    },
    cardCtaPrimary: {
        color: "#e7e9f0ff",
        fontWeight: "700",
        fontSize: 16,
    },
    cardGroupFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
});
