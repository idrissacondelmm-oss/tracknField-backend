import React, { useMemo } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTrainingTemplatesList } from "../../hooks/useTrainingTemplatesList";
import { TrainingTemplate } from "../../types/trainingTemplate";

const formatTypeLabel = (value?: string) => {
    switch (value) {
        case "vitesse":
            return "Vitesse";
        case "endurance":
            return "Endurance";
        case "force":
            return "Force";
        case "technique":
            return "Technique";
        case "récupération":
            return "Récupération";
        default:
            return value || "—";
    }
};

const getTemplateSubtitle = (template: TrainingTemplate) => {
    const parts: string[] = [];
    const typeLabel = formatTypeLabel(template.type);
    if (typeLabel) parts.push(typeLabel);
    if (typeof template.version === "number") parts.push(`v${template.version}`);
    return parts.join(" · ");
};

export default function TrainingTemplatesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { templates, loading, error, refresh } = useTrainingTemplatesList();

    const sortedTemplates = useMemo(() => {
        const list = [...templates];
        list.sort((a, b) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return bTime - aTime;
        });
        return list;
    }, [templates]);

    const handleUseTemplate = (templateId: string) => {
        router.push(`/(main)/training/templates/use/${templateId}`);
    };

    const handleCreateTemplate = () => {
        router.push("/(main)/training/templates/new");
    };

    const handleEditTemplate = (templateId: string) => {
        router.push(`/(main)/training/templates/edit/${templateId}`);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#22d3ee" />}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Mes plans d’entraînement</Text>
                    <Text style={styles.subtitle}>Créés des plans d’entraînement réutilisables.</Text>
                    <Button
                        mode="contained"
                        onPress={handleCreateTemplate}
                        buttonColor="#22d3ee"
                        textColor="#02111f"
                        disabled={loading}
                    >
                        Nouveau template
                    </Button>
                </View>

                {error ? (
                    <View style={styles.stateContainer}>
                        <Text style={styles.stateTitle}>Impossible de charger</Text>
                        <Text style={styles.stateSubtitle}>{error}</Text>
                    </View>
                ) : null}

                {loading && !sortedTemplates.length ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="small" color="#22d3ee" />
                    </View>
                ) : null}

                {!loading && !sortedTemplates.length ? (
                    <View style={styles.stateContainer}>
                        <Text style={styles.stateTitle}>Aucun plan d’entraînement</Text>

                    </View>
                ) : (
                    <View style={styles.list}>
                        {sortedTemplates.map((template) => (
                            <View key={template.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardIcon}>
                                        <MaterialCommunityIcons name="bookmark-multiple-outline" size={18} color="#38bdf8" />
                                    </View>
                                    <View style={styles.cardMain}>
                                        <Text style={styles.cardTitle}>{template.title}</Text>
                                        <Text style={styles.cardSubtitle}>{getTemplateSubtitle(template)}</Text>
                                    </View>
                                </View>
                                <View style={styles.cardActions}>
                                    <Button
                                        mode="outlined"
                                        onPress={() => handleEditTemplate(template.id)}
                                        textColor="#cbd5e1"
                                        disabled={loading}
                                    >
                                        Modifier
                                    </Button>
                                    <Button
                                        mode="contained"
                                        onPress={() => handleUseTemplate(template.id)}
                                        buttonColor="#22d3ee"
                                        textColor="#02111f"
                                        disabled={loading}
                                    >
                                        Planifier
                                    </Button>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#020617",
    },
    scroll: {
        flex: 1,
        backgroundColor: "#020617",
    },
    container: {
        paddingHorizontal: 12,
        gap: 18,
    },
    header: {
        gap: 8,
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
    loadingBox: {
        paddingVertical: 16,
        alignItems: "center",
    },
    list: {
        gap: 12,
    },
    card: {
        borderRadius: 20,
        padding: 16,
        backgroundColor: "rgba(15,23,42,0.75)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: "rgba(56,189,248,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    cardMain: {
        flex: 1,
        gap: 2,
    },
    cardTitle: {
        color: "#f8fafc",
        fontSize: 16,
        fontWeight: "700",
    },
    cardSubtitle: {
        color: "#94a3b8",
        fontSize: 13,
    },
    cardActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 12,
    },
    stateContainer: {
        borderRadius: 22,
        padding: 18,
        backgroundColor: "rgba(15,23,42,0.75)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
        gap: 8,
    },
    stateTitle: {
        color: "#f8fafc",
        fontSize: 14,
        textAlign: "center",
        fontStyle: "italic"
    },
    stateSubtitle: {
        color: "#cbd5e1",
        lineHeight: 20,
    },
});
