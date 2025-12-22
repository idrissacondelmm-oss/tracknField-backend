import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ImageBackground,
    Alert,
    Modal,
    Pressable,
} from "react-native";
import { Text, Card, Avatar, Chip, Searchbar, ActivityIndicator } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NEWS_FEED, NewsItem } from "../../src/mocks/newsFeed";
import { getUserProfileById, searchUsers, UserSearchResult } from "../../src/api/userService";
import { User } from "../../src/types/User";
import { useRouter } from "expo-router";

type QuickStat = {
    id: string;
    label: string;
    value: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    gradient: [string, string];
};

type NotificationItem = {
    id: string;
    message: string;
    tone: "info" | "alert";
    action?: "friendRequests" | "navigate" | "info";
};

export default function HomePage() {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [requestsModalOpen, setRequestsModalOpen] = useState(false);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestsError, setRequestsError] = useState<string | null>(null);
    const [requesters, setRequesters] = useState<User[]>([]);

    const sortedNews = useMemo(
        () =>
            [...NEWS_FEED].sort(
                (a, b) =>
                    new Date(b.publishedAt).getTime() -
                    new Date(a.publishedAt).getTime(),
            ),
        [],
    );

    const primaryDiscipline =
        user?.mainDiscipline || user?.otherDisciplines?.[0] || "Sprint & Relais";
    const pendingFriendIds = user?.friendRequestsReceived ?? [];
    const pendingFriendRequests = pendingFriendIds.length;

    const quickStats = useMemo<QuickStat[]>(
        () => [
            {
                id: "focus",
                label: "Focus discipline",
                value: primaryDiscipline,
                icon: "run-fast",
                gradient: ["rgba(16,185,129,0.35)", "rgba(34,211,238,0.15)"],
            },
            {
                id: "sessions",
                label: "Volume semaine",
                value: "4 séances",
                icon: "calendar-week",
                gradient: ["rgba(14,165,233,0.35)", "rgba(99,102,241,0.2)"],
            },
            {
                id: "status",
                label: "Challenge en cours",
                value: "Road to Prague",
                icon: "flag-checkered",
                gradient: ["rgba(248,113,113,0.35)", "rgba(251,146,60,0.2)"],
            },
        ],
        [primaryDiscipline],
    );

    const heroFeature = sortedNews[0];
    const buildDefaultNotifications = useCallback(() => {
        const items: NotificationItem[] = [];
        if (pendingFriendRequests > 0) {
            const suffix = pendingFriendRequests > 1 ? "s" : "";
            items.push({
                id: "friend-requests",
                tone: "alert",
                message: `Vous avez ${pendingFriendRequests} demande${suffix} en attente`,
                action: "friendRequests",
            });
        }
        items.push({
            id: "training",
            tone: "info",
            message: "Briefing Track&Field disponible dans ton agenda",
            action: "info",
        });
        return items;
    }, [pendingFriendRequests]);

    const [notifications, setNotifications] = useState<NotificationItem[]>(() => buildDefaultNotifications());

    useEffect(() => {
        setNotifications(buildDefaultNotifications());
    }, [buildDefaultNotifications]);

    const handleSearchSubmit = useCallback(() => {
        const trimmed = searchQuery.trim();
        if (!trimmed) {
            return;
        }
        Alert.alert("Recherche utilisateur", `Recherche lancée pour ${trimmed}`);
    }, [searchQuery]);

    const toggleNotifications = useCallback(() => {
        setNotificationsOpen((prev) => !prev);
    }, []);

    const closeNotifications = useCallback(() => {
        setNotificationsOpen(false);
    }, []);

    const openFriendRequestsModal = useCallback(async () => {
        if (!pendingFriendIds.length) {
            Alert.alert("Aucune demande", "Tu n'as aucune demande en attente.");
            return;
        }
        setRequestsModalOpen(true);
        setRequestsLoading(true);
        setRequestsError(null);
        try {
            const profiles = await Promise.all(
                pendingFriendIds.map((id) =>
                    getUserProfileById(id).catch(() => null),
                ),
            );
            const filtered = profiles.filter(Boolean) as User[];
            setRequesters(filtered);
            if (!filtered.length) {
                setRequestsError("Impossible de charger ces profils");
            }
        } catch (error) {
            console.error("loadFriendRequests", error);
            setRequestsError("Une erreur est survenue");
        } finally {
            setRequestsLoading(false);
        }
    }, [pendingFriendIds]);

    const closeFriendRequestsModal = useCallback(() => {
        setRequestsModalOpen(false);
        setRequestsError(null);
        setRequesters([]);
    }, []);

    const handleDismissNotification = useCallback((notificationId: string) => {
        setNotifications((previous) => previous.filter((notification) => notification.id !== notificationId));
    }, []);

    const handleClearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const handleNotificationPress = useCallback(
        (notification: NotificationItem) => {
            if (notification.id === "friend-requests" || notification.action === "friendRequests") {
                closeNotifications();
                openFriendRequestsModal();
                return;
            }
            closeNotifications();
            Alert.alert("Notification", notification.message);
        },
        [closeNotifications, openFriendRequestsModal],
    );

    const handleClearSearch = useCallback(() => {
        setSearchQuery("");
        setSearchResults([]);
        setSearchError(null);
    }, []);

    const handleSelectResult = useCallback(
        (result: UserSearchResult) => {
            if (!result?.id) {
                return;
            }
            setSearchQuery(result.fullName || result.username || "");
            setSearchResults([]);
            setSearchError(null);
            router.push({ pathname: "/(main)/profiles/[id]", params: { id: result.id } });
        },
        [router],
    );

    const handleOpenRequesterProfile = useCallback(
        (userId?: string) => {
            if (!userId) {
                return;
            }
            closeFriendRequestsModal();
            router.push({ pathname: "/(main)/profiles/[id]", params: { id: userId } });
        },
        [closeFriendRequestsModal, router],
    );

    useEffect(() => {
        const trimmed = searchQuery.trim();
        if (trimmed.length < 2) {
            setSearchResults([]);
            setSearchError(null);
            setSearchLoading(false);
            return;
        }

        let isCancelled = false;
        setSearchLoading(true);
        const debounceId = setTimeout(() => {
            searchUsers(trimmed)
                .then((results) => {
                    if (isCancelled) return;
                    setSearchResults(results);
                    setSearchError(results.length ? null : "Aucun athlète trouvé");
                })
                .catch(() => {
                    if (isCancelled) return;
                    setSearchResults([]);
                    setSearchError("Impossible de rechercher des athlètes");
                })
                .finally(() => {
                    if (isCancelled) return;
                    setSearchLoading(false);
                });
        }, 250);

        return () => {
            isCancelled = true;
            clearTimeout(debounceId);
        };
    }, [searchQuery]);

    const headerTopInset = insets.top + 12;
    const fixedHeaderHeight = 80;
    const listTopPadding = headerTopInset + fixedHeaderHeight - 20;
    const navigationBarOffset = 0;

    return (
        <LinearGradient colors={["#020617", "#030711", "#00040a"]} style={styles.gradient}>
            <View
                style={[
                    styles.fixedHeaderContainer,
                    {
                        paddingTop: headerTopInset,
                        paddingHorizontal: 20,
                    },
                ]}
            >
                <View style={styles.fixedHeaderInner}>
                    <HomeUtilityHeader
                        searchQuery={searchQuery}
                        onChangeSearch={setSearchQuery}
                        onSubmitSearch={handleSearchSubmit}
                        onClearSearch={handleClearSearch}
                        onSelectResult={handleSelectResult}
                        searchLoading={searchLoading}
                        searchResults={searchResults}
                        searchError={searchError}
                        notifications={notifications}
                        pendingCount={pendingFriendRequests}
                        onDismissNotification={handleDismissNotification}
                        onClearNotifications={handleClearNotifications}
                        isOpen={notificationsOpen}
                        onToggle={toggleNotifications}
                        onClose={closeNotifications}
                        onNotificationPress={handleNotificationPress}
                    />
                </View>
            </View>
            <View
                style={[
                    styles.scrollRegion,
                    {
                        paddingTop: listTopPadding,
                        paddingBottom: navigationBarOffset,
                    },
                ]}
            >
                <FlatList
                    style={styles.feedList}
                    data={sortedNews}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <NewsCard item={item} />}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <FeedHeader
                                userName={user?.fullName || user?.username || user?.email}
                                isAuthenticated={Boolean(user)}
                            />
                            <StatsRow stats={quickStats} />
                            <HighlightCard feature={heroFeature} />
                            <Text style={styles.sectionTitle}>Dernières actus</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyState}>Aucune actu pour le moment.</Text>
                    }
                    contentContainerStyle={[
                        styles.listContent,
                        {
                            paddingBottom: Math.max(insets.bottom, 24),
                        },
                    ]}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                />
            </View>
            <Modal
                transparent
                visible={requestsModalOpen}
                animationType="fade"
                onRequestClose={closeFriendRequestsModal}
            >
                <View style={styles.notificationModalBackdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={closeFriendRequestsModal} />
                    <View style={styles.requestsModalCard}>
                        <View style={styles.notificationModalHeader}>
                            <Text style={styles.notificationTitle}>Demandes d'amis</Text>
                            <TouchableOpacity
                                onPress={closeFriendRequestsModal}
                                accessibilityRole="button"
                            >
                                <MaterialCommunityIcons name="close" size={20} color="#cbd5e1" />
                            </TouchableOpacity>
                        </View>
                        {requestsLoading ? (
                            <View style={styles.requestsLoadingRow}>
                                <ActivityIndicator animating color="#38bdf8" />
                                <Text style={styles.notificationItemText}>Chargement…</Text>
                            </View>
                        ) : requesters.length ? (
                            requesters.map((requester) => (
                                <TouchableOpacity
                                    key={requester._id || requester.id}
                                    style={styles.requestItem}
                                    onPress={() => handleOpenRequesterProfile(requester._id || requester.id)}
                                    activeOpacity={0.85}
                                >
                                    <MaterialCommunityIcons
                                        name="account-circle"
                                        size={30}
                                        color="#38bdf8"
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.requestName}>
                                            {requester.fullName || requester.username || "Athlète"}
                                        </Text>
                                        {requester.username ? (
                                            <Text style={styles.requestMeta}>@{requester.username}</Text>
                                        ) : null}
                                    </View>
                                    <MaterialCommunityIcons
                                        name="chevron-right"
                                        size={22}
                                        color="#94a3b8"
                                    />
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.notificationEmpty}>
                                {requestsError || "Aucune demande à afficher"}
                            </Text>
                        )}
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

const HomeUtilityHeader = ({
    searchQuery,
    onChangeSearch,
    onSubmitSearch,
    onClearSearch,
    onSelectResult,
    searchLoading,
    searchResults,
    searchError,
    notifications,
    pendingCount,
    onDismissNotification,
    onClearNotifications,
    isOpen,
    onToggle,
    onClose,
    onNotificationPress,
}: {
    searchQuery: string;
    onChangeSearch: (value: string) => void;
    onSubmitSearch: () => void;
    onClearSearch: () => void;
    onSelectResult: (result: UserSearchResult) => void;
    searchLoading: boolean;
    searchResults: UserSearchResult[];
    searchError: string | null;
    notifications: NotificationItem[];
    pendingCount: number;
    onDismissNotification: (notificationId: string) => void;
    onClearNotifications: () => void;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onNotificationPress: (notification: NotificationItem) => void;
}) => {
    const badgeValue = notifications.length || pendingCount;
    const trimmedQuery = searchQuery.trim();
    const showSearchResults = trimmedQuery.length >= 2 && (searchLoading || searchResults.length > 0 || !!searchError);
    return (
        <>
            <View style={styles.utilityHeader}>
                <View style={styles.searchWrapper}>
                    <Searchbar
                        placeholder="Rechercher un utilisateur"
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={onChangeSearch}
                        onSubmitEditing={onSubmitSearch}
                        onClearIconPress={onClearSearch}
                        iconColor="#38bdf8"
                        style={styles.searchBar}
                        inputStyle={styles.searchInput}
                        elevation={0}
                        returnKeyType="search"
                        loading={searchLoading}
                    />
                    {showSearchResults ? (
                        <View style={styles.searchDropdown}>
                            {searchLoading ? (
                                <View style={styles.searchDropdownRow}>
                                    <ActivityIndicator animating size="small" color="#38bdf8" />
                                    <Text style={styles.searchDropdownText}>Recherche en cours…</Text>
                                </View>
                            ) : searchResults.length ? (
                                searchResults.map((result) => (
                                    <TouchableOpacity
                                        key={result.id}
                                        style={styles.searchDropdownRow}
                                        onPress={() => onSelectResult(result)}
                                    >
                                        <MaterialCommunityIcons
                                            name="account-search"
                                            size={18}
                                            color="#38bdf8"
                                        />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.searchResultName}>
                                                {result.fullName || result.username || "Utilisateur"}
                                            </Text>
                                            {result.username ? (
                                                <Text style={styles.searchResultMeta}>@{result.username}</Text>
                                            ) : null}
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.searchDropdownEmpty}>{searchError || "Aucun résultat"}</Text>
                            )}
                        </View>
                    ) : null}
                </View>
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={onToggle}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Afficher les notifications"
                >
                    <MaterialCommunityIcons name="bell-badge" size={20} color="#f8fafc" />
                    <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>{badgeValue}</Text>
                    </View>
                </TouchableOpacity>
            </View>
            <Modal transparent visible={isOpen} animationType="fade" onRequestClose={onClose}>
                <View style={styles.notificationModalBackdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                    <View style={styles.notificationModalCard}>
                        <View style={styles.notificationModalHeader}>
                            <Text style={styles.notificationTitle}>Notifications</Text>
                            <View style={styles.notificationHeaderActions}>
                                {notifications.length ? (
                                    <Pressable
                                        onPress={onClearNotifications}
                                        style={styles.clearNotificationsButton}
                                        accessibilityRole="button"
                                        hitSlop={8}
                                    >
                                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#f8fafc" />
                                        <Text style={styles.clearNotificationsText}>Tout effacer</Text>
                                    </Pressable>
                                ) : null}
                                <TouchableOpacity onPress={onClose} accessibilityRole="button">
                                    <MaterialCommunityIcons name="close" size={20} color="#cbd5e1" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.notificationList}>
                            {notifications.length ? (
                                notifications.map((notification) => (
                                    <Pressable
                                        key={notification.id}
                                        style={({ pressed }) => [
                                            styles.notificationItem,
                                            notification.tone === "alert"
                                                ? styles.notificationItemAlert
                                                : styles.notificationItemInfo,
                                            pressed ? { opacity: 0.9 } : null,
                                        ]}
                                        onPress={() => onNotificationPress(notification)}
                                    >
                                        <MaterialCommunityIcons
                                            name={
                                                notification.tone === "alert"
                                                    ? "bell-alert-outline"
                                                    : "information-outline"
                                            }
                                            size={20}
                                            color="#f8fafc"
                                        />
                                        <Text style={styles.notificationItemText}>{notification.message}</Text>
                                        <Pressable
                                            onPress={(event) => {
                                                event.stopPropagation();
                                                onDismissNotification(notification.id);
                                            }}
                                            style={({ pressed }) => [
                                                styles.notificationDismissButton,
                                                pressed ? { opacity: 0.7 } : null,
                                            ]}
                                            accessibilityRole="button"
                                            hitSlop={6}
                                        >
                                            <MaterialCommunityIcons name="close" size={14} color="#e2e8f0" />
                                        </Pressable>
                                    </Pressable>
                                ))
                            ) : (
                                <Text style={styles.notificationEmpty}>Aucune notification pour le moment.</Text>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const FeedHeader = ({
    userName,
    isAuthenticated,
}: {
    userName?: string | null;
    isAuthenticated: boolean;
}) => (
    <View style={styles.header}>
        <View style={styles.badgeRow}>
            <View style={styles.badgePrimary}>
                <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={14}
                    color="#fef3c7"
                />
                <Text style={styles.badgeText}>Flux Athlé</Text>
            </View>
            <View style={styles.badgeSecondary}>
                <MaterialCommunityIcons
                    name="broadcast"
                    size={14}
                    color="#38bdf8"
                />
                <Text style={styles.badgeTextSecondary}>Live</Text>
            </View>
        </View>
        <Text style={styles.title}>Actus Track&Field</Text>
        {isAuthenticated ? (
            <>
                <Text style={styles.welcome}>Bienvenue 👋</Text>
                <Text style={styles.name}>{userName || "Athlète"}</Text>
                <Text style={styles.subtitle}>
                    Ton flux d&apos;athlé est prêt : perfs, stages et coulisses des disciplines olympiques.
                </Text>
            </>
        ) : (
            <Text style={styles.subtitle}>
                Connecte-toi pour personnaliser ton flux d&apos;athlétisme et suivre tes disciplines favorites.
            </Text>
        )}
    </View>
);

const StatsRow = ({ stats }: { stats: QuickStat[] }) => (
    <View style={styles.statsRow}>
        {stats.map((stat) => (
            <LinearGradient
                key={stat.id}
                colors={stat.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
            >
                <View style={styles.statIconWrapper}>
                    <MaterialCommunityIcons name={stat.icon} size={18} color="#f8fafc" />
                </View>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
            </LinearGradient>
        ))}
    </View>
);

const HighlightCard = ({ feature }: { feature?: NewsItem }) => {
    if (!feature) {
        return null;
    }

    return (
        <LinearGradient
            colors={["rgba(56,189,248,0.25)", "rgba(15,23,42,0.9)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.highlightCard}
        >
            <View style={styles.highlightContent}>
                <Text style={styles.highlightLabel}>Focus du jour</Text>
                <Text style={styles.highlightTitle}>{feature.headline}</Text>
                <Text style={styles.highlightMeta}>
                    {feature.discipline} • {feature.country}
                </Text>
                <TouchableOpacity style={styles.highlightCTA}>
                    <Text style={styles.highlightCTAText}>Voir les détails</Text>
                    <MaterialCommunityIcons
                        name="arrow-right"
                        size={18}
                        color="#f8fafc"
                    />
                </TouchableOpacity>
            </View>
            <ImageBackground
                source={{ uri: feature.mediaUrl }}
                style={styles.highlightImage}
                imageStyle={styles.highlightImageRadius}
            />
        </LinearGradient>
    );
};

const NewsCard = ({ item }: { item: NewsItem }) => (
    <Card style={styles.card} mode="elevated">
        <Card.Title
            title={item.headline}
            subtitle={`${item.athleteName} • ${formatDate(item.publishedAt)}`}
            left={(props) => (
                <Avatar.Text
                    {...props}
                    label={getInitials(item.athleteName)}
                    style={styles.avatar}
                    size={42}
                />
            )}
            right={() => (
                <Chip compact style={styles.chip} textStyle={styles.chipText}>
                    {item.discipline}
                </Chip>
            )}
        />
        {item.mediaUrl ? (
            <Card.Cover source={{ uri: item.mediaUrl }} style={styles.cardCover} />
        ) : null}
        <Card.Content>
            <Text style={styles.summary}>{item.summary}</Text>
            <View style={styles.metaRow}>
                <Text style={styles.metaText}>{item.country}</Text>
                <Text style={styles.metaText}>❤️ {item.likes}</Text>
                <Text style={styles.metaText}>💬 {item.comments}</Text>
            </View>
            <View style={styles.tagsRow}>
                {item.tags.map((tag) => (
                    <Text key={tag} style={styles.tag}>
                        #{tag}
                    </Text>
                ))}
            </View>
        </Card.Content>
    </Card>
);

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

const getInitials = (value: string) =>
    value
        .split(" ")
        .map((chunk) => chunk?.[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    scrollRegion: {
        flex: 1,
    },
    feedList: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 0,
        paddingTop: 8,
    },
    listHeader: {
        gap: 16,
    },
    fixedHeaderContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        zIndex: 50,
    },
    fixedHeaderInner: {

    },
    utilityHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,

    },
    searchWrapper: {
        flex: 1,
        position: "relative",
    },
    searchBar: {
        flex: 1,
        backgroundColor: "rgba(15,23,42,0.85)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.35)",

    },
    searchInput: {
        color: "#f8fafc",
        fontSize: 14,
    },
    searchDropdown: {
        position: "absolute",
        top: 58,
        left: 0,
        right: 0,
        borderRadius: 18,
        backgroundColor: "rgba(2,6,23,0.95)",
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.25)",
        paddingVertical: 6,
        gap: 2,
        zIndex: 100,
    },
    searchDropdownRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    searchDropdownText: {
        color: "#e2e8f0",
        fontSize: 13,
    },
    searchResultName: {
        color: "#f8fafc",
        fontSize: 14,
        fontWeight: "600",
    },
    searchResultMeta: {
        color: "#94a3b8",
        fontSize: 12,
    },
    searchDropdownEmpty: {
        color: "#94a3b8",
        fontSize: 13,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    notificationButton: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(56,189,248,0.2)",
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.4)",

    },
    notificationBadge: {
        position: "absolute",
        top: 8,
        right: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: "#f97316",

    },
    notificationBadgeText: {
        color: "#0f172a",
        fontSize: 10,
        fontWeight: "700",
    },
    title: {
        fontSize: 30,
        fontWeight: "700",
        color: "#f1f5f9",
        textAlign: "left",
        marginBottom: 4,
    },
    header: {
        paddingVertical: 10,
        gap: 8,
    },
    badgeRow: {
        flexDirection: "row",
        gap: 8,
    },
    badgePrimary: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "rgba(250,204,21,0.15)",
        borderRadius: 999,
    },
    badgeSecondary: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "rgba(56,189,248,0.15)",
        borderRadius: 999,
    },
    badgeText: {
        color: "#fde047",
        fontSize: 12,
        fontWeight: "600",
    },
    badgeTextSecondary: {
        color: "#38bdf8",
        fontSize: 12,
        fontWeight: "600",
    },
    name: {
        fontSize: 22,
        color: "#22d3ee",
        marginVertical: 8,
        fontWeight: "600",
    },
    subtitle: {
        textAlign: "left",
        color: "#cbd5e1",
        fontSize: 15,
        marginBottom: 10,
    },
    welcome: {
        fontSize: 18,
        fontWeight: "600",
        color: "#f8fafc",
    },
    statsRow: {
        flexDirection: "row",
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    statIconWrapper: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
        marginBottom: 10,
    },
    statLabel: {
        color: "#cbd5e1",
        fontSize: 12,
    },
    statValue: {
        color: "#f8fafc",
        fontSize: 16,
        fontWeight: "600",
        marginTop: 2,
    },
    highlightCard: {
        flexDirection: "row",
        borderRadius: 26,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.3)",
        overflow: "hidden",
        gap: 16,
    },
    highlightContent: {
        flex: 1,
        gap: 10,
    },
    highlightLabel: {
        color: "#38bdf8",
        fontSize: 12,
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    highlightTitle: {
        color: "#f8fafc",
        fontSize: 20,
        fontWeight: "700",
    },
    highlightMeta: {
        color: "#cbd5e1",
        fontSize: 14,
    },
    highlightCTA: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 6,
    },
    highlightCTAText: {
        color: "#f8fafc",
        fontWeight: "600",
    },
    highlightImage: {
        width: 110,
        height: 120,
    },
    highlightImageRadius: {
        borderRadius: 18,
    },
    notificationModalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(2,6,23,0.85)",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    notificationModalCard: {
        width: "100%",
        borderRadius: 24,
        padding: 20,
        backgroundColor: "rgba(15,23,42,0.98)",
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.35)",
        gap: 16,
    },
    requestsModalCard: {
        width: "100%",
        borderRadius: 24,
        padding: 20,
        backgroundColor: "rgba(2,6,23,0.98)",
        borderWidth: 1,
        borderColor: "rgba(34,197,94,0.35)",
        gap: 12,
        maxHeight: 420,
    },
    notificationModalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    notificationHeaderActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    notificationTitle: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "700",
    },
    clearNotificationsButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "rgba(148,163,184,0.15)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
    },
    clearNotificationsText: {
        color: "#f8fafc",
        fontSize: 12,
        fontWeight: "600",
    },
    notificationList: {
        gap: 12,
    },
    notificationItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 18,
    },
    notificationItemAlert: {
        backgroundColor: "rgba(248,113,113,0.15)",
        borderWidth: 1,
        borderColor: "rgba(248,113,113,0.4)",
    },
    notificationItemInfo: {
        backgroundColor: "rgba(59,130,246,0.12)",
        borderWidth: 1,
        borderColor: "rgba(59,130,246,0.35)",
    },
    notificationItemText: {
        flex: 1,
        color: "#e2e8f0",
        fontSize: 14,
        lineHeight: 20,
    },
    notificationDismissButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15,23,42,0.35)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
    },
    notificationEmpty: {
        color: "#94a3b8",
        fontSize: 14,
        textAlign: "center",
        paddingVertical: 10,
    },
    requestsLoadingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    requestItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        gap: 12,
        borderBottomWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
    },
    requestName: {
        color: "#f8fafc",
        fontSize: 15,
        fontWeight: "600",
    },
    requestMeta: {
        color: "#94a3b8",
        fontSize: 12,
    },
    sectionTitle: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "600",
        marginTop: 8,
    },
    card: {
        marginBottom: 18,
        backgroundColor: "rgba(2,6,23,0.7)",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        shadowColor: "#0ea5e9",
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    cardCover: {
        backgroundColor: "#0f172a",
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    summary: {
        color: "#e2e8f0",
        fontSize: 15,
        marginTop: 8,
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
    },
    metaText: {
        color: "#94a3b8",
        fontSize: 13,
    },
    tagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 12,
        gap: 6,
    },
    tag: {
        color: "#38bdf8",
        fontSize: 13,
        borderWidth: 1,
        borderColor: "rgba(56,189,248,0.4)",
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 2,
    },
    emptyState: {
        color: "#94a3b8",
        textAlign: "center",
        marginTop: 40,
    },
    chip: {
        backgroundColor: "rgba(56,189,248,0.15)",
    },
    chipText: {
        color: "#38bdf8",
        fontSize: 12,
    },
    avatar: {
        backgroundColor: "#0ea5e9",
    },
});
