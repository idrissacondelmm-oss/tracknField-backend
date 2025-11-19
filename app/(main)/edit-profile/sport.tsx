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
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../src/context/AuthContext";
import { updateUserProfile } from "../../../src/api/userService";

export default function SportInfoScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();

    const [formData, setFormData] = useState({
        mainDiscipline: user?.mainDiscipline || "",
        otherDisciplines: user?.otherDisciplines?.join(", ") || "",
        club: user?.club || "",
        level: user?.level || "",
        category: user?.category || "",
        goals: user?.goals || "",
        dominantLeg: user?.dominantLeg || "",
    });

    const [loading, setLoading] = useState(false);
    const [levelMenuVisible, setLevelMenuVisible] = useState(false);
    const [legMenuVisible, setLegMenuVisible] = useState(false);

    const handleChange = (key: string, value: string) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                otherDisciplines: formData.otherDisciplines
                    ? formData.otherDisciplines.split(",").map((s) => s.trim())
                    : [],
                level:
                    ["beginner", "intermediate", "advanced", "pro"].includes(formData.level)
                        ? (formData.level as "beginner" | "intermediate" | "advanced" | "pro")
                        : undefined,
                dominantLeg:
                    ["left", "right", "unknown"].includes(formData.dominantLeg)
                        ? (formData.dominantLeg as "left" | "right" | "unknown")
                        : undefined,
            };

            await updateUserProfile(payload);
            await refreshProfile();
            Alert.alert("✅ Succès", "Vos informations sportives ont été mises à jour !");
            router.replace("/(main)/account");
        } catch (error: any) {
            console.error(error);
            Alert.alert(
                "❌ Erreur",
                error.message || "Impossible de mettre à jour vos informations sportives."
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
                    <Ionicons name="barbell-outline" size={60} color="#10b981" />
                    <Text style={styles.headerTitle}>Informations sportives</Text>
                    <Text style={styles.headerSubtitle}>
                        Mettez à jour vos disciplines, niveau et objectifs
                    </Text>
                </View>

                <Card style={styles.card}>
                    <Card.Content>
                        <TextInput
                            label="Discipline principale"
                            value={formData.mainDiscipline}
                            onChangeText={(v) => handleChange("mainDiscipline", v)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Autres disciplines (séparées par des virgules)"
                            value={formData.otherDisciplines}
                            onChangeText={(v) => handleChange("otherDisciplines", v)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Club"
                            value={formData.club}
                            onChangeText={(v) => handleChange("club", v)}
                            style={styles.input}
                        />

                        {/* ✅ Menu déroulant pour niveau */}
                        <Menu
                            visible={levelMenuVisible}
                            onDismiss={() => setLevelMenuVisible(false)}
                            anchor={
                                <TextInput
                                    label="Niveau"
                                    value={
                                        formData.level === "beginner"
                                            ? "Débutant"
                                            : formData.level === "intermediate"
                                                ? "Intermédiaire"
                                                : formData.level === "advanced"
                                                    ? "Avancé"
                                                    : formData.level === "pro"
                                                        ? "Professionnel"
                                                        : ""
                                    }
                                    style={styles.input}
                                    right={
                                        <TextInput.Icon
                                            icon="chevron-down"
                                            onPress={() => setLevelMenuVisible(true)}
                                        />
                                    }
                                    editable={false}
                                    onPressIn={() => setLevelMenuVisible(true)}
                                />
                            }
                        >
                            <Menu.Item
                                onPress={() => {
                                    setLevelMenuVisible(false);
                                    handleChange("level", "beginner");
                                }}
                                title="Débutant"
                            />
                            <Menu.Item
                                onPress={() => {
                                    setLevelMenuVisible(false);
                                    handleChange("level", "intermediate");
                                }}
                                title="Intermédiaire"
                            />
                            <Menu.Item
                                onPress={() => {
                                    setLevelMenuVisible(false);
                                    handleChange("level", "advanced");
                                }}
                                title="Avancé"
                            />
                            <Menu.Item
                                onPress={() => {
                                    setLevelMenuVisible(false);
                                    handleChange("level", "pro");
                                }}
                                title="Professionnel"
                            />
                        </Menu>

                        <TextInput
                            label="Catégorie"
                            value={formData.category}
                            onChangeText={(v) => handleChange("category", v)}
                            style={styles.input}
                        />
                        <TextInput
                            label="Objectifs"
                            value={formData.goals}
                            onChangeText={(v) => handleChange("goals", v)}
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                        />

                        {/* ✅ Menu déroulant jambe dominante */}
                        <Menu
                            visible={legMenuVisible}
                            onDismiss={() => setLegMenuVisible(false)}
                            anchor={
                                <TextInput
                                    label="Jambe dominante"
                                    value={
                                        formData.dominantLeg === "left"
                                            ? "Gauche"
                                            : formData.dominantLeg === "right"
                                                ? "Droite"
                                                : formData.dominantLeg === "unknown"
                                                    ? "Non spécifié"
                                                    : ""
                                    }
                                    style={styles.input}
                                    right={
                                        <TextInput.Icon
                                            icon="chevron-down"
                                            onPress={() => setLegMenuVisible(true)}
                                        />
                                    }
                                    editable={false}
                                    onPressIn={() => setLegMenuVisible(true)}
                                />
                            }
                        >
                            <Menu.Item
                                onPress={() => {
                                    setLegMenuVisible(false);
                                    handleChange("dominantLeg", "left");
                                }}
                                title="Gauche"
                            />
                            <Menu.Item
                                onPress={() => {
                                    setLegMenuVisible(false);
                                    handleChange("dominantLeg", "right");
                                }}
                                title="Droite"
                            />
                            <Menu.Item
                                onPress={() => {
                                    setLegMenuVisible(false);
                                    handleChange("dominantLeg", "unknown");
                                }}
                                title="Non spécifié"
                            />
                        </Menu>
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
    card: { borderRadius: 16, elevation: 2, backgroundColor: "white", marginBottom: 25 },
    input: { backgroundColor: "white", marginBottom: 12 },
    divider: { marginVertical: 10 },
    button: { borderRadius: 12, backgroundColor: "#10b981" },
});
