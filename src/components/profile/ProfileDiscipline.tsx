import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../src/styles/theme";
import { User } from "../../../src/types/User";
import SkiaProgressBar from "./SkiaProgressBar";
import {
    computePerformanceProgress,
    getPerformanceColor,
    getPerformanceGradient,
} from "../../utils/performance";

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
}: {
    epreuve: string;
    record?: string;
    season?: string;
}) {
    const progress = computePerformanceProgress(epreuve, record, season);
    const color = getPerformanceColor(progress);
    const gradient = getPerformanceGradient(progress);

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

            <View style={styles.progressWrapper}>
                <SkiaProgressBar progress={progress} colors={gradient} height={8} />
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
    progressWrapper: {
        flex: 1.5,
        justifyContent: "center",
        marginHorizontal: 10,
    },
    percent: { width: 40, fontSize: 12, fontWeight: "700", textAlign: "right" },
    valueLight: { fontSize: 13, color: "#94a3b8", marginTop: 6 },
});
