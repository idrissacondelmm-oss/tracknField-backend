import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, Card, ProgressBar } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors } from "../../../src/styles/theme";
import { User } from "../../../src/types/User";
import { Badge } from "../../../src/types/Badge";

/* ---------------------------------------------------------
 * Composant principal : section des badges
 * --------------------------------------------------------- */
export default function ProfileBadges({ user }: { user: User }) {
    const badges = user.badges || [];

    if (badges.length === 0) {
        return (
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.title}>Badges & Réalisations</Text>
                    <Text style={styles.emptyText}>Aucun badge débloqué pour le moment 🕒</Text>
                </Card.Content>
            </Card>
        );
    }

    const unlockedCount = badges.filter((b) => b.isUnlocked !== false).length;

    return (
        <Card style={styles.card}>
            <Card.Content>
                {/* Titre et compteur */}
                <View style={styles.headerRow}>
                    <Ionicons name="medal-outline" size={20} color={colors.primary} />
                    <Text style={styles.title}>Badges & Réalisations</Text>
                </View>
                <Text style={styles.counter}>
                    🎖️ {unlockedCount} / {badges.length} badges obtenus
                </Text>

                {/* Liste des badges */}
                <FlatList
                    data={badges}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    scrollEnabled={false}
                    columnWrapperStyle={{ justifyContent: "space-between" }}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInUp.delay(index * 100)}>
                            <BadgeItem badge={item} />
                        </Animated.View>
                    )}
                />
            </Card.Content>
        </Card>
    );
}

/* ---------------------------------------------------------
 * Élément individuel de badge
 * --------------------------------------------------------- */
function BadgeItem({ badge }: { badge: Badge }) {
    const colorByRarity = {
        common: "#94a3b8", // gris
        rare: "#0ea5e9", // bleu
        epic: "#a855f7", // violet
        legendary: "#f59e0b", // or
    }[badge.rarity];

    const isLocked = badge.isUnlocked === false;
    const progress = badge.progress ?? (isLocked ? 0 : 1);

    return (
        <View
            style={[
                styles.badgeContainer,
                {
                    borderColor: isLocked ? "#e2e8f0" : colorByRarity,
                    opacity: isLocked ? 0.6 : 1,
                },
            ]}
        >
            {/* Icône */}
            <View style={[styles.iconWrapper, { backgroundColor: colorByRarity + "22" }]}>
                <Ionicons
                    name={badge.icon as any}
                    size={28}
                    color={isLocked ? "#cbd5e1" : colorByRarity}
                />
            </View>

            {/* Nom + description */}
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.badgeDesc} numberOfLines={2}>
                {badge.description}
            </Text>

            {/* Progression si non débloqué */}
            {isLocked && progress > 0 && (
                <View style={{ marginTop: 6 }}>
                    <ProgressBar
                        progress={progress}
                        color={colorByRarity}
                        style={{ height: 5, borderRadius: 3 }}
                    />
                    <Text style={styles.progressText}>
                        {Math.round(progress * 100)}% vers le déblocage
                    </Text>
                </View>
            )}

            {/* Date si débloqué */}
            {badge.unlockedAt && !isLocked && (
                <Text style={styles.badgeDate}>
                    🗓️ {new Date(badge.unlockedAt).toLocaleDateString()}
                </Text>
            )}
        </View>
    );
}

/* ---------------------------------------------------------
 * Styles
 * --------------------------------------------------------- */
const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        backgroundColor: colors.white,
        marginBottom: 20,
        elevation: 2,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        marginLeft: 6,
        color: colors.text,
    },
    counter: {
        fontSize: 13,
        color: colors.textLight,
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 13,
        color: "#94a3b8",
        textAlign: "center",
        paddingVertical: 10,
    },
    badgeContainer: {
        width: "48%",
        borderWidth: 2,
        borderRadius: 12,
        padding: 10,
        marginBottom: 12,
        backgroundColor: "#f8fafc",
    },
    iconWrapper: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginBottom: 6,
    },
    badgeName: {
        fontWeight: "600",
        fontSize: 14,
        textAlign: "center",
        color: colors.text,
    },
    badgeDesc: {
        fontSize: 12,
        textAlign: "center",
        color: colors.textLight,
    },
    badgeDate: {
        fontSize: 11,
        textAlign: "center",
        color: "#64748b",
        marginTop: 4,
    },
    progressText: {
        fontSize: 11,
        textAlign: "center",
        color: "#64748b",
        marginTop: 3,
    },
});
