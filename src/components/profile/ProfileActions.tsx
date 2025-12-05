import React from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { colors } from "../../../src/styles/theme";

export default function ProfileActions() {
    const router = useRouter();
    const primaryAnim = useBouncyPress(colors.primary);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.animatedWrapper, primaryAnim.animatedStyle]}>
                <Button
                    mode="contained"
                    style={styles.button}
                    onPressIn={primaryAnim.handlePressIn}
                    onPressOut={primaryAnim.handlePressOut}
                    onPress={() => router.push("/(main)/profile-stats")}
                >
                    Voir mes performances
                </Button>
            </Animated.View>
        </View>
    );
}

const SPRING_CONFIG = {
    damping: 15,
    stiffness: 230,
    mass: 0.8,
};

const TIMING_CONFIG = { duration: 150 };

function useBouncyPress(shadowColor: string) {
    const scale = useSharedValue(1);
    const glow = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        shadowColor,
        shadowOpacity: 0.18 + glow.value * 0.25,
        shadowRadius: 12 + glow.value * 10,
        elevation: 2 + glow.value * 6,
    }));

    const handlePressIn = () => {
        glow.value = withTiming(1, TIMING_CONFIG);
        scale.value = withSpring(0.96, SPRING_CONFIG);
    };

    const handlePressOut = () => {
        glow.value = withTiming(0, TIMING_CONFIG);
        scale.value = withSpring(1, SPRING_CONFIG);
    };

    return { animatedStyle, handlePressIn, handlePressOut };
}

const styles = StyleSheet.create({
    container: { marginTop: 10 },
    animatedWrapper: {
        borderRadius: 16,
        marginBottom: 12,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: 14,
    },
});
