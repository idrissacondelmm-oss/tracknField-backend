import { Stack } from "expo-router";

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
            <Stack.Screen name="[id]" options={{ title: "Détail de la séance" }} />
        </Stack>
    );
}
