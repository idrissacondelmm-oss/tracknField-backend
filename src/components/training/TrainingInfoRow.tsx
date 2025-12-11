import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

interface TrainingInfoRowProps {
    label: string;
    value?: string | number | null;
}

export function TrainingInfoRow({ label, value }: TrainingInfoRowProps) {
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value ?? "—"}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(148,163,184,0.35)",
    },
    label: {
        fontSize: 12,
        color: "#94a3b8",
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    value: {
        fontSize: 16,
        fontWeight: "600",
        color: "#f8fafc",
        marginTop: 2,
    },
});
