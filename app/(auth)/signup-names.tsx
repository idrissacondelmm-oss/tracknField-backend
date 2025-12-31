import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Animated, View, KeyboardAvoidingView, Platform, ScrollView, Keyboard, Easing, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignupWizard } from "../../src/context/SignupWizardContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AuthForm from "../../src/components/AuthForm";

export default function SignupNamesScreen() {
    const router = useRouter();
    const { draft, setStep1 } = useSignupWizard();
    const slideAnim = useRef(new Animated.Value(40)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [keyboardOffset, setKeyboardOffset] = useState(0);
    const insets = useSafeAreaInsets();

    const canProceed = useMemo(
        () => Boolean(draft.email && draft.password && draft.emailVerified),
        [draft.email, draft.password, draft.emailVerified]
    );

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                easing: Easing.out(Easing.quad),
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

    useEffect(() => {
        if (!draft.email || !draft.password || !draft.emailVerified) {
            router.replace("/(auth)/signup-email-confirm");
        }
    }, [draft.email, draft.password, draft.emailVerified, router]);

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
                                        <Pressable style={styles.navButtonDisabled} disabled>
                                            <Ionicons name="chevron-back" size={16} color="#e0f2fe" />
                                        </Pressable>
                                        <Pressable style={styles.navButtonDisabled} disabled>
                                            <Ionicons name="chevron-forward" size={16} color="#0f172a" />
                                        </Pressable>
                                    </View>
                                    <View style={styles.progressWrap}>
                                        <View style={[styles.progressDot, styles.progressDotActive]} />
                                        <View style={[styles.progressDot, styles.progressDotActive]} />
                                        <View style={[styles.progressDot, styles.progressDotActive]} />
                                        <View style={styles.progressDot} />
                                    </View>
                                </View>

                                <View style={styles.cardHeader}>
                                    <View style={styles.headerTitleRow}>
                                        <Ionicons name="person-circle-outline" size={18} color="#e0f2fe" />
                                        <Text style={styles.title}>Qui es-tu ?</Text>
                                    </View>
                                    <Text style={styles.subtitle}>Renseigne ton prénom et ton nom.</Text>
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
                                        includeEmail={false}
                                        includePassword={false}
                                        includeNames
                                        submitLabel="Continuer"
                                        onSubmit={async ({ firstName, lastName }) => {
                                            if (!canProceed) return;
                                            setStep1({
                                                email: draft.email || "",
                                                password: draft.password || "",
                                                firstName: firstName || "",
                                                lastName: lastName || "",
                                            });
                                            router.push("/(auth)/signup-step2");
                                        }}
                                    />
                                </View>
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
    navButtonDisabled: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(148,163,184,0.35)",
        alignItems: "center",
        justifyContent: "center",
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
    cardHeader: {
        gap: 6,
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    title: {
        color: "#f8fafc",
        fontSize: 20,
        fontWeight: "800",
    },
    subtitle: {
        color: "#cbd5e1",
        fontSize: 14,
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
