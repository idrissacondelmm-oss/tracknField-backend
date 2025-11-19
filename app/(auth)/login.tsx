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
        <SafeAreaView style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
                <Text style={styles.title}>Track&Field</Text>
                <Text style={styles.subtitle}>Heureux de te revoir 👋</Text>
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
                        try {
                            await login(email, password);
                        } catch (err: any) {
                            console.error("Erreur de connexion :", err.message);
                        }
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
        justifyContent: "center",
        paddingHorizontal: 25,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#0f172a",
    },
    subtitle: {
        fontSize: 15,
        color: "#64748b",
        marginBottom: 25,
    },
    formContainer: {
        marginTop: 10,
    },
    footer: {
        textAlign: "center",
        marginTop: 15,
        color: "#334155",
    },
    link: {
        color: "#0ea5e9",
        fontWeight: "600",
    },
});
