import React from "react";
import { View, Image, StyleSheet, Modal, Pressable, ScrollView, TouchableOpacity } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { User } from "../../../src/types/User";
import { getUserProfileById } from "../../../src/api/userService";
import { usePathname, useRouter } from "expo-router";
import { COUNTRIES } from "../../../src/constants/countries";

const SHOW_PROFILE_RANKINGS = false;
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
    const initials = parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
    return initials || value.slice(0, 2).toUpperCase();
};

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

const computeCategoryFromAge = (age: number): string | null => {
    if (age >= 4 && age <= 6) return "Baby Athlé";
    if (age >= 7 && age <= 8) return "Éveil Athlétique (EA)";
    if (age >= 9 && age <= 10) return "Poussin (PO)";
    if (age >= 11 && age <= 12) return "Benjamin (BE)";
    if (age >= 13 && age <= 14) return "Minime (MI)";
    if (age >= 15 && age <= 16) return "Cadet (CA)";
    if (age >= 17 && age <= 18) return "Junior (JU)";
    if (age >= 19 && age <= 22) return "Espoir (ES)";
    if (age >= 23 && age <= 34) return "Senior (SE)";
    if (age >= 35 && age <= 39) return "Master 0 (M0)";
    if (age >= 40 && age <= 44) return "Master 1 (M1)";
    if (age >= 45 && age <= 49) return "Master 2 (M2)";
    if (age >= 50 && age <= 54) return "Master 3 (M3)";
    if (age >= 55 && age <= 59) return "Master 4 (M4)";
    if (age >= 60 && age <= 64) return "Master 5 (M5)";
    if (age >= 65 && age <= 69) return "Master 6 (M6)";
    if (age >= 70) return "Master 7+ (M7+)";
    return null;
};

const computeCategoryFromBirthdate = (birthDateIso?: string | null): string | null => {
    if (!birthDateIso) return null;
    const parsed = new Date(birthDateIso);
    if (Number.isNaN(parsed.getTime())) return null;
    const currentYear = new Date().getFullYear();
    const age = currentYear - parsed.getFullYear();
    return computeCategoryFromAge(age);
};

export default function ProfileHeader({ user }: { user: User }) {
    const router = useRouter();
    const pathname = usePathname();
    const isCoach = user.role === "coach";
    const avatarUri =
        resolveProfilePhoto(user.photoUrl) ||
        resolveProfilePhoto(user.rpmAvatarPreviewUrl) ||
        user.rpmAvatarPreviewUrl ||
        null;
    const fallbackInitials = getInitials(user.fullName || user.username);
    const birthDateRaw = user.birthDate?.trim() || "";
    const birthDateIso = birthDateRaw && !birthDateRaw.includes("T") ? `${birthDateRaw}T00:00:00` : birthDateRaw;
    const hasValidBirthDate = Boolean(birthDateIso && !Number.isNaN(Date.parse(birthDateIso)));
    const discipline = user.mainDiscipline?.trim() || null;
    const computedCategory = hasValidBirthDate ? computeCategoryFromBirthdate(birthDateIso) : null;
    const category = hasValidBirthDate ? computedCategory : null;
    const hasDiscipline = Boolean(discipline);
    const hasCategory = Boolean(category);
    const disciplineDisplay = discipline || "Renseigne ta discipline";
    const categoryDisplay = hasValidBirthDate
        ? category || "Catégorie non disponible"
        : "Ajoute ta date de naissance";
    const categoryMissingDueToBirthDate = !hasValidBirthDate;
    const countryDisplay = user.country?.trim() || "Renseigne ton pays";
    const clubDisplay = user.club?.trim() || "Renseigne ton club";
    const hasCountry = Boolean(user.country?.trim());
    const hasClub = Boolean(user.club?.trim());
    const countryCode = getCountryCode(user.country);
    const flagEmoji = countryCode ? countryCodeToFlag(countryCode) : null;
    const [clubModalVisible, setClubModalVisible] = React.useState(false);
    const [friendsModalVisible, setFriendsModalVisible] = React.useState(false);
    const [friendsLoading, setFriendsLoading] = React.useState(false);
    const [friendsError, setFriendsError] = React.useState<string | null>(null);
    const [friendsDetails, setFriendsDetails] = React.useState<User[]>([]);
    const friendsTotal = user.relationship?.friendsCount ?? user.friends?.length ?? 0;
    const friendIds = React.useMemo(() => user.friends ?? [], [user.friends]);
    const isSelfProfile = Boolean(user.relationship?.isSelf);
    const pendingInviteIds = React.useMemo(
        () => (isSelfProfile ? user.friendRequestsReceived ?? [] : []),
        [isSelfProfile, user.friendRequestsReceived],
    );
    const pendingInvitesTotal = pendingInviteIds.length;
    const [pendingInviteDetails, setPendingInviteDetails] = React.useState<User[]>([]);
    const [pendingInvitesLoading, setPendingInvitesLoading] = React.useState(false);
    const [pendingInvitesError, setPendingInvitesError] = React.useState<string | null>(null);

    const handleOpenFriendsModal = React.useCallback(async () => {
        setFriendsModalVisible(true);
        setFriendsError(null);
        setPendingInvitesError(null);

        const loadFriends = async () => {
            if (!friendIds.length) {
                setFriendsDetails([]);
                setFriendsLoading(false);
                setFriendsError(
                    friendsTotal > 0
                        ? "Liste détaillée indisponible"
                        : "Aucun ami pour le moment",
                );
                return;
            }
            setFriendsLoading(true);
            try {
                const responses = await Promise.all(
                    friendIds.map((id) => getUserProfileById(id).catch(() => null)),
                );
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
            if (!isSelfProfile || !pendingInviteIds.length) {
                setPendingInviteDetails([]);
                setPendingInvitesLoading(false);
                return;
            }
            setPendingInvitesLoading(true);
            try {
                const responses = await Promise.all(
                    pendingInviteIds.map((id) => getUserProfileById(id).catch(() => null)),
                );
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
    }, [friendIds, friendsTotal, isSelfProfile, pendingInviteIds]);

    const handleCloseFriendsModal = React.useCallback(() => {
        setFriendsModalVisible(false);
        setFriendsError(null);
        setFriendsDetails([]);
        setFriendsLoading(false);
        setPendingInviteDetails([]);
        setPendingInvitesError(null);
        setPendingInvitesLoading(false);
    }, []);

    const navigateToProfile = React.useCallback(
        (targetId?: string | null) => {
            if (!targetId) {
                return;
            }
            const originPath = pathname?.startsWith("/") ? pathname : pathname ? `/${pathname}` : undefined;
            router.push({
                pathname: "/(main)/profiles/[id]",
                params: originPath ? { id: targetId, from: originPath } : { id: targetId },
            });
        },
        [pathname, router],
    );

    const navigateToSportEdit = React.useCallback(() => {
        router.push("/(main)/edit-profile/sport");
    }, [router]);

    const navigateToPersonalEdit = React.useCallback(() => {
        router.push("/(main)/edit-profile/personal");
    }, [router]);

    return (
        <View style={styles.cardWrapper}>
            <LinearGradient
                colors={["#0f172a", "#0b1120"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardOverlay} />
            <View style={styles.topRow}>
                <View style={styles.identityBlock}>
                    <View style={styles.avatarWrapper}>
                        <LinearGradient
                            colors={["rgba(21, 29, 31, 0.9)", "rgba(59,130,246,0.9)"]}
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
                        {user.username && <Text style={styles.usernameRow}>@{user.username}</Text>}
                        {!isCoach ? (
                            <View style={styles.disciplineCategoryRow}>
                                {hasDiscipline ? (
                                    <Text
                                        style={[
                                            styles.tagText,
                                            styles.disciplineText,
                                            !hasDiscipline && styles.placeholderTagText,
                                        ]}
                                    >
                                        {disciplineDisplay}
                                    </Text>
                                ) : (
                                    <Pressable
                                        onPress={navigateToSportEdit}
                                        style={({ pressed }) => [styles.tagPressable, pressed ? styles.tagPressed : null]}
                                        accessibilityRole="button"
                                        accessibilityLabel="Compléter ta discipline principale"
                                    >
                                        <Text
                                            style={[
                                                styles.tagText,
                                                styles.disciplineText,
                                                styles.placeholderTagText,
                                                styles.placeholderTagItalic,
                                            ]}
                                        >
                                            {disciplineDisplay}
                                        </Text>
                                    </Pressable>
                                )}
                                <View style={styles.disciplineDivider} />
                                {hasCategory ? (
                                    <Text
                                        style={[
                                            styles.tagText,
                                            styles.categoryText,
                                            !hasCategory && styles.placeholderTagText,
                                        ]}
                                    >
                                        {categoryDisplay}
                                    </Text>
                                ) : (
                                    <Pressable
                                        onPress={categoryMissingDueToBirthDate ? navigateToPersonalEdit : navigateToSportEdit}
                                        style={({ pressed }) => [styles.tagPressable, pressed ? styles.tagPressed : null]}
                                        accessibilityRole="button"
                                        accessibilityLabel={
                                            categoryMissingDueToBirthDate
                                                ? "Ajouter ta date de naissance"
                                                : "Compléter ta catégorie"
                                        }
                                    >
                                        <Text
                                            style={[styles.tagText, styles.categoryText, styles.placeholderTagText]}
                                        >
                                            {categoryDisplay}
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        ) : (
                            <View style={styles.disciplineCategoryRow}>
                                <Text style={[styles.tagText, styles.categoryText]}>Coach</Text>
                            </View>
                        )}
                    </View>
                </View>
                <CommunityStat
                    label="Amis"
                    value={friendsTotal}
                    icon="people-outline"
                    onPress={handleOpenFriendsModal}
                />
            </View>
            <View style={styles.metaRow}>
                {hasCountry ? (
                    <View style={[styles.metaItem, styles.metaPill, !hasCountry && styles.metaPlaceholderPill]}>
                        {flagEmoji && hasCountry ? (
                            <Text style={styles.flagEmoji}>{flagEmoji}</Text>
                        ) : (
                            <Ionicons name="location-outline" size={16} color={hasCountry ? "#94a3b8" : "#cbd5e1"} />
                        )}
                        <Text style={[styles.metaText, !hasCountry && styles.metaPlaceholderText]} numberOfLines={1}>
                            {countryDisplay}
                        </Text>
                    </View>
                ) : (
                    <Pressable
                        onPress={navigateToPersonalEdit}
                        style={({ pressed }) => [
                            styles.metaItem,
                            styles.metaPill,
                            styles.metaPlaceholderPill,
                            pressed ? styles.metaPressed : null,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Renseigner ton pays"
                    >
                        <Ionicons name="location-outline" size={16} color="#cbd5e1" />
                        <Text style={[styles.metaText, styles.metaPlaceholderText]} numberOfLines={1}>
                            {countryDisplay}
                        </Text>
                    </Pressable>
                )}

                {hasClub ? (
                    <Pressable
                        style={styles.metaClubPressable}
                        onPress={() => setClubModalVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Afficher le nom complet du club"
                    >
                        <LinearGradient
                            colors={["rgba(251,191,36,0.25)", "rgba(59,130,246,0.3)"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.metaItem, styles.metaClubPill]}
                        >
                            <Ionicons name="ribbon-outline" size={16} color="#f8fafc" />
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[styles.metaText, styles.metaClubText]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {clubDisplay}
                                </Text>
                            </View>
                        </LinearGradient>
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={navigateToSportEdit}
                        style={({ pressed }) => [styles.metaItem, styles.metaClubPlaceholder, pressed ? styles.metaPressed : null]}
                        accessibilityRole="button"
                        accessibilityLabel="Renseigner ton club"
                    >
                        <Ionicons name="ribbon-outline" size={16} color="#cbd5e1" />
                        <Text
                            style={[styles.metaText, styles.metaPlaceholderText, styles.metaClubText]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {clubDisplay}
                        </Text>
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
            <Modal
                visible={friendsModalVisible}
                transparent
                animationType="fade"
                onRequestClose={handleCloseFriendsModal}
            >
                <View style={styles.modalBackdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseFriendsModal} />
                    <LinearGradient
                        colors={[
                            "rgba(14,165,233,0.15)",
                            "rgba(15,23,42,0.95)",
                            "rgba(14,165,233,0.08)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.friendsModalCard}
                    >
                        <View style={styles.friendsModalHeader}>
                            <View style={styles.clubModalIconBadge}>
                                <Ionicons name="people-outline" size={20} color="#f8fafc" />
                            </View>
                            <Pressable
                                style={styles.modalCloseButton}
                                onPress={handleCloseFriendsModal}
                                accessibilityRole="button"
                            >
                                <Ionicons name="close" size={18} color="#e2e8f0" />
                            </Pressable>
                        </View>
                        <Text style={styles.friendsModalTitle}>Liste des amis</Text>
                        <ScrollView style={styles.friendsList} contentContainerStyle={styles.friendsListContent}>
                            {isSelfProfile ? (
                                <View style={styles.pendingSection}>
                                    <View style={styles.pendingHeaderRow}>
                                        <View style={styles.pendingHeaderTextBlock}>
                                            <Text style={styles.pendingSectionTitle}>Invitations en attente</Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.pendingBadge,
                                                !pendingInvitesTotal ? styles.pendingBadgeMuted : null,
                                            ]}
                                        >
                                            <Text style={styles.pendingBadgeText}>{pendingInvitesTotal}</Text>
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

                                            if (!requesterId) {
                                                return null;
                                            }
                                            const avatarUri = resolveProfilePhoto(
                                                requester.photoUrl || requester.rpmAvatarPreviewUrl,
                                            );
                                            return (
                                                <TouchableOpacity
                                                    key={`pending-${requesterId}`}
                                                    style={[styles.friendRow, styles.pendingRow]}
                                                    onPress={() => navigateToProfile(requesterId)}
                                                    activeOpacity={0.85}
                                                >
                                                    {avatarUri ? (
                                                        <Image source={{ uri: avatarUri }} style={styles.friendAvatar} />
                                                    ) : (
                                                        <View style={styles.friendAvatarPlaceholder}>
                                                            <Ionicons name="person-add-outline" size={18} color="#0f172a" />
                                                        </View>
                                                    )}
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.friendName}>
                                                            {requester.fullName || requester.username || "Athlète"}
                                                        </Text>
                                                        <Text style={styles.pendingMeta}>Invitation reçue</Text>
                                                    </View>
                                                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                                                </TouchableOpacity>
                                            );
                                        })
                                    ) : (
                                        <Text style={styles.pendingEmptyText}>
                                            {pendingInvitesError || "Aucune invitation en attente"}
                                        </Text>
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

                                        if (!friendId) {
                                            return null;
                                        }
                                        const avatarUri = resolveProfilePhoto(friend.photoUrl || friend.rpmAvatarPreviewUrl);
                                        return (
                                            <TouchableOpacity
                                                key={friendId}
                                                style={styles.friendRow}
                                                onPress={() => navigateToProfile(friendId)}
                                                activeOpacity={0.85}
                                            >
                                                {avatarUri ? (
                                                    <Image source={{ uri: avatarUri }} style={styles.friendAvatar} />
                                                ) : (
                                                    <View style={styles.friendAvatarPlaceholder}>
                                                        <Ionicons name="person" size={18} color="#0f172a" />
                                                    </View>
                                                )}
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.friendName}>
                                                        {friend.fullName || friend.username || "Athlète"}
                                                    </Text>
                                                    {friend.username ? (
                                                        <Text style={styles.friendMeta}>@{friend.username}</Text>
                                                    ) : null}
                                                </View>
                                                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                                            </TouchableOpacity>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.friendsEmptyText}>
                                        {friendsError || "Aucun ami enregistré"}
                                    </Text>
                                )}
                                {friendsError && friendsDetails.length > 0 ? (
                                    <Text style={styles.friendsErrorText}>{friendsError}</Text>
                                ) : null}
                            </View>
                        </ScrollView>
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

type CommunityStatProps = {
    label: string;
    value?: number;
    icon: IoniconName;
    onPress?: () => void;
    disabled?: boolean;
};

function CommunityStat({ label, value, icon, onPress, disabled }: CommunityStatProps) {
    const interactive = Boolean(onPress) && !disabled;
    return (
        <Pressable
            onPress={onPress}
            disabled={!interactive}
            style={({ pressed }) => [styles.communityStatWrapper, interactive && pressed ? { opacity: 0.8 } : null]}
        >
            <LinearGradient
                colors={["rgba(14,165,233,0.25)", "rgba(49,46,129,0.45)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.communityStat, interactive ? styles.communityStatInteractive : null]}
            >
                <View style={styles.communityIconBadge}>
                    <Ionicons name={icon} size={16} color="#e0f2fe" />
                </View>
                <View>
                    <Text style={styles.communityLabel}>{label}</Text>
                    <Text style={styles.communityValue}>{(value ?? 0).toLocaleString("fr-FR")}</Text>
                </View>
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 24,
        padding: 20,
        borderRadius: 32,
        overflow: "hidden",
        backgroundColor: "rgba(8,11,19,0.9)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
    },
    cardOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: "rgba(59,130,246,0.35)",
        opacity: 0.35,
        pointerEvents: "none",
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
    },
    identityBlock: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 14,
    },
    identityText: {
        flex: 1,
        gap: 6,
    },
    avatarWrapper: {
        borderRadius: 52,
        backgroundColor: "rgba(15,23,42,0.4)",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarRing: {
        borderRadius: 48,
        alignItems: "center",
        justifyContent: "center",
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 42,
    },
    avatarFallback: {
        width: 60,
        height: 60,
        borderRadius: 42,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarFallbackText: {
        color: "#0f172a",
        fontSize: 24,
        fontWeight: "700",
    },
    name: {
        fontSize: 16,
        fontWeight: "700",
        color: "#f8fafc",
        marginTop: 0,
        marginLeft: 0,
        alignSelf: "flex-start",
    },
    usernameRow: {
        fontSize: 10,
        color: "#94a3b8",
        fontWeight: "500",
    },

    disciplineCategoryRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    tagPressable: {
        paddingVertical: 2,
    },
    tagPressed: {
        opacity: 0.85,
    },
    tagChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "rgba(248,250,252,0.08)",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.35)",
    },
    tagText: {
        fontSize: 12,
        color: "#e2e8f0",
        textTransform: "capitalize",
    },
    disciplineText: {
        letterSpacing: 0.4,
    },
    categoryText: {
        color: "#cbd5e1",
    },
    placeholderTagText: {
        color: "#94a3b8",
        fontWeight: "600",
    },
    placeholderTagItalic: {
        fontStyle: "italic",
    },
    disciplineDivider: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(248,250,252,0.4)",
    },
    metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 18,
        width: "100%",
    },
    communityStatWrapper: {
        alignSelf: "flex-start",
    },
    communityStat: {
        borderRadius: 18,
        paddingVertical: 2,
        paddingHorizontal: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderWidth: 1,
        borderColor: "rgba(59,130,246,0.3)",
        alignSelf: "flex-start",
    },
    communityStatInteractive: {
        borderColor: "rgba(14,165,233,0.6)",
    },
    communityIconBadge: {
        width: 20,
        height: 20,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15,23,42,0.35)",
    },
    communityValue: {
        color: "#f8fafc",
        fontSize: 10,
        fontWeight: "700",
    },
    communityLabel: {
        color: "#bae6fd",
        fontSize: 8,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        maxWidth: "100%",
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
    metaPlaceholderPill: {
        borderColor: "rgba(148,163,184,0.4)",
        backgroundColor: "rgba(15,23,42,0.35)",
    },
    metaPressed: {
        opacity: 0.85,
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
    metaPlaceholderText: {
        color: "#94a3b8",
        fontWeight: "500",
        fontSize: 10,
    },
    metaClubText: {
        maxWidth: 320,
    },
    metaClubPressable: {
        flexGrow: 1,
        borderRadius: 20,
    },
    metaClubPill: {
        borderRadius: 18,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "rgba(251,191,36,0.5)",
    },
    metaClubPlaceholder: {
        flexGrow: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.35)",
        backgroundColor: "rgba(15,23,42,0.35)",
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
    clubModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    friendsModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
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
    friendsModalTitle: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "700",
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
    clubModalHint: {
        color: "#cbd5e1",
        fontSize: 13,
        marginTop: 8,
    },
});
