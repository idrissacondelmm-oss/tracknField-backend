import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";

export default function HomePage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <View style={styles.container}>
            {user ? (
                <>
                    <Text style={styles.title}>Bienvenue 👋</Text>
                    <Text style={styles.name}>
                        {user.fullName || user.username || user.email}
                    </Text>

                    <Text style={styles.subtitle}>
                        Heureux de te revoir sur Track&Field Mobile 🏃‍♂️
                    </Text>

                    <Button
                        mode="contained"
                        onPress={handleLogout}
                        style={styles.button}
                        labelStyle={{ fontSize: 16 }}
                    >
                        Se déconnecter
                    </Button>
                </>
            ) : (
                <Text>Aucun utilisateur connecté.</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        paddingHorizontal: 25,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#0f172a",
    },
    name: {
        fontSize: 20,
        color: "#0284c7",
        marginVertical: 10,
    },
    subtitle: {
        textAlign: "center",
        color: "#64748b",
        fontSize: 15,
        marginBottom: 25,
    },
    button: {
        borderRadius: 10,
        backgroundColor: "#ef4444",
        paddingHorizontal: 20,
        paddingVertical: 5,
    },
});
