import React, { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { TrainingSessionScope, useTrainingSessionsList } from "../../hooks/useTrainingSessionsList";
import { formatSessionSummary } from "../../utils/trainingFormatter";
import { useAuth } from "../../context/AuthContext";
import { ParticipantStatus, ParticipantUserRef } from "../../types/training";

const getParticipantUserId = (value?: ParticipantUserRef | string) => {
    if (!value) {
        return undefined;
    }
    if (typeof value === "string") {
        return value;
    }
    return value.id || value._id;
};

const normalizeParticipantStatus = (status?: ParticipantStatus): ParticipantStatus =>
    status === "pending" ? "pending" : "confirmed";

const formatParticipantStatusLabel = (status: ParticipantStatus) =>
    status === "pending" ? "Invitation" : "Confirmée";

export default function TrainingSessionsListScreen() {
    const router = useRouter();
    const [scope, setScope] = useState<TrainingSessionScope>("owned");
    const { sessions, loading, error, refresh } = useTrainingSessionsList(scope);
    const { user } = useAuth();
    const currentUserId = user?.id || user?._id;
    const tabBarHeight = useBottomTabBarHeight();
    const insets = useSafeAreaInsets();
    const bottomSpacing = tabBarHeight + Math.max(insets.bottom, 10);
    const isOwnedView = scope === "owned";

    const headerTitle = isOwnedView ? "Mes séances planifiées" : "Séances auxquelles je participe";
    const headerSubtitle = isOwnedView
        ? sessions.length
            ? "Dernières mises à jour par ordre décroissant."
            : "Aucune séance encore planifiée."
        : sessions.length
            ? "Invitations reçues et séances confirmées."
            : "Aucune invitation reçue pour le moment.";

    const handleOpen = (id: string) => {
        router.push({ pathname: "/(main)/training/[id]", params: { id } });
    };

    const handleCreate = () => router.push("/(main)/training/create");

    const renderEmptyState = () => (
        <View style={styles.stateContainer}>
            <Text style={styles.stateTitle}>{isOwnedView ? "Planifiez votre première séance" : "Aucune participation"}</Text>
            <Text style={styles.stateSubtitle}>
                {isOwnedView
                    ? "Créez un programme pour apparaître ici."
                    : "Quand un coach vous ajoute à une séance, elle apparaîtra ici."}
            </Text>
            {isOwnedView ? (
                <Button mode="contained" onPress={handleCreate} buttonColor="#22d3ee" textColor="#02111f">
                    Créer une séance
                </Button>
            ) : null}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
            <ScrollView
                contentContainerStyle={[styles.container, { paddingBottom: bottomSpacing }]}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#22d3ee" />}
            >
                <View style={styles.scopeSwitcher}>
                    <Button
                        mode={isOwnedView ? "contained" : "outlined"}
                        onPress={() => setScope("owned")}
                        style={[styles.scopeButton, isOwnedView && styles.scopeButtonActive]}
                        buttonColor={isOwnedView ? "#22d3ee" : "transparent"}
                        textColor={isOwnedView ? "#02111f" : "#22d3ee"}
                    >
                        Mes séances
                    </Button>
                    <Button
                        mode={!isOwnedView ? "contained" : "outlined"}
                        onPress={() => setScope("participating")}
                        style={[styles.scopeButton, !isOwnedView && styles.scopeButtonActive]}
                        buttonColor={!isOwnedView ? "#22d3ee" : "transparent"}
                        textColor={!isOwnedView ? "#02111f" : "#22d3ee"}
                    >
                        Je participe
                    </Button>
                </View>
                <View style={styles.header}>
                    <Text style={styles.title}>{headerTitle}</Text>
                    <Text style={styles.subtitle}>{headerSubtitle}</Text>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                {loading && !sessions.length ? (
                    <View style={styles.stateContainer}>
                        <ActivityIndicator color="#22d3ee" />
                    </View>
                ) : null}

                {sessions.length
                    ? sessions.map((session) => (
                        <PressableCard
                            key={session.id}
                            session={session}
                            onPress={() => handleOpen(session.id)}
                            currentUserId={currentUserId}
                        />
                    ))
                    : !loading && renderEmptyState()}

                {isOwnedView ? (
                    <Button
                        mode="contained"
                        onPress={handleCreate}
                        style={styles.createButton}
                        buttonColor="#22d3ee"
                        textColor="#02111f"
                    >
                        Nouvelle séance
                    </Button>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const typeColors = {
    vitesse: '#38bdf8',
    endurance: '#22d3ee',
    force: '#facc15',
    technique: '#a3e635',
    récupération: '#f472b6',
    default: '#818cf8',
};

const PressableCard = ({
    session,
    onPress,
    currentUserId,
}: {
    session: Parameters<typeof formatSessionSummary>[0];
    onPress: () => void;
    currentUserId?: string | null;
}) => {
    const summary = formatSessionSummary(session);
    const typeColor = typeColors[session.type as keyof typeof typeColors] || typeColors.default;
    // On cache le volume si pas de distance (totalMeters = 0)
    const hasVolume = summary.volumeLabel && summary.volumeLabel !== '0 m' && summary.volumeLabel !== '0.0 km';
    const participants = session.participants || [];
    const participantEntry = currentUserId
        ? participants.find((participant) => getParticipantUserId(participant.user) === currentUserId)
        : undefined;
    const participantStatus = participantEntry
        ? normalizeParticipantStatus(participantEntry.status as ParticipantStatus | undefined)
        : undefined;
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.cardModern, pressed && styles.cardModernPressed]} accessibilityRole="button">
            <View style={styles.timelineRow}>
                <View style={styles.timelineDotWrapper}>
                    <View style={[styles.timelineDot, { backgroundColor: typeColor }]} />
                    <View style={styles.timelineLine} />
                </View>
                <View style={styles.cardModernContent}>
                    <View style={styles.cardModernHeader}>
                        <Text style={styles.cardModernDate}>{summary.date}</Text>
                        <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
                            <Text style={styles.typeBadgeText}>{summary.type}</Text>
                        </View>
                    </View>
                    {participantStatus ? (
                        <View
                            style={[
                                styles.participationChip,
                                participantStatus === "confirmed"
                                    ? styles.participationChipConfirmed
                                    : styles.participationChipPending,
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={participantStatus === "confirmed" ? "check-circle" : "handshake-outline"}
                                size={14}
                                color={participantStatus === "confirmed" ? "#10b981" : "#f97316"}
                                style={{ marginRight: 4 }}
                            />
                            <Text style={styles.participationChipText}>
                                {formatParticipantStatusLabel(participantStatus)}
                            </Text>
                        </View>
                    ) : null}
                    <Text style={styles.cardModernTitle}>{session.title}</Text>
                    {summary.place ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                            <MaterialCommunityIcons name="map-marker" size={16} color="#9a1c0cff" />
                            <Text style={styles.cardModernPlace}>{summary.place}</Text>
                        </View>
                    ) : null}
                    <Text style={styles.cardModernDesc}>{session.description}</Text>
                    {session.equipment ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                            <MaterialCommunityIcons name="toolbox-outline" size={16} color="#facc15" />
                            <Text style={styles.cardModernMeta}>{session.equipment}</Text>
                        </View>
                    ) : null}
                    <View style={styles.cardModernMetaRow}>
                        <MaterialCommunityIcons name="layers-triple-outline" size={16} color="#38bdf8" />
                        <Text style={styles.cardModernMeta}>{summary.seriesLabel}</Text>
                        {hasVolume && (
                            <>
                                <MaterialCommunityIcons name="run-fast" size={16} color="#facc15" />
                                <Text style={styles.cardModernMeta}>{summary.volumeLabel}</Text>
                            </>
                        )}
                    </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={28} color="#38bdf8" style={{ alignSelf: 'center' }} />
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#010617",
    },
    container: {
        padding: 20,
        gap: 16,
        backgroundColor: "#010617",
        flexGrow: 1,
    },
    header: {
        gap: 8,
    },
    scopeSwitcher: {
        flexDirection: "row",
        gap: 8,
        backgroundColor: "rgba(14,165,233,0.08)",
        borderRadius: 999,
        padding: 4,
    },
    scopeButton: {
        flex: 1,
        borderRadius: 999,
    },
    scopeButtonActive: {
        elevation: 0,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#f8fafc",
    },
    subtitle: {
        color: "#94a3b8",
    },
    error: {
        color: "#f87171",
    },
    cardModern: {
        borderRadius: 24,
        backgroundColor: "#0f172a",
        marginBottom: 8,
        shadowColor: "#22d3ee",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
        paddingVertical: 18,
        paddingHorizontal: 14,
    },
    cardModernPressed: {
        backgroundColor: "#1e293b",
        shadowOpacity: 0.22,
        elevation: 8,
    },
    timelineRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    timelineDotWrapper: {
        alignItems: "center",
        marginRight: 14,
        width: 18,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 6,
        marginBottom: 2,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: "#334155",
        marginTop: 2,
        borderRadius: 1,
    },
    cardModernContent: {
        flex: 1,
        gap: 2,
    },
    cardModernHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    participationChip: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginBottom: 6,
        borderWidth: 1,
    },
    participationChipConfirmed: {
        backgroundColor: "rgba(16,185,129,0.15)",
        borderColor: "rgba(16,185,129,0.4)",
    },
    participationChipPending: {
        backgroundColor: "rgba(249,115,22,0.15)",
        borderColor: "rgba(249,115,22,0.4)",
    },
    participationChipText: {
        color: "#f8fafc",
        fontSize: 11,
        fontWeight: "600",
    },
    cardModernDate: {
        color: "#38bdf8",
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    typeBadge: {
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 2,
        alignSelf: "flex-start",
        marginLeft: 8,
    },
    typeBadgeText: {
        color: "#0f172a",
        fontWeight: "700",
        fontSize: 12,
        textTransform: "capitalize",
        letterSpacing: 0.5,
    },
    cardModernTitle: {
        color: "#f8fafc",
        fontSize: 19,
        fontWeight: "700",
        marginBottom: 2,
    },
    cardModernPlace: {
        color: "#94a3b8",
        fontSize: 14,
        marginBottom: 2,
    },
    cardModernDesc: {
        color: "#cbd5e1",
        fontSize: 14,
        marginBottom: 4,
    },
    cardModernMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 2,
    },
    cardModernMeta: {
        color: "#94a3b8",
        fontSize: 13,
        marginRight: 6,
    },
    createButton: {
        marginTop: 16,
    },
    stateContainer: {
        paddingVertical: 40,
        gap: 12,
        alignItems: "center",
    },
    stateTitle: {
        color: "#f8fafc",
        fontSize: 16,
        fontWeight: "600",
    },
    stateSubtitle: {
        color: "#94a3b8",
        fontSize: 13,
        textAlign: "center",
        paddingHorizontal: 12,
    },
});
