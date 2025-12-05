import React, { useMemo, useState } from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import { Canvas, RoundedRect, LinearGradient, vec, Shadow } from "@shopify/react-native-skia";

interface SkiaProgressBarProps {
    progress: number;
    height?: number;
    colors?: string[];
    backgroundColor?: string;
    glowColor?: string;
}

export default function SkiaProgressBar({
    progress,
    height = 8,
    colors = ["#0ea5e9", "#22c55e"],
    backgroundColor = "#e2e8f0",
    glowColor = "#0ea5e955",
}: SkiaProgressBarProps) {
    const [width, setWidth] = useState(0);
    const clamped = useMemo(() => Math.max(0, Math.min(progress ?? 0, 1)), [progress]);

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width: nextWidth } = event.nativeEvent.layout;
        if (nextWidth !== width) {
            setWidth(nextWidth);
        }
    };

    const gradientColors = useMemo<[string, string]>(() => {
        if (!colors || colors.length === 0) {
            return ["#0ea5e9", "#22c55e"];
        }
        if (colors.length === 1) {
            return [colors[0], colors[0]];
        }
        return [colors[0], colors[colors.length - 1]];
    }, [colors]);

    return (
        <View style={[styles.wrapper, { height }]} onLayout={handleLayout}>
            {width > 0 && (
                <Canvas style={{ width, height }}>
                    <RoundedRect x={0} y={0} width={width} height={height} r={height / 2} color={backgroundColor} />
                    <RoundedRect x={0} y={0} width={width * clamped} height={height} r={height / 2}>
                        <LinearGradient start={vec(0, 0)} end={vec(width, 0)} colors={gradientColors} />
                        <Shadow dx={0} dy={2} blur={8} color={glowColor} />
                    </RoundedRect>
                </Canvas>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        width: "100%",
        justifyContent: "center",
    },
});
