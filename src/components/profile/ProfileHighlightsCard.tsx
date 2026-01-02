import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Canvas, Circle, BlurMask } from "@shopify/react-native-skia";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../src/styles/theme";
import { User } from "../../../src/types/User";
import SkiaProgressBar from "./SkiaProgressBar";
import { buildPerformanceHighlights, computePerformanceProgress, getPerformanceGradient } from "../../utils/performance";
import { useRouter } from "expo-router";

const disciplineGradients: Record<string, [string, string]> = {
    sprint: ["#0f172a", "#0b2e3fff"],
    endurance: ["#111827", "#253538ff"],
    saut: ["#1e1b4b", "#241a2dff"],
    lancer: ["#141b2f", "#2d231bff"],
};

const getGradientForDiscipline = (discipline?: string): [string, string] => {
    if (!discipline) return ["#0f172a", "#252b2eff"];
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
    const router = useRouter();
    if (user.role === "coach") return null;

    const hasLicense = Boolean(user.licenseNumber?.trim());

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
    const performanceHighlights = hasLicense
        ? buildPerformanceHighlights(user.performances, user.performanceTimeline, 0, user.records)
        : [];

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

    if (!hasLicense) {
        return (
            <View style={styles.card}>
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <View style={styles.disciplineBlock}>
                            <Text style={styles.label}>Performances clés</Text>
                        </View>
                    </View>
                    <View style={styles.licenseBlock}>
                        <View style={styles.licenseIconBadge}>
                            <Ionicons name="card-outline" size={20} color="#e8ebf2ff" />
                            <Text style={styles.licenseTitle}>
                                {showStatsLink ? "Ajoute ton numéro de licence" : "Donnée non disponible"}
                            </Text>
                        </View>
                        <Text style={styles.licenseText}>
                            {showStatsLink
                                ? "Renseigne ton numéro de licence pour afficher tes performances clés et suivre ta progression."
                                : "Cet athlète n'a pas encore partagé de performances clés."}
                        </Text>
                        {showStatsLink ? (
                            <TouchableOpacity
                                style={styles.sectionButton}
                                activeOpacity={0.9}
                                onPress={() => router.push("/(main)/edit-profile/sport")}
                            >
                                <Ionicons name="create-outline" size={16} color="#0f172a" />
                                <Text style={styles.sectionButtonText}>Compléter maintenant</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            </View>
        );
    }

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
                                <View key={`${entry.epreuve}-${index}`} style={styles.metricCard}>
                                    <View style={styles.metricTopRow}>
                                        <Text style={styles.recordLabel} numberOfLines={1}>
                                            {entry.epreuve}
                                        </Text>
                                    </View>

                                    <View style={styles.statsRow}>
                                        <View style={styles.statCard}>
                                            <Text style={styles.statLabel}>PB</Text>
                                            <Text style={styles.statValue} >
                                                {entry.value}
                                            </Text>
                                        </View>
                                        <View style={[styles.statCard, styles.statCardMuted]}>
                                            <Text style={styles.statLabel}>SB</Text>
                                            <Text style={styles.statValue}>
                                                {entry.seasonValue}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.progressRowNew}>
                                        <View style={styles.progressColNew}>
                                            <SkiaProgressBar progress={entry.progress} colors={entry.gradient} height={8} />
                                        </View>
                                        <View style={styles.percentPill}>
                                            <Text style={styles.percentPillText}>{Math.floor(entry.progress * 100)}%</Text>
                                        </View>
                                    </View>
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
        backgroundColor: "rgba(15,23,42,0.7)",
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
        padding: 8,
        gap: 8,
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
        color: "#b9c4d6ff",
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
        borderRadius: 18,
        padding: 8,
        gap: 14,
    },
    recordsSection: {
        padding: 0,
    },
    recordsList: {
        gap: 8,
    },
    licenseBlock: {
        backgroundColor: "rgba(15,23,42,0.5)",
        borderRadius: 20,
        padding: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    licenseIconBadge: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    licenseTitle: {
        color: colors.white,
        fontSize: 12,
        fontWeight: "700",
    },
    licenseText: {
        color: "#b9c4d6ff",
        fontSize: 12,
        lineHeight: 18,
    },
    metricCard: {
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
        gap: 5,
    },
    metricTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "stretch",
        gap: 10,
    },
    statCard: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",

        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: "rgba(15,23,42,0.55)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        gap: 10,
        minWidth: 0,
    },
    statCardMuted: {
        backgroundColor: "rgba(15,23,42,0.35)",
        borderColor: "rgba(255,255,255,0.06)",
    },
    statLabel: {
        color: "#b9c4d6ff",
        fontSize: 14,
        fontWeight: "700",

        textTransform: "uppercase",
    },
    statValue: {
        color: colors.white,
        fontSize: 14,
        fontWeight: "800",
        lineHeight: 18,
        fontStyle: "italic",
    },
    progressRowNew: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    progressColNew: {
        flex: 1,
        justifyContent: "center",
    },
    percentPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        minWidth: 56,
        alignItems: "center",
    },
    percentPillText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: "700",
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