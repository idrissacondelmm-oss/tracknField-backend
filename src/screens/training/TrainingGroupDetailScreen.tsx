import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, Dialog, Portal, Text, TextInput } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    useFonts,
} from "@expo-google-fonts/space-grotesk";
import {
    addMemberToTrainingGroup,
    getTrainingGroup,
    removeMemberFromTrainingGroup,
} from "../../api/groupService";
import {
    attachSessionToGroup,
    detachSessionFromGroup,
    listGroupSessions,
    listTrainingSessions,
} from "../../api/trainingService";
import { GroupMember, GroupUserRef, TrainingGroupSummary } from "../../types/trainingGroup";
import { SessionParticipant, TrainingSession } from "../../types/training";
import { useAuth } from "../../context/AuthContext";
import { useTraining } from "../../context/TrainingContext";
import TrainingSessionCard from "../../components/training/TrainingSessionCard";
import { searchUsers, UserSearchResult } from "../../api/userService";

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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ?? "";

const resolveProfilePhoto = (value?: string | null): string | undefined => {
    if (!value) {
        return undefined;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    if (!API_BASE_URL) {
        return undefined;
    }
    const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${API_BASE_URL}${normalized}`;
};

const getMemberPhotoUri = (value?: string | null) => resolveProfilePhoto(value);

const formatDisplayDate = (value?: string) => {
    if (!value) return "Date à définir";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return parsed.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
    });
};

type SessionGroupingKey = "today" | "upcoming" | "past";

const SECTION_LABELS: Record<SessionGroupingKey, string> = {
    today: "Séances du jour",
    upcoming: "Séances à venir",
    past: "Séances passées",
};

const SECTION_DESCRIPTIONS: Record<SessionGroupingKey, string> = {
    today: "Ce qui se passe aujourd'hui dans le groupe.",
    upcoming: "Programmez les prochaines étapes avec votre équipe.",
    past: "Historique des rendez-vous terminés.",
};

const TIMEFRAME_OPTIONS: { key: SessionGroupingKey; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: "today", label: "Aujourd'hui", icon: "calendar-today" },
    { key: "upcoming", label: "À venir", icon: "calendar-arrow-right" },
    { key: "past", label: "Passées", icon: "history" },
];

const toValidDate = (value?: string) => {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const getSessionStartDate = (session: TrainingSession) => {
    const baseDate = toValidDate(session.date);
    if (!baseDate) {
        return null;
    }
    if (session.startTime && /^\d{2}:\d{2}$/.test(session.startTime)) {
        const [hours, minutes] = session.startTime.split(":").map((part) => Number(part));
        if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
            const start = new Date(baseDate);
            start.setHours(hours, minutes, 0, 0);
            return start;
        }
    }
    const dayStart = new Date(baseDate);
    dayStart.setHours(0, 0, 0, 0);
    return dayStart;
};

const getSessionEndDate = (session: TrainingSession, startDate: Date | null) => {
    if (startDate) {
        const durationMinutes = Number(session.durationMinutes);
        if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
            return new Date(startDate.getTime() + durationMinutes * 60 * 1000);
        }
        const endOfDay = new Date(startDate);
        endOfDay.setHours(23, 59, 59, 999);
        return endOfDay;
    }
    const baseDate = toValidDate(session.date);
    if (!baseDate) {
        return null;
    }
    baseDate.setHours(23, 59, 59, 999);
    return baseDate;
};

const getDayStart = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
};

const getSessionSortTimestamp = (session: TrainingSession) => {
    const startDate = getSessionStartDate(session);
    if (startDate) {
        return startDate.getTime();
    }
    const baseDate = toValidDate(session.date);
    return baseDate ? baseDate.getTime() : 0;
};

const categorizeSession = (session: TrainingSession): SessionGroupingKey => {
    const now = new Date();
    const todayStart = getDayStart(now);
    const baseDate = toValidDate(session.date);
    const startDate = getSessionStartDate(session);
    const endDate = getSessionEndDate(session, startDate);
    if (baseDate && isSameDay(baseDate, now)) {
        return "today";
    }
    if (startDate && startDate > now) {
        return "upcoming";
    }
    if (!startDate && baseDate && getDayStart(baseDate) > todayStart) {
        return "upcoming";
    }
    if (endDate && endDate < now) {
        return "past";
    }
    if (baseDate && getDayStart(baseDate) < todayStart) {
        return "past";
    }
    return "upcoming";
};

const groupSessionsByTimeframe = (sessions: TrainingSession[]) => {
    const groups: Record<SessionGroupingKey, TrainingSession[]> = {
        today: [],
        upcoming: [],
        past: [],
    };
    sessions.forEach((session) => {
        const bucket = categorizeSession(session);
        groups[bucket].push(session);
    });
    groups.today.sort((a, b) => getSessionSortTimestamp(a) - getSessionSortTimestamp(b));
    groups.upcoming.sort((a, b) => getSessionSortTimestamp(a) - getSessionSortTimestamp(b));
    groups.past.sort((a, b) => getSessionSortTimestamp(b) - getSessionSortTimestamp(a));
    return groups;
};

const isSessionLocked = (status?: TrainingSession["status"]) => status === "done" || status === "canceled";

export default function TrainingGroupDetailScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const pathname = usePathname();
    const { user } = useAuth();
    const { joinSession, leaveSession } = useTraining();
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
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [sessionsError, setSessionsError] = useState<string | null>(null);
    const [sessionMutationIds, setSessionMutationIds] = useState<Record<string, boolean>>({});
    const [memberDialogVisible, setMemberDialogVisible] = useState(false);
    const [memberInput, setMemberInput] = useState("");
    const [memberSuggestions, setMemberSuggestions] = useState<UserSearchResult[]>([]);
    const [memberSearchLoading, setMemberSearchLoading] = useState(false);
    const [selectedMember, setSelectedMember] = useState<UserSearchResult | null>(null);
    const [memberSaving, setMemberSaving] = useState(false);
    const [removingMemberIds, setRemovingMemberIds] = useState<Record<string, boolean>>({});
    const [sessionPickerVisible, setSessionPickerVisible] = useState(false);
    const [sessionPickerLoading, setSessionPickerLoading] = useState(false);
    const [sessionPickerError, setSessionPickerError] = useState<string | null>(null);
    const [ownedSessions, setOwnedSessions] = useState<TrainingSession[]>([]);
    const [sessionPublishingId, setSessionPublishingId] = useState<string | null>(null);
    const [sessionRemovalIds, setSessionRemovalIds] = useState<Record<string, boolean>>({});
    const [timeframe, setTimeframe] = useState<SessionGroupingKey>("today");

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

    const fetchSessions = useCallback(async () => {
        if (!id) return;
        try {
            setSessionsLoading(true);
            const data = await listGroupSessions(id.toString());
            setSessions(data);
            setSessionsError(null);
        } catch (error: any) {
            console.error("Erreur chargement séances groupe", error);
            const message = error?.response?.data?.message || "Impossible de charger les séances du groupe";
            setSessionsError(message);
        } finally {
            setSessionsLoading(false);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            fetchGroup();
            fetchSessions();
        }, [fetchGroup, fetchSessions]),
    );

    const members = group?.members ?? [];
    const groupReturnPath = useMemo(() => {
        const slug = group?.id || id?.toString() || "";
        const query = slug ? `?id=${slug}` : "";
        return `${pathname}${query}`;
    }, [group?.id, id, pathname]);
    const shareableSessions = useMemo(() => {
        if (!ownerId) return [];
        return ownedSessions.filter((session) => session.athleteId === ownerId && !session.groupId);
    }, [ownedSessions, ownerId]);

    const groupedSessions = useMemo(() => groupSessionsByTimeframe(sessions), [sessions]);

    useEffect(() => {
        if (!sessions.length) {
            return;
        }
        if (groupedSessions[timeframe]?.length) {
            return;
        }
        const fallback = TIMEFRAME_OPTIONS.find((option) => groupedSessions[option.key].length);
        if (fallback) {
            setTimeframe(fallback.key);
        }
    }, [groupedSessions, sessions.length, timeframe]);

    const filteredSessions = groupedSessions[timeframe] || [];
    const timeframeTitle = SECTION_LABELS[timeframe];
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

    const handlePublishSession = useCallback(() => {
        if (!isOwner) {
            return;
        }
        setSessionPickerVisible(true);
        setSessionPickerError(null);
        setSessionPickerLoading(true);
        setOwnedSessions([]);
        listTrainingSessions()
            .then((data) => {
                setOwnedSessions(data);
            })
            .catch((error: any) => {
                const message = error?.response?.data?.message || error?.message || "Impossible de récupérer vos séances";
                setSessionPickerError(message);
            })
            .finally(() => {
                setSessionPickerLoading(false);
            });
    }, [isOwner]);

    const handleCreateNewSession = useCallback(() => {
        const groupId = group?.id || id?.toString();
        if (!groupId) return;
        setSessionPickerVisible(false);
        router.push({ pathname: "/(main)/training/create", params: { groupId } });
    }, [group?.id, id, router]);

    const closeSessionPicker = useCallback(() => {
        if (sessionPublishingId) {
            return;
        }
        setSessionPickerVisible(false);
        setSessionPickerError(null);
    }, [sessionPublishingId]);

    const handleAttachExistingSession = useCallback(
        async (sessionId: string) => {
            if (!group?.id) {
                return;
            }
            setSessionPublishingId(sessionId);
            try {
                await attachSessionToGroup(group.id, sessionId);
                await fetchSessions();
                Alert.alert("Séance ajoutée", "La séance est maintenant partagée dans ce groupe.");
                setSessionPickerVisible(false);
            } catch (error: any) {
                const message = error?.response?.data?.message || error?.message || "Impossible d'ajouter cette séance";
                Alert.alert("Erreur", message);
            } finally {
                setSessionPublishingId(null);
            }
        },
        [fetchSessions, group?.id],
    );

    const performDetachGroupSession = useCallback(
        async (sessionId: string) => {
            if (!group?.id || !sessionId) {
                return;
            }
            setSessionRemovalIds((prev) => ({ ...prev, [sessionId]: true }));
            try {
                await detachSessionFromGroup(group.id, sessionId);
                await fetchSessions();
                Alert.alert("Séance retirée", "Cette séance n'est plus partagée dans le groupe.");
            } catch (error: any) {
                const message = error?.response?.data?.message || error?.message || "Impossible de retirer cette séance";
                Alert.alert("Erreur", message);
            } finally {
                setSessionRemovalIds((prev) => {
                    if (!prev[sessionId]) {
                        return prev;
                    }
                    const next = { ...prev };
                    delete next[sessionId];
                    return next;
                });
            }
        },
        [fetchSessions, group?.id],
    );

    const confirmDetachGroupSession = useCallback(
        (sessionId: string, label?: string) => {
            if (!sessionId) {
                return;
            }
            Alert.alert(
                "Retirer la séance",
                label ? `Retirer \"${label}\" du groupe ?` : "Retirer cette séance du groupe ?",
                [
                    { text: "Annuler", style: "cancel" },
                    { text: "Retirer", style: "destructive", onPress: () => performDetachGroupSession(sessionId) },
                ],
            );
        },
        [performDetachGroupSession],
    );

    const handleOpenSession = useCallback(
        (sessionId: string) => {
            router.push(`/(main)/training/${sessionId}`);
        },
        [router],
    );

    const handleJoinSession = useCallback(
        async (sessionId: string) => {
            if (!sessionId) return;
            const targetSession = sessions.find((item) => item.id === sessionId);
            if (isSessionLocked(targetSession?.status)) {
                const reasonLabel = targetSession?.status === "canceled" ? "annulée" : "terminée";
                Alert.alert("Séance clôturée", `Impossible de rejoindre une séance ${reasonLabel}.`);
                return;
            }
            let skip = false;
            setSessionMutationIds((prev) => {
                if (prev[sessionId]) {
                    skip = true;
                    return prev;
                }
                return { ...prev, [sessionId]: true };
            });
            if (skip) {
                return;
            }
            try {
                const updated = await joinSession(sessionId);
                setSessions((prev) => prev.map((session) => (session.id === updated.id ? updated : session)));
            } catch (error: any) {
                console.error("Erreur participation séance", error);
                const message = error?.response?.data?.message || "Impossible de rejoindre cette séance";
                Alert.alert("Erreur", message);
            } finally {
                setSessionMutationIds((prev) => {
                    if (!prev[sessionId]) return prev;
                    const next = { ...prev };
                    delete next[sessionId];
                    return next;
                });
            }
        },
        [joinSession, sessions],
    );

    const handleLeaveSession = useCallback(
        async (sessionId: string) => {
            if (!sessionId) return;
            const targetSession = sessions.find((item) => item.id === sessionId);
            if (isSessionLocked(targetSession?.status)) {
                const reasonLabel = targetSession?.status === "canceled" ? "annulée" : "terminée";
                Alert.alert("Séance clôturée", `Les désinscriptions sont verrouillées car la séance est ${reasonLabel}.`);
                return;
            }
            let skip = false;
            setSessionMutationIds((prev) => {
                if (prev[sessionId]) {
                    skip = true;
                    return prev;
                }
                return { ...prev, [sessionId]: true };
            });
            if (skip) {
                return;
            }
            try {
                const updated = await leaveSession(sessionId);
                setSessions((prev) => prev.map((session) => (session.id === updated.id ? updated : session)));
            } catch (error: any) {
                console.error("Erreur désinscription séance", error);
                const message = error?.response?.data?.message || "Impossible de se désinscrire de cette séance";
                Alert.alert("Erreur", message);
            } finally {
                setSessionMutationIds((prev) => {
                    if (!prev[sessionId]) return prev;
                    const next = { ...prev };
                    delete next[sessionId];
                    return next;
                });
            }
        },
        [leaveSession, sessions],
    );

    const handleOpenMemberDialog = useCallback(() => {
        setMemberDialogVisible(true);
        setMemberInput("");
        setMemberSuggestions([]);
        setSelectedMember(null);
    }, []);

    const closeMemberDialog = useCallback(() => {
        if (memberSaving) {
            return;
        }
        setMemberDialogVisible(false);
        setMemberInput("");
        setMemberSuggestions([]);
        setSelectedMember(null);
    }, [memberSaving]);

    const handleSelectMemberSuggestion = useCallback((suggestion: UserSearchResult) => {
        setSelectedMember(suggestion);
        setMemberInput(suggestion.fullName?.trim() || suggestion.username?.trim() || suggestion.id);
        setMemberSuggestions([]);
        setMemberSearchLoading(false);
    }, []);

    const handleAddMember = useCallback(async () => {
        const groupId = group?.id || id?.toString();
        if (!groupId) {
            return;
        }
        const trimmed = memberInput.trim();
        const manualIdAllowed = /^[a-f\d]{8,}$/i.test(trimmed);
        const targetUserId = selectedMember?.id || (manualIdAllowed ? trimmed : "");
        if (!targetUserId) {
            Alert.alert(
                "Sélection requise",
                "Choisissez un athlète dans la liste ou renseignez son identifiant complet.",
            );
            return;
        }
        try {
            setMemberSaving(true);
            const updated = await addMemberToTrainingGroup(groupId, targetUserId);
            setGroup(updated);
            setMemberDialogVisible(false);
            setMemberInput("");
            setMemberSuggestions([]);
            setSelectedMember(null);
            Alert.alert("Membre ajouté", "L'athlète a rejoint votre groupe.");
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || "Ajout impossible";
            Alert.alert("Erreur", message);
        } finally {
            setMemberSaving(false);
        }
    }, [group?.id, id, memberInput, selectedMember]);

    const performRemoveMember = useCallback(
        async (memberId: string) => {
            const groupId = group?.id || id?.toString();
            if (!groupId || !memberId) {
                return;
            }
            setRemovingMemberIds((prev) => ({ ...prev, [memberId]: true }));
            try {
                const updated = await removeMemberFromTrainingGroup(groupId, memberId);
                setGroup(updated);
            } catch (error: any) {
                const message = error?.response?.data?.message || error?.message || "Impossible de retirer ce membre";
                Alert.alert("Erreur", message);
            } finally {
                setRemovingMemberIds((prev) => {
                    if (!prev[memberId]) return prev;
                    const next = { ...prev };
                    delete next[memberId];
                    return next;
                });
            }
        },
        [group?.id, id],
    );

    const confirmRemoveMember = useCallback(
        (memberId: string, label?: string) => {
            if (!memberId) {
                return;
            }
            Alert.alert(
                "Retirer le membre",
                label ? `Retirer ${label} du groupe ?` : "Retirer cet athlète du groupe ?",
                [
                    { text: "Annuler", style: "cancel" },
                    { text: "Retirer", style: "destructive", onPress: () => performRemoveMember(memberId) },
                ],
            );
        },
        [performRemoveMember],
    );

    useEffect(() => {
        if (!memberDialogVisible) {
            setMemberSuggestions([]);
            setMemberSearchLoading(false);
            return;
        }
        const trimmed = memberInput.trim();
        if (trimmed.length < 2) {
            setMemberSuggestions([]);
            setMemberSearchLoading(false);
            return;
        }
        let isActive = true;
        setMemberSearchLoading(true);
        const debounce = setTimeout(() => {
            searchUsers(trimmed)
                .then((results) => {
                    if (!isActive) return;
                    setMemberSuggestions(results);
                })
                .catch(() => {
                    if (!isActive) return;
                    setMemberSuggestions([]);
                })
                .finally(() => {
                    if (!isActive) return;
                    setMemberSearchLoading(false);
                });
        }, 250);
        return () => {
            isActive = false;
            clearTimeout(debounce);
        };
    }, [memberDialogVisible, memberInput]);

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
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
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
            <ScrollView
                contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom + 16, 36) }]}
            >
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
                                                    router.push(`/(main)/training/groups/${group.id}/edit`)
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
                                    <Text style={styles.sectionTitle}>Séances partagées</Text>
                                    <Text style={styles.sectionHint}>
                                        {sessions.length > 0
                                            ? `${sessions.length} publication${sessions.length > 1 ? "s" : ""}`
                                            : "Aucune séance programmée"}
                                    </Text>
                                </View>
                                {isOwner ? (
                                    <Pressable
                                        style={styles.primaryButton}
                                        accessibilityRole="button"
                                        onPress={handlePublishSession}
                                    >
                                        <MaterialCommunityIcons name="plus" size={12} color="#010b14" />
                                    </Pressable>
                                ) : null}
                            </View>
                            <View style={styles.sectionDivider} />
                            {sessionsLoading ? (
                                <View style={styles.loadingInline}>
                                    <ActivityIndicator color="#22d3ee" />
                                </View>
                            ) : sessionsError ? (
                                <Text style={styles.emptyState}>{sessionsError}</Text>
                            ) : sessions.length === 0 ? (
                                <Text style={styles.emptyState}>
                                    {isOwner
                                        ? "Publiez votre première séance pour dynamiser ce groupe."
                                        : "Le coach n'a pas encore partagé de séance."}
                                </Text>
                            ) : (
                                <>
                                    <View style={styles.timeframeSwitcher}>
                                        {TIMEFRAME_OPTIONS.map((option) => {
                                            const isActive = timeframe === option.key;
                                            const count = groupedSessions[option.key].length;
                                            return (
                                                <Pressable
                                                    key={option.key}
                                                    style={[styles.timeframeChip, isActive && styles.timeframeChipActive]}
                                                    accessibilityRole="button"
                                                    onPress={() => setTimeframe(option.key)}
                                                >
                                                    <MaterialCommunityIcons
                                                        name={option.icon}
                                                        size={12}
                                                        color={isActive ? "#010617" : "#38bdf8"}
                                                    />
                                                    <View style={styles.timeframeChipLabels}>
                                                        <Text
                                                            style={[styles.timeframeChipLabel, isActive && styles.timeframeChipLabelActive]}
                                                        >
                                                            {option.label}
                                                        </Text>
                                                        <Text
                                                            style={[styles.timeframeChipCount, isActive && styles.timeframeChipCountActive]}
                                                        >
                                                            {count} séance{count > 1 ? "s" : ""}
                                                        </Text>
                                                    </View>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                    <View style={styles.timeframeSectionHeader}>
                                        <View>
                                            <Text style={styles.timeframeSectionTitle}>{timeframeTitle}</Text>
                                        </View>
                                        <View style={styles.timeframeCountPill}>
                                            <Text style={styles.timeframeCountNumber}>{filteredSessions.length}</Text>
                                            <Text style={styles.timeframeCountLabel}>
                                                séance{filteredSessions.length > 1 ? "s" : ""}
                                            </Text>
                                        </View>
                                    </View>
                                    {filteredSessions.length ? (
                                        <View style={styles.sessionList}>
                                            {filteredSessions.map((session) => {
                                                const sessionOwnerId = getSessionOwnerId(session);
                                                const ownsSession = sessionOwnerId === currentUserId;
                                                const hasConfirmed = userHasConfirmedSession(session, currentUserId);
                                                const isLockedSession = isSessionLocked(session.status);
                                                const canJoinSession = !isLockedSession && !ownsSession && !hasConfirmed;
                                                const canLeaveSession = !isLockedSession && !ownsSession && hasConfirmed;
                                                const isMutating = Boolean(sessionMutationIds[session.id]);
                                                const canDetachSession = Boolean(isOwner && sessionOwnerId === ownerId);
                                                const isRemovingSession = Boolean(sessionRemovalIds[session.id]);
                                                return (
                                                    <View key={session.id} style={styles.sessionCardWrapper}>
                                                        <TrainingSessionCard
                                                            session={session}
                                                            currentUserId={currentUserId}
                                                            onPress={() => handleOpenSession(session.id)}
                                                        />
                                                        {canDetachSession ? (
                                                            <Pressable
                                                                style={({ pressed }) => [
                                                                    styles.sessionDetachButton,
                                                                    pressed && styles.sessionDetachButtonPressed,
                                                                    isRemovingSession && styles.sessionDetachButtonDisabled,
                                                                ]}
                                                                accessibilityRole="button"
                                                                onPress={() =>
                                                                    confirmDetachGroupSession(session.id, session.title)
                                                                }
                                                                disabled={isRemovingSession}
                                                            >
                                                                {isRemovingSession ? (
                                                                    <ActivityIndicator size="small" color="#fecaca" />
                                                                ) : (
                                                                    <>
                                                                        <MaterialCommunityIcons
                                                                            name="trash-can"
                                                                            size={16}
                                                                            color="#fecaca"
                                                                        />
                                                                        <Text style={styles.sessionDetachButtonLabel}>Retirer</Text>
                                                                    </>
                                                                )}
                                                            </Pressable>
                                                        ) : null}
                                                        {canJoinSession ? (
                                                            <Pressable
                                                                style={[
                                                                    styles.sessionJoinButton,
                                                                    isMutating && styles.sessionJoinButtonDisabled,
                                                                ]}
                                                                accessibilityRole="button"
                                                                onPress={() => handleJoinSession(session.id)}
                                                                disabled={isMutating}
                                                            >
                                                                {isMutating ? (
                                                                    <ActivityIndicator color="#02131d" />
                                                                ) : (
                                                                    <>
                                                                        <MaterialCommunityIcons
                                                                            name="hand-back-left"
                                                                            size={16}
                                                                            color="#02131d"
                                                                        />
                                                                        <Text style={styles.sessionJoinButtonLabel}>
                                                                            Je participe
                                                                        </Text>
                                                                    </>
                                                                )}
                                                            </Pressable>
                                                        ) : canLeaveSession ? (
                                                            <Pressable
                                                                style={[
                                                                    styles.sessionLeaveButton,
                                                                    isMutating && styles.sessionJoinButtonDisabled,
                                                                ]}
                                                                accessibilityRole="button"
                                                                onPress={() => handleLeaveSession(session.id)}
                                                                disabled={isMutating}
                                                            >
                                                                {isMutating ? (
                                                                    <ActivityIndicator color="#fca5a5" />
                                                                ) : (
                                                                    <>
                                                                        <MaterialCommunityIcons
                                                                            name="account-cancel"
                                                                            size={16}
                                                                            color="#fecaca"
                                                                        />
                                                                        <Text style={styles.sessionLeaveButtonLabel}>
                                                                            Je me désinscris
                                                                        </Text>
                                                                    </>
                                                                )}
                                                            </Pressable>
                                                        ) : null}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    ) : (
                                        <View style={styles.timeframeEmptyState}>
                                            <MaterialCommunityIcons
                                                name="emoticon-neutral-outline"
                                                size={22}
                                                color="#94a3b8"
                                            />
                                            <Text style={styles.timeframeEmptyTitle}>Aucune séance ici</Text>
                                            <Text style={styles.timeframeEmptySubtitle}>
                                                Essayez une autre période ou créez un nouveau rendez-vous.
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>

                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <View>
                                    <Text style={styles.sectionTitle}>Membres</Text>
                                    <Text style={styles.sectionHint}>
                                        {group.membersCount} profil{group.membersCount > 1 ? "s" : ""} visibles
                                    </Text>
                                </View>
                                {isOwner ? (
                                    <Pressable
                                        style={({ pressed }) => [
                                            styles.memberActionButton,
                                            pressed && styles.memberActionButtonPressed,
                                        ]}
                                        accessibilityRole="button"
                                        onPress={handleOpenMemberDialog}
                                    >
                                        <MaterialCommunityIcons name="account-plus" size={16} color="#010617" />
                                        <Text style={styles.memberActionButtonLabel}>Ajouter</Text>
                                    </Pressable>
                                ) : null}
                            </View>
                            <View style={styles.sectionDivider} />
                            {members.length === 0 ? (
                                <Text style={styles.emptyState}>Aucun membre visible pour le moment.</Text>
                            ) : (
                                members.map((member) => {
                                    const canRemoveMember = Boolean(isOwner && member.id && member.id !== ownerId);
                                    const isRemovingMember = Boolean(member.id && removingMemberIds[member.id]);
                                    const label = member.fullName || member.username;
                                    return (
                                        <MemberCard
                                            key={member.id}
                                            member={member}
                                            isCreator={member.id === ownerId}
                                            isCurrentUser={member.id === currentUserId}
                                            canRemove={canRemoveMember}
                                            isRemoving={isRemovingMember}
                                            returnPath={groupReturnPath}
                                            onRemove={
                                                canRemoveMember && member.id
                                                    ? () => confirmRemoveMember(member.id, label)
                                                    : undefined
                                            }
                                        />
                                    );
                                })
                            )}
                        </View>
                    </>
                ) : !loading ? (
                    <Text style={styles.emptyState}>Impossible de retrouver ce groupe.</Text>
                ) : null}
            </ScrollView>
            <Portal>
                <Dialog visible={sessionPickerVisible} onDismiss={closeSessionPicker}>
                    <Dialog.Content>
                        {sessionPickerLoading ? (
                            <View style={styles.sessionPickerLoading}>
                                <ActivityIndicator color="#22d3ee" />
                            </View>
                        ) : sessionPickerError ? (
                            <Text style={styles.sessionPickerError}>{sessionPickerError}</Text>
                        ) : shareableSessions.length ? (
                            <ScrollView style={styles.sessionPickerList}>
                                <View style={styles.sessionPickerListContent}>
                                    {shareableSessions.map((session) => {
                                        const isPublishing = sessionPublishingId === session.id;
                                        return (
                                            <Pressable
                                                key={session.id}
                                                style={({ pressed }) => [
                                                    styles.sessionOptionRow,
                                                    pressed && styles.sessionOptionRowPressed,
                                                ]}
                                                onPress={() => handleAttachExistingSession(session.id)}
                                                disabled={isPublishing}
                                            >
                                                <View style={styles.sessionOptionMeta}>
                                                    <Text style={styles.sessionOptionTitle}>{session.title}</Text>
                                                    <Text style={styles.sessionOptionSubtitle}>
                                                        {formatDisplayDate(session.date)}
                                                    </Text>
                                                </View>
                                                {isPublishing ? (
                                                    <ActivityIndicator size="small" color="#22d3ee" />
                                                ) : (
                                                    <Text style={styles.sessionOptionAction}>Ajouter</Text>
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        ) : (
                            <Text style={styles.sessionPickerEmpty}>
                                {ownedSessions.length
                                    ? "Toutes vos séances sont déjà partagées dans un groupe."
                                    : "Vous n'avez pas encore créé de séance."}
                            </Text>
                        )}
                        <Pressable
                            style={({ pressed }) => [
                                styles.sessionCreateButton,
                                pressed && styles.sessionCreateButtonPressed,
                            ]}
                            onPress={handleCreateNewSession}
                        >
                            <MaterialCommunityIcons name="plus-circle-outline" size={16} color="#010617" />
                            <Text style={styles.sessionCreateButtonLabel}>Créer une nouvelle séance</Text>
                        </Pressable>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={closeSessionPicker} disabled={Boolean(sessionPublishingId)} textColor="#94a3b8">
                            Fermer
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            <Portal>
                <Dialog visible={memberDialogVisible} onDismiss={closeMemberDialog}>
                    <Dialog.Title>Ajouter un membre</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Rechercher un athlète"
                            value={memberInput}
                            onChangeText={(value) => {
                                setMemberInput(value);
                                setSelectedMember(null);
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            mode="outlined"
                            style={styles.memberDialogInput}
                            placeholder="Nom, pseudo ou identifiant"
                            returnKeyType="done"
                            onSubmitEditing={handleAddMember}
                            disabled={memberSaving}
                        />
                        {memberInput.trim().length >= 2 ? (
                            <View style={styles.memberSuggestionList}>
                                {memberSearchLoading ? (
                                    <View style={styles.memberSuggestionLoading}>
                                        <ActivityIndicator color="#22d3ee" />
                                    </View>
                                ) : memberSuggestions.length ? (
                                    memberSuggestions.map((suggestion, index) => {
                                        const suggestionPhotoUri = getMemberPhotoUri(suggestion.photoUrl);
                                        const suggestionLabel = suggestion.fullName || suggestion.username || "Athlète";
                                        return (
                                            <Pressable
                                                key={suggestion.id}
                                                style={({ pressed }) => [
                                                    styles.memberSuggestionRow,
                                                    index === memberSuggestions.length - 1 && styles.memberSuggestionRowLast,
                                                    pressed && styles.memberSuggestionRowPressed,
                                                ]}
                                                onPress={() => handleSelectMemberSuggestion(suggestion)}
                                            >
                                                {suggestionPhotoUri ? (
                                                    <Avatar.Image
                                                        size={32}
                                                        source={{ uri: suggestionPhotoUri }}
                                                        style={[styles.memberSuggestionAvatar, styles.memberSuggestionAvatarImage]}
                                                    />
                                                ) : (
                                                    <Avatar.Text
                                                        size={32}
                                                        label={suggestionLabel.slice(0, 2).toUpperCase()}
                                                        style={styles.memberSuggestionAvatar}
                                                    />
                                                )}
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.memberSuggestionName}>{suggestionLabel}</Text>
                                                    {suggestion.username ? (
                                                        <Text style={styles.memberSuggestionHandle}>@{suggestion.username}</Text>
                                                    ) : null}
                                                </View>
                                            </Pressable>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.memberSuggestionEmpty}>Aucun athlète trouvé.</Text>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.memberDialogHint}>Tapez au moins 2 lettres pour lancer la recherche.</Text>
                        )}
                        <Text style={[styles.memberDialogHint, { marginTop: 8 }]}>
                            L'athlète peut aussi fournir son identifiant unique.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={closeMemberDialog} disabled={memberSaving} textColor="#94a3b8">
                            Annuler
                        </Button>
                        <Button onPress={handleAddMember} loading={memberSaving} disabled={memberSaving}>
                            Ajouter
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
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
    canRemove?: boolean;
    onRemove?: () => void;
    isRemoving?: boolean;
    returnPath?: string;
};

const MemberCard = ({ member, isCreator, isCurrentUser, canRemove, onRemove, isRemoving, returnPath }: MemberCardProps) => {
    const router = useRouter();
    const displayName = member.fullName || member.username || "Membre";
    const subtitle = member.username && member.fullName ? `@${member.username}` : member.username ? `@${member.username}` : undefined;
    const date = member.joinedAt ? new Date(member.joinedAt).toLocaleDateString("fr-FR") : undefined;
    const avatarInitial = displayName.charAt(0).toUpperCase();
    const showSelfBadge = isCurrentUser && !isCreator;
    const showBadges = isCreator || showSelfBadge;
    const photoUri = getMemberPhotoUri(member.photoUrl);
    const navigateToProfile = useCallback(() => {
        if (!member.id) return;
        if (isCurrentUser) {
            router.push("/(main)/user-profile");
            return;
        }
        const profilePath = `/(main)/profiles/${member.id}`;
        if (returnPath) {
            router.push({ pathname: profilePath, params: { from: returnPath } });
        } else {
            router.push(profilePath);
        }
    }, [isCurrentUser, member.id, returnPath, router]);

    return (
        <Pressable
            style={({ pressed }) => [
                styles.memberCard,
                member.id && styles.memberCardInteractive,
                pressed && member.id && styles.memberCardPressed,
            ]}
            accessibilityRole={member.id ? "button" : undefined}
            onPress={member.id ? navigateToProfile : undefined}
            disabled={!member.id}
        >
            {photoUri ? (
                <Avatar.Image
                    size={42}
                    source={{ uri: photoUri }}
                    style={[styles.memberAvatarFallback, styles.memberAvatarImage]}
                />
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
                {canRemove ? (
                    <Pressable
                        style={({ pressed }) => [
                            styles.memberRemoveButton,
                            pressed && styles.memberRemoveButtonPressed,
                            isRemoving && styles.memberRemoveButtonDisabled,
                        ]}
                        accessibilityRole="button"
                        onPress={(event) => {
                            event.stopPropagation();
                            if (!isRemoving && onRemove) {
                                onRemove();
                            }
                        }}
                        disabled={isRemoving || !onRemove}
                    >
                        {isRemoving ? (
                            <ActivityIndicator size="small" color="#fecaca" />
                        ) : (
                            <MaterialCommunityIcons name="account-remove" size={16} color="#fca5a5" />
                        )}
                    </Pressable>
                ) : null}
                {showBadges ? (
                    <View style={styles.memberBadgeRow}>
                        {isCreator ? (
                            <View style={[styles.memberPill, styles.memberPillOwner]}>
                                <Text style={[styles.memberPillText, styles.memberPillTextDark]}>Coach</Text>
                            </View>
                        ) : null}
                        {showSelfBadge ? (
                            <View style={[styles.memberPill, styles.memberPillSelf]}>
                                <Text style={styles.memberPillText}>Vous</Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </Pressable>
    );
};

function getParticipantUserId(value?: SessionParticipant["user"]) {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    return value.id || value._id;
}

function getSessionOwnerId(session: TrainingSession) {
    const ownerRef = (session.athlete || session.athleteId) as SessionParticipant["user"] | undefined;
    return getParticipantUserId(ownerRef);
}

function userHasConfirmedSession(session: TrainingSession, userId?: string | null) {
    if (!userId) return false;
    if (getSessionOwnerId(session) === userId) return true;
    return (
        session.participants?.some(
            (participant) => getParticipantUserId(participant.user) === userId && (participant.status ?? "confirmed") === "confirmed"
        ) || false
    );
}

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
        width: "100%",
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
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#22d3ee",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        shadowColor: "#22d3ee",
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    primaryButtonLabel: {
        color: "#010b14",
        fontFamily: "SpaceGrotesk_700Bold",
        fontSize: 5,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    sectionTitle: {
        color: "#f8fafc",
        fontSize: 14,
        fontFamily: "SpaceGrotesk_700Bold",
    },
    sectionHint: {
        color: "#94a3b8",
        fontSize: 12,
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
    sessionList: {
        width: "100%",
        gap: 16,
    },
    sessionCardWrapper: {
        width: "100%",
    },
    timeframeSwitcher: {
        flexDirection: "row",
        gap: 10,
        marginTop: 4,
    },
    timeframeChip: {
        flex: 1,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(45,212,191,0.3)",
        backgroundColor: "rgba(15,118,110,0.12)",
        paddingVertical: 5,
        paddingHorizontal: 2,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    timeframeChipActive: {
        backgroundColor: "#2dd4bf",
        borderColor: "#2dd4bf",
    },
    timeframeChipLabels: {
        flex: 1,
    },
    timeframeChipLabel: {
        color: "#94a3b8",
        fontSize: 8,
        fontFamily: "SpaceGrotesk_600SemiBold",
        letterSpacing: 0.5,
    },
    timeframeChipLabelActive: {
        color: "#02131d",
    },
    timeframeChipCount: {
        color: "#a5f3fc",
        fontSize: 10,
        fontFamily: "SpaceGrotesk_500Medium",
    },
    timeframeChipCountActive: {
        color: "#02131d",
    },
    timeframeSectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 16,
        marginBottom: 4,
        gap: 12,
    },
    timeframeSectionTitle: {
        color: "#f8fafc",
        fontSize: 15,
        fontFamily: "SpaceGrotesk_700Bold",
    },
    timeframeSectionDescription: {
        color: "#94a3b8",
        fontSize: 12,
        fontFamily: "SpaceGrotesk_400Regular",
        marginTop: 2,
    },
    timeframeCountPill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.4)",
        backgroundColor: "rgba(15,23,42,0.5)",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 72,
    },
    timeframeCountNumber: {
        color: "#f8fafc",
        fontSize: 16,
        fontFamily: "SpaceGrotesk_700Bold",
        lineHeight: 18,
    },
    timeframeCountLabel: {
        color: "#94a3b8",
        fontSize: 11,
        fontFamily: "SpaceGrotesk_400Regular",
    },
    timeframeEmptyState: {
        marginTop: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        padding: 18,
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(15,23,42,0.5)",
    },
    timeframeEmptyTitle: {
        color: "#f8fafc",
        fontFamily: "SpaceGrotesk_600SemiBold",
    },
    timeframeEmptySubtitle: {
        color: "#94a3b8",
        fontSize: 12,
        textAlign: "center",
    },
    sessionDetachButton: {
        alignSelf: "flex-end",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "rgba(248,113,113,0.12)",
        borderWidth: 1,
        borderColor: "rgba(248,113,113,0.35)",
    },
    sessionDetachButtonPressed: {
        opacity: 0.85,
    },
    sessionDetachButtonDisabled: {
        opacity: 0.55,
    },
    sessionDetachButtonLabel: {
        color: "#fecaca",
        fontSize: 11,
        fontFamily: "SpaceGrotesk_600SemiBold",
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
    sessionPickerLoading: {
        paddingVertical: 16,
        alignItems: "center",
    },
    sessionPickerError: {
        color: "#f87171",
        fontFamily: "SpaceGrotesk_500Medium",
        marginVertical: 8,
    },
    sessionPickerList: {
        marginTop: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        backgroundColor: "rgba(2,6,23,0.95)",
        maxHeight: 260,
        overflow: "hidden",
    },
    sessionPickerListContent: {
        paddingVertical: 4,
    },
    sessionOptionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(148,163,184,0.15)",
        gap: 12,
    },
    sessionOptionRowPressed: {
        backgroundColor: "rgba(34,211,238,0.08)",
    },
    sessionOptionMeta: {
        flex: 1,
    },
    sessionOptionTitle: {
        color: "#f8fafc",
        fontFamily: "SpaceGrotesk_600SemiBold",
        fontSize: 13,
    },
    sessionOptionSubtitle: {
        color: "#94a3b8",
        fontSize: 11,
        marginTop: 2,
    },
    sessionOptionAction: {
        color: "#22d3ee",
        fontFamily: "SpaceGrotesk_600SemiBold",
        fontSize: 12,
        textTransform: "uppercase",
    },
    sessionPickerEmpty: {
        color: "#94a3b8",
        fontFamily: "SpaceGrotesk_400Regular",
        marginTop: 8,
        textAlign: "center",
    },
    sessionCreateButton: {
        marginTop: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#22d3ee",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        alignSelf: "center",
        shadowColor: "#22d3ee",
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    sessionCreateButtonPressed: {
        opacity: 0.9,
    },
    sessionCreateButtonLabel: {
        color: "#010617",
        fontFamily: "SpaceGrotesk_700Bold",
        fontSize: 12,
        letterSpacing: 0.4,
    },
    sessionJoinButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: "#22d3ee",
        shadowColor: "#22d3ee",
        shadowOpacity: 0.45,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 10,
    },
    sessionJoinButtonDisabled: {
        opacity: 0.55,
    },
    sessionJoinButtonLabel: {
        color: "#03131f",
        fontFamily: "SpaceGrotesk_700Bold",
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    sessionLeaveButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: "rgba(239,68,68,0.12)",
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.45)",
    },
    sessionLeaveButtonLabel: {
        color: "#fecaca",
        fontFamily: "SpaceGrotesk_600SemiBold",
        fontSize: 14,
    },
    memberCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 2,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(148,163,184,0.15)",
    },
    memberCardInteractive: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 18,
        marginHorizontal: -4,
    },
    memberCardPressed: {
        backgroundColor: "rgba(15,23,42,0.45)",
    },
    memberAvatarFallback: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "rgba(34,211,238,0.18)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.35)",
    },
    memberAvatarImage: {
        backgroundColor: "rgba(2,6,23,0.4)",
    },
    memberAvatarInitial: {
        color: "#f8fafc",
        fontFamily: "SpaceGrotesk_600SemiBold",
        fontSize: 14,
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
        fontSize: 12,
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
        fontSize: 10,
        fontFamily: "SpaceGrotesk_500Medium",
    },
    memberActionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#22d3ee",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        shadowColor: "#22d3ee",
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    memberActionButtonPressed: {
        opacity: 0.9,
    },
    memberActionButtonLabel: {
        color: "#010617",
        fontFamily: "SpaceGrotesk_700Bold",
        fontSize: 12,
    },
    memberRemoveButton: {
        padding: 6,
        borderRadius: 999,
        backgroundColor: "rgba(248,113,113,0.08)",
        borderWidth: 1,
        borderColor: "rgba(248,113,113,0.35)",
        marginTop: 4,
    },
    memberRemoveButtonPressed: {
        opacity: 0.85,
    },
    memberRemoveButtonDisabled: {
        opacity: 0.5,
    },
    memberDialogInput: {
        marginBottom: 8,
        backgroundColor: "#010617",
    },
    memberDialogHint: {
        color: "#94a3b8",
        fontSize: 12,
        marginTop: 8,
    },
    memberSuggestionList: {
        marginTop: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.3)",
        backgroundColor: "rgba(2,6,23,0.9)",
        overflow: "hidden",
    },
    memberSuggestionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(15,23,42,0.5)",
    },
    memberSuggestionRowLast: {
        borderBottomWidth: 0,
    },
    memberSuggestionRowPressed: {
        backgroundColor: "rgba(34,211,238,0.08)",
    },
    memberSuggestionName: {
        color: "#f8fafc",
        fontSize: 13,
        fontFamily: "SpaceGrotesk_600SemiBold",
    },
    memberSuggestionHandle: {
        color: "#94a3b8",
        fontSize: 11,
        fontFamily: "SpaceGrotesk_400Regular",
    },
    memberSuggestionEmpty: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: "#94a3b8",
        fontSize: 12,
        textAlign: "center",
    },
    memberSuggestionLoading: {
        padding: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    memberSuggestionAvatar: {
        backgroundColor: "rgba(34,211,238,0.2)",
    },
    memberSuggestionAvatarImage: {
        backgroundColor: "rgba(2,6,23,0.35)",
    },
});
