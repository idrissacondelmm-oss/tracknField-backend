import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View, Pressable, GestureResponderEvent } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { listMyTrainingGroups } from "../../api/groupService";
import { TrainingGroupSummary } from "../../types/trainingGroup";
import { useAuth } from "../../context/AuthContext";

const extractOwnerId = (group: TrainingGroupSummary) => {
    if (!group.owner) return undefined;
    if (typeof group.owner === "string") return group.owner;
    return group.owner.id || group.owner._id;
};

const ownerDisplayName = (group: TrainingGroupSummary) => {
    if (!group.owner || typeof group.owner === "string") return undefined;
    return group.owner.fullName || group.owner.username;
};

export default function TrainingGroupsScreen() {
    const [groups, setGroups] = useState<TrainingGroupSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const userId = user?.id || user?._id;

    const fetchGroups = useCallback(async () => {
        try {
            setError(null);
            const data = await listMyTrainingGroups();
            setGroups(data);
        } catch (err) {
            console.error("Erreur lors du chargement des groupes", err);
            setError("Impossible de charger vos groupes. Balayez vers le bas pour réessayer.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchGroups();
        }, [fetchGroups]),
    );

    const handleRefresh = () => {
        setRefreshing(true);
        fetchGroups();
    };

    const ownedGroups = groups.filter((group) => userId && extractOwnerId(group) === userId);
    const memberGroups = groups.filter((group) => {
        if (!userId) return false;
        const ownerId = extractOwnerId(group);
        if (ownerId === userId) return false;
        return Boolean(group.isMember);
    });

    const renderGroupList = (collection: TrainingGroupSummary[], variant: "owned" | "member", emptyLabel: string) => {
        if (loading && !refreshing) {
            return (
                <View style={styles.loadingState}>
                    <ActivityIndicator size="small" color="#38bdf8" />
                </View>
            );
        }

        if (!collection.length) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyLabel}>{emptyLabel}</Text>
                </View>
            );
        }

        return collection.map((group) => (
            <GroupCard
                key={group.id}
                group={group}
                variant={variant}
                onPress={() => router.push(`/(main)/training/groups/${group.id}`)}
                onEdit={
                    variant === "owned"
                        ? () => router.push({ pathname: "/(main)/training/groups/[id]/edit", params: { id: group.id } })
                        : undefined
                }
            />
        ));
    };

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={[
                styles.container,
                {
                    paddingTop: Math.max(insets.top, 16),
                    paddingBottom: Math.max(insets.bottom + 24, 32),
                },
            ]}
            refreshControl={<RefreshControl tintColor="#38bdf8" refreshing={refreshing} onRefresh={handleRefresh} />}
        >
            <View style={styles.heroCard}>
                <Text style={styles.heroKicker}>Communauté</Text>
                <Text style={styles.heroTitle}>Pilotez vos clubs</Text>
                <Text style={styles.heroSubtitle}>Créez, recherchez ou modifiez vos groupes depuis un seul hub.</Text>

                <View style={styles.heroActions}>
                    <Pressable
                        style={styles.primaryAction}
                        onPress={() => router.push("/(main)/training/groups/create")}
                        accessibilityRole="button"
                    >
                        <Text style={styles.primaryActionText}>Créer un groupe</Text>
                        <MaterialCommunityIcons name="plus-circle" size={20} color="#0f172a" />
                    </Pressable>
                    <Pressable
                        style={styles.secondaryAction}
                        onPress={() => router.push("/(main)/training/groups/join")}
                        accessibilityRole="button"
                    >
                        <MaterialCommunityIcons name="account-search" size={20} color="#f8fafc" />
                        <Text style={styles.secondaryActionText}>Rejoindre</Text>
                    </Pressable>
                </View>
            </View>

            {error ? (
                <View style={styles.errorBanner}>
                    <MaterialCommunityIcons name="alert" size={18} color="#fbbf24" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mes créations</Text>
                <Text style={styles.sectionSubtitle}>Les clubs que vous administrez et pouvez mettre à jour.</Text>
                <View style={styles.sectionContent}>
                    {renderGroupList(
                        ownedGroups,
                        "owned",
                        "Créez votre premier groupe pour commencer à organiser vos athlètes."
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mes groupes</Text>
                <Text style={styles.sectionSubtitle}>Les collectifs que vous suivez en tant que membre ou athlète invité.</Text>
                <View style={styles.sectionContent}>
                    {renderGroupList(memberGroups, "member", "Rejoignez un groupe pour collaborer avec d'autres athlètes.")}
                </View>
            </View>
        </ScrollView>
    );
}

type GroupCardProps = {
    group: TrainingGroupSummary;
    variant: "owned" | "member";
    onEdit?: () => void;
    onPress?: () => void;
};

const GroupCard = ({ group, variant, onEdit, onPress }: GroupCardProps) => {
    const accent = variant === "owned" ? "#f97316" : "#38bdf8";
    const ownerName = ownerDisplayName(group);
    const ownerId = extractOwnerId(group);
    const handleEditPress = (event: GestureResponderEvent) => {
        event.stopPropagation();
        onEdit?.();
    };

    return (
        <Pressable style={styles.groupCard} onPress={onPress} accessibilityRole="button">
            <View style={styles.groupCardHeader}>
                <View style={[styles.groupBadge, { backgroundColor: `${accent}1A` }]}>
                    <MaterialCommunityIcons
                        name={variant === "owned" ? "shield-crown" : "account-group"}
                        size={20}
                        color={accent}
                    />
                </View>
                <Text style={styles.membersCount}>{group.membersCount} membre{group.membersCount > 1 ? "s" : ""}</Text>
            </View>
            <Text style={styles.groupName}>{group.name}</Text>
            {variant === "member" && ownerName && ownerId ? (
                <Text style={styles.groupOwner}>Coach {ownerName}</Text>
            ) : null}
            {group.description ? <Text style={styles.groupDescription}>{group.description}</Text> : null}
            {variant === "owned" ? (
                <View style={styles.cardFooter}>
                    <Pressable
                        style={styles.editButton}
                        onPress={handleEditPress}
                        accessibilityRole="button"
                        disabled={!onEdit}
                    >
                        <MaterialCommunityIcons name="pencil" size={16} color="#0f172a" />
                        <Text style={styles.editButtonText}>Modifier</Text>
                    </Pressable>
                </View>
            ) : null}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#020617",
    },
    container: {
        paddingHorizontal: 24,
        gap: 28,
    },
    heroCard: {
        borderRadius: 32,
        padding: 24,
        gap: 12,
        backgroundColor: "#0f172a",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
    },
    heroKicker: {
        fontSize: 12,
        color: "#67e8f9",
        letterSpacing: 1.5,
        textTransform: "uppercase",
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: "#f8fafc",
    },
    heroSubtitle: {
        color: "#cbd5e1",
        lineHeight: 20,
    },
    heroActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 4,
    },
    primaryAction: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: 16,
        padding: 10,
        backgroundColor: "#69e0f0ff",
    },
    primaryActionText: {
        color: "#0f172a",
        fontWeight: "700",
    },
    secondaryAction: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.4)",
    },
    secondaryActionText: {
        color: "#f8fafc",
        fontWeight: "600",
    },
    errorBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 14,
        borderRadius: 16,
        backgroundColor: "rgba(251,191,36,0.15)",
        borderWidth: 1,
        borderColor: "rgba(251,191,36,0.4)",
    },
    errorText: {
        color: "#fbbf24",
        flex: 1,
        fontWeight: "600",
    },
    section: {
        gap: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#f8fafc",
    },
    sectionSubtitle: {
        color: "#94a3b8",
    },
    sectionContent: {
        marginTop: 8,
        gap: 12,
    },
    loadingState: {
        paddingVertical: 24,
        alignItems: "center",
    },
    emptyState: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        backgroundColor: "rgba(15,23,42,0.6)",
    },
    emptyLabel: {
        color: "#94a3b8",
        textAlign: "center",
    },
    groupCard: {
        borderRadius: 24,
        padding: 18,
        backgroundColor: "rgba(15,23,42,0.85)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        gap: 6,
    },
    groupCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    groupBadge: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    membersCount: {
        color: "#94a3b8",
        fontWeight: "600",
    },
    groupName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#f8fafc",
    },
    groupOwner: {
        color: "#fbbf24",
        fontWeight: "600",
    },
    groupDescription: {
        color: "#cbd5e1",
        lineHeight: 20,
    },
    cardFooter: {
        marginTop: 12,
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    editButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: "#67e8f9",
    },
    editButtonText: {
        color: "#0f172a",
        fontWeight: "600",
    },
});
