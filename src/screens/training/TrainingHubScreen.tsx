import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function TrainingHubScreen() {
    const router = useRouter();

    const handleCreate = () => router.push("/(main)/training/create");
    const handleList = () => router.push("/(main)/training/list");

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.overline}>Séances</Text>
                <Text style={styles.title}>Planifier & suivre</Text>
            </View>
            <View style={styles.actions}>
                <Pressable style={styles.cardPrimary} onPress={handleCreate} accessibilityRole="button">
                    <View style={styles.cardIconPrimary}>
                        <MaterialCommunityIcons name="calendar-plus" size={26} color="#0f172a" />
                    </View>
                    <Text style={[styles.cardTitle, styles.cardTitlePrimary]}>Créer une séance</Text>
                    <Text style={styles.cardCta}>Commencer →</Text>
                </Pressable>
                <Pressable style={styles.cardSecondary} onPress={handleList} accessibilityRole="button">
                    <View style={styles.cardIconSecondary}>
                        <MaterialCommunityIcons name="playlist-check" size={24} color="#38bdf8" />
                    </View>
                    <Text style={styles.cardTitle}>Voir mes séances</Text>
                    <Text style={styles.cardCtaSecondary}>Afficher →</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 32,
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
        backgroundColor: "#22d3ee",
        padding: 20,
        gap: 10,
    },
    cardIconPrimary: {
        width: 48,
        height: 48,
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
        borderColor: "rgba(148,163,184,0.25)",
        gap: 10,
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
        color: "#0f172a",
    },
    cardBody: {
        color: "#cbd5e1",
        lineHeight: 20,
    },
    cardBodyPrimary: {
        color: "#0f172a",
        opacity: 0.85,
    },
    cardCta: {
        color: "#0f172a",
        fontWeight: "700",
    },
    cardCtaSecondary: {
        color: "#38bdf8",
        fontWeight: "700",
    },
});
