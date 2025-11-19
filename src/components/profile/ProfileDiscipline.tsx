import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card } from "react-native-paper";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../src/styles/theme";
import { User } from "../../../src/types/User";

/* --- Fonctions utilitaires --- */
function parseTime(value?: string) {
    if (!value) return null;
    const num = parseFloat(value.replace(/[^\d.]/g, ""));
    return isNaN(num) ? null : num;
}

function computeProgress(discipline: string = "Sprint", record?: string, season?: string): number {
    // 🧩 Sprint / épreuves chronométrées : plus petit = meilleur
    if (discipline.toLowerCase() === "sprint" || discipline.toLowerCase() === "fond" || discipline.toLowerCase() === "demi-fond") {
        const recordTime = parseTime(record);
        const seasonTime = parseTime(season);
        if (!recordTime || !seasonTime) return 0;

        const ratio = recordTime / seasonTime; // ex: 10.50 / 10.80 = 0.9722
        const progress = Math.min(ratio, 1);

        console.log(`[${discipline}] chrono ratio =`, progress);
        return progress;
    }

    // 🏹 Saut / Lancer : plus grand = meilleur
    else if (discipline.toLowerCase() === "saut" || discipline.toLowerCase() === "lancer") {
        const recordDist = parseFloat(record || "0");
        const seasonDist = parseFloat(season || "0");
        if (!recordDist || !seasonDist) return 0;

        const ratio = seasonDist / recordDist; // ex: 7.60 / 8.00 = 0.95
        const progress = Math.min(ratio, 1);

        console.log(`[${discipline}] distance ratio =`, progress);
        return progress;
    }

    // ⚙️ Cas non pris en charge : on retourne 0
    console.warn(`Discipline "${discipline}" non reconnue pour computeProgress()`);
    return 0;
}


function getColor(value: number) {
    if (value >= 0.95) return "#22c55e";
    if (value >= 0.8) return "#0ea5e9";
    if (value >= 0.6) return "#f97316";
    return "#cbd5e1";
}

/* --- Composant principal --- */
export default function ProfileDiscipline({ user }: { user: User }) {
    const discipline = user.mainDiscipline || "Non spécifiée";
    const category = user.category || "Inconnu";
    const performances = user.performances || [];

    return (
        <Card style={styles.card}>
            <Card.Content>
                {/* Discipline + Niveau */}
                <View style={styles.headerRow}>
                    <Ionicons name="barbell-outline" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Discipline</Text>
                </View>
                <Text style={styles.value}>{discipline}</Text>

                <View style={styles.divider} />

                <View style={styles.headerRow}>
                    <Ionicons name="trending-up-outline" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Catégorie</Text>
                </View>
                <Text style={styles.value}>{category}</Text>

                <View style={styles.divider} />

                {/* Performances */}
                <View style={styles.headerRow}>
                    <Ionicons name="stopwatch-outline" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Mes performances</Text>
                </View>

                {performances.length > 0 ? (
                    performances.map((perf, i) => (
                        <PerformanceRow
                            key={i}
                            epreuve={perf.epreuve}
                            record={perf.record}
                            season={perf.bestSeason}
                            delay={i * 100}
                        />
                    ))
                ) : (
                    <Text style={styles.valueLight}>
                        Aucune performance enregistrée pour le moment.
                    </Text>
                )}
            </Card.Content>
        </Card>
    );
}

/* --- Ligne animée --- */
function PerformanceRow({
    epreuve,
    record,
    season,
    delay = 0,
}: {
    epreuve: string;
    record?: string;
    season?: string;
    delay?: number;
}) {
    const progress = computeProgress(record, season);
    const color = getColor(progress);

    const value = useSharedValue(0);
    useEffect(() => {
        value.value = withDelay(
            delay,
            withTiming(progress, { duration: 5000, easing: Easing.out(Easing.exp) })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        width: `${value.value * 100}%`,
    }));

    return (
        <View style={styles.row}>
            <View style={{ flex: 1 }}>
                <Text style={styles.eventName}>{epreuve}</Text>
                <Text style={styles.subText}>
                    Record : <Text style={styles.bold}>{record || "—"}</Text>
                </Text>
                <Text style={styles.subText}>
                    Saison : <Text style={styles.bold}>{season || "—"}</Text>
                </Text>
            </View>

            <View style={styles.progressContainer}>
                <Animated.View
                    style={[styles.progressBar, animatedStyle, { backgroundColor: color }]}
                />
            </View>

            <Text style={[styles.percent, { color }]}>{Math.floor(progress * 100)}%</Text>
        </View>
    );
}

/* --- Styles --- */
const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        backgroundColor: colors.white,
        marginBottom: 20,
        paddingBottom: 6,
        elevation: 2,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.text,
        marginLeft: 6,
    },
    value: { fontSize: 14, color: colors.textLight, marginBottom: 8 },
    divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 10 },
    row: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 8,
    },
    eventName: { fontSize: 14, color: colors.text, fontWeight: "600" },
    subText: { fontSize: 12, color: colors.textLight },
    bold: { fontWeight: "600", color: colors.text },
    progressContainer: {
        flex: 1.5,
        height: 6,
        backgroundColor: "#e2e8f0",
        borderRadius: 4,
        marginHorizontal: 10,
        overflow: "hidden",
    },
    progressBar: { height: 6, borderRadius: 4 },
    percent: { width: 40, fontSize: 12, fontWeight: "700", textAlign: "right" },
    valueLight: { fontSize: 13, color: "#94a3b8", marginTop: 6 },
});
