import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Text } from "react-native-paper";
import AuthForm from "../../src/components/AuthForm";
import { useAuth } from "../../src/context/AuthContext";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
    const { login } = useAuth();
    const router = useRouter(); // ✅ pour la redirection
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View style={styles.screen}>
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
                    <Text style={styles.title}>Track&Field</Text>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.formContainer,
                        {
                            opacity: fadeAnim,
                            transform: [
                                {
                                    translateY: fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [30, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <AuthForm
                        type="login"
                        onSubmit={async ({ email, password }) => {
                            await login(email, password);
                        }}
                    />

                    <Text style={styles.footer}>
                        Pas encore de compte ?{" "}
                        <Link href="/(auth)/signup" style={styles.link}>
                            Inscris-toi ici
                        </Link>
                    </Text>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "transparent",
    },
    container: {
        flex: 1,
        backgroundColor: "transparent",
        justifyContent: "center",
        paddingHorizontal: 25,
    },
    title: {
        fontSize: 30,
        fontWeight: "700",
        color: "#f8fafc",
    },
    subtitle: {
        fontSize: 15,
        color: "#cbd5e1",
        marginBottom: 25,
    },
    formContainer: {
        marginTop: 10,
    },
    footer: {
        textAlign: "center",
        marginTop: 15,
        color: "#e2e8f0",
    },
    link: {
        color: "#22d3ee",
        fontWeight: "600",
    },
});
