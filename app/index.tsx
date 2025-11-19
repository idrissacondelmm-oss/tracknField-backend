import React, { useEffect, useRef, useState } from "react";
import { View, Image, StyleSheet, Animated } from "react-native";
import { Text, Button } from "react-native-paper";
import { router } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function WelcomeScreen() {
    const { user } = useAuth();
    const [isReady, setIsReady] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isReady) return;
        if (user) {
            router.replace("/(main)/home");
        } else {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 700,
                useNativeDriver: true,
            }).start();
        }
    }, [user, isReady]);

    if (user) {
        // petit écran de chargement pendant la redirection
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: "#0ea5e9", fontSize: 18 }}>Chargement...</Text>
            </View>
        );
    }

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>


            <Text style={styles.title}>Track&Field 🏃‍♂️</Text>
            <Text style={styles.subtitle}>
                Rejoins la communauté des athlètes connectés
            </Text>

            <Button
                mode="contained"
                onPress={() => router.push("/(auth)/login")}
                style={[styles.button, styles.loginButton]}
                labelStyle={{ fontSize: 16 }}
            >
                Se connecter
            </Button>

            <Button
                mode="outlined"
                onPress={() => router.push("/(auth)/signup")}
                style={[styles.button, styles.signupButton]}
                labelStyle={{ fontSize: 16 }}
            >
                S’inscrire
            </Button>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        paddingHorizontal: 25,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#0f172a",
        marginBottom: 5,
    },
    subtitle: {
        color: "#64748b",
        fontSize: 15,
        textAlign: "center",
        marginBottom: 35,
    },
    button: {
        borderRadius: 10,
        width: "80%",
        marginVertical: 6,
        paddingVertical: 5,
    },
    loginButton: {
        backgroundColor: "#0ea5e9",
    },
    signupButton: {
        borderColor: "#0ea5e9",
    },
});
