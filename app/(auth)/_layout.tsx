import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";
import { SignupWizardProvider } from "../../src/context/SignupWizardContext";

export default function AuthLayout() {
    return (
        <SignupWizardProvider>
            <View style={styles.container}>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: "transparent" },
                        animation: "slide_from_right",
                    }}
                >
                    <Stack.Screen name="login" />
                    <Stack.Screen name="forgot-password" />
                    <Stack.Screen name="signup" />
                    <Stack.Screen name="signup-step2" />
                    <Stack.Screen name="signup-step3" />
                </Stack>
            </View>
        </SignupWizardProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },
});
