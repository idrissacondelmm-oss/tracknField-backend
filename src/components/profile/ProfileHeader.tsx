import React from "react";
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../src/styles/theme";
import { User } from "../../../src/types/User";

export default function ProfileHeader({ user }: { user: User }) {
    const avatarUri =
        user.rpmAvatarPreviewUrl ||
        user.photoUrl ||
        "https://cdn-icons-png.flaticon.com/512/1077/1077012.png";

    return (
        <View style={styles.container}>
            {/* Avatar à gauche */}
            <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
            />

            {/* Infos à droite */}
            <View style={styles.infoContainer}>
                <View style={styles.topRow}>
                    <Text style={styles.name} numberOfLines={1}>
                        {user.fullName}
                    </Text>
                </View>
                {user.username && (
                    <Text style={styles.username}>@{user.username}</Text>
                )}
                {user.club && (
                    <Text style={styles.meta}>
                        <Ionicons name="ribbon-outline" size={14} color={colors.primary} />{" "}
                        {user.club}
                    </Text>
                )}
                {user.country && (
                    <Text style={styles.meta}>
                        <Ionicons name="location-outline" size={14} color={colors.textLight} />{" "}
                        {user.country}
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: colors.primary,
        marginRight: 16,
    },
    infoContainer: {
        flex: 1,
        justifyContent: "center",
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    name: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.text,
        flexShrink: 1,
        marginRight: 10,
    },
    username: {
        fontSize: 14,
        color: colors.textLight,
        marginBottom: 4,
    },
    meta: {
        fontSize: 13,
        color: colors.textLight,
        marginTop: 2,
    },
});
