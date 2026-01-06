import React, { ReactNode, useMemo } from "react";
import { View, StyleSheet, useColorScheme, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Canvas, Circle, BlurMask } from "@shopify/react-native-skia";

type Palette = {
    gradient: [string, string, string];
    accent: [string, string, string];
    vignette: string;
};

const palettes: Record<"light" | "dark", Palette> = {
    light: {
        gradient: ["#f8fafc", "#e2e8f0", "#cbd5e1"],
        accent: ["rgba(14,165,233,0.18)", "rgba(34,211,238,0.16)", "rgba(99,102,241,0.10)"],
        vignette: "rgba(2,6,23,0.12)",
    },
    dark: {
        gradient: ["#020617", "#0b1220", "#00040a"],
        accent: ["rgba(34,211,238,0.20)", "rgba(56,189,248,0.16)", "rgba(99,102,241,0.12)"],
        vignette: "rgba(2,6,23,0.55)",
    },
};

const blobConfigs = [
    { x: 0.12, y: 0.18, r: 0.32 },
    { x: 0.88, y: 0.22, r: 0.38 },
    { x: 0.65, y: 0.78, r: 0.50 },
    { x: 0.18, y: 0.82, r: 0.42 },
];

export default function AppBackground({ children }: { children: ReactNode }) {
    const colorScheme = useColorScheme();
    const palette = colorScheme === "dark" ? palettes.dark : palettes.light;
    const { width, height } = useWindowDimensions();

    const baseSize = Math.max(320, Math.min(width, height));

    const circles = useMemo(
        () =>
            blobConfigs.map((blob, index) => ({
                cx: blob.x * width,
                cy: blob.y * height,
                r: blob.r * baseSize,
                color: palette.accent[index % palette.accent.length],
            })),
        [width, height, baseSize, palette]
    );

    return (
        <View style={styles.wrapper}>
            <LinearGradient
                colors={palette.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <LinearGradient
                colors={["rgba(34,211,238,0.10)", "rgba(34,211,238,0.00)", "rgba(2,6,23,0.35)"]}
                locations={[0, 0.55, 1]}
                start={{ x: 0.15, y: 0.05 }}
                end={{ x: 0.85, y: 0.95 }}
                style={StyleSheet.absoluteFill}
            />

            <Canvas style={StyleSheet.absoluteFill}>
                {circles.map((circle, idx) => (
                    <Circle key={idx} cx={circle.cx} cy={circle.cy} r={circle.r} color={circle.color}>
                        <BlurMask blur={70} style="normal" />
                    </Circle>
                ))}
            </Canvas>

            <View style={[StyleSheet.absoluteFill, styles.vignette, { backgroundColor: palette.vignette }]} />

            <View style={styles.content}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: "#020617",
    },
    vignette: {
        opacity: 0.55,
    },
    content: {
        flex: 1,
    },
});
