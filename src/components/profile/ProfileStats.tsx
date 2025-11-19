import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { colors } from "../../../src/styles/theme";
import { User } from "../../../src/types/User";

export default function ProfileStats({ user }: { user: User }) {
    const stats = [
        { label: "Track Points", value: user.trackPoints || 0 },
        { label: "Rang national", value: user.rankNational ?? "-" },
        { label: "Compétitions", value: user.competitionsCount || 0 },
    ];

    return (
        <View style={styles.container}>
            {stats.map((s, i) => (
                <View key={i} style={styles.statBox}>
                    <Text style={styles.value}>{s.value}</Text>
                    <Text style={styles.label}>{s.label}</Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: colors.white,
        borderRadius: 20,
        paddingVertical: 16,
        marginBottom: 20,
        elevation: 1,
    },
    statBox: { alignItems: "center" },
    value: { fontSize: 18, fontWeight: "bold", color: colors.primary },
    label: { fontSize: 12, color: colors.textLight },
});
