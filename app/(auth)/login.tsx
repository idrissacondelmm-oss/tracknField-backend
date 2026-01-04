import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, KeyboardAvoidingView, Platform, ScrollView, Keyboard, Easing } from "react-native";
import { Text } from "react-native-paper";
import AuthForm from "../../src/components/AuthForm";
import { useAuth } from "../../src/context/AuthContext";
import { Link } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
    const { login } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const keyboardOffset = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1300,
            useNativeDriver: true,
        }).start();
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

    return (
        <View style={styles.screen}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            >
                <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
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
                            <Animated.View style={{ paddingBottom: keyboardOffset }}>
                                <AuthForm
                                    type="login"
                                    onSubmit={async ({ email, password }) => {
                                        await login(email, password);
                                    }}
                                />

                                <Text style={styles.forgot}>
                                    <Link href="/(auth)/forgot-password" style={styles.link}>
                                        Mot de passe oublié ?
                                    </Link>
                                </Text>

                                <Text style={styles.footer}>
                                    Pas encore de compte ?{" "}
                                    <Link href="/(auth)/signup" style={styles.link}>
                                        Inscris-toi ici
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
    forgot: {
        textAlign: "center",
        marginTop: 10,
        color: "#e2e8f0",
    },
    link: {
        color: "#22d3ee",
        fontWeight: "600",
    },
});
