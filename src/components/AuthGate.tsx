import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { Text } from "react-native-paper";

/**
 * 🔐 AuthGate : protège les routes de ton application.
 * - Si l’utilisateur n’est pas connecté → redirige vers (auth)
 * - Si l’utilisateur est connecté → accès à (main)
 * - Affiche un écran de chargement pendant la récupération du profil
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (loading) return; // attend que AuthProvider finisse le chargement

        const inAuthGroup = segments[0] === "(auth)";
        const inMainGroup = segments[0] === "(main)";

        if (!user && !inAuthGroup) {
            console.log("🔒 Utilisateur non connecté → redirection vers (auth)");
            router.replace("/(auth)/login");
        } else if (user && inAuthGroup) {
            console.log("🔓 Utilisateur connecté → redirection vers (main)");
            router.replace("/(main)/home");
        }
    }, [user, loading]);

    // 🕓 Écran de chargement pendant le boot initial
    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#0ea5e9" />
                <Text style={styles.loaderText}>Chargement du profil...</Text>
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
    },
    loaderText: {
        marginTop: 12,
        fontSize: 15,
        color: "#64748b",
    },
});
