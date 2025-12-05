import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";

export default function AuthLayout() {
    return (
        <View style={styles.container}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />
            </Stack>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },
});
