import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../context/AuthContext";
import AppBackground from "./layout/AppBackground";
import LottieView from "lottie-react-native";
import { useTraining } from "../context/TrainingContext";

/**
 * 🔐 AuthGate : protège les routes de ton application.
 * - Si l’utilisateur n’est pas connecté → redirige vers (auth)
 * - Si l’utilisateur est connecté → accès à (main)
 * - Affiche un écran de chargement pendant la récupération du profil
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
    const [minSplashDone, setMinSplashDone] = useState(false);
    const [trainingBootLoading, setTrainingBootLoading] = useState(false);
    const trainingPrefetched = useRef(false);
    const hasShownSplash = useRef(false);
    const { user, loading } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const { fetchAllSessions, fetchParticipantSessions, ownedSessionsLoaded, participatingSessionsLoaded } = useTraining();

    // Garantit au moins 3s d'affichage de l'animation
    useEffect(() => {
        const timer = setTimeout(() => setMinSplashDone(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    // Précharge les séances pendant le splash pour éviter un second loader en home
    useEffect(() => {
        if (!user) return;
        if (trainingPrefetched.current) return;
        const needsOwned = !ownedSessionsLoaded;
        const needsParticipating = !participatingSessionsLoaded;
        if (!needsOwned && !needsParticipating) return;

        trainingPrefetched.current = true;
        setTrainingBootLoading(true);
        Promise.all([
            needsOwned ? fetchAllSessions().catch(() => null) : Promise.resolve(null),
            needsParticipating ? fetchParticipantSessions().catch(() => null) : Promise.resolve(null),
        ]).finally(() => setTrainingBootLoading(false));
    }, [user, ownedSessionsLoaded, participatingSessionsLoaded, fetchAllSessions, fetchParticipantSessions]);

    useEffect(() => {
        if (loading) return; // attend que AuthProvider finisse le chargement

        const inAuthGroup = segments[0] === "(auth)";
        const isPublicRoute = segments[0] === "terms";

        if (!user && !inAuthGroup && !isPublicRoute) {
            console.log("🔒 Utilisateur non connecté → redirection vers (auth)");
            router.replace("/(auth)/login");
        } else if (user && inAuthGroup) {
            console.log("🔓 Utilisateur connecté → redirection vers (main)");
            router.replace("/(main)/home");
        }
    }, [user, loading, router, segments]);

    // 🕓 Écran de chargement pendant le boot initial
    // On ne montre l'animation qu'une seule fois par lancement (pas après login).
    const needsTraining = Boolean(user) && !hasShownSplash.current;
    const showSplash =
        !hasShownSplash.current && (
            loading ||
            trainingBootLoading ||
            (needsTraining && (!ownedSessionsLoaded || !participatingSessionsLoaded)) ||
            !minSplashDone
        );

    // Marque le splash comme déjà affiché après la première passe
    useEffect(() => {
        if (!showSplash && !hasShownSplash.current) {
            hasShownSplash.current = true;
        }
    }, [showSplash]);

    if (showSplash) {
        return (
            <AppBackground>
                <View style={styles.loaderContainer}>
                    <LottieView
                        source={require("../../assets/lottie/lottierun.json")}
                        autoPlay
                        loop
                        speed={0.6}
                        style={styles.lottie}
                    />
                </View>
            </AppBackground>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        backgroundColor: "transparent",
    },
    lottie: {
        width: 260,
        height: 260,
    },
});
