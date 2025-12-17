import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    useFonts,
} from "@expo-google-fonts/space-grotesk";
import { getTrainingGroup } from "../../api/groupService";
import { GroupMember, GroupUserRef, TrainingGroupSummary } from "../../types/trainingGroup";
import { useAuth } from "../../context/AuthContext";

const extractUserId = (value?: GroupUserRef | string) => {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    return value.id || value._id;
};

const formatName = (user?: GroupUserRef | string) => {
    if (!user) return "-";
    if (typeof user === "string") return user;
    return user.fullName || user.username || "-";
};

export default function TrainingGroupDetailScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [fontsLoaded] = useFonts({
        SpaceGrotesk_400Regular,
        SpaceGrotesk_500Medium,
        SpaceGrotesk_600SemiBold,
        SpaceGrotesk_700Bold,
    });

    const [group, setGroup] = useState<TrainingGroupSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const ownerId = extractUserId(group?.owner);
    const currentUserId = user?.id || user?._id;
    const isOwner = ownerId && currentUserId && ownerId === currentUserId;
    const isMember = Boolean(group?.isMember || isOwner);

    const fetchGroup = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await getTrainingGroup(id.toString());
            setGroup(data);
        } catch (error: any) {
            console.error("Erreur chargement groupe", error);
            const message = error?.response?.data?.message || "Impossible de charger ce groupe";
            Alert.alert("Erreur", message, [{ text: "OK", onPress: () => router.back() }]);
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useFocusEffect(
        useCallback(() => {
            fetchGroup();
        }, [fetchGroup]),
    );

    const members = group?.members ?? [];
    const formattedCreatedAt = useMemo(() => {
        if (!group?.createdAt) return null;
        try {
            return new Date(group.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            });
        } catch (error) {
            console.warn("Format date groupe", error);
            return null;
        }
    }, [group?.createdAt]);

    const membershipLabel = useMemo(() => {
        if (isOwner) return "Vous pilotez ce groupe";
        if (isMember) return "Vous êtes membre";
        return "Aperçu public";
    }, [isMember, isOwner]);

    const membershipIcon = useMemo(() => {
        if (isOwner) return "shield-crown-outline" as const;
        if (isMember) return "check-decagram" as const;
        return "eye-outline" as const;
    }, [isMember, isOwner]);

    const heroStats = useMemo(
        () => [
            {
                icon: "account-group-outline" as const,
                label: "Membres actifs",
                value: `${group?.membersCount ?? members.length}`,
            },
            {
                icon: "calendar-blank-outline" as const,
                label: "Créé le",
                value: formattedCreatedAt ?? "À définir",
            },
        ],
        [formattedCreatedAt, group?.membersCount, members.length],
    );

    if (!fontsLoaded) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingState}>
                    <ActivityIndicator color="#22d3ee" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 20) }]}
            edges={["left", "right", "bottom"]}
        >
            <View style={styles.backgroundDecor}>
                <LinearGradient
                    colors={["#020617", "#01030b"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                    colors={["rgba(34,211,238,0.35)", "transparent"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.backgroundGlow}
                />
            </View>
            <ScrollView contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 40) }]}>
                {loading ? (
                    <View style={styles.loadingInline}>
                        <ActivityIndicator color="#22d3ee" />
                    </View>
                ) : null}

                {group ? (
                    <>
                        <View style={styles.hero}>
                            <LinearGradient
                                colors={["rgba(34,211,238,0.25)", "rgba(2,6,23,0.35)"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.heroGradient}
                            />
                            <View style={styles.heroHeaderRow}>
                                <View style={styles.heroIdentity}>
                                    <View style={styles.heroNameRow}>
                                        <View style={styles.heroNamePlate}>
                                            <Text style={styles.heroTitle}>{group.name}</Text>
                                        </View>
                                        {isOwner ? (
                                            <Pressable
                                                accessibilityRole="button"
                                                accessibilityLabel="Modifier ce groupe"
                                                onPress={() =>
                                                    router.push({
                                                        pathname: "/(main)/training/groups/[id]/edit",
                                                        params: { id: group.id },
                                                    })
                                                }
                                                style={styles.heroEditIcon}
                                                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                                            >
                                                <MaterialCommunityIcons name="square-edit-outline" size={20} color="#02131d" />
                                            </Pressable>
                                        ) : null}
                                    </View>
                                    {group.description ? (
                                        <Text style={styles.heroSubtitle} numberOfLines={3}>
                                            {group.description}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>

                            <View style={styles.heroChipRow}>
                                <View style={styles.heroChip}>
                                    <MaterialCommunityIcons name="crown-outline" color="#22d3ee" size={16} />
                                    <Text style={styles.heroChipText}>{formatName(group.owner)}</Text>
                                </View>
                                <View style={styles.heroChip}>
                                    <MaterialCommunityIcons name={membershipIcon} color="#94a3b8" size={16} />
                                    <Text style={styles.heroChipText}>{membershipLabel}</Text>
                                </View>
                            </View>

                            <View style={styles.heroMetaGrid}>
                                {heroStats.map((stat) => (
                                    <HeroStat key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} />
                                ))}
                            </View>
                        </View>

                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View>
                                    <Text style={styles.sectionTitle}>Membres</Text>
                                    <Text style={styles.sectionHint}>{group.membersCount} profils visibles</Text>
                                </View>
                            </View>
                            <View style={styles.sectionDivider} />
                            {members.length === 0 ? (
                                <Text style={styles.emptyState}>Aucun membre visible pour le moment.</Text>
                            ) : (
                                members.map((member) => (
                                    <MemberCard
                                        key={member.id}
                                        member={member}
                                        isCreator={member.id === ownerId}
                                        isCurrentUser={member.id === currentUserId}
                                    />
                                ))
                            )}
                        </View>
                    </>
                ) : !loading ? (
                    <Text style={styles.emptyState}>Impossible de retrouver ce groupe.</Text>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

type HeroStatProps = {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
    label: string;
    value: string;
};

const HeroStat = ({ icon, label, value }: HeroStatProps) => (
    <View style={styles.heroStat}>
        <View style={styles.heroStatIcon}>
            <MaterialCommunityIcons name={icon} color="#02131d" size={16} />
        </View>
        <View>
            <Text style={styles.heroStatLabel}>{label}</Text>
            <Text style={styles.heroStatValue}>{value}</Text>
        </View>
    </View>
);

type MemberCardProps = {
    member: GroupMember;
    isCreator: boolean;
    isCurrentUser: boolean;
};

const MemberCard = ({ member, isCreator, isCurrentUser }: MemberCardProps) => {
    const displayName = member.fullName || member.username || "Membre";
    const subtitle = member.username && member.fullName ? `@${member.username}` : member.username ? `@${member.username}` : undefined;
    const date = member.joinedAt ? new Date(member.joinedAt).toLocaleDateString("fr-FR") : undefined;
    const avatarInitial = displayName.charAt(0).toUpperCase();

    return (
        <View style={styles.memberCard}>
            {member.photoUrl ? (
                <Image source={{ uri: member.photoUrl }} style={styles.memberAvatar} />
            ) : (
                <View style={styles.memberAvatarFallback}>
                    <Text style={styles.memberAvatarInitial}>{avatarInitial}</Text>
                </View>
            )}
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{displayName}</Text>
                {subtitle ? <Text style={styles.memberSubtitle}>{subtitle}</Text> : null}
            </View>
            <View style={styles.memberMetaColumn}>
                {date ? <Text style={styles.memberDate}>Depuis {date}</Text> : null}
                <View style={styles.memberBadgeRow}>
                    {isCreator ? (
                        <View style={[styles.memberPill, styles.memberPillOwner]}>
                            <Text style={[styles.memberPillText, styles.memberPillTextDark]}>Coach</Text>
                        </View>
                    ) : null}
                    {isCurrentUser && !isCreator ? (
                        <View style={[styles.memberPill, styles.memberPillSelf]}>
                            <Text style={styles.memberPillText}>Vous</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#020617",
    },
    backgroundDecor: {
        ...StyleSheet.absoluteFillObject,
    },
    backgroundGlow: {
        position: "absolute",
        width: 320,
        height: 320,
        borderRadius: 320,
        top: -80,
        right: -60,
        opacity: 0.8,
    },
    container: {
        paddingHorizontal: 20,
        paddingTop: 32,
        gap: 24,
    },
    loadingState: {
        marginTop: 40,
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
    },
    loadingInline: {
        alignItems: "center",
    },
    hero: {
        borderRadius: 24,
        padding: 20,
        backgroundColor: "rgba(15,23,42,0.65)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        gap: 20,
        overflow: "hidden",
        position: "relative",
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    heroHeaderRow: {
        width: "100%",
    },
    heroIdentity: {
        flex: 1,
        gap: 12,
        alignItems: "flex-start",
        width: "100%",
    },
    heroNameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        width: "100%",
        flexWrap: "wrap",
    },
    heroNamePlate: {
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: "rgba(2,6,23,0.65)",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.35)",
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
        flex: 1,
        minWidth: 0,
    },
    heroTitle: {
        color: "#f8fafc",
        fontSize: 14,
        lineHeight: 26,
        fontFamily: "SpaceGrotesk_700Bold",
    },
    heroSubtitle: {
        color: "#cbd5e1",
        marginTop: 4,
        fontFamily: "SpaceGrotesk_400Regular",
        lineHeight: 20,
        fontStyle: "italic",
        fontSize: 14,
    },
    heroChipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    heroChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "rgba(15,23,42,0.7)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    heroChipText: {
        color: "#f8fafc",
        fontSize: 13,
        fontFamily: "SpaceGrotesk_500Medium",
    },
    heroMetaGrid: {
        flexDirection: "row",
        gap: 12,
        marginTop: 4,
        flexWrap: "wrap",
    },
    heroStat: {
        flex: 1,
        minWidth: 140,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        padding: 14,
        backgroundColor: "rgba(2,6,23,0.45)",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    heroStatIcon: {
        width: 34,
        height: 34,
        borderRadius: 12,
        backgroundColor: "rgba(248,250,252,0.9)",
        alignItems: "center",
        justifyContent: "center",
    },
    heroStatLabel: {
        color: "#94a3b8",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontFamily: "SpaceGrotesk_500Medium",
    },
    heroStatValue: {
        color: "#f8fafc",
        fontSize: 14,
        fontFamily: "SpaceGrotesk_700Bold",
        marginTop: 2,
    },
    heroEditIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#22d3ee",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#22d3ee",
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    sectionCard: {
        borderRadius: 28,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        backgroundColor: "rgba(10,15,35,0.75)",
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 18,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectionTitle: {
        color: "#f8fafc",
        fontSize: 18,
        fontFamily: "SpaceGrotesk_700Bold",
    },
    sectionHint: {
        color: "#94a3b8",
        fontSize: 13,
        fontFamily: "SpaceGrotesk_400Regular",
    },
    sectionDivider: {
        height: 1,
        backgroundColor: "rgba(148,163,184,0.25)",
        marginVertical: 4,
    },
    emptyState: {
        color: "#94a3b8",
        textAlign: "center",
        paddingVertical: 12,
        fontFamily: "SpaceGrotesk_400Regular",
    },
    memberCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(148,163,184,0.15)",
    },
    memberAvatar: {
        width: 54,
        height: 54,
        borderRadius: 18,
    },
    memberAvatarFallback: {
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: "rgba(34,211,238,0.2)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.35)",
    },
    memberAvatarInitial: {
        color: "#f8fafc",
        fontFamily: "SpaceGrotesk_600SemiBold",
        fontSize: 20,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        color: "#f8fafc",
        fontFamily: "SpaceGrotesk_600SemiBold",
    },
    memberSubtitle: {
        color: "#94a3b8",
        fontSize: 13,
        fontFamily: "SpaceGrotesk_400Regular",
        marginTop: 2,
    },
    memberMetaColumn: {
        alignItems: "flex-end",
        gap: 6,
    },
    memberBadgeRow: {
        flexDirection: "row",
        gap: 6,
    },
    memberPill: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    memberPillOwner: {
        backgroundColor: "#fbbf24",
    },
    memberPillSelf: {
        backgroundColor: "rgba(34,211,238,0.18)",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.4)",
    },
    memberPillText: {
        fontSize: 12,
        color: "#22d3ee",
        fontFamily: "SpaceGrotesk_600SemiBold",
    },
    memberPillTextDark: {
        color: "#1e1b4b",
    },
    memberDate: {
        color: "#cbd5e1",
        fontSize: 12,
        fontFamily: "SpaceGrotesk_500Medium",
    },
});
