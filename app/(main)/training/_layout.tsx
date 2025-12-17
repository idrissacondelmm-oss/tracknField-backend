import React from "react";
import { Pressable, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";

const BackToSessionsButton = ({ onPress }: { onPress: () => void }) => (
    <Pressable
        onPress={onPress}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 4 }}
        accessibilityRole="button"
        accessibilityLabel="Revenir aux séances"
    >
        <MaterialCommunityIcons name="chevron-left" size={22} color="#f8fafc" />
        <Text style={{ color: "#f8fafc", fontWeight: "600" }}>Séances</Text>
    </Pressable>
);

export default function TrainingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: "#020617" },
                headerTintColor: "#f8fafc",
                headerTitleStyle: { fontSize: 16, fontWeight: "600" },
                contentStyle: { backgroundColor: "transparent" },
            }}
        >
            <Stack.Screen name="index" options={{ title: "Séances" }} />
            <Stack.Screen name="create" options={{ title: "Planifier une séance" }} />
            <Stack.Screen name="list" options={{ title: "Mes séances" }} />
            <Stack.Screen name="groups/index" options={{ title: "Groupes d'entraînement" }} />
            <Stack.Screen name="groups/create" options={{ title: "Créer un groupe" }} />
            <Stack.Screen name="groups/join" options={{ title: "Rejoindre un groupe" }} />
            <Stack.Screen name="groups/[id]/index" options={{ title: "Détails du groupe" }} />
            <Stack.Screen name="groups/[id]/edit" options={{ title: "Modifier un groupe" }} />
            <Stack.Screen
                name="[id]"
                options={({ navigation }) => ({
                    title: "Détail de la séance",
                    headerLeft: () => (
                        <BackToSessionsButton
                            onPress={() => {
                                if (navigation.canGoBack()) {
                                    navigation.goBack();
                                } else {
                                    navigation.navigate("list");
                                }
                            }}
                        />
                    ),
                })}
            />
        </Stack>
    );
}
