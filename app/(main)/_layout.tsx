// app/(main)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function MainLayout() {
    return (
        <Tabs
            screenOptions={{
                sceneStyle: { backgroundColor: "transparent" },
                headerShown: false,
                tabBarActiveTintColor: "#22d3ee",
                tabBarInactiveTintColor: "#94a3b8",
                tabBarStyle: {
                    backgroundColor: "rgba(15,23,42,0.85)",
                    borderTopWidth: 0,
                    height: 68,
                    marginHorizontal: 16,
                    marginBottom: 16,
                    borderRadius: 22,
                    position: "absolute",
                    shadowColor: "#000",
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 8,
                    paddingBottom: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: "600",
                },
                tabBarItemStyle: {
                    marginTop: 8,
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

            <Tabs.Screen
                name="profile-stats"
                options={{
                    title: "Performances",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="stats-chart-outline" size={size} color={color} />
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
        </Tabs>
    );
}
