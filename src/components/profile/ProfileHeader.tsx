import React from "react";
import { View, Image, StyleSheet, Modal, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../../src/styles/theme";
import { User } from "../../../src/types/User";
import { COUNTRIES } from "../../../src/constants/countries";

const SHOW_PROFILE_RANKINGS = false;

const getCountryCode = (countryName?: string): string | null => {
    if (!countryName) return null;
    const normalized = countryName.trim().toLowerCase();
    const match = COUNTRIES.find(
        (country) =>
            country.name.toLowerCase() === normalized || country.code.toLowerCase() === normalized
    );
    return match?.code ?? null;
};

const countryCodeToFlag = (code: string): string =>
    code
        .toUpperCase()
        .split("")
        .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
        .join("");

export default function ProfileHeader({ user }: { user: User }) {
    const avatarUri = user.photoUrl
    const tags = [user.mainDiscipline, user.category, user.level]
        .filter((tag): tag is string => Boolean(tag))
        .slice(0, 2);
    const countryCode = getCountryCode(user.country);
    const flagEmoji = countryCode ? countryCodeToFlag(countryCode) : null;
    const [clubModalVisible, setClubModalVisible] = React.useState(false);

    return (
        <View style={styles.cardWrapper}>
            <LinearGradient
                colors={["rgba(34,211,238,0.25)", "rgba(76,29,149,0.3)", "rgba(15,23,42,0.85)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.headerHorizontal}>
                <View style={styles.avatarWrapper}>
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                </View>
                <View style={styles.nameUsernameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                        {user.fullName || user.username}
                    </Text>
                    {user.username && (
                        <Text style={styles.usernameRow}>@{user.username}</Text>
                    )}
                </View>
            </View>
            <View style={styles.tagsRow}>
                {tags.map((tag) => (
                    <View key={tag} style={styles.tagChip}>
                        <Text style={styles.tagText}>{tag}</Text>
                    </View>
                ))}
                {user.country && (
                    <View style={[styles.metaItem, styles.metaPill]}>
                        {flagEmoji ? (
                            <Text style={styles.flagEmoji}>{flagEmoji}</Text>
                        ) : (
                            <Ionicons name="location-outline" size={16} color="#94a3b8" />
                        )}
                        <Text style={styles.metaText} numberOfLines={1}>
                            {user.country}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.metaRow}>
                {user.club && (
                    <Pressable
                        style={[styles.metaClubPressable, { flex: 1 }]}
                        onPress={() => setClubModalVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Afficher le nom complet du club"
                    >
                        <LinearGradient
                            colors={["rgba(251,191,36,0.25)", "rgba(59,130,246,0.25)"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.metaItem, styles.metaClubPill, { flex: 1 }]}
                        >
                            <Ionicons name="ribbon-outline" size={16} color="#f8fafc" />
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[styles.metaText, styles.metaClubText]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {user.club}
                                </Text>
                            </View>
                        </LinearGradient>
                    </Pressable>
                )}
            </View>
            {SHOW_PROFILE_RANKINGS && (
                <View style={styles.statsRow}>
                    <StatBlock
                        label="Track Points"
                        value={user.trackPoints ?? 0}
                        icon="flame-outline"
                        gradient={["rgba(34,197,94,0.25)", "rgba(16,185,129,0.08)"]}
                    />
                    <StatBlock
                        label="Compétitions"
                        value={user.competitionsCount ?? 0}
                        icon="trophy-outline"
                        gradient={["rgba(59,130,246,0.25)", "rgba(14,165,233,0.08)"]}
                    />
                    <StatBlock
                        label="Rang"
                        value={user.rankNational ?? "-"}
                        icon="medal-outline"
                        gradient={["rgba(251,191,36,0.25)", "rgba(251,146,60,0.08)"]}
                    />
                </View>
            )}
            <Modal
                visible={clubModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setClubModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={() => setClubModalVisible(false)}
                    />
                    <LinearGradient
                        colors={["rgba(15,23,42,0.95)", "rgba(30,64,175,0.9)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.clubModalCard}
                    >
                        <View style={styles.clubModalHeader}>
                            <View style={styles.clubModalIconBadge}>
                                <Ionicons name="ribbon-outline" size={20} color="#f8fafc" />
                            </View>
                            <Pressable
                                style={styles.modalCloseButton}
                                onPress={() => setClubModalVisible(false)}
                                accessibilityRole="button"
                            >
                                <Ionicons name="close" size={18} color="#e2e8f0" />
                            </Pressable>
                        </View>
                        <Text style={styles.clubModalLabel}>Club</Text>
                        <Text style={styles.clubModalTitle}>{user.club}</Text>
                    </LinearGradient>
                </View>
            </Modal>
        </View>
    );
}

type IoniconName = keyof typeof Ionicons.glyphMap;

type StatProps = {
    label: string;
    value: string | number;
    icon: IoniconName;
    gradient: [string, string];
};

function StatBlock({ label, value, icon, gradient }: StatProps) {
    return (
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statBlock}>
            <View style={styles.statIconBadge}>
                <Ionicons name={icon} size={16} color="#f8fafc" />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 24,
        padding: 18,
        borderRadius: 28,
        overflow: "hidden",
        backgroundColor: "rgba(15,23,42,0.75)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        alignItems: "flex-start",
    },
    headerHorizontal: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        marginBottom: 8,
    },
    nameUsernameRow: {
        marginLeft: 14,
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 1,
        gap: 10,
    },
    avatarWrapper: {
        width: 86,
        height: 86,
        borderRadius: 48,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "flex-start",
    },
    // avatarGlow removed
    avatar: {
        width: 76,
        height: 76,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: "rgba(34,211,238,0.8)",
    },
    name: {
        fontSize: 22,
        fontWeight: "700",
        color: "#f8fafc",
        marginTop: 0,
        marginLeft: 0,
        alignSelf: "flex-start",
    },
    usernameRow: {
        fontSize: 16,
        color: "#94a3b8",
        marginLeft: 8,
        alignSelf: "center",
        fontWeight: "500",
    },
    tagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 10,
        marginLeft: 2,
        alignSelf: "flex-start",
    },
    tagChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "rgba(248,250,252,0.08)",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.4)",
    },
    tagText: {
        fontSize: 12,
        color: "#e2e8f0",
        textTransform: "capitalize",
    },
    metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginLeft: 2,
        alignSelf: "flex-start",
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        maxWidth: "90%",
        gap: 6,
    },
    metaPill: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: "rgba(15,23,42,0.55)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
    },
    countryChip: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: "rgba(15,23,42,0.55)",
    },
    flagEmoji: {
        fontSize: 18,
    },
    metaText: {
        color: "#cbd5e1",
        fontSize: 13,
    },
    metaClubText: {
        maxWidth: 320,
    },
    metaClubPressable: {
        borderRadius: 999,
    },
    metaClubPill: {
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "rgba(251,191,36,0.6)",
    },
    statsRow: {
        flexDirection: "row",
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(148,163,184,0.2)",
        paddingTop: 18,
    },
    statBlock: {
        flex: 1,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(248,250,252,0.08)",
    },
    statIconBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "rgba(15,23,42,0.35)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    statValue: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "700",
    },
    statLabel: {
        color: "#cbd5e1",
        fontSize: 12,
        marginTop: 4,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(3,7,18,0.8)",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    clubModalCard: {
        width: "100%",
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.4)",
        gap: 8,
    },
    clubModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    clubModalIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(15,23,42,0.55)",
        borderWidth: 1,
        borderColor: "rgba(251,191,36,0.5)",
        alignItems: "center",
        justifyContent: "center",
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15,23,42,0.4)",
    },
    clubModalLabel: {
        color: "#fde68a",
        fontSize: 12,
        letterSpacing: 1,
        textTransform: "uppercase",
        fontWeight: "700",
    },
    clubModalTitle: {
        color: "#f8fafc",
        fontSize: 20,
        fontWeight: "800",
        lineHeight: 26,
    },
    clubModalHint: {
        color: "#cbd5e1",
        fontSize: 13,
        marginTop: 8,
    },
});
