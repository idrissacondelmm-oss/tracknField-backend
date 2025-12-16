import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Canvas, Circle, BlurMask } from "@shopify/react-native-skia";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../../src/styles/theme";
import { User } from "../../../src/types/User";
import { Badge } from "../../../src/types/Badge";
import SkiaProgressBar from "./SkiaProgressBar";
import {
    buildPerformanceHighlights,
    computePerformanceProgress,
    getPerformanceGradient,
} from "../../utils/performance";

const disciplineGradients: Record<string, [string, string]> = {
    sprint: ["#0f172a", "#0ea5e9"],
    endurance: ["#111827", "#22d3ee"],
    saut: ["#1e1b4b", "#c084fc"],
    lancer: ["#141b2f", "#f97316"],
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

const normalizeBadges = (badges?: Badge[] | string[]) => {
    if (!badges || badges.length === 0) return [] as Badge[];
    return badges.map((badge, index) => {
        if (typeof badge === "string") {
            return {
                id: `${index}`,
                name: badge,
                description: badge,
                icon: "medal-outline",
                rarity: "common",
                isUnlocked: true,
            } as Badge;
        }
        return badge;
    });
};

const SectionTitle = ({ icon, label }: { icon: string; label: string }) => (
    <View style={styles.sectionTitleRow}>
        <Ionicons name={icon as any} size={16} color="#ffffffcc" />
        <Text style={styles.sectionTitleText}>{label}</Text>
    </View>
);

const InfoChip = ({ icon, value }: { icon: string; value: string }) => (
    <View style={styles.infoChip}>
        <Ionicons name={icon as any} size={14} color="#e2e8f0" />
        <Text style={styles.infoChipText}>{value}</Text>
    </View>
);

const BadgePill = ({ badge }: { badge: Badge }) => (
    <View style={styles.badgePill}>
        <Ionicons name={(badge.icon as any) || "medal-outline"} size={18} color="#facc15" />
        <View style={{ marginLeft: 6 }}>
            <Text style={styles.badgeName}>{badge.name}</Text>
            {badge.description && (
                <Text style={styles.badgeDesc} numberOfLines={1}>
                    {badge.description}
                </Text>
            )}
        </View>
    </View>
);

export default function ProfileHighlightsCard({ user }: { user: User }) {
    const discipline = user.mainDiscipline || "Discipline non définie";
    const performances = useMemo(
        () => buildPerformanceHighlights(user.performances, user.performanceTimeline, 3),
        [user.performances, user.performanceTimeline]
    );
    const badges = normalizeBadges(user.badges).slice(0, 3);
    const gradient = getGradientForDiscipline(discipline);
    const router = useRouter();

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
                        <Text style={styles.label}>Discipline principale</Text>
                        <Text style={styles.title}>{discipline}</Text>
                    </View>

                </View>

                <View style={styles.section}>
                    <SectionTitle icon="stopwatch-outline" label="Performances clés" />
                    {performances.length > 0 ? (
                        performances.map((perf, index) => {
                            const progress = computePerformanceProgress(perf.epreuve, perf.record, perf.bestSeason);
                            const gradientBar = getPerformanceGradient(progress);
                            return (
                                <View key={`${perf.epreuve}-${index}`} style={styles.performanceRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.performanceName}>{perf.epreuve}</Text>
                                        <Text style={styles.performanceDetail}>
                                            Record <Text style={styles.bold}>{perf.record || "—"}</Text> • Saison <Text style={styles.bold}>{perf.bestSeason || "—"}</Text>
                                        </Text>
                                        <View style={styles.progressRow}>
                                            <View style={{ flex: 1 }}>
                                                <SkiaProgressBar progress={progress} colors={gradientBar} height={10} />
                                            </View>
                                            <Text style={styles.progressValue}>{Math.round(progress * 100)}%</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <Text style={styles.emptyText}>Aucune performance pour le moment.</Text>
                    )}
                    <TouchableOpacity
                        style={styles.sectionButton}
                        onPress={() => router.push("/(main)/profile-stats")}
                    >
                        <Ionicons name="speedometer-outline" size={16} color="#0f172a" />
                        <Text style={styles.sectionButtonText}>Voir mes performances</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.section, styles.badgeSection]}>
                    <SectionTitle icon="medal-outline" label="Badges & highlights" />
                    {badges.length > 0 ? (
                        <View style={styles.badgeRow}>
                            {badges.map((badge) => (
                                <BadgePill key={badge.id} badge={badge} />
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.emptyText}>Aucun badge pour le moment.</Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: colors.primary,
        marginBottom: 20,
        position: "relative",
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
    chipRow: {
        flexDirection: "row",
        gap: 8,
    },
    infoChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 30,
        backgroundColor: "rgba(15,23,42,0.35)",
    },
    infoChipText: {
        color: "#f8fafc",
        fontSize: 12,
        fontWeight: "600",
    },
    section: {
        backgroundColor: "rgba(15,23,42,0.25)",
        borderRadius: 18,
        padding: 16,
        gap: 14,
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
        color: "#e2e8f0",
        fontWeight: "600",
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    performanceRow: {
        flexDirection: "row",
        gap: 12,
        paddingVertical: 4,
    },
    performanceName: {
        color: colors.white,
        fontWeight: "700",
        fontSize: 14,
    },
    performanceDetail: {
        color: "#e2e8f0",
        fontSize: 12,
        marginTop: 2,
    },
    bold: {
        fontWeight: "700",
        color: colors.white,
    },
    progressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 8,
    },
    progressValue: {
        color: "#e2e8f0",
        fontSize: 12,
        fontWeight: "700",
        minWidth: 40,
        textAlign: "right",
    },
    emptyText: {
        color: "#cbd5e1",
        fontSize: 13,
    },
    badgeSection: {
        marginBottom: 0,
    },
    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    badgePill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(15,23,42,0.45)",
        borderRadius: 50,
        paddingVertical: 10,
        paddingHorizontal: 14,
        minWidth: 120,
    },
    badgeName: {
        color: colors.white,
        fontWeight: "600",
        fontSize: 13,
    },
    badgeDesc: {
        color: "#cbd5e1",
        fontSize: 11,
    },
});