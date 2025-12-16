import React, { useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { uploadProfilePhoto, getUserProfile } from "../../src/api/userService";

type ProfilePath =
    | "/(main)/edit-profile/personal"
    | "/(main)/edit-profile/sport"
    | "/(main)/edit-profile/preferences";

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function ProfileScreen() {
    const { user, logout, setUser } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [uploading, setUploading] = useState(false);

    if (!user) return null;

    const handleNavigate = (path: ProfilePath) => {
        router.push(path);
    };

    const handleChangeAvatar = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets[0].uri) {
                setUploading(true);
                try {
                    const newUrl = await uploadProfilePhoto(result.assets[0].uri);
                    const freshUser = await getUserProfile();
                    setUser(freshUser);
                } catch (err) {
                    // Optionnel: afficher une erreur
                }
                setUploading(false);
            }
        } catch (e) {
            setUploading(false);
        }
    };

    const avatarUri = user.photoUrl;
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: Math.max(insets.bottom, 12) },
                ]}
            >
                <LinearGradient
                    colors={["rgba(34,211,238,0.25)", "rgba(76,29,149,0.3)", "rgba(15,23,42,0.85)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.profileCard}
                >
                    <View style={styles.avatarRow}>
                        <View style={{ alignItems: "center" }}>
                            <TouchableOpacity style={styles.avatarWrapper} onPress={handleChangeAvatar} activeOpacity={0.7} accessibilityLabel="Modifier la photo de profil">
                                <Image source={{ uri: avatarUri }} style={styles.avatar} />
                                {uploading && (
                                    <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center", borderRadius: 48 }]}>
                                        <ActivityIndicator color="#22d3ee" />
                                    </View>
                                )}
                            </TouchableOpacity>
                            {user.club && (
                                <View style={[styles.metaRow, { marginTop: 8 }]}>
                                    <Ionicons name="ribbon-outline" size={16} color="#fbbf24" />
                                    <Text style={styles.metaText}>{user.club}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.name}>{user.fullName || user.username}</Text>
                            <Text style={styles.email}>{user.email}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.optionsCard}>
                    <OptionRow
                        icon="person-outline"
                        label="Informations personnelles"
                        description="Nom, email, pays"
                        color="#22d3ee"
                        onPress={() => handleNavigate("/(main)/edit-profile/personal")}
                    />
                    <OptionRow
                        icon="barbell-outline"
                        label="Profil sportif"
                        description="Disciplines, club, objectifs"
                        color="#10b981"
                        onPress={() => handleNavigate("/(main)/edit-profile/sport")}
                    />
                    <OptionRow
                        icon="settings-outline"
                        label="Préférences & réseaux"
                        description="Visibilité, notifications, liens"
                        color="#fbbf24"
                        onPress={() => handleNavigate("/(main)/edit-profile/preferences")}
                        isLast
                    />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Ionicons name="log-out-outline" size={20} color="#f87171" />
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

type OptionRowProps = {
    icon: IoniconName;
    label: string;
    description: string;
    color: string;
    onPress: () => void;
    isLast?: boolean;
};

function OptionRow({ icon, label, description, color, onPress, isLast }: OptionRowProps) {
    return (
        <TouchableOpacity style={[styles.optionRow, !isLast && styles.optionDivider]} onPress={onPress}>
            <View style={[styles.optionIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{label}</Text>
                <Text style={styles.optionDescription}>{description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
    },
    content: {
        padding: 20,
        paddingBottom: 20,
        gap: 20,
    },
    profileCard: {
        borderRadius: 28,
        padding: 12,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        backgroundColor: "rgba(15,23,42,0.7)",
    },
    avatarRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
        gap: 16,
    },
    avatarWrapper: {
        width: 90,
        height: 90,
        borderRadius: 48,
        justifyContent: "center",
        alignItems: "center",
    },
    // avatarGlow removed
    avatar: {
        width: 78,
        height: 78,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: "rgba(34,211,238,0.8)",
    },
    headerInfo: { flex: 1 },
    name: {
        fontSize: 24,
        fontWeight: "700",
        color: "#f8fafc",
    },
    email: {
        fontSize: 14,
        color: "#94a3b8",
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaText: { color: "#e2e8f0", fontSize: 13 },
    actionsRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    secondaryButton: {
        width: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(248,250,252,0.2)",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15,23,42,0.4)",
    },
    sectionHeader: {
        gap: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#f8fafc",
    },
    sectionSubtitle: {
        color: "#94a3b8",
        fontSize: 13,
    },
    optionsCard: {
        borderRadius: 24,
        backgroundColor: "rgba(15,23,42,0.55)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 16,
        gap: 16,
    },
    optionDivider: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(148,163,184,0.15)",
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    optionLabel: {
        color: "#f8fafc",
        fontSize: 15,
        fontWeight: "600",
    },
    optionDescription: {
        color: "#94a3b8",
        fontSize: 12,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "rgba(248,113,113,0.12)",
        borderRadius: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: "rgba(248,113,113,0.3)",
    },
    logoutText: {
        color: "#f87171",
        fontWeight: "700",
    },
});
