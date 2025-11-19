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
    Switch,
    Menu,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import { updateUserProfile } from "../../../src/api/userService";

export default function PreferencesScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();

    const [formData, setFormData] = useState({
        isProfilePublic: user?.isProfilePublic ?? true,
        notificationsEnabled: user?.notificationsEnabled ?? true,
        autoSharePerformance: user?.autoSharePerformance ?? false,
        theme: user?.theme || "system",
        instagram: user?.instagram || "",
        strava: user?.strava || "",
        tiktok: user?.tiktok || "",
        website: user?.website || "",
    });

    const [loading, setLoading] = useState(false);
    const [themeMenuVisible, setThemeMenuVisible] = useState(false);

    const handleToggle = (key: keyof typeof formData) =>
        setFormData((prev) => ({ ...prev, [key]: !prev[key] }));

    const handleChange = (key: string, value: string) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateUserProfile(formData);
            await refreshProfile();
            Alert.alert("✅ Succès", "Vos préférences ont été mises à jour !");
            router.replace("/(main)/account");
        } catch (error: any) {
            console.error(error);
            Alert.alert(
                "❌ Erreur",
                error.message || "Impossible de mettre à jour vos préférences."
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
                <View style={styles.header}>
                    <Ionicons name="settings-outline" size={60} color="#f59e0b" />
                    <Text style={styles.headerTitle}>Préférences & Réseaux</Text>
                    <Text style={styles.headerSubtitle}>
                        Gérez vos préférences et vos comptes sociaux
                    </Text>
                </View>

                <Card style={styles.card}>
                    <Card.Content>
                        {/* Préférences */}
                        <Text style={styles.sectionTitle}>Préférences générales</Text>

                        <View style={styles.row}>
                            <Text>Profil public</Text>
                            <Switch
                                value={formData.isProfilePublic}
                                onValueChange={() => handleToggle("isProfilePublic")}
                            />
                        </View>

                        <View style={styles.row}>
                            <Text>Notifications</Text>
                            <Switch
                                value={formData.notificationsEnabled}
                                onValueChange={() => handleToggle("notificationsEnabled")}
                            />
                        </View>

                        <View style={styles.row}>
                            <Text>Partage automatique</Text>
                            <Switch
                                value={formData.autoSharePerformance}
                                onValueChange={() => handleToggle("autoSharePerformance")}
                            />
                        </View>

                        {/* ✅ Menu déroulant pour le thème */}
                        <Menu
                            visible={themeMenuVisible}
                            onDismiss={() => setThemeMenuVisible(false)}
                            anchor={
                                <TextInput
                                    label="Thème"
                                    value={
                                        formData.theme === "light"
                                            ? "Clair"
                                            : formData.theme === "dark"
                                                ? "Sombre"
                                                : "Système"
                                    }
                                    style={styles.input}
                                    right={
                                        <TextInput.Icon
                                            icon="chevron-down"
                                            onPress={() => setThemeMenuVisible(true)}
                                        />
                                    }
                                    editable={false}
                                    onPressIn={() => setThemeMenuVisible(true)}
                                />
                            }
                        >
                            <Menu.Item
                                onPress={() => {
                                    setThemeMenuVisible(false);
                                    handleChange("theme", "light");
                                }}
                                title="Clair"
                            />
                            <Menu.Item
                                onPress={() => {
                                    setThemeMenuVisible(false);
                                    handleChange("theme", "dark");
                                }}
                                title="Sombre"
                            />
                            <Menu.Item
                                onPress={() => {
                                    setThemeMenuVisible(false);
                                    handleChange("theme", "system");
                                }}
                                title="Système"
                            />
                        </Menu>

                        {/* Réseaux sociaux */}
                        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Réseaux sociaux</Text>

                        <TextInput
                            label="Instagram"
                            value={formData.instagram}
                            onChangeText={(v) => handleChange("instagram", v)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Strava"
                            value={formData.strava}
                            onChangeText={(v) => handleChange("strava", v)}
                            style={styles.input}
                        />
                        <TextInput
                            label="TikTok"
                            value={formData.tiktok}
                            onChangeText={(v) => handleChange("tiktok", v)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Site web"
                            value={formData.website}
                            onChangeText={(v) => handleChange("website", v)}
                            style={styles.input}
                        />
                    </Card.Content>
                </Card>

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
    container: { padding: 20, backgroundColor: "#f8fafc" },
    header: { alignItems: "center", marginBottom: 20 },
    headerTitle: { fontSize: 22, fontWeight: "bold", marginTop: 5 },
    headerSubtitle: { fontSize: 13, color: "#64748b" },
    sectionTitle: { fontWeight: "600", fontSize: 15, marginBottom: 10 },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    card: { borderRadius: 16, elevation: 2, backgroundColor: "white", marginBottom: 25 },
    input: { backgroundColor: "white", marginBottom: 12 },
    button: { borderRadius: 12, backgroundColor: "#f59e0b" },
});
