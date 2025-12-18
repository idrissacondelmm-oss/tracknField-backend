import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ParticipantStatus, ParticipantUserRef, TrainingSession } from "../../types/training";
import { formatSessionSummary } from "../../utils/trainingFormatter";

const typeColors = {
    vitesse: "#38bdf8",
    endurance: "#22d3ee",
    force: "#facc15",
    technique: "#a3e635",
    récupération: "#f472b6",
    default: "#818cf8",
};

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

type TrainingSessionCardProps = {
    session: TrainingSession;
    onPress?: () => void;
    currentUserId?: string | null;
};

const TrainingSessionCard = ({ session, onPress, currentUserId }: TrainingSessionCardProps) => {
    const summary = formatSessionSummary(session);
    const typeColor = typeColors[session.type as keyof typeof typeColors] || typeColors.default;
    const hasVolume = summary.volumeLabel && summary.volumeLabel !== "0 m" && summary.volumeLabel !== "0.0 km";
    const participants = session.participants || [];
    const participantCount = participants.length;
    const participantLabel = participantCount > 1 ? "participants" : "participant";
    const participantEntry = currentUserId
        ? participants.find((participant) => getParticipantUserId(participant.user) === currentUserId)
        : undefined;
    const participantStatus = participantEntry
        ? normalizeParticipantStatus(participantEntry.status as ParticipantStatus | undefined)
        : undefined;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.cardModern, pressed && onPress ? styles.cardModernPressed : null]}
            accessibilityRole={onPress ? "button" : undefined}
        >
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
                        <View style={styles.inlineMetaRow}>
                            <MaterialCommunityIcons name="map-marker" size={16} color="#9a1c0c" />
                            <Text style={styles.cardModernPlace}>{summary.place}</Text>
                        </View>
                    ) : null}
                    <Text style={styles.cardModernDesc}>{session.description}</Text>
                    {session.equipment ? (
                        <View style={styles.inlineMetaRow}>
                            <MaterialCommunityIcons name="toolbox-outline" size={16} color="#facc15" />
                            <Text style={styles.cardModernMeta}>{session.equipment}</Text>
                        </View>
                    ) : null}
                    <View style={styles.cardModernMetaRow}>
                        <MaterialCommunityIcons name="layers-triple-outline" size={16} color="#38bdf8" />
                        <Text style={styles.cardModernMeta}>{summary.seriesLabel}</Text>
                        {hasVolume ? (
                            <>
                                <MaterialCommunityIcons name="run-fast" size={16} color="#facc15" />
                                <Text style={styles.cardModernMeta}>{summary.volumeLabel}</Text>
                            </>
                        ) : null}
                    </View>
                    <View style={styles.inlineMetaRow}>
                        <MaterialCommunityIcons name="account-group" size={16} color="#38bdf8" />
                        <Text style={styles.cardModernMeta}>
                            {participantCount} {participantLabel}
                        </Text>
                    </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={28} color="#38bdf8" style={{ alignSelf: "center" }} />
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
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
    inlineMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 2,
    },
    cardModernMeta: {
        color: "#94a3b8",
        fontSize: 13,
        marginRight: 6,
    },
});

export default TrainingSessionCard;
