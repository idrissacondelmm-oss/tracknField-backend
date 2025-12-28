import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Animated, View, KeyboardAvoidingView, Platform, ScrollView, Keyboard, Easing, Pressable } from "react-native";
import { Text } from "react-native-paper";
import AuthForm from "../../src/components/AuthForm";
import { checkEmailExists } from "../../src/api/authService";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignupWizard } from "../../src/context/SignupWizardContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function SignupScreen() {
    const router = useRouter();
    const { draft, setStep1 } = useSignupWizard();
    const slideAnim = useRef(new Animated.Value(50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [keyboardOffset, setKeyboardOffset] = useState(0);
    const insets = useSafeAreaInsets();
    const step1Ready = useMemo(
        () => Boolean(draft.firstName && draft.lastName && draft.email && draft.password),
        [draft]
    );

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1300,
                useNativeDriver: false,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1300,
                useNativeDriver: false,
            }),
        ]).start();
    }, []);

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const handleShow = (event: any) => {
            const height = event?.endCoordinates?.height ?? 0;
            setKeyboardOffset(Math.max(height - insets.bottom, 0) + 12);
        };

        const handleHide = () => {
            setKeyboardOffset(0);
        };

        const showSub = Keyboard.addListener(showEvent, handleShow);
        const hideSub = Keyboard.addListener(hideEvent, handleHide);

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, [insets.bottom]);

    return (
        <View style={styles.screen}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            >
                <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
                    <LinearGradient
                        colors={["#0f172a", "#0b1120"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }}
                        >
                            <LinearGradient
                                colors={["rgba(34,211,238,0.18)", "rgba(14,165,233,0.12)", "rgba(99,102,241,0.12)"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.card}
                            >
                                <View style={styles.navBar}>
                                    <View style={styles.navButtonsWrap}>
                                        <Pressable
                                            style={styles.navButton}
                                            onPress={() => router.replace("/(auth)/login")}
                                        >
                                            <Ionicons name="chevron-back" size={16} color="#e0f2fe" />
                                        </Pressable>
                                        <Pressable
                                            style={[styles.navButtonPrimary, !step1Ready && styles.navButtonDisabled]}
                                            disabled={!step1Ready}
                                            onPress={() => {
                                                if (!step1Ready) return;
                                                router.push("/(auth)/signup-step2");
                                            }}
                                        >
                                            <Ionicons name="chevron-forward" size={16} color="#0f172a" />
                                        </Pressable>
                                    </View>
                                    <View style={styles.progressWrap}>
                                        <View style={[styles.progressDot, styles.progressDotActive]} />
                                        <View style={styles.progressDot} />
                                        <View style={styles.progressDot} />
                                    </View>
                                </View>

                                <View style={styles.cardHeader}>
                                    <View style={styles.headerTitleRow}>
                                        <Ionicons name="sparkles-outline" size={18} color="#e0f2fe" />
                                        <Text style={styles.title}>Crée ton compte</Text>
                                    </View>
                                </View>

                                <View style={{ paddingBottom: keyboardOffset }}>
                                    <AuthForm
                                        type="signup"
                                        successMessage=""
                                        suppressSuccessToast
                                        initialValues={{
                                            firstName: draft.firstName,
                                            lastName: draft.lastName,
                                            email: draft.email,
                                            password: draft.password,
                                        }}
                                        submitLabel="Continuer"
                                        onSubmit={async ({ firstName, lastName, email, password }) => {
                                            const exists = await checkEmailExists(email);
                                            if (exists) {
                                                throw { field: "email", message: "email déjà utilisé" };
                                            }
                                            setStep1({ firstName: firstName || "", lastName: lastName || "", email, password });
                                            router.push("/(auth)/signup-step2");
                                        }}
                                    />
                                </View>

                                <Text style={styles.footer}>
                                    Déjà un compte ?{" "}
                                    <Link href="/(auth)/login" style={styles.link}>
                                        Connecte-toi ici
                                    </Link>
                                </Text>
                            </LinearGradient>
                        </Animated.View>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "transparent",
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 18,
        paddingTop: 0,
        paddingBottom: 24,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: "#cbd5e1",
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
    stepPill: {
        alignSelf: "center",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "rgba(34,211,238,0.15)",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.35)",
        marginBottom: 10,
    },
    stepText: {
        color: "#22d3ee",
        fontWeight: "700",
        fontSize: 12,
    },
    card: {
        borderRadius: 26,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        backgroundColor: "rgba(15,23,42,0.65)",
        gap: 14,
        shadowColor: "#0ea5e9",
        shadowOpacity: 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
    },
    cardHeader: {
        gap: 6,
    },
    navBar: {
        width: "100%",
        alignSelf: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: "rgba(15,23,42,0.7)",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.25)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        shadowColor: "#0ea5e9",
        shadowOpacity: 0.16,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
    },
    navButtonsWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    navButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.35)",
        backgroundColor: "rgba(15,23,42,0.35)",
        alignItems: "center",
        justifyContent: "center",
    },
    navButtonPrimary: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#22d3ee",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#22d3ee",
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
    },
    navButtonDisabled: {
        opacity: 0.45,
    },
    progressWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    progressDot: {
        width: 22,
        height: 6,
        borderRadius: 999,
        backgroundColor: "rgba(148,163,184,0.35)",
    },
    progressDotActive: {
        backgroundColor: "#22d3ee",
        shadowColor: "#22d3ee",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: "800",
        color: "#f8fafc",
    },
});
