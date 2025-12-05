import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
    useSharedValue,
    withRepeat,
    withTiming,
    useAnimatedStyle,
} from "react-native-reanimated";

export default function ProfileAura() {
    const { width } = useWindowDimensions();
    const pulse = useSharedValue(0.85);

    React.useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1.05, { duration: 2800 }),
            -1,
            true
        );
    }, [pulse]);

    const gradientStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: 0.4 + (pulse.value - 0.85) * 1.2,
    }));

    const haloStyle = useAnimatedStyle(() => ({
        transform: [{ scale: 1.15 - (pulse.value - 0.85) }],
        opacity: 0.18 + (1.05 - pulse.value) * 0.9,
    }));

    return (
        <View style={[styles.wrapper, { width }]} pointerEvents="none">
            <Animated.View style={[styles.halo, haloStyle]} />
            <Animated.View style={[styles.gradientBlob, gradientStyle]} />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 220,
        overflow: "hidden",
        zIndex: -1,
        alignItems: "center",
        justifyContent: "center",
    },
    gradientBlob: {
        position: "absolute",
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: "rgba(56,189,248,0.35)",
        shadowColor: "#38bdf8",
        shadowOpacity: 0.4,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: 12 },
        elevation: 12,
    },
    halo: {
        position: "absolute",
        width: 360,
        height: 360,
        borderRadius: 180,
        backgroundColor: "rgba(14,165,233,0.25)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        shadowColor: "#0ea5e9",
        shadowOpacity: 0.25,
        shadowRadius: 45,
        shadowOffset: { width: 0, height: 16 },
        elevation: 16,
    },
});
