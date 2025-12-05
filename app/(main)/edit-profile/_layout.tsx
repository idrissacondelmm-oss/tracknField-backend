// app/(main)/edit-profile/_layout.tsx
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

export default function EditProfileLayout() {
    const router = useRouter();

    const goBackToProfile = () => {
        router.replace("/(main)/account");
    };

    const backButton = (
        <TouchableOpacity onPress={goBackToProfile} style={{ marginLeft: 10 }}>
            <Ionicons name="arrow-back-outline" size={24} color="#0ea5e9" />
        </TouchableOpacity>
    );

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerTitleAlign: "center",
                headerTintColor: "#0ea5e9",
                headerStyle: { backgroundColor: "rgba(15,23,42,0.6)" },
                headerTransparent: true,
                headerLeft: () => backButton, // 👈 bouton personnalisé
                animation: "slide_from_right",
                contentStyle: { backgroundColor: "transparent" },
            }}
        >
            <Stack.Screen
                name="personal"
                options={{ title: "Informations personnelles" }}
            />
            <Stack.Screen
                name="sport"
                options={{ title: "Informations sportives" }}
            />
            <Stack.Screen
                name="preferences"
                options={{ title: "Préférences & Réseaux" }}
            />
        </Stack>
    );
}
