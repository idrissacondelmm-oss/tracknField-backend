import React from "react";
import { View, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { Text } from "react-native-paper";

interface IntensitySliderProps {
    value?: number;
    onChange?: (value: number) => void;
    disabled?: boolean;
    label?: string;
}

export function IntensitySlider({ value = 5, onChange, disabled, label = "Intensité" }: IntensitySliderProps) {
    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}/10</Text>
            </View>
            <Slider
                value={value}
                onValueChange={onChange}
                disabled={disabled}
                minimumValue={1}
                maximumValue={10}
                step={1}
                minimumTrackTintColor="#22d3ee"
                maximumTrackTintColor="#1e293b"
                thumbTintColor="#22d3ee"
                style={styles.slider}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 6 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    label: { fontWeight: "600", color: "#f8fafc" },
    value: { fontWeight: "700", color: "#e2e8f0" },
    slider: { marginTop: 4 },
});
