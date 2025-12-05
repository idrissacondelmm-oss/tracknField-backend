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
        gradient: ["#000000", "#020202", "#040404"],
        accent: ["rgba(34,197,94,0.35)", "rgba(14,165,233,0.35)", "rgba(236,72,153,0.25)"],
        vignette: "rgba(0,0,0,0.75)",
    },
    dark: {
        gradient: ["#000000", "#010101", "#020202"],
        accent: ["rgba(125,211,252,0.35)", "rgba(147,51,234,0.25)", "rgba(248,113,113,0.25)"],
        vignette: "rgba(0,0,0,0.7)",
    },
};

const blobConfigs = [
    { x: 0.2, y: 0.15, r: 120 },
    { x: 0.85, y: 0.25, r: 140 },
    { x: 0.5, y: 0.75, r: 200 },
];

export default function AppBackground({ children }: { children: ReactNode }) {
    const colorScheme = useColorScheme();
    const palette = colorScheme === "dark" ? palettes.dark : palettes.light;
    const { width, height } = useWindowDimensions();

    const circles = useMemo(
        () =>
            blobConfigs.map((blob, index) => ({
                cx: blob.x * width,
                cy: blob.y * height,
                r: blob.r,
                color: palette.accent[index % palette.accent.length],
            })),
        [width, height, palette]
    );

    return (
        <View style={styles.wrapper}>
            <LinearGradient
                colors={palette.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            <Canvas style={StyleSheet.absoluteFill}>
                {circles.map((circle, idx) => (
                    <Circle key={idx} cx={circle.cx} cy={circle.cy} r={circle.r} color={circle.color}>
                        <BlurMask blur={60} style="normal" />
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
        backgroundColor: "#000",
    },
    vignette: {
        opacity: 0.4,
    },
    content: {
        flex: 1,
    },
});
