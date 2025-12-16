import React from "react";
import { View, Text, StyleSheet, Pressable, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { User } from "../../types/User";

const sanitizeHandle = (value: string) => value.replace(/@/g, "").trim();

const stripProtocol = (value: string) => value.replace(/^https?:\/\//i, "");

type SocialKey = "instagram" | "strava" | "tiktok";

type SocialDefinition = {
    key: SocialKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    gradient: [string, string];
    getDisplayValue: (value: string) => string;
    getUrl: (value: string) => string;
};

const SOCIAL_DEFINITIONS: SocialDefinition[] = [
    {
        key: "instagram",
        label: "Instagram",
        icon: "logo-instagram",
        gradient: ["rgba(244,114,182,0.45)", "rgba(249,168,212,0.2)"],
        getDisplayValue: (value) => `@${sanitizeHandle(value)}`,
        getUrl: (value) => `https://www.instagram.com/${sanitizeHandle(value)}/`,
    },
    {
        key: "tiktok",
        label: "TikTok",
        icon: "musical-notes-outline",
        gradient: ["rgba(14,165,233,0.45)", "rgba(79,70,229,0.25)"],
        getDisplayValue: (value) => `@${sanitizeHandle(value)}`,
        getUrl: (value) => `https://www.tiktok.com/@${sanitizeHandle(value)}`,
    },
    {
        key: "strava",
        label: "Strava",
        icon: "bicycle-outline",
        gradient: ["rgba(251,146,60,0.45)", "rgba(248,113,113,0.2)"],
        getDisplayValue: (value) => stripProtocol(value),
        getUrl: (value) => (value.startsWith("http") ? value : `https://${value}`),
    },
];

type Props = {
    user: User;
};

export default function ProfileSocialLinks({ user }: Props) {
    const socials = SOCIAL_DEFINITIONS.flatMap((definition) => {
        const rawValue = user[definition.key];
        if (!rawValue) return [];
        const resolvedUrl = definition.getUrl(rawValue);
        const display = definition.getDisplayValue(rawValue);
        if (!resolvedUrl || !display.trim()) return [];
        return [
            {
                ...definition,
                url: resolvedUrl,
                display,
            },
        ];
    });

    if (socials.length === 0) return null;

    const handleOpen = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (!supported) throw new Error("unsupported");
            Linking.openURL(url);
        } catch (error) {
            Alert.alert("Lien indisponible", "Nous n'avons pas pu ouvrir ce lien.");
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardEyebrow}>Réseaux</Text>
                    <Text style={styles.cardTitle}>Connecte-toi avec {user.username || "la team"}</Text>
                </View>
                <Ionicons name="sparkles-outline" size={18} color="#e0f2fe" />
            </View>
            <View style={styles.linksGrid}>
                {socials.map((social) => (
                    <Pressable
                        key={social.key}
                        onPress={() => handleOpen(social.url)}
                        style={styles.linkPressable}
                        accessibilityRole="button"
                        accessibilityLabel={`Ouvrir ${social.label}`}
                    >
                        <LinearGradient
                            colors={social.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.linkCard}
                        >
                            <View style={styles.linkIconBadge}>
                                <Ionicons name={social.icon} size={18} color="#0f172a" />
                            </View>
                            <View style={styles.linkTextBlock}>
                                <Text style={styles.linkLabel}>{social.label}</Text>
                                <Text style={styles.linkHandle} numberOfLines={1}>
                                    {social.display}
                                </Text>
                            </View>
                            <Ionicons name="open-outline" size={16} color="#e2e8f0" />
                        </LinearGradient>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        backgroundColor: "rgba(15,23,42,0.65)",
        padding: 18,
        marginTop: 12,
        gap: 16,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardEyebrow: {
        color: "#94a3b8",
        fontSize: 11,
        letterSpacing: 1,
        textTransform: "uppercase",
        fontWeight: "700",
    },
    cardTitle: {
        color: "#f8fafc",
        fontSize: 16,
        fontWeight: "700",
        marginTop: 2,
    },
    linksGrid: {
        gap: 12,
    },
    linkPressable: {
        borderRadius: 18,
        overflow: "hidden",
    },
    linkCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(248,250,252,0.35)",
    },
    linkIconBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(248,250,252,0.9)",
        alignItems: "center",
        justifyContent: "center",
    },
    linkTextBlock: {
        flex: 1,
    },
    linkLabel: {
        color: "#0f172a",
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    linkHandle: {
        color: "#f8fafc",
        fontSize: 14,
        fontWeight: "600",
        marginTop: 2,
    },
});
