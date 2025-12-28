import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Canvas, Circle, BlurMask } from "@shopify/react-native-skia";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../src/styles/theme";
import { User } from "../../../src/types/User";
import SkiaProgressBar from "./SkiaProgressBar";
import { buildPerformanceHighlights, computePerformanceProgress, getPerformanceGradient } from "../../utils/performance";

const disciplineGradients: Record<string, [string, string]> = {
    sprint: ["#0f172a", "#0b2e3fff"],
    endurance: ["#111827", "#22d3ee"],
    saut: ["#1e1b4b", "#241a2dff"],
    lancer: ["#141b2f", "#2d231bff"],
};

const getGradientForDiscipline = (discipline?: string): [string, string] => {
    if (!discipline) return ["#0f172a", "#0ea5e9"];
    const normalized = discipline.toLowerCase();
    if (normalized.includes("saut")) return disciplineGradients.saut;
    if (normalized.includes("lancer")) return disciplineGradients.lancer;
    if (normalized.includes("fond") || normalized.includes("marathon") || normalized.includes("trail")) {
        return disciplineGradients.endurance;
    }
    return disciplineGradients.sprint;
};

const SectionTitle = ({ icon, label }: { icon: string; label: string }) => (
    <View style={styles.sectionTitleRow}>
        <Ionicons name={icon as any} size={16} color="#ffffffcc" />
        <Text style={styles.sectionTitleText}>{label}</Text>
    </View>
);


type ProfileHighlightsCardProps = {
    user: User;
    showStatsLink?: boolean;
};

export default function ProfileHighlightsCard({ user, showStatsLink = true }: ProfileHighlightsCardProps) {
    if (user.role === "coach") return null;

    const discipline = user.mainDiscipline || "A renseigner";
    const gradient = getGradientForDiscipline(discipline);
    const recordPointsMap = user.recordPoints || {};
    const recordEntries = Object.entries(user.records || {})
        .map(([epreuve, value]) => {
            const points = recordPointsMap?.[epreuve];
            const parsedPerf = parseFloat(String(value).replace(/[^0-9.,-]/g, "").replace(",", "."));
            const score = Number.isFinite(points) ? Number(points) : Number.isFinite(parsedPerf) ? parsedPerf : 0;
            return { epreuve, value: String(value), points: Number.isFinite(points) ? Number(points) : undefined, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    const performanceHighlights = buildPerformanceHighlights(user.performances, user.performanceTimeline, 0, user.records);

    const normalizeLabel = (value?: string) => (value || "").trim().toLowerCase();
    const highlightMap = new Map<string, { bestSeason?: string }>();
    performanceHighlights.forEach((perf) => {
        highlightMap.set(normalizeLabel(perf.epreuve), { bestSeason: perf.bestSeason });
    });

    const recordsWithSeason = recordEntries.map((entry) => {
        const match = highlightMap.get(normalizeLabel(entry.epreuve));
        const seasonValue = match?.bestSeason || "0";
        const progress = computePerformanceProgress(entry.epreuve, entry.value, seasonValue);
        const gradient = getPerformanceGradient(progress);
        return { ...entry, seasonValue, progress, gradient };
    });

    return (
        <View style={styles.card}>
            <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Canvas style={styles.canvasDecor}>
                <Circle cx={40} cy={20} r={50} color="rgba(255,255,255,0.12)">
                    <BlurMask blur={20} style="normal" />
                </Circle>
                <Circle cx={220} cy={120} r={80} color="rgba(255,255,255,0.08)">
                    <BlurMask blur={60} style="normal" />
                </Circle>
            </Canvas>

            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <View style={styles.disciplineBlock}>
                        <Text style={styles.label}>Performances clés</Text>
                    </View>

                </View>

                <View style={[styles.section, styles.recordsSection]}>
                    <SectionTitle icon="speedometer-outline" label="Records vs saison" />
                    {recordsWithSeason.length > 0 ? (
                        <View style={styles.recordsList}>
                            {recordsWithSeason.map((entry, index) => (
                                <View key={`${entry.epreuve}-${index}`} style={styles.progressRow}>
                                    <View style={{ flex: 1, gap: 4 }}>
                                        <View style={styles.recordHeaderRow}>
                                            <Text style={styles.recordLabel}>{entry.epreuve}</Text>
                                        </View>
                                        <Text style={styles.subText}>Record · <Text style={styles.bold}>{entry.value}</Text></Text>
                                        <Text style={styles.subText}>Saison · <Text style={styles.bold}>{entry.seasonValue}</Text></Text>
                                    </View>
                                    <View style={styles.progressCol}>
                                        <SkiaProgressBar progress={entry.progress} colors={entry.gradient} height={10} />
                                    </View>
                                    <Text style={styles.percentText}>{Math.floor(entry.progress * 100)}%</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.emptyText}>Aucun record enregistré.</Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 28,
        overflow: "hidden",
        backgroundColor: colors.primary,
        marginBottom: 22,
        position: "relative",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
        shadowColor: "#0f172a",
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
    },
    canvasDecor: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        padding: 20,
        gap: 18,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 20,
    },
    disciplineBlock: {
        flex: 1,
        alignItems: "center",
    },
    label: {
        color: "#cbd5e1",
        fontSize: 12,
        letterSpacing: 1,
        textTransform: "uppercase",
        textAlign: "center",
    },
    title: {
        color: colors.white,
        fontSize: 24,
        fontWeight: "700",
        maxWidth: 220,
        textAlign: "center",
    },
    section: {
        backgroundColor: "rgba(15,23,42,0.32)",
        borderRadius: 18,
        padding: 18,
        gap: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    recordsSection: {},
    recordsList: {
        gap: 8,
    },
    progressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    progressCol: {
        flex: 1,
        justifyContent: "center",
    },
    recordLabel: {
        color: colors.textLight,
        fontSize: 14,
        flexShrink: 1,
        marginRight: 8,
    },
    subText: {
        color: "#cbd5e1",
        fontSize: 12,
    },
    bold: {
        color: colors.white,
        fontWeight: "700",
    },
    percentText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: "700",
        width: 46,
        textAlign: "right",
    },
    recordValue: {
        color: colors.white,
        fontSize: 15,
        fontWeight: "700",
    },
    sectionButton: {
        marginTop: 6,
        borderRadius: 16,
        paddingVertical: 12,
        backgroundColor: "#22d3ee",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: "rgba(15,23,42,0.15)",
    },
    sectionButtonText: {
        color: "#0f172a",
        fontWeight: "700",
        fontSize: 14,
    },
    sectionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    sectionTitleText: {
        color: "#f8fafc",
        fontWeight: "700",
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    recordHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    emptyText: {
        color: "#cbd5e1",
        fontSize: 13,
    },
});