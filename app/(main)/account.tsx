import React from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from "react-native";
import { Text, Card, Divider } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    type ProfilePath =
        | "/(main)/edit-profile/personal"
        | "/(main)/edit-profile/sport"
        | "/(main)/edit-profile/preferences";

    const handleNavigate = (path: ProfilePath) => {
        router.push(path);
    };

    return (
        <SafeAreaView style={styles.container}>

            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Image
                        source={{
                            uri:
                                user?.photoUrl ||
                                "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
                        }}
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{user?.fullName || "Utilisateur"}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                </View>

                {/* Statistiques rapides */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{user?.trackPoints || 0}</Text>
                        <Text style={styles.statLabel}>Track Points</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{user?.rankNational ?? "-"}</Text>
                        <Text style={styles.statLabel}>Rang national</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{user?.competitionsCount ?? 0}</Text>
                        <Text style={styles.statLabel}>Compétitions</Text>
                    </View>
                </View>

                <Divider style={{ marginVertical: 10 }} />

                {/* Section des options */}
                <Text style={styles.sectionTitle}>Mon profil</Text>

                <Card style={styles.card}>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => handleNavigate("/(main)/edit-profile/personal")}
                    >
                        <Ionicons name="person-outline" size={24} color="#0ea5e9" />
                        <Text style={styles.optionText}>Informations personnelles</Text>
                        <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
                    </TouchableOpacity>

                    <Divider />

                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => handleNavigate("/(main)/edit-profile/sport")}
                    >
                        <Ionicons name="barbell-outline" size={24} color="#10b981" />
                        <Text style={styles.optionText}>Informations sportives</Text>
                        <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
                    </TouchableOpacity>

                    <Divider />

                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => handleNavigate("/(main)/edit-profile/preferences")}
                    >
                        <Ionicons name="settings-outline" size={24} color="#f59e0b" />
                        <Text style={styles.optionText}>Préférences</Text>
                        <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
                    </TouchableOpacity>
                </Card>

                {/* Bouton déconnexion */}
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                    <Text style={styles.logoutText}>Déconnexion</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>

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
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        marginBottom: 10,
    },
    name: {
        fontSize: 22,
        fontWeight: "bold",
    },
    email: {
        fontSize: 14,
        color: "#64748b",
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "white",
        borderRadius: 16,
        paddingVertical: 10,
        marginBottom: 20,
        elevation: 1,
    },
    statBox: {
        alignItems: "center",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0ea5e9",
    },
    statLabel: {
        fontSize: 12,
        color: "#64748b",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 10,
        color: "#334155",
    },
    card: {
        borderRadius: 16,
        backgroundColor: "white",
        elevation: 2,
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    optionText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
    },
    logoutButton: {
        marginTop: 25,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    logoutText: {
        color: "#ef4444",
        marginLeft: 8,
        fontSize: 15,
        fontWeight: "600",
    },
});
