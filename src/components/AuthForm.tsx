import React, { useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

type AuthFormProps = {
    type: "login" | "signup";
    onSubmit: (form: {
        name?: string;
        email: string;
        password: string;
    }) => Promise<void>;
};

export default function AuthForm({ type, onSubmit }: AuthFormProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [errors, setErrors] = useState<{
        email?: string;
        password?: string;
        confirm?: string;
    }>({});
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const [toast] = useState(new Animated.Value(0));
    const [toastMessage, setToastMessage] = useState("");
    const [toastColor, setToastColor] = useState("#22c55e");

    const [successAnim] = useState(new Animated.Value(0));

    // ✅ Toast animé
    const showToast = (message: string, success = true) => {
        setToastMessage(message);
        setToastColor(success ? "#22c55e" : "#ef4444");

        Animated.sequence([
            Animated.timing(toast, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.delay(2000),
            Animated.timing(toast, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
    };

    // ✅ Validation du formulaire
    const validateFields = () => {
        let newErrors: any = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/;

        if (!emailRegex.test(email)) newErrors.email = "Email invalide";
        if (!passRegex.test(password))
            newErrors.password = "6+ caractères, 1 majuscule, 1 chiffre, 1 symbole";

        if (type === "signup" && password !== confirm)
            newErrors.confirm = "Les mots de passe ne correspondent pas";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ✅ Soumission
    const handleSubmit = async () => {
        setSubmitted(true);
        if (!validateFields()) {
            showToast("Veuillez corriger les erreurs", false);
            return;
        }

        setLoading(true);
        try {
            await onSubmit({ name, email, password });
            showToast(
                type === "login" ? "Connexion réussie 🎉" : "Inscription réussie 🎯",
                true
            );

            Animated.sequence([
                Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.delay(1000),
                Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start();
        } catch (e: any) {
            console.log("❌ Erreur capturée dans AuthForm:", e?.response?.data || e.message);

            showToast("Erreur lors de l’opération", false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.form}>
            {/* ✅ Toast animé */}
            <Animated.View
                style={[
                    styles.toast,
                    {
                        backgroundColor: toastColor,
                        opacity: toast,
                        transform: [
                            {
                                translateY: toast.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-80, 0],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <Text style={styles.toastText}>{toastMessage}</Text>
            </Animated.View>

            {type === "signup" && (
                <TextInput
                    label="Nom complet"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    mode="outlined"
                    left={<TextInput.Icon icon="account" />}
                />
            )}

            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                mode="outlined"
                left={<TextInput.Icon icon="email" />}
                error={submitted && !!errors.email}
            />
            {submitted && errors.email && <Text style={styles.error}>{errors.email}</Text>}

            <TextInput
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                mode="outlined"
                left={<TextInput.Icon icon="lock" />}
                right={
                    <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword((prev) => !prev)}
                    />
                }
                error={submitted && !!errors.password}
            />
            {submitted && errors.password && (
                <Text style={styles.error}>{errors.password}</Text>
            )}

            {type === "signup" && (
                <>
                    <TextInput
                        label="Confirmer le mot de passe"
                        value={confirm}
                        onChangeText={setConfirm}
                        secureTextEntry={!showConfirm}
                        style={styles.input}
                        mode="outlined"
                        left={<TextInput.Icon icon="lock-check" />}
                        right={
                            <TextInput.Icon
                                icon={showConfirm ? "eye-off" : "eye"}
                                onPress={() => setShowConfirm((prev) => !prev)}
                            />
                        }
                        error={submitted && !!errors.confirm}
                    />
                    {submitted && errors.confirm && (
                        <Text style={styles.error}>{errors.confirm}</Text>
                    )}
                </>
            )}

            <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.button}
            >
                {type === "login" ? "Se connecter" : "S'inscrire"}
            </Button>

            {/* ✅ Check animé */}
            <Animated.View
                style={[
                    styles.checkContainer,
                    { opacity: successAnim, transform: [{ scale: successAnim }] },
                ]}
            >
                <Ionicons name="checkmark-circle" size={70} color="#10b981" />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    form: {
        width: "100%",
    },
    input: {
        marginBottom: 10,
    },
    button: {
        marginTop: 10,
        borderRadius: 10,
        paddingVertical: 5,
    },
    error: {
        color: "#ef4444",
        fontSize: 13,
        marginBottom: 8,
    },
    checkContainer: {
        position: "absolute",
        alignSelf: "center",
        top: "40%",
    },
    toast: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingVertical: 10,
        alignItems: "center",
        zIndex: 10,
    },
    toastText: {
        color: "#fff",
        fontWeight: "600",
    },
});
