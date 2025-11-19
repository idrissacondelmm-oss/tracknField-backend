import React, { useState } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import {
    TextInput,
    Button,
    Text,
    ActivityIndicator,
    Card,
    Divider,
    Menu,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { updateUserProfile } from "../../../src/api/userService";

export default function PersonalInfoScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();

    const [formData, setFormData] = useState({
        username: user?.username || "",
        gender: user?.gender || "",
        birthDate: user?.birthDate || "",
        country: user?.country || "",
    });

    const [loading, setLoading] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false); // ✅ menu déroulant genre

    const handleChange = (key: string, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                // ✅ assure qu'on envoie bien "male" ou "female"
                gender:
                    formData.gender === "male" || formData.gender === "female"
                        ? (formData.gender as "male" | "female")
                        : undefined,
            };

            await updateUserProfile(payload);
            await refreshProfile();
            Alert.alert("✅ Succès", "Vos informations ont été mises à jour !");
            router.replace("/(main)/account");
        } catch (error: any) {
            console.error(error);
            Alert.alert(
                "❌ Erreur",
                error.message || "Impossible de mettre à jour vos informations."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="person-circle-outline" size={60} color="#0ea5e9" />
                    <Text style={styles.headerTitle}>Informations personnelles</Text>
                    <Text style={styles.headerSubtitle}>
                        Mettez à jour vos informations de base
                    </Text>
                </View>

                {/* Card principale */}
                <Card style={styles.card}>
                    <Card.Content>
                        <TextInput
                            label="Nom complet"
                            value={user?.fullName || ""}
                            disabled
                            style={styles.input}
                        />
                        <TextInput
                            label="Email"
                            value={user?.email || ""}
                            disabled
                            style={styles.input}
                        />
                        <Divider style={styles.divider} />

                        <TextInput
                            label="Nom d’utilisateur"
                            value={formData.username}
                            onChangeText={(v) => handleChange("username", v)}
                            style={styles.input}
                        />

                        {/* ✅ Champ genre avec menu déroulant */}
                        <Menu
                            visible={menuVisible}
                            onDismiss={() => setMenuVisible(false)}
                            anchor={
                                <TextInput
                                    label="Genre"
                                    value={
                                        formData.gender === "male"
                                            ? "Homme"
                                            : formData.gender === "female"
                                                ? "Femme"
                                                : ""
                                    }
                                    style={styles.input}
                                    right={
                                        <TextInput.Icon
                                            icon="chevron-down"
                                            onPress={() => setMenuVisible(true)}
                                        />
                                    }
                                    editable={false}
                                    onPressIn={() => setMenuVisible(true)}
                                />
                            }
                            contentStyle={{ backgroundColor: "white" }}
                        >
                            <Menu.Item
                                onPress={() => {
                                    setMenuVisible(false);
                                    handleChange("gender", "male");
                                }}
                                title="Homme"
                                leadingIcon="human-male"
                            />
                            <Menu.Item
                                onPress={() => {
                                    setMenuVisible(false);
                                    handleChange("gender", "female");
                                }}
                                title="Femme"
                                leadingIcon="human-female"
                            />
                        </Menu>

                        <TextInput
                            label="Date de naissance (YYYY-MM-DD)"
                            value={formData.birthDate}
                            onChangeText={(v) => handleChange("birthDate", v)}
                            style={styles.input}
                        />

                        <TextInput
                            label="Pays"
                            value={formData.country}
                            onChangeText={(v) => handleChange("country", v)}
                            style={styles.input}
                        />
                    </Card.Content>
                </Card>

                {/* Bouton enregistrer */}
                <Button
                    mode="contained"
                    onPress={handleSave}
                    disabled={loading}
                    style={styles.button}
                    contentStyle={{ paddingVertical: 6 }}
                >
                    {loading ? (
                        <ActivityIndicator animating color="#fff" />
                    ) : (
                        "Enregistrer les modifications"
                    )}
                </Button>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#f8fafc",
    },
    header: {
        alignItems: "center",
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginTop: 5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: "#64748b",
    },
    card: {
        borderRadius: 16,
        elevation: 2,
        backgroundColor: "white",
        marginBottom: 25,
    },
    input: {
        backgroundColor: "white",
        marginBottom: 12,
    },
    divider: {
        marginVertical: 10,
    },
    button: {
        borderRadius: 12,
        backgroundColor: "#0ea5e9",
    },
});
