import React, { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View, Text } from "react-native";
import { ActivityIndicator, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import ProfileHeader from "../../../src/components/profile/ProfileHeader";
import ProfileHighlightsCard from "../../../src/components/profile/ProfileHighlightsCard";
import ProfileSocialLinks from "../../../src/components/profile/ProfileSocialLinks";
import {
    getUserProfileById,
    respondToFriendInvitation,
    sendFriendInvitation,
    removeFriend,
} from "../../../src/api/userService";
import { User } from "../../../src/types/User";
import { useAuth } from "../../../src/context/AuthContext";

export default function PublicProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string; from?: string }>();
    const { user: currentUser, refreshProfile } = useAuth();
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [respondingAction, setRespondingAction] = useState<"accept" | "decline" | null>(null);

    const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
    const rawFrom = Array.isArray(params.from) ? params.from[0] : params.from;
    const profileId = rawId?.trim() || null;
    const returnPath = useMemo(() => {
        if (!rawFrom) {
            return null;
        }
        const trimmed = rawFrom.trim();
        if (!trimmed) {
            return null;
        }
        return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    }, [rawFrom]);

    const viewerId = currentUser?._id || currentUser?.id || null;
    const targetProfileId = profile?._id || profile?.id || profileId || null;
    const relationship = profile?.relationship;
    const computedIsSelf = useMemo(() => {
        if (!viewerId || !targetProfileId) {
            return false;
        }
        return viewerId === targetProfileId;
    }, [targetProfileId, viewerId]);
    const isSelf = relationship?.isSelf ?? computedIsSelf;
    const resolvedRelationshipStatus = relationship?.status ?? (isSelf ? "self" : "none");
    const canSendInvite = Boolean(!isSelf && targetProfileId && !["friends", "outgoing", "incoming"].includes(resolvedRelationshipStatus));
    const hasIncomingInvite = !isSelf && resolvedRelationshipStatus === "incoming";
    const isResponding = respondingAction !== null;
    const inviteButtonState = useMemo(() => {
        switch (resolvedRelationshipStatus) {
            case "friends":
                return {
                    label: "Ne plus suivre",
                    icon: "person-remove" as const,
                    mode: "contained-tonal" as const,
                    textColor: "#041b15",
                    canPress: true,
                    action: "unfollow" as const,
                };
            case "outgoing":
                return {
                    label: "Invitation envoyée",
                    icon: "hourglass-outline" as const,
                    mode: "outlined" as const,
                    textColor: "#bae6fd",
                    canPress: false,
                    action: "invite" as const,
                };
            default:
                return {
                    label: "Inviter",
                    icon: "person-add" as const,
                    mode: "contained" as const,
                    textColor: "#02111f",
                    canPress: canSendInvite,
                    action: "invite" as const,
                };
        }
    }, [canSendInvite, resolvedRelationshipStatus]);
    const isUnfollowAction = inviteButtonState.action === "unfollow";

    const loadProfile = useCallback(async () => {
        if (!profileId) {
            setProfile(null);
            setError("Aucun athlète sélectionné");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await getUserProfileById(profileId);
            setProfile(data);
        } catch (fetchError: any) {
            setProfile(null);
            setError(fetchError?.message || "Impossible de charger ce profil");
        } finally {
            setLoading(false);
        }
    }, [profileId]);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [loadProfile]),
    );

    const handleGoBack = useCallback(() => {
        if (returnPath) {
            router.replace(returnPath);
            return;
        }
        if (router.canGoBack?.()) {
            router.back();
        } else {
            router.replace("/(main)/home");
        }
    }, [returnPath, router]);

    const handleSendInvite = useCallback(async () => {
        if (!targetProfileId || !canSendInvite) {
            return;
        }
        try {
            setInviteLoading(true);
            const response = await sendFriendInvitation(targetProfileId);
            setProfile((previous) => (previous ? { ...previous, relationship: response.relationship } : previous));
            if (response.message) {
                Alert.alert("Invitation", response.message);
            }
        } catch (inviteError: any) {
            Alert.alert("Invitation impossible", inviteError?.message || "Une erreur est survenue.");
        } finally {
            setInviteLoading(false);
        }
    }, [canSendInvite, targetProfileId]);

    const handleRespondToInvite = useCallback(
        async (action: "accept" | "decline") => {
            if (!targetProfileId || !hasIncomingInvite) {
                return;
            }
            try {
                setRespondingAction(action);
                const response = await respondToFriendInvitation(targetProfileId, action);
                setProfile((previous) =>
                    previous
                        ? {
                            ...previous,
                            relationship: response.relationship,
                        }
                        : previous,
                );
                await refreshProfile();
                await loadProfile();
                if (response.message) {
                    Alert.alert("Invitation", response.message);
                }
            } catch (respondError: any) {
                Alert.alert(
                    "Action impossible",
                    respondError?.message || "Nous n'avons pas pu traiter cette invitation.",
                );
            } finally {
                setRespondingAction(null);
            }
        },
        [hasIncomingInvite, loadProfile, refreshProfile, targetProfileId],
    );

    const handleRemoveFriend = useCallback(async () => {
        if (!targetProfileId || resolvedRelationshipStatus !== "friends") {
            return;
        }
        try {
            setInviteLoading(true);
            const response = await removeFriend(targetProfileId);
            setProfile((previous) =>
                previous
                    ? {
                        ...previous,
                        relationship: response.relationship,
                    }
                    : previous,
            );
            await refreshProfile();
            await loadProfile();
            if (response.message) {
                Alert.alert("Abonnement", response.message);
            }
        } catch (removeError: any) {
            Alert.alert(
                "Action impossible",
                removeError?.message || "Nous n'avons pas pu vous désabonner de cet athlète.",
            );
        } finally {
            setInviteLoading(false);
        }
    }, [loadProfile, refreshProfile, resolvedRelationshipStatus, targetProfileId]);

    const renderFallback = (title: string, subtitle?: string, canRetry = false) => (
        <View style={styles.fallbackState}>
            <Ionicons name="person-circle-outline" size={56} color="#475569" />
            <Text style={styles.fallbackTitle}>{title}</Text>
            {subtitle ? <Text style={styles.fallbackSubtitle}>{subtitle}</Text> : null}
            <Button
                mode="outlined"
                textColor="#38bdf8"
                style={styles.fallbackButton}
                onPress={canRetry ? loadProfile : handleGoBack}
            >
                {canRetry ? "Réessayer" : "Revenir en arrière"}
            </Button>
        </View>
    );

    if (!profileId) {
        return (
            <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
                {renderFallback("Profil inconnu", "Sélectionnez un athlète depuis un groupe ou une séance.")}
            </SafeAreaView>
        );
    }

    if (loading && !profile) {
        return (
            <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
                <View style={styles.loadingState}>
                    <ActivityIndicator color="#22d3ee" />
                    <Text style={styles.loadingLabel}>Chargement du profil…</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error && !profile) {
        return (
            <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
                {renderFallback("Profil indisponible", error, true)}
            </SafeAreaView>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "right", "left"]}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerActions}>
                    <Button
                        mode="text"
                        textColor="#bae6fd"
                        icon={({ size, color }) => <Ionicons name="arrow-back" size={size} color={color} />}
                        onPress={handleGoBack}
                        compact
                    >
                        Retour
                    </Button>
                    {!isSelf ? (
                        hasIncomingInvite ? (
                            <View style={styles.responseActions}>
                                <Button
                                    mode="contained"
                                    onPress={() => handleRespondToInvite("accept")}
                                    icon={({ size, color }) => (
                                        <Ionicons name="checkmark" size={size} color={color} />
                                    )}
                                    textColor="#041b15"
                                    style={styles.acceptButton}
                                    loading={respondingAction === "accept"}
                                    disabled={isResponding}
                                    compact
                                >
                                    Accepter
                                </Button>
                                <Button
                                    mode="outlined"
                                    onPress={() => handleRespondToInvite("decline")}
                                    icon={({ size, color }) => (
                                        <Ionicons name="close" size={size} color={color} />
                                    )}
                                    textColor="#f97316"
                                    style={styles.declineButton}
                                    loading={respondingAction === "decline"}
                                    disabled={isResponding}
                                    compact
                                >
                                    Refuser
                                </Button>
                            </View>
                        ) : (
                            <Button
                                mode={inviteButtonState.mode}
                                onPress={isUnfollowAction ? handleRemoveFriend : handleSendInvite}
                                icon={({ size, color }) => (
                                    <Ionicons name={inviteButtonState.icon} size={size} color={color} />
                                )}
                                disabled={!inviteButtonState.canPress || inviteLoading}
                                loading={inviteLoading}
                                textColor={inviteButtonState.textColor}
                                style={[styles.inviteButton, isUnfollowAction ? styles.unfollowButton : null]}
                                compact
                            >
                                {inviteButtonState.label}
                            </Button>
                        )
                    ) : null}
                </View>
                {loading ? (
                    <View style={styles.loadingBanner}>
                        <ActivityIndicator color="#22d3ee" size="small" />
                        <Text style={styles.loadingBannerText}>Actualisation en cours…</Text>
                    </View>
                ) : null}
                <ProfileHeader user={profile} />
                {profile.bio ? (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionLabel}>Bio</Text>
                        <Text style={styles.sectionBody}>{profile.bio}</Text>
                    </View>
                ) : null}
                {profile.goals ? (
                    <View style={styles.goalCard}>
                        <View style={styles.goalIconWrapper}>
                            <Ionicons name="flag-outline" size={18} color="#e2e8f0" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.goalLabel}>Objectif de la saison</Text>
                            <Text style={styles.goalText} numberOfLines={3} ellipsizeMode="tail">
                                {profile.goals}
                            </Text>
                        </View>
                    </View>
                ) : null}
                <ProfileHighlightsCard user={profile} showStatsLink={false} />
                <ProfileSocialLinks user={profile} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
    },
    container: {
        padding: 16,
        paddingBottom: 24,
        gap: 16,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
        gap: 12,
    },
    responseActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    inviteButton: {
        borderRadius: 999,
    },
    unfollowButton: {
        backgroundColor: "rgba(190, 187, 208, 0.5)",
        borderWidth: 1,
        borderColor: "rgba(193, 171, 171, 0.5)",
    },
    acceptButton: {
        borderRadius: 999,
        backgroundColor: "#34d399",
    },
    declineButton: {
        borderRadius: 999,
        borderColor: "rgba(249,115,22,0.4)",
    },
    loadingState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingLabel: {
        color: "#94a3b8",
        fontSize: 13,
    },
    loadingBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.35)",
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "rgba(2,6,23,0.8)",
    },
    loadingBannerText: {
        color: "#e0f2fe",
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },
    sectionCard: {
        borderRadius: 20,
        backgroundColor: "rgba(15,23,42,0.85)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        padding: 16,
        gap: 8,
    },
    sectionLabel: {
        color: "#94a3b8",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontWeight: "600",
    },
    sectionBody: {
        color: "#f8fafc",
        fontSize: 14,
        lineHeight: 20,
    },
    goalCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.4)",
        backgroundColor: "rgba(2,6,23,0.9)",
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    goalIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(34,211,238,0.25)",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.5)",
        alignItems: "center",
        justifyContent: "center",
    },
    goalLabel: {
        color: "#bae6fd",
        fontSize: 11,
        letterSpacing: 1,
        textTransform: "uppercase",
        fontWeight: "700",
    },
    goalText: {
        color: "#f8fafc",
        fontSize: 12,
        fontWeight: "700",
        marginTop: 4,
        lineHeight: 20,
        fontStyle: "italic",
    },
    fallbackState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 12,
    },
    fallbackTitle: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
    },
    fallbackSubtitle: {
        color: "#94a3b8",
        textAlign: "center",
        lineHeight: 20,
    },
    fallbackButton: {
        borderColor: "rgba(56,189,248,0.6)",
    },
});
