import React, { useEffect, useRef } from "react";
import { StyleSheet, Animated, View } from "react-native";
import { Text } from "react-native-paper";
import AuthForm from "../../src/components/AuthForm";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignupWizard } from "../../src/context/SignupWizardContext";

export default function SignupScreen() {
    const router = useRouter();
    const { setStep1 } = useSignupWizard();
    const slideAnim = useRef(new Animated.Value(50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={styles.screen}>
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        alignItems: "center",
                    }}
                >

                    <Text style={styles.subtitle}>Rejoins la communauté Track&Field</Text>
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <AuthForm
                        type="signup"
                        successMessage="Étape suivante"
                        onSubmit={async ({ firstName, lastName, email, password }) => {
                            setStep1({ firstName: firstName || "", lastName: lastName || "", email, password });
                            router.push("/(auth)/signup-step2");
                        }}
                    />

                    <Text style={styles.footer}>
                        Déjà un compte ?{" "}
                        <Link href="/(auth)/login" style={styles.link}>
                            Connecte-toi ici
                        </Link>
                    </Text>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "transparent",
    },
    container: {
        flex: 1,
        backgroundColor: "transparent",
        justifyContent: "center",
        paddingHorizontal: 25,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 10,
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
