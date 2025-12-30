import React, { useMemo, useCallback, useState } from "react";
import { View, Image, StyleSheet, Pressable, Modal, ScrollView, TouchableOpacity } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { User } from "../../../src/types/User";
import { COUNTRIES } from "../../../src/constants/countries";
import { getUserProfileById } from "../../../src/api/userService";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ?? "";

const resolveProfilePhoto = (value?: string | null): string | null => {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    if (!API_BASE_URL) return value;
    const normalized = value.startsWith("/") ? value : `/${value}`;
    return `${API_BASE_URL}${normalized}`;
};

const getInitials = (value?: string | null) => {
    if (!value) return "TF";
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return value.slice(0, 2).toUpperCase();
    return parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || value.slice(0, 2).toUpperCase();
};

const getCountryCode = (countryName?: string): string | null => {
    if (!countryName) return null;
    const normalized = countryName.trim().toLowerCase();
    const match = COUNTRIES.find(
        (country) => country.name.toLowerCase() === normalized || country.code.toLowerCase() === normalized,
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
    const router = useRouter();
    const pathname = usePathname();
    const isViewingSelf = Boolean(user.relationship?.isSelf);
    const isCoach = user.role === "coach";
    const [friendsModalVisible, setFriendsModalVisible] = useState(false);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [friendsError, setFriendsError] = useState<string | null>(null);
    const [friendsDetails, setFriendsDetails] = useState<User[]>([]);
    const [pendingInviteDetails, setPendingInviteDetails] = useState<User[]>([]);
    const [pendingInvitesLoading, setPendingInvitesLoading] = useState(false);
    const [pendingInvitesError, setPendingInvitesError] = useState<string | null>(null);
    const [infoModal, setInfoModal] = useState<{ title: string; body: string } | null>(null);

    const avatarUri =
        resolveProfilePhoto(user.photoUrl) ||
        resolveProfilePhoto(user.rpmAvatarPreviewUrl) ||
        user.rpmAvatarPreviewUrl ||
        null;
    const fallbackInitials = getInitials(user.fullName || user.username);

    const discipline = (user.mainDiscipline || "").trim();
    const hasDiscipline = Boolean(discipline);
    const disciplineDisplay = hasDiscipline
        ? discipline
        : isViewingSelf
            ? "Renseigne ta discipline"
            : "Discipline non définie";

    const category = (user.category || "").trim();
    const hasCategory = Boolean(category);
    const categoryDisplay = hasCategory
        ? category
        : isViewingSelf
            ? user.birthDate
                ? "Catégorie non disponible"
                : "Ajoute ta date de naissance"
            : "Catégorie non définie";

    const countryCode = getCountryCode(user.country);
    const flagEmoji = countryCode ? countryCodeToFlag(countryCode) : null;
    const hasCountry = Boolean(user.country?.trim());
    const countryDisplay = hasCountry
        ? user.country?.trim() || ""
        : isViewingSelf
            ? "Renseigne ton pays"
            : "Pays non défini";

    const hasClub = Boolean(user.club?.trim());
    const clubDisplay = hasClub
        ? user.club?.trim() || ""
        : isViewingSelf
            ? "Renseigne ton club"
            : "Club non défini";

    const handleShowCountryAlert = useCallback(() => {
        if (!hasCountry) return;
        setInfoModal({ title: "Pays", body: countryDisplay });
    }, [countryDisplay, hasCountry]);

    const handleShowClubAlert = useCallback(() => {
        if (!hasClub) return;
        setInfoModal({ title: "Club", body: clubDisplay });
    }, [clubDisplay, hasClub]);

    const friendIds = useMemo(() => user.friends ?? [], [user.friends]);
    const pendingInviteIds = useMemo(() => (isViewingSelf ? user.friendRequestsReceived ?? [] : []), [isViewingSelf, user.friendRequestsReceived]);
    const friendsTotal = user.relationship?.friendsCount ?? friendIds.length;
    const pendingTotal = pendingInviteIds.length;

    const handleOpenFriends = useCallback(async () => {
        setFriendsModalVisible(true);
        setFriendsError(null);
        setPendingInvitesError(null);

        const loadFriends = async () => {
            if (!friendIds.length) {
                setFriendsDetails([]);
                setFriendsLoading(false);
                setFriendsError(friendsTotal > 0 ? "Liste détaillée indisponible" : "Aucun ami pour le moment");
                return;
            }
            setFriendsLoading(true);
            try {
                const responses = await Promise.all(friendIds.map((id) => getUserProfileById(id).catch(() => null)));
                const validProfiles = responses.filter(Boolean) as User[];
                setFriendsDetails(validProfiles);
                if (!validProfiles.length) {
                    setFriendsError("Impossible de charger ces amis");
                }
            } catch (error) {
                setFriendsDetails([]);
                setFriendsError("Une erreur est survenue");
            } finally {
                setFriendsLoading(false);
            }
        };

        const loadPendingInvites = async () => {
            if (!isViewingSelf || !pendingInviteIds.length) {
                setPendingInviteDetails([]);
                setPendingInvitesLoading(false);
                return;
            }
            setPendingInvitesLoading(true);
            try {
                const responses = await Promise.all(pendingInviteIds.map((id) => getUserProfileById(id).catch(() => null)));
                const validProfiles = responses.filter(Boolean) as User[];
                setPendingInviteDetails(validProfiles);
                if (!validProfiles.length) {
                    setPendingInvitesError("Impossible de charger les invitations");
                }
            } catch (error) {
                setPendingInviteDetails([]);
                setPendingInvitesError("Impossible de charger les invitations");
            } finally {
                setPendingInvitesLoading(false);
            }
        };

        await Promise.all([loadFriends(), loadPendingInvites()]);
    }, [friendIds, friendsTotal, isViewingSelf, pendingInviteIds]);

    const handleCloseFriends = useCallback(() => {
        setFriendsModalVisible(false);
        setFriendsError(null);
        setFriendsDetails([]);
        setFriendsLoading(false);
        setPendingInviteDetails([]);
        setPendingInvitesError(null);
        setPendingInvitesLoading(false);
    }, []);

    const navigateToSportEdit = useCallback(() => {
        if (!isViewingSelf) return;
        router.push("/(main)/edit-profile/sport");
    }, [isViewingSelf, router]);

    const navigateToPersonalEdit = useCallback(() => {
        if (!isViewingSelf) return;
        router.push("/(main)/edit-profile/personal");
    }, [isViewingSelf, router]);

    const navigateToProfile = useCallback(
        (targetId?: string | null) => {
            if (!targetId) return;
            const originPath = pathname?.startsWith("/") ? pathname : pathname ? `/${pathname}` : undefined;
            router.push({ pathname: "/(main)/profiles/[id]", params: originPath ? { id: targetId, from: originPath } : { id: targetId } });
        },
        [pathname, router],
    );

    const disciplineNode = useMemo(() => {
        if (isCoach) {
            return <Text style={[styles.tagText, styles.categoryText]}>Coach</Text>;
        }
        if (hasDiscipline) {
            return <Text style={[styles.tagText, styles.disciplineText]}>{disciplineDisplay}</Text>;
        }
        if (!isViewingSelf) {
            return (
                <Text style={[styles.tagText, styles.disciplineText, styles.placeholderTagText, styles.placeholderTagItalic]}>
                    {disciplineDisplay}
                </Text>
            );
        }
        return (
            <Pressable
                onPress={navigateToSportEdit}
                style={({ pressed }) => [styles.tagPressable, pressed ? styles.tagPressed : null]}
                accessibilityRole="button"
                accessibilityLabel="Compléter ta discipline principale"
            >
                <Text style={[styles.tagText, styles.disciplineText, styles.placeholderTagText, styles.placeholderTagItalic]}>
                    {disciplineDisplay}
                </Text>
            </Pressable>
        );
    }, [disciplineDisplay, hasDiscipline, isCoach, isViewingSelf, navigateToSportEdit]);

    const categoryNode = useMemo(() => {
        if (isCoach) return null;
        if (hasCategory) {
            return <Text style={[styles.tagText, styles.categoryText]}>{categoryDisplay}</Text>;
        }
        if (!isViewingSelf) {
            return <Text style={[styles.tagText, styles.categoryText, styles.placeholderTagText]}>{categoryDisplay}</Text>;
        }
        return (
            <Pressable
                onPress={navigateToPersonalEdit}
                style={({ pressed }) => [styles.tagPressable, pressed ? styles.tagPressed : null]}
                accessibilityRole="button"
                accessibilityLabel="Compléter ta catégorie"
            >
                <Text style={[styles.tagText, styles.categoryText, styles.placeholderTagText]}>{categoryDisplay}</Text>
            </Pressable>
        );
    }, [categoryDisplay, hasCategory, isCoach, isViewingSelf, navigateToPersonalEdit]);

    const countryNode = useMemo(() => {
        if (hasCountry) {
            return (
                <View style={[styles.metaItem, styles.metaPill]}>
                    {flagEmoji ? <Text style={styles.flagEmoji}>{flagEmoji}</Text> : <Ionicons name="location-outline" size={16} color="#94a3b8" />}
                    <Pressable
                        style={styles.metaPressable}
                        onPress={handleShowCountryAlert}
                        accessibilityRole="button"
                        accessibilityLabel="Afficher le nom complet du pays"
                    >
                        <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
                            {countryDisplay}
                        </Text>
                    </Pressable>
                </View>
            );
        }
        if (!isViewingSelf) {
            return (
                <View style={[styles.metaItem, styles.metaPill, styles.metaPlaceholderPill]}>
                    <Ionicons name="location-outline" size={16} color="#cbd5e1" />
                    <Text style={[styles.metaText, styles.metaPlaceholderText]} numberOfLines={1}>
                        {countryDisplay}
                    </Text>
                </View>
            );
        }
        return (
            <Pressable
                onPress={navigateToPersonalEdit}
                style={({ pressed }) => [styles.metaItem, styles.metaPill, styles.metaPlaceholderPill, pressed ? styles.metaPressed : null]}
                accessibilityRole="button"
                accessibilityLabel="Renseigner ton pays"
            >
                <Ionicons name="location-outline" size={16} color="#cbd5e1" />
                <Text style={[styles.metaText, styles.metaPlaceholderText]} numberOfLines={1}>
                    {countryDisplay}
                </Text>
            </Pressable>
        );
    }, [countryDisplay, flagEmoji, hasCountry, isViewingSelf, navigateToPersonalEdit]);

    const clubNode = useMemo(() => {
        if (hasClub) {
            return (
                <View style={[styles.metaItem, styles.metaClubPill]}>
                    <Ionicons name="ribbon-outline" size={16} color="#f8fafc" />
                    <Pressable
                        style={styles.metaPressable}
                        onPress={handleShowClubAlert}
                        accessibilityRole="button"
                        accessibilityLabel="Afficher le nom complet du club"
                    >
                        <Text style={[styles.metaText, styles.metaClubText]} numberOfLines={1} ellipsizeMode="tail">
                            {clubDisplay}
                        </Text>
                    </Pressable>
                </View>
            );
        }
        if (!isViewingSelf) {
            return (
                <View style={[styles.metaItem, styles.metaClubPlaceholder]}>
                    <Ionicons name="ribbon-outline" size={16} color="#cbd5e1" />
                    <Text style={[styles.metaText, styles.metaPlaceholderText, styles.metaClubText]} numberOfLines={1} ellipsizeMode="tail">
                        {clubDisplay}
                    </Text>
                </View>
            );
        }
        return (
            <Pressable
                onPress={navigateToSportEdit}
                style={({ pressed }) => [styles.metaItem, styles.metaClubPlaceholder, pressed ? styles.metaPressed : null]}
                accessibilityRole="button"
                accessibilityLabel="Renseigner ton club"
            >
                <Ionicons name="ribbon-outline" size={16} color="#cbd5e1" />
                <Text style={[styles.metaText, styles.metaPlaceholderText, styles.metaClubText]} numberOfLines={1} ellipsizeMode="tail">
                    {clubDisplay}
                </Text>
            </Pressable>
        );
    }, [clubDisplay, hasClub, isViewingSelf, navigateToSportEdit]);

    return (
        <View style={styles.cardWrapper}>
            <LinearGradient
                colors={["#0f172a", "#0b1120"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardOverlay} />
            <Pressable
                onPress={handleOpenFriends}
                style={({ pressed }) => [styles.statPill, styles.statPillFloating, pressed ? styles.statPillPressed : null]}
                accessibilityRole="button"
                accessibilityLabel="Afficher la liste des amis"
            >
                <Ionicons name="people-outline" size={16} color="#cbd5e1" />
                <Text style={styles.statPillText}>{friendsTotal}</Text>
            </Pressable>
            <View style={styles.topRow}>
                <View style={styles.identityBlock}>
                    <View style={styles.avatarWrapper}>
                        <LinearGradient
                            colors={["rgba(21, 29, 31, 0.9)", "rgba(221, 222, 224, 0.9)"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.avatarRing}
                        >
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatar} />
                            ) : (
                                <LinearGradient
                                    colors={["#22d3ee", "#0ea5e9"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.avatarFallback}
                                >
                                    <Text style={styles.avatarFallbackText}>{fallbackInitials}</Text>
                                </LinearGradient>
                            )}
                        </LinearGradient>
                    </View>
                    <View style={styles.identityText}>
                        <Text style={styles.name} numberOfLines={1}>
                            {user.fullName || user.username}
                        </Text>
                        {user.username ? <Text style={styles.usernameRow}>@{user.username}</Text> : null}
                        <View style={styles.disciplineCategoryRow}>
                            {disciplineNode}
                            {!isCoach ? <View style={styles.disciplineDivider} /> : null}
                            {categoryNode}
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.metaRow}>
                {countryNode}
                {clubNode}
            </View>

            <Modal visible={friendsModalVisible} transparent animationType="fade" onRequestClose={handleCloseFriends}>
                <View style={styles.modalBackdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseFriends} />
                    <LinearGradient
                        colors={["rgba(14,165,233,0.15)", "rgba(15,23,42,0.95)", "rgba(14,165,233,0.08)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.friendsModalCard}
                    >
                        <View style={styles.friendsModalHeader}>
                            <View style={styles.modalIconBadge}>
                                <Ionicons name="people-outline" size={18} color="#e2e8f0" />
                            </View>
                            <Pressable onPress={handleCloseFriends} accessibilityRole="button" style={styles.modalCloseButton}>
                                <Ionicons name="close" size={18} color="#cbd5e1" />
                            </Pressable>
                        </View>
                        <Text style={styles.friendsModalTitle}>Liste des amis</Text>
                        <ScrollView style={styles.friendsList} contentContainerStyle={styles.friendsListContent}>
                            {isViewingSelf ? (
                                <View style={styles.pendingSection}>
                                    <View style={styles.pendingHeaderRow}>
                                        <View style={styles.pendingHeaderTextBlock}>
                                            <Text style={styles.pendingSectionTitle}>Invitations en attente</Text>
                                            <Text style={styles.pendingSectionSubtitle}>Demandes reçues</Text>
                                        </View>
                                        <View style={[styles.pendingBadge, !pendingTotal ? styles.pendingBadgeMuted : null]}>
                                            <Text style={styles.pendingBadgeText}>{pendingTotal}</Text>
                                        </View>
                                    </View>
                                    {pendingInvitesLoading ? (
                                        <View style={styles.friendsLoadingRow}>
                                            <ActivityIndicator animating color="#38bdf8" />
                                            <Text style={styles.friendsLoadingText}>Chargement…</Text>
                                        </View>
                                    ) : pendingInviteDetails.length ? (
                                        pendingInviteDetails.map((requester) => {
                                            const requesterId = requester._id || requester.id;
                                            if (!requesterId) return null;
                                            const requesterAvatar = resolveProfilePhoto(requester.photoUrl || requester.rpmAvatarPreviewUrl);
                                            return (
                                                <TouchableOpacity
                                                    key={`pending-${requesterId}`}
                                                    style={[styles.friendRow, styles.pendingRow]}
                                                    onPress={() => navigateToProfile(requesterId)}
                                                    activeOpacity={0.85}
                                                >
                                                    {requesterAvatar ? (
                                                        <Image source={{ uri: requesterAvatar }} style={styles.friendAvatar} />
                                                    ) : (
                                                        <View style={styles.friendAvatarPlaceholder}>
                                                            <Ionicons name="person-add-outline" size={18} color="#0f172a" />
                                                        </View>
                                                    )}
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.friendName}>{requester.fullName || requester.username || "Athlète"}</Text>
                                                        <Text style={styles.pendingMeta}>Invitation reçue</Text>
                                                    </View>
                                                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                                                </TouchableOpacity>
                                            );
                                        })
                                    ) : (
                                        <Text style={styles.pendingEmptyText}>{pendingInvitesError || "Aucune invitation en attente"}</Text>
                                    )}
                                    {pendingInvitesError && pendingInviteDetails.length > 0 ? (
                                        <Text style={styles.pendingErrorText}>{pendingInvitesError}</Text>
                                    ) : null}
                                </View>
                            ) : null}

                            <View style={styles.friendSection}>
                                <View style={styles.friendSectionHeader}>
                                    <View>
                                        <Text style={styles.friendSectionTitle}>Amis</Text>
                                        <Text style={styles.friendSectionSubtitle}>Connexions actives</Text>
                                    </View>
                                    <View style={styles.friendCountBadge}>
                                        <Text style={styles.friendCountText}>{friendsTotal}</Text>
                                    </View>
                                </View>
                                {friendsLoading ? (
                                    <View style={styles.friendsLoadingRow}>
                                        <ActivityIndicator animating color="#38bdf8" />
                                        <Text style={styles.friendsLoadingText}>Chargement…</Text>
                                    </View>
                                ) : friendsDetails.length ? (
                                    friendsDetails.map((friend) => {
                                        const friendId = friend._id || friend.id;
                                        if (!friendId) return null;
                                        const friendAvatar = resolveProfilePhoto(friend.photoUrl || friend.rpmAvatarPreviewUrl);
                                        return (
                                            <TouchableOpacity
                                                key={friendId}
                                                style={styles.friendRow}
                                                onPress={() => navigateToProfile(friendId)}
                                                activeOpacity={0.85}
                                            >
                                                {friendAvatar ? (
                                                    <Image source={{ uri: friendAvatar }} style={styles.friendAvatar} />
                                                ) : (
                                                    <View style={styles.friendAvatarPlaceholder}>
                                                        <Ionicons name="person" size={18} color="#0f172a" />
                                                    </View>
                                                )}
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.friendName}>{friend.fullName || friend.username || "Athlète"}</Text>
                                                    {friend.username ? <Text style={styles.friendMeta}>@{friend.username}</Text> : null}
                                                </View>
                                                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                                            </TouchableOpacity>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.friendsEmptyText}>{friendsError || "Aucun ami enregistré"}</Text>
                                )}
                                {friendsError && friendsDetails.length > 0 ? <Text style={styles.friendsErrorText}>{friendsError}</Text> : null}
                            </View>
                        </ScrollView>
                    </LinearGradient>
                </View>
            </Modal>

            <Modal
                visible={Boolean(infoModal)}
                transparent
                animationType="fade"
                onRequestClose={() => setInfoModal(null)}
            >
                <View style={styles.infoModalBackdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setInfoModal(null)} />
                    {infoModal ? (
                        <LinearGradient
                            colors={["rgba(25, 34, 58, 1)", "rgba(22, 71, 58, 1)"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.infoModalCard}
                        >
                            <View style={styles.infoModalHeader}>
                                <View style={styles.infoModalIconBadge}>
                                    <Ionicons name="information-circle" size={18} color="#0f172a" />
                                </View>
                                <Pressable
                                    style={styles.infoModalClose}
                                    onPress={() => setInfoModal(null)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Fermer"
                                >
                                    <Ionicons name="close" size={18} color="#0f172a" />
                                </Pressable>
                            </View>
                            <Text style={styles.infoModalTitle}>{infoModal.title}</Text>
                            <Text style={styles.infoModalBody}>{infoModal.body}</Text>
                        </LinearGradient>
                    ) : null}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        width: "100%",
        borderRadius: 26,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        backgroundColor: "rgba(15,23,42,0.85)",
        padding: 16,
        gap: 16,
        shadowColor: "#0ea5e9",
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        position: "relative",
    },
    cardOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.14,
        backgroundColor: "rgba(15,23,42,0.4)",
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
    },
    identityBlock: {
        flexDirection: "row",
        gap: 12,
        flex: 1,
        alignItems: "center",
    },
    avatarWrapper: {
        width: 70,
        height: 70,
        borderRadius: 20,
        padding: 0,
    },
    avatarRing: {
        flex: 1,
        borderRadius: 999,
        padding: 3,
    },
    avatar: {
        flex: 1,
        borderRadius: 999,
    },
    avatarFallback: {
        flex: 1,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarFallbackText: {
        color: "#0f172a",
        fontWeight: "800",
        fontSize: 24,
    },
    identityText: {
        flex: 1,
        gap: 6,
    },
    name: {
        color: "#f8fafc",
        fontSize: 20,
        fontWeight: "800",
    },
    usernameRow: {
        color: "#94a3b8",
        fontSize: 13,
    },
    disciplineCategoryRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
    },
    disciplineDivider: {
        width: 10,
        height: 2,
        borderRadius: 10,
        backgroundColor: "rgba(148,163,184,0.4)",
    },
    tagText: {
        fontWeight: "700",
        fontSize: 13,
    },
    disciplineText: {
        color: "#22d3ee",
    },
    categoryText: {
        color: "#f8fafc",
    },
    placeholderTagText: {
        color: "#94a3b8",
    },
    placeholderTagItalic: {
        fontStyle: "italic",
    },
    tagPressable: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.4)",
    },
    tagPressed: {
        opacity: 0.8,
    },
    statPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "rgba(148,163,184,0.15)",
    },
    statPillFloating: {
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 2,
    },
    statPillDisabled: {
        opacity: 0.65,
    },
    statPillPressed: {
        opacity: 0.85,
    },
    statPillText: {
        color: "#e2e8f0",
        fontWeight: "700",
    },
    statPillTextDisabled: {
        color: "#94a3b8",
    },
    metaRow: {
        flexDirection: "row",
        gap: 10,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 2,
        paddingVertical: 10,
    },
    metaPill: {
        backgroundColor: "rgba(15,23,42,0.65)",
        borderColor: "rgba(148,163,184,0.35)",
    },
    metaPlaceholderPill: {
        borderStyle: "dashed",
        borderColor: "rgba(148,163,184,0.4)",
        backgroundColor: "rgba(255,255,255,0.02)",
    },
    metaClubPill: {
        flex: 1,
        backgroundColor: "rgba(34,211,238,0.08)",
        borderColor: "rgba(34,211,238,0.35)",
    },
    metaClubPlaceholder: {
        flex: 1,
        borderColor: "rgba(148,163,184,0.35)",
        backgroundColor: "rgba(255,255,255,0.02)",
    },
    metaText: {
        color: "#e2e8f0",
        fontWeight: "700",
        flexShrink: 1,
    },
    metaPressable: {
        flex: 1,
    },
    metaPlaceholderText: {
        color: "#94a3b8",
    },
    metaClubText: {
        fontSize: 13,
    },
    metaPressed: {
        opacity: 0.85,
    },
    flagEmoji: {
        fontSize: 16,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    modalCard: {
        width: "100%",
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        gap: 10,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    modalIconBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "rgba(15,23,42,0.5)",
        alignItems: "center",
        justifyContent: "center",
    },
    modalTitle: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "800",
    },
    modalSubtitle: {
        color: "#e2e8f0",
        fontSize: 14,
    },
    modalList: {
        maxHeight: 340,
    },
    modalListContent: {
        gap: 8,
        paddingVertical: 4,
    },
    modalSectionLabel: {
        color: "#cbd5e1",
        fontWeight: "700",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    modalRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(148,163,184,0.18)",
    },
    modalRowText: {
        color: "#f8fafc",
        fontWeight: "700",
        flex: 1,
    },
    modalEmptyText: {
        color: "#94a3b8",
        fontStyle: "italic",
        fontSize: 12,
        paddingVertical: 8,
    },
    modalDivider: {
        height: 1,
        backgroundColor: "rgba(148,163,184,0.25)",
        marginVertical: 6,
    },
    friendsModalCard: {
        width: "100%",
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(59,130,246,0.35)",
        gap: 12,
        maxHeight: 420,
        backgroundColor: "rgba(8,11,19,0.95)",
    },
    friendsModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15,23,42,0.4)",
    },
    friendsModalTitle: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "700",
    },
    friendsList: {
        maxHeight: 320,
    },
    friendsListContent: {
        gap: 18,
        paddingBottom: 12,
    },
    pendingSection: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(34,197,94,0.35)",
        backgroundColor: "rgba(15,23,42,0.55)",
        padding: 14,
        gap: 12,
    },
    pendingHeaderRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
    },
    pendingHeaderTextBlock: {
        flex: 1,
        gap: 4,
    },
    pendingSectionTitle: {
        color: "#bbf7d0",
        fontSize: 14,
        fontWeight: "700",
    },
    pendingSectionSubtitle: {
        color: "#94a3b8",
        fontSize: 12,
        lineHeight: 16,
    },
    pendingBadge: {
        minWidth: 36,
        height: 26,
        borderRadius: 999,
        paddingHorizontal: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(34,197,94,0.3)",
        borderWidth: 1,
        borderColor: "rgba(34,197,94,0.4)",
    },
    pendingBadgeMuted: {
        backgroundColor: "rgba(15,23,42,0.6)",
        borderColor: "rgba(148,163,184,0.4)",
    },
    pendingBadgeText: {
        color: "#ecfccb",
        fontSize: 13,
        fontWeight: "700",
    },
    friendsLoadingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 8,
    },
    friendsLoadingText: {
        color: "#e2e8f0",
        fontSize: 14,
    },
    friendRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
    },
    pendingRow: {
        borderColor: "rgba(34,197,94,0.35)",
    },
    friendAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    friendAvatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(59,130,246,0.25)",
        alignItems: "center",
        justifyContent: "center",
    },
    friendName: {
        color: "#f8fafc",
        fontSize: 14,
        fontWeight: "600",
    },
    friendMeta: {
        color: "#94a3b8",
        fontSize: 12,
    },
    pendingMeta: {
        color: "#86efac",
        fontSize: 12,
    },
    friendsEmptyText: {
        color: "#94a3b8",
        textAlign: "center",
        marginTop: 12,
    },
    friendsErrorText: {
        color: "#f97316",
        textAlign: "center",
        marginTop: 8,
        fontSize: 13,
    },
    infoModalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    infoModalCard: {
        width: "100%",
        maxWidth: 420,
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(15,23,42,0.25)",
        gap: 10,
    },
    infoModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    infoModalIconBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(235, 238, 246, 0.8)",
        alignItems: "center",
        justifyContent: "center",
    },
    infoModalClose: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(229, 232, 240, 0.75)",
        alignItems: "center",
        justifyContent: "center",
    },
    infoModalTitle: {
        color: "#e1e3e9ff",
        fontSize: 16,
        fontWeight: "800",
    },
    infoModalBody: {
        color: "#e8ecf5ff",
        fontSize: 14,
        lineHeight: 20,
    },
    pendingEmptyText: {
        color: "#94a3b8",
        fontSize: 12,
    },
    pendingErrorText: {
        color: "#f97316",
        fontSize: 12,
        marginTop: 4,
    },
    friendSection: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(59,130,246,0.35)",
        backgroundColor: "rgba(2,6,23,0.45)",
        padding: 14,
        gap: 10,
    },
    friendSectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    friendSectionTitle: {
        color: "#f8fafc",
        fontSize: 16,
        fontWeight: "700",
    },
    friendSectionSubtitle: {
        color: "#94a3b8",
        fontSize: 12,
    },
    friendCountBadge: {
        minWidth: 36,
        height: 26,
        borderRadius: 999,
        backgroundColor: "rgba(59,130,246,0.25)",
        borderWidth: 1,
        borderColor: "rgba(59,130,246,0.4)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
    },
    friendCountText: {
        color: "#bae6fd",
        fontSize: 13,
        fontWeight: "700",
    },
});
