import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { PerformancePoint } from "../../types/User";
import { getDisciplineMetricMeta } from "../../utils/performance";

interface Props {
    discipline: string;
    results: PerformancePoint[];
}

const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toISOString().split("T")[0];
};

export default function FfaResultsList({ discipline, results }: Props) {
    const meta = useMemo(() => getDisciplineMetricMeta(discipline), [discipline]);
    const list = useMemo(
        () =>
            [...results].sort((a, b) => {
                const ta = new Date(a.date).getTime();
                const tb = new Date(b.date).getTime();
                return Number.isFinite(tb) && Number.isFinite(ta) ? tb - ta : 0;
            }),
        [results]
    );

    if (list.length === 0) {
        return (
            <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Aucun résultat détaillé pour cette discipline.</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <Text style={styles.title}>Résultats détaillés</Text>
            {list.map((item, idx) => (
                <View key={`${item.date}-${item.value}-${idx}`} style={styles.row}>
                    <View style={styles.left}>
                        <Text style={styles.date}>{formatDate(item.date)}</Text>
                        <Text style={styles.meeting}>{item.meeting || "Meeting"}{item.city ? ` · ${item.city}` : ""}</Text>
                    </View>
                    <View style={styles.right}>
                        <Text style={styles.value}>{meta.formatValue(item.value, "compact")}</Text>
                        {typeof item.points === "number" && Number.isFinite(item.points) ? (
                            <Text style={styles.points}>{item.points} pts</Text>
                        ) : null}
                    </View>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginTop: 12,
        padding: 14,
        borderRadius: 16,
        backgroundColor: "rgba(15,23,42,0.4)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        gap: 10,
    },
    title: {
        color: "#e2e8f0",
        fontWeight: "700",
        fontSize: 16,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(148,163,184,0.15)",
    },
    left: {
        flexShrink: 1,
    },
    right: {
        alignItems: "flex-end",
        gap: 2,
    },
    date: {
        color: "#f8fafc",
        fontWeight: "600",
    },
    meeting: {
        color: "#cbd5e1",
        fontSize: 12,
        marginTop: 2,
    },
    value: {
        color: "#22d3ee",
        fontWeight: "700",
    },
    points: {
        color: "#cbd5e1",
        fontSize: 12,
    },
    emptyBox: {
        padding: 12,
        borderRadius: 14,
        backgroundColor: "rgba(15,23,42,0.35)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.18)",
        marginTop: 12,
    },
    emptyText: {
        color: "#cbd5e1",
        textAlign: "center",
    },
});
