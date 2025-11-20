// app/(main)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function MainLayout() {
    return (
        <SafeAreaProvider>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: "#0ea5e9",
                    tabBarInactiveTintColor: "#94a3b8",
                    tabBarStyle: {
                        backgroundColor: "white",
                        borderTopWidth: 0.5,
                        borderTopColor: "#e2e8f0",
                        height: 65,
                        paddingBottom: 8,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: "600",
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: "Accueil",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="home-outline" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="user-profile"
                    options={{
                        title: "Profil",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="person-outline" size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="account"
                    options={{
                        title: "Compte",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="settings-outline" size={size} color={color} />
                        ),
                    }}
                />


                {/* 🧩 Masquer le dossier edit-profile */}
                <Tabs.Screen
                    name="edit-profile"
                    options={{
                        href: null, // 👈 Cache complètement ce dossier du Tab principal
                    }}
                />
                <Tabs.Screen
                    name="avatar-generator"
                    options={{
                        href: null,
                    }}
                />
            </Tabs>
        </SafeAreaProvider>
    );
}
