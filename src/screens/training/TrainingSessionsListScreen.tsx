import React from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTrainingSessionsList } from "../../hooks/useTrainingSessionsList";
import { formatSessionSummary } from "../../utils/trainingFormatter";

export default function TrainingSessionsListScreen() {
    const router = useRouter();
    const { sessions, loading, error, refresh } = useTrainingSessionsList();
    const tabBarHeight = useBottomTabBarHeight();
    const insets = useSafeAreaInsets();
    const bottomSpacing = tabBarHeight + Math.max(insets.bottom, 10);

    const handleOpen = (id: string) => {
        router.push({ pathname: "/(main)/training/[id]", params: { id } });
    };

    const handleCreate = () => router.push("/(main)/training/create");

    return (
        <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
            <ScrollView
                contentContainerStyle={[styles.container, { paddingBottom: bottomSpacing }]}
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

                <Button
                    mode="contained"
                    onPress={handleCreate}
                    style={styles.createButton}
                    buttonColor="#22d3ee"
                    textColor="#02111f"
                >
                    Nouvelle séance
                </Button>
            </ScrollView>
        </SafeAreaView>
    );
}

const typeColors = {
    vitesse: '#38bdf8',
    endurance: '#22d3ee',
    force: '#facc15',
    technique: '#a3e635',
    récupération: '#f472b6',
    default: '#818cf8',
};

const PressableCard = ({ session, onPress }: { session: Parameters<typeof formatSessionSummary>[0]; onPress: () => void }) => {
    const summary = formatSessionSummary(session);
    const typeColor = typeColors[session.type as keyof typeof typeColors] || typeColors.default;
    // On cache le volume si pas de distance (totalMeters = 0)
    const hasVolume = summary.volumeLabel && summary.volumeLabel !== '0 m' && summary.volumeLabel !== '0.0 km';
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.cardModern, pressed && styles.cardModernPressed]} accessibilityRole="button">
            <View style={styles.timelineRow}>
                <View style={styles.timelineDotWrapper}>
                    <View style={[styles.timelineDot, { backgroundColor: typeColor }]} />
                    <View style={styles.timelineLine} />
                </View>
                <View style={styles.cardModernContent}>
                    <View style={styles.cardModernHeader}>
                        <Text style={styles.cardModernDate}>{summary.date}</Text>
                        <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
                            <Text style={styles.typeBadgeText}>{summary.type}</Text>
                        </View>
                    </View>
                    <Text style={styles.cardModernTitle}>{session.title}</Text>
                    {summary.place ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                            <MaterialCommunityIcons name="map-marker" size={16} color="#9a1c0cff" />
                            <Text style={styles.cardModernPlace}>{summary.place}</Text>
                        </View>
                    ) : null}
                    <Text style={styles.cardModernDesc}>{session.description}</Text>
                    {session.equipment ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                            <MaterialCommunityIcons name="toolbox-outline" size={16} color="#facc15" />
                            <Text style={styles.cardModernMeta}>{session.equipment}</Text>
                        </View>
                    ) : null}
                    <View style={styles.cardModernMetaRow}>
                        <MaterialCommunityIcons name="layers-triple-outline" size={16} color="#38bdf8" />
                        <Text style={styles.cardModernMeta}>{summary.seriesLabel}</Text>
                        {hasVolume && (
                            <>
                                <MaterialCommunityIcons name="run-fast" size={16} color="#facc15" />
                                <Text style={styles.cardModernMeta}>{summary.volumeLabel}</Text>
                            </>
                        )}
                    </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={28} color="#38bdf8" style={{ alignSelf: 'center' }} />
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#010617",
    },
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
    cardModern: {
        borderRadius: 24,
        backgroundColor: "#0f172a",
        marginBottom: 8,
        shadowColor: "#22d3ee",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
        paddingVertical: 18,
        paddingHorizontal: 14,
    },
    cardModernPressed: {
        backgroundColor: "#1e293b",
        shadowOpacity: 0.22,
        elevation: 8,
    },
    timelineRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    timelineDotWrapper: {
        alignItems: "center",
        marginRight: 14,
        width: 18,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 6,
        marginBottom: 2,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: "#334155",
        marginTop: 2,
        borderRadius: 1,
    },
    cardModernContent: {
        flex: 1,
        gap: 2,
    },
    cardModernHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    cardModernDate: {
        color: "#38bdf8",
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    typeBadge: {
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 2,
        alignSelf: "flex-start",
        marginLeft: 8,
    },
    typeBadgeText: {
        color: "#0f172a",
        fontWeight: "700",
        fontSize: 12,
        textTransform: "capitalize",
        letterSpacing: 0.5,
    },
    cardModernTitle: {
        color: "#f8fafc",
        fontSize: 19,
        fontWeight: "700",
        marginBottom: 2,
    },
    cardModernPlace: {
        color: "#94a3b8",
        fontSize: 14,
        marginBottom: 2,
    },
    cardModernDesc: {
        color: "#cbd5e1",
        fontSize: 14,
        marginBottom: 4,
    },
    cardModernMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 2,
    },
    cardModernMeta: {
        color: "#94a3b8",
        fontSize: 13,
        marginRight: 6,
    },
    createButton: {
        marginTop: 16,
    },
    stateContainer: {
        paddingVertical: 40,
    },
});
