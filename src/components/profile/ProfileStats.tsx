import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { User } from "../../../src/types/User";

type StatConfig = {
    label: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    gradient: [string, string];
};

export default function ProfileStats({ user }: { user: User }) {
    const stats: StatConfig[] = [
        {
            label: "Track Points",
            value: user.trackPoints ?? 0,
            icon: "flame-outline",
            gradient: ["rgba(34,197,94,0.25)", "rgba(16,185,129,0.08)"],
        },
        {
            label: "Rang national",
            value: user.rankNational ?? "-",
            icon: "medal-outline",
            gradient: ["rgba(251,191,36,0.25)", "rgba(251,146,60,0.08)"],
        },
        {
            label: "Compétitions",
            value: user.competitionsCount ?? 0,
            icon: "trophy-outline",
            gradient: ["rgba(59,130,246,0.23)", "rgba(14,165,233,0.08)"],
        },
    ];

    return (
        <View style={styles.container}>
            {stats.map((stat) => (
                <LinearGradient
                    key={stat.label}
                    colors={stat.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statCard}
                >
                    <View style={styles.iconBadge}>
                        <Ionicons name={stat.icon} size={16} color="#f8fafc" />
                    </View>
                    <Text style={styles.value}>{stat.value}</Text>
                    <Text style={styles.label}>{stat.label}</Text>
                </LinearGradient>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 12,
        paddingVertical: 6,
        marginBottom: 22,
    },
    statCard: {
        flex: 1,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(248,250,252,0.08)",
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: "center",
    },
    iconBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(15,23,42,0.4)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
    },
    value: {
        fontSize: 18,
        fontWeight: "700",
        color: "#f8fafc",
    },
    label: {
        fontSize: 12,
        color: "#cbd5e1",
        marginTop: 4,
        textAlign: "center",
    },
});
