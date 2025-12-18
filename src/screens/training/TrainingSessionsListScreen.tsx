import React, { useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { TrainingSessionScope, useTrainingSessionsList } from "../../hooks/useTrainingSessionsList";
import { useAuth } from "../../context/AuthContext";
import TrainingSessionCard from "../../components/training/TrainingSessionCard";

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
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
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
                        <TrainingSessionCard
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
