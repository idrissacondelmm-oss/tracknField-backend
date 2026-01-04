import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, InteractionManager, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { Link, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { confirmPasswordReset, requestPasswordResetCode, verifyPasswordResetCode } from "../../src/api/authService";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const keyboardOffset = useRef(new Animated.Value(0)).current;

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [step, setStep] = useState<"email" | "code" | "password">("email");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    const testIDs = {
        email: "forgot-email",
        code: "forgot-code",
        newPassword: "forgot-newPassword",
        confirmPassword: "forgot-confirmPassword",
        send: "forgot-send",
        verify: "forgot-verify",
        reset: "forgot-reset",
        toggleNewPassword: "forgot-toggle-newPassword",
        toggleConfirmPassword: "forgot-toggle-confirmPassword",
    };

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 450,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }).start();
        });

        return () => {
            task.cancel();
        };
    }, [fadeAnim]);

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const handleShow = (event: any) => {
            const height = event?.endCoordinates?.height ?? 0;
            Animated.timing(keyboardOffset, {
                toValue: Math.max(height - insets.bottom, 0) + 12,
                duration: 260,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
        };

        const handleHide = () => {
            Animated.timing(keyboardOffset, {
                toValue: 0,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
        };

        const showSub = Keyboard.addListener(showEvent, handleShow);
        const hideSub = Keyboard.addListener(hideEvent, handleHide);

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, [insets.bottom, keyboardOffset]);

    const canSend = useMemo(() => {
        const trimmed = email.trim();
        return trimmed.length > 3 && trimmed.includes("@");
    }, [email]);

    const canVerify = useMemo(() => code.trim().length === 6 && !loading, [code, loading]);

    const canReset = useMemo(() => {
        const newPwd = newPassword.trim();
        const confirmPwd = confirm.trim();
        return (
            !loading &&
            code.trim().length === 6 &&
            newPwd.length >= 6 &&
            confirmPwd.length >= 6 &&
            newPwd === confirmPwd
        );
    }, [code, newPassword, confirm, loading]);

    const handleSend = async () => {
        setError(null);
        setInfo(null);
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) {
            setError("Email requis");
            return;
        }
        setLoading(true);
        try {
            await requestPasswordResetCode(trimmedEmail);
            setInfo("Si un compte existe, un code a été envoyé par email.");
            setStep("code");
        } catch (e: any) {
            const message = e?.response?.data?.message;
            setError(message || "Impossible d'envoyer le code");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setError(null);
        setInfo(null);
        setLoading(true);
        try {
            await verifyPasswordResetCode(email.trim().toLowerCase(), code.trim());
            setInfo("Code validé. Choisis un nouveau mot de passe.");
            setStep("password");
        } catch (e: any) {
            const message = e?.response?.data?.message;
            setError(message || "Code incorrect");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        setError(null);
        setInfo(null);

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedCode = code.trim();
        const normalizedNewPassword = newPassword.trim();
        const normalizedConfirm = confirm.trim();

        if (normalizedNewPassword !== normalizedConfirm) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        setLoading(true);
        try {
            await confirmPasswordReset(normalizedEmail, normalizedCode, normalizedNewPassword);
            await login(normalizedEmail, normalizedNewPassword);
            router.replace("/");
        } catch (e: any) {
            const message = e?.response?.data?.message;
            setError(message || "Impossible de réinitialiser le mot de passe");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.screen}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [
                                    {
                                        translateY: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [18, 0],
                                        }),
                                    },
                                ],
                            }}
                        >
                            <Text style={styles.title}>Mot de passe oublié</Text>
                            <Text style={styles.subtitle}>Reçois un code par email, valide-le, puis choisis un nouveau mot de passe.</Text>
                        </Animated.View>

                        <Animated.View style={{ opacity: fadeAnim }}>
                            <Animated.View style={{ paddingBottom: keyboardOffset }}>

                                {error ? <Text style={styles.error}>{error}</Text> : null}
                                {info ? <Text style={styles.info}>{info}</Text> : null}

                                <TextInput
                                    label="Email"
                                    value={email}
                                    onChangeText={(v) => {
                                        setEmail(v);
                                        setError(null);
                                        setInfo(null);
                                    }}
                                    style={styles.input}
                                    mode="outlined"
                                    testID={testIDs.email}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    left={<TextInput.Icon icon="email" />}
                                    outlineStyle={styles.inputOutline}
                                    textColor="#f8fafc"
                                    theme={{ colors: { primary: "#22d3ee" } }}
                                />

                                {step !== "email" ? (
                                    <TextInput
                                        label="Code (6 chiffres)"
                                        value={code}
                                        onChangeText={(v) => {
                                            const sanitized = v.replace(/\D/g, "").slice(0, 6);
                                            setCode(sanitized);
                                            setError(null);
                                            setInfo(null);
                                        }}
                                        style={styles.input}
                                        mode="outlined"
                                        testID={testIDs.code}
                                        keyboardType="number-pad"
                                        left={<TextInput.Icon icon="lock" />}
                                        outlineStyle={styles.inputOutline}
                                        textColor="#f8fafc"
                                        theme={{ colors: { primary: "#22d3ee" } }}
                                    />
                                ) : null}

                                {step === "password" ? (
                                    <>
                                        <TextInput
                                            label="Nouveau mot de passe"
                                            value={newPassword}
                                            onChangeText={(v) => {
                                                setNewPassword(v);
                                                setError(null);
                                                setInfo(null);
                                            }}
                                            style={styles.input}
                                            mode="outlined"
                                            testID={testIDs.newPassword}
                                            secureTextEntry={!showNewPassword}
                                            left={<TextInput.Icon icon="lock" />}
                                            right={
                                                <TextInput.Icon
                                                    icon={showNewPassword ? "eye-off" : "eye"}
                                                    testID={testIDs.toggleNewPassword}
                                                    onPress={() => setShowNewPassword((prev) => !prev)}
                                                />
                                            }
                                            outlineStyle={styles.inputOutline}
                                            textColor="#f8fafc"
                                            theme={{ colors: { primary: "#22d3ee" } }}
                                        />
                                        <TextInput
                                            label="Confirmer le mot de passe"
                                            value={confirm}
                                            onChangeText={(v) => {
                                                setConfirm(v);
                                                setError(null);
                                                setInfo(null);
                                            }}
                                            style={styles.input}
                                            mode="outlined"
                                            testID={testIDs.confirmPassword}
                                            secureTextEntry={!showConfirmPassword}
                                            left={<TextInput.Icon icon="lock" />}
                                            right={
                                                <TextInput.Icon
                                                    icon={showConfirmPassword ? "eye-off" : "eye"}
                                                    testID={testIDs.toggleConfirmPassword}
                                                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                                                />
                                            }
                                            outlineStyle={styles.inputOutline}
                                            textColor="#f8fafc"
                                            theme={{ colors: { primary: "#22d3ee" } }}
                                        />
                                    </>
                                ) : null}

                                {step === "email" ? (
                                    <Button testID={testIDs.send} mode="contained" style={styles.button} onPress={handleSend} loading={loading} disabled={!canSend || loading}>
                                        Envoyer le code
                                    </Button>
                                ) : null}

                                {step === "code" ? (
                                    <>
                                        <Button testID={testIDs.verify} mode="contained" style={styles.button} onPress={handleVerify} loading={loading} disabled={!canVerify}>
                                            Valider le code
                                        </Button>
                                        <Button mode="text" onPress={handleSend} disabled={loading} textColor="#22d3ee">
                                            Renvoyer un code
                                        </Button>
                                    </>
                                ) : null}

                                {step === "password" ? (
                                    <Button testID={testIDs.reset} mode="contained" style={styles.button} onPress={handleReset} loading={loading} disabled={!canReset}>
                                        Changer le mot de passe et se connecter
                                    </Button>
                                ) : null}

                                <Text style={styles.footer}>
                                    <Link href="/(auth)/login" style={styles.link}>
                                        Retour à la connexion
                                    </Link>
                                </Text>
                            </Animated.View>
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
        paddingHorizontal: 25,
        paddingBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: "#f8fafc",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#cbd5e1",
        marginBottom: 16,
    },
    input: {
        marginBottom: 12,
        backgroundColor: "rgba(15,23,42,0.45)",
    },
    inputOutline: {
        borderRadius: 16,
        borderColor: "rgba(148,163,184,0.4)",
    },
    button: {
        marginTop: 8,
        borderRadius: 16,
        paddingVertical: 6,
        backgroundColor: "#22d3ee",
    },
    footer: {
        textAlign: "center",
        marginTop: 14,
        color: "#e2e8f0",
    },
    link: {
        color: "#22d3ee",
        fontWeight: "600",
    },
    error: {
        color: "#ef4444",
        marginBottom: 10,
        textAlign: "center",
    },
    info: {
        color: "#cbd5e1",
        marginBottom: 10,
        textAlign: "center",
    },
});
