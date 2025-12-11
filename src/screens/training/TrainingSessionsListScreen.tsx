import React from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTrainingSessionsList } from "../../hooks/useTrainingSessionsList";
import { formatSessionSummary } from "../../utils/trainingFormatter";

export default function TrainingSessionsListScreen() {
    const router = useRouter();
    const { sessions, loading, error, refresh } = useTrainingSessionsList();

    const handleOpen = (id: string) => {
        router.push({ pathname: "/(main)/training/[id]", params: { id } });
    };

    const handleCreate = () => router.push("/(main)/training/create");

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#22d3ee" />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Mes séances planifiées</Text>
                {sessions.length ? (
                    <Text style={styles.subtitle}>Dernières mises à jour par ordre décroissant.</Text>
                ) : (
                    <Text style={styles.subtitle}>Aucune séance encore planifiée.</Text>
                )}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {loading && !sessions.length ? (
                <View style={styles.stateContainer}>
                    <ActivityIndicator color="#22d3ee" />
                </View>
            ) : null}

            {sessions.map((session) => (
                <PressableCard key={session.id} session={session} onPress={() => handleOpen(session.id)} />
            ))}

            <Button mode="contained" onPress={handleCreate} style={styles.createButton} buttonColor="#22d3ee" textColor="#02111f">
                Nouvelle séance
            </Button>
        </ScrollView>
    );
}

const PressableCard = ({ session, onPress }: { session: Parameters<typeof formatSessionSummary>[0]; onPress: () => void }) => {
    const summary = formatSessionSummary(session);
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} accessibilityRole="button">
            <View style={styles.cardRow}>
                <View>
                    <Text style={styles.cardOverline}>{summary.date}</Text>
                    <Text style={styles.cardTitle}>{session.title}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#94a3b8" />
            </View>
            <Text style={styles.cardDesc}>{session.description}</Text>
            <View style={styles.cardMetaRow}>
                <Text style={styles.cardMeta}>{summary.type}</Text>
                <Text style={styles.cardMeta}>{summary.seriesLabel}</Text>
                <Text style={styles.cardMeta}>{summary.volumeLabel}</Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        gap: 16,
        backgroundColor: "#010617",
        flexGrow: 1,
    },
    header: {
        gap: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#f8fafc",
    },
    subtitle: {
        color: "#94a3b8",
    },
    error: {
        color: "#f87171",
    },
    card: {
        borderRadius: 20,
        padding: 16,
        backgroundColor: "rgba(2,6,23,0.9)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 10,
    },
    cardPressed: {
        borderColor: "#22d3ee",
        backgroundColor: "rgba(2,6,23,0.75)",
    },
    cardRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardOverline: {
        color: "#38bdf8",
        textTransform: "uppercase",
        letterSpacing: 1,
        fontSize: 12,
    },
    cardTitle: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "600",
    },
    cardDesc: {
        color: "#cbd5e1",
    },
    cardMetaRow: {
        flexDirection: "row",
        gap: 12,
        flexWrap: "wrap",
    },
    cardMeta: {
        color: "#94a3b8",
        fontSize: 13,
    },
    createButton: {
        marginTop: 16,
    },
    stateContainer: {
        paddingVertical: 40,
    },
});
