import React, { useMemo } from "react";
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ImageBackground,
} from "react-native";
import { Text, Card, Avatar, Chip } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NEWS_FEED, NewsItem } from "../../src/mocks/newsFeed";

type QuickStat = {
    id: string;
    label: string;
    value: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    gradient: [string, string];
};

export default function HomePage() {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

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

    return (
        <LinearGradient
            colors={["#020617", "#030711", "#00040a"]}
            style={[styles.gradient, { paddingTop: insets.top + 12 }]}
        >
            <FlatList
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
                    { paddingBottom: Math.max(insets.bottom, 12) },
                ]}
                showsVerticalScrollIndicator={false}
            />
        </LinearGradient>
    );
}

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
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 0,
        paddingTop: 8,
    },
    listHeader: {
        gap: 16,
    },
    title: {
        fontSize: 30,
        fontWeight: "700",
        color: "#f1f5f9",
        textAlign: "left",
        marginBottom: 4,
    },
    header: {
        paddingVertical: 24,
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
