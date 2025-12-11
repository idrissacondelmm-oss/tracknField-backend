import React from "react";
import { View, StyleSheet } from "react-native";
import { Chip, Text } from "react-native-paper";
import { TrainingType } from "../../types/training";
import { trainingTypeOptions } from "../../hooks/useTrainingForm";

interface TrainingTypeSelectProps {
    value: TrainingType;
    onChange: (value: TrainingType) => void;
    label?: string;
}

export function TrainingTypeSelect({ value, onChange, label = "Type" }: TrainingTypeSelectProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.chipRow}>
                {trainingTypeOptions.map((option) => (
                    <Chip
                        key={option.value}
                        selected={option.value === value}
                        onPress={() => onChange(option.value)}
                        mode="outlined"
                        compact
                        style={[
                            styles.chip,
                            option.value === value ? styles.chipSelected : styles.chipUnselected,
                        ]}
                        textStyle={[styles.chipText, option.value === value && styles.chipTextSelected]}
                    >
                        {option.label}
                    </Chip>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 8 },
    label: { fontWeight: "600", color: "#f8fafc", letterSpacing: 0.4 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
        borderRadius: 999,
        borderWidth: 1,
    },
    chipUnselected: {
        backgroundColor: "rgba(15,23,42,0.6)",
        borderColor: "rgba(148,163,184,0.4)",
    },
    chipSelected: {
        backgroundColor: "rgba(34,211,238,0.18)",
        borderColor: "rgba(34,211,238,0.6)",
    },
    chipText: {
        fontWeight: "600",
        color: "#cbd5e1",
    },
    chipTextSelected: {
        color: "#f8fafc",
    },
});
