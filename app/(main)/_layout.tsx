// app/(main)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MainLayout() {
    const insets = useSafeAreaInsets();
    const baseTabHeight = 68;
    const navLiftOffset = Math.max(insets.bottom, 10);
    const tabBarPaddingBottom = Math.max(insets.bottom / 2, 6);
    const scrollGuardPadding = baseTabHeight + Math.max(insets.bottom, 4);

    return (
        <Tabs
            screenOptions={{
                sceneStyle: {
                    backgroundColor: "transparent",
                    paddingBottom: scrollGuardPadding,
                },
                headerShown: false,
                tabBarActiveTintColor: "#22d3ee",
                tabBarInactiveTintColor: "#94a3b8",
                tabBarStyle: {
                    backgroundColor: "rgba(15,23,42,0.85)",
                    borderTopWidth: 0,
                    height: baseTabHeight,
                    marginHorizontal: 16,
                    marginBottom: navLiftOffset,
                    borderRadius: 22,
                    position: "absolute",
                    shadowColor: "#000",
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 8,
                    paddingBottom: tabBarPaddingBottom,
                    paddingTop: 6,
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

            {/* Nouvel ordre: Accueil, Séances, Performances, Profil, Compte */}
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
                name="training"
                options={{
                    title: "Séances",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="barbell-outline" size={size} color={color} />
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
                name="profiles/[id]"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
