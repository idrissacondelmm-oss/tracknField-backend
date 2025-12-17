import React, { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, View, ActivityIndicator } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { joinTrainingGroup, searchTrainingGroups } from "../../api/groupService";
import { TrainingGroupSummary } from "../../types/trainingGroup";

export default function TrainingGroupSearchScreen() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<TrainingGroupSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searched, setSearched] = useState(false);
    const [autoSearchReady, setAutoSearchReady] = useState(false);
    const insets = useSafeAreaInsets();

    const fetchResults = useCallback(
        async (term: string, options?: { showLoader?: boolean }) => {
            const trimmed = term.trim();
            const showLoader = options?.showLoader ?? true;
            try {
                if (showLoader) setLoading(true);
                const data = await searchTrainingGroups(trimmed, 5);
                setResults(data);
                setSearched(true);
            } catch (error: any) {
                const message = error?.response?.data?.message || error?.message || "Recherche impossible";
                Alert.alert("Erreur", message);
            } finally {
                if (showLoader) setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchResults("", { showLoader: true }).finally(() => setAutoSearchReady(true));
    }, [fetchResults]);

    useEffect(() => {
        if (!autoSearchReady) return;
        const handler = setTimeout(() => {
            fetchResults(query, { showLoader: false });
        }, 300);
        return () => clearTimeout(handler);
    }, [autoSearchReady, fetchResults, query]);

    const performSearch = useCallback(async () => {
        try {
            await fetchResults(query, { showLoader: true });
        } catch (error) {
            console.error(error);
        }
    }, [fetchResults, query]);

    const handleJoin = useCallback(async (group: TrainingGroupSummary) => {
        if (group.isMember) {
            return;
        }
        try {
            setRefreshing(true);
            const updated = await joinTrainingGroup(group.id);
            setResults((prev) => prev.map((item) => (item.id === group.id ? { ...item, ...updated } : item)));
            Alert.alert("Bienvenue", `Vous avez rejoint ${group.name}.`);
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || "Impossible de rejoindre ce groupe";
            Alert.alert("Erreur", message);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handleRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            await fetchResults(query, { showLoader: false });
        } finally {
            setRefreshing(false);
        }
    }, [fetchResults, query]);

    const isSuggestionMode = query.trim().length === 0;

    return (
        <SafeAreaView style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 16) }]} edges={["left", "right", "bottom"]}>
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#22d3ee" />}
            >
                <View style={styles.header}>
                    <Text style={styles.overline}>Groupes d’entraînement</Text>
                    <Text style={styles.title}>Rejoindre un groupe</Text>
                    <Text style={styles.subtitle}>
                        Recherchez le nom partagé par votre coach. Si le groupe existe, vous pourrez le rejoindre en un
                        tap.
                    </Text>
                </View>
                <View style={styles.card}>
                    <TextInput
                        label="Nom du groupe"
                        value={query}
                        onChangeText={setQuery}
                        mode="outlined"
                        style={styles.input}
                        placeholder="Ex: Sprint Club Lyon"
                        returnKeyType="search"
                        onSubmitEditing={performSearch}
                        autoCapitalize="words"
                    />
                    <Button mode="contained" onPress={performSearch} loading={loading} disabled={loading} buttonColor="#22d3ee" textColor="#02111f">
                        Rechercher
                    </Button>
                </View>
                <View style={styles.resultsContainer}>
                    <View style={styles.resultsHeader}>
                        <Text style={styles.resultsTitle}>{isSuggestionMode ? "Suggestions" : "Résultats"}</Text>
                        <Text style={styles.resultsHint}>
                            {isSuggestionMode ? "Top 5 groupes" : `${results.length} résultat${results.length > 1 ? "s" : ""}`}
                        </Text>
                    </View>
                    {loading ? (
                        <ActivityIndicator size="small" color="#22d3ee" style={{ marginVertical: 12 }} />
                    ) : null}
                    {searched && !results.length && !loading ? (
                        <Text style={styles.emptyState}>Aucun groupe trouvé pour cette recherche.</Text>
                    ) : null}
                    {results.map((group) => (
                        <View key={group.id} style={styles.groupCard}>
                            <View style={{ flex: 1, gap: 4 }}>
                                <Text style={styles.groupName}>{group.name}</Text>
                                {group.description ? <Text style={styles.groupDescription}>{group.description}</Text> : null}
                                <Text style={styles.groupMeta}>{group.membersCount} membre{group.membersCount > 1 ? "s" : ""}</Text>
                            </View>
                            <Button
                                mode={group.isMember ? "outlined" : "contained"}
                                onPress={() => handleJoin(group)}
                                disabled={group.isMember || refreshing}
                                textColor={group.isMember ? "#94a3b8" : "#02111f"}
                                buttonColor={group.isMember ? "transparent" : "#22d3ee"}
                            >
                                {group.isMember ? "Dans le groupe" : "Rejoindre"}
                            </Button>
                        </View>
                    ))}
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
    container: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
        gap: 16,
    },
    header: {
        gap: 6,
    },
    overline: {
        textTransform: "uppercase",
        letterSpacing: 1.6,
        color: "#38bdf8",
        fontSize: 12,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: "#f8fafc",
    },
    subtitle: {
        color: "#94a3b8",
        fontSize: 14,
        lineHeight: 20,
    },
    card: {
        borderRadius: 20,
        padding: 16,
        backgroundColor: "rgba(15,23,42,0.85)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 12,
    },
    input: {
        backgroundColor: "transparent",
    },
    resultsContainer: {
        gap: 10,
    },
    resultsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    resultsTitle: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "700",
    },
    resultsHint: {
        color: "#94a3b8",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    emptyState: {
        color: "#94a3b8",
        fontSize: 13,
        textAlign: "center",
        marginTop: 12,
    },
    groupCard: {
        borderRadius: 18,
        padding: 16,
        backgroundColor: "rgba(15,23,42,0.9)",
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.2)",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    groupName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#f8fafc",
    },
    groupDescription: {
        color: "#cbd5e1",
        fontSize: 13,
    },
    groupMeta: {
        color: "#94a3b8",
        fontSize: 12,
    },
});
