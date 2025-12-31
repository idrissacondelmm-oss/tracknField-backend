import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Animated, View, KeyboardAvoidingView, Platform, ScrollView, Keyboard, Easing, Pressable, TextInput as RNTextInput } from "react-native";
import { Text, Button } from "react-native-paper";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignupWizard } from "../../src/context/SignupWizardContext";
import { requestEmailCode, verifyEmailCode } from "../../src/api/authService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function SignupEmailConfirmScreen() {
    const router = useRouter();
    const { draft, setStep1 } = useSignupWizard();
    const slideAnim = useRef(new Animated.Value(40)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const CODE_LENGTH = 6;
    const [keyboardOffset, setKeyboardOffset] = useState(0);
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const sentOnceRef = useRef(false);
    const inputRef = useRef<RNTextInput | null>(null);
    const [lastAttemptedCode, setLastAttemptedCode] = useState("");
    const insets = useSafeAreaInsets();

    const alreadyVerified = Boolean(draft.emailVerified);
    const navDisabled =
        sending ||
        verifying ||
        (!alreadyVerified && code.trim().length < CODE_LENGTH) ||
        (!alreadyVerified && code === lastAttemptedCode && Boolean(error));

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
        if (!draft.email || !draft.password) {
            router.replace("/(auth)/signup");
        }
    }, [draft.email, draft.password, router]);

    const triggerSendCode = useCallback(async () => {
        if (!draft.email) {
            setError("Renseigne d'abord ton email");
            return;
        }
        setError(null);
        setInfo(null);
        setSending(true);
        try {
            await requestEmailCode(draft.email);
            setInfo(`Code envoyé à ${draft.email}`);
        } catch (err) {
            const apiMessage = (err as any)?.response?.data?.message;
            setError(apiMessage || "Impossible d'envoyer le code");
        } finally {
            setSending(false);
        }
    }, [draft.email]);

    useEffect(() => {
        if (draft.email && !sentOnceRef.current) {
            sentOnceRef.current = true;
            triggerSendCode();
        }
    }, [draft.email, triggerSendCode]);

    const handleCodeChange = useCallback(
        (v: string) => {
            const sanitized = v.replace(/\D/g, "").slice(0, CODE_LENGTH);
            setCode(sanitized);
            setError(null);
        },
        [setCode],
    );

    const runVerification = useCallback(async (value: string | undefined) => {
        if (alreadyVerified) {
            router.push("/(auth)/signup-names");
            return;
        }
        if (!draft.email || !draft.password) {
            setError("Renseigne d'abord ton email et mot de passe");
            return;
        }
        const trimmed = (value || "").trim();
        if (trimmed.length < CODE_LENGTH) return;

        setVerifying(true);
        setError(null);
        setInfo(null);
        setLastAttemptedCode(trimmed);
        try {
            await verifyEmailCode(draft.email, trimmed);
            setStep1({ emailVerified: true, emailVerifiedAt: new Date().toISOString() });
            setInfo("Email vérifié !");
            setLastAttemptedCode("");
            router.push("/(auth)/signup-names");
        } catch (err) {
            const resp = (err as any)?.response;
            const apiMessage = resp?.data?.message;
            setError(apiMessage || "Code incorrect");
        } finally {
            setVerifying(false);
        }
    }, [alreadyVerified, draft.email, draft.password, router, setStep1]);

    useEffect(() => {
        const trimmed = code.trim();
        if (trimmed.length === CODE_LENGTH && !verifying && !alreadyVerified && trimmed !== lastAttemptedCode) {
            runVerification(trimmed);
        }
    }, [code, verifying, alreadyVerified, runVerification, lastAttemptedCode]);

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
                                            onPress={() => router.replace("/(auth)/signup")}
                                        >
                                            <Ionicons name="chevron-back" size={16} color="#e0f2fe" />
                                        </Pressable>
                                        <Pressable
                                            style={[styles.navButtonPrimary, navDisabled && styles.navButtonDisabled]}
                                            disabled={navDisabled}
                                            onPress={() => runVerification(code)}
                                        >
                                            <Ionicons name="chevron-forward" size={16} color="#0f172a" />
                                        </Pressable>
                                    </View>
                                    <View style={styles.progressWrap}>
                                        <View style={[styles.progressDot, styles.progressDotActive]} />
                                        <View style={[styles.progressDot, styles.progressDotActive]} />
                                        <View style={styles.progressDot} />
                                        <View style={styles.progressDot} />
                                    </View>
                                </View>

                                <View style={styles.cardHeader}>
                                    <View style={styles.headerTitleRow}>
                                        <Ionicons name="mail-outline" size={18} color="#e0f2fe" />
                                        <Text style={styles.title}>Vérifie ton email</Text>
                                    </View>
                                </View>

                                <View style={{ gap: 14, paddingBottom: keyboardOffset }}>
                                    {info ? <Text style={styles.info}>{info}</Text> : null}
                                    <Pressable onPress={() => inputRef.current?.focus()} style={styles.otpRow}>
                                        {Array.from({ length: CODE_LENGTH }).map((_, idx) => {
                                            const digit = code[idx] || "";
                                            const isActive = code.length === idx;
                                            return (
                                                <View
                                                    key={idx}
                                                    style={[styles.otpCell, isActive && styles.otpCellActive]}
                                                >
                                                    <Text style={styles.otpDigit}>{digit}</Text>
                                                </View>
                                            );
                                        })}
                                    </Pressable>
                                    <RNTextInput
                                        ref={inputRef}
                                        value={code}
                                        onChangeText={handleCodeChange}
                                        maxLength={CODE_LENGTH}
                                        keyboardType="number-pad"
                                        inputMode="numeric"
                                        textContentType="oneTimeCode"
                                        autoFocus
                                        style={styles.hiddenInput}
                                    />
                                    <View >
                                        <Button
                                            mode="text"
                                            onPress={triggerSendCode}
                                            disabled={sending || !draft.email}
                                            textColor="#e2e8f0"
                                            style={{ backgroundColor: "rgba(6, 7, 82, 0.5)", alignSelf: "flex-start" }}
                                            labelStyle={{ fontWeight: "700" }}
                                        >
                                            {sending ? "Envoi..." : "Renvoyer"}
                                        </Button>
                                    </View>
                                    {error ? <Text style={styles.error}>{error}</Text> : null}
                                    {alreadyVerified ? <Text style={styles.info}>Email vérifié.</Text> : <Text style={styles.helper}>Le code expire dans 10 minutes.</Text>}
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
        backgroundColor: "rgba(148,163,184,0.35)",
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
        fontSize: 11,
    },
    label: {
        color: "#e2e8f0",
        fontWeight: "700",
    },
    readonlyField: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        backgroundColor: "rgba(15,23,42,0.45)",
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    readonlyText: {
        color: "#cbd5e1",
        fontWeight: "600",
    },
    hiddenInput: {
        position: "absolute",
        opacity: 0,
        height: 0,
        width: 0,
    },
    otpRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    otpCell: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.45)",
        backgroundColor: "rgba(15,23,42,0.6)",
        alignItems: "center",
        justifyContent: "center",
    },
    otpCellActive: {
        borderColor: "#22d3ee",
        shadowColor: "#22d3ee",
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
    },
    otpDigit: {
        color: "#f8fafc",
        fontSize: 22,
        fontWeight: "700",
        letterSpacing: 1,
        fontVariant: ["tabular-nums"],
    },
    error: {
        color: "#f97316",
        fontSize: 13,
    },
    info: {
        color: "#22d3ee",
        fontSize: 13,
    },
    helper: {
        color: "#cbd5e1",
        fontSize: 12,
    },
});
