import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CreateTrainingHubScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleNewSession = () => router.push("/(main)/training/create");
    const handleTemplates = () => router.push("/(main)/training/templates");
    const handleBlocks = () => router.push("/(main)/training/blocks");

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        >
            <View style={styles.actions}>
                <Pressable style={styles.cardPrimary} onPress={handleNewSession} accessibilityRole="button">
                    <View style={styles.cardPrimaryHeader}>
                        <View style={styles.cardIconPrimary}>
                            <MaterialCommunityIcons name="calendar-plus" size={26} color="#38bdf8" />
                        </View>
                        <Text style={[styles.cardTitle, styles.cardTitlePrimary]}>Nouvel entraînement</Text>
                    </View>
                    <Text style={styles.cardCtaSecondary}>Créer une séance →</Text>
                </Pressable>

                <Pressable style={styles.cardSecondary} onPress={handleTemplates} accessibilityRole="button">
                    <View style={styles.cardSecondaryHeader}>
                        <View style={styles.cardIconSecondary}>
                            <MaterialCommunityIcons name="bookmark-multiple-outline" size={24} color="#38bdf8" />
                        </View>
                        <Text style={styles.cardTitle}>Plans d’entraînement</Text>
                    </View>
                    <Text style={styles.cardCtaSecondary}>Voir les plans →</Text>
                </Pressable>

                <Pressable style={styles.cardSecondary} onPress={handleBlocks} accessibilityRole="button">
                    <View style={styles.cardSecondaryHeader}>
                        <View style={styles.cardIconSecondary}>
                            <MaterialCommunityIcons name="puzzle" size={24} color="#38bdf8" />
                        </View>
                        <Text style={styles.cardTitle}>Exercices & blocs</Text>
                    </View>
                    <Text style={styles.cardCtaSecondary}>Composer →</Text>
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
    cardTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#f8fafc",
    },
    cardTitlePrimary: {
        color: "#e7e9f0ff",
    },
    cardCtaSecondary: {
        color: "#38bdf8",
        fontWeight: "700",
    },
});
