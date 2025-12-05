import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ProfileStats from "../../src/components/profile/ProfileStats";
import ProfilePerformanceTimeline from "../../src/components/profile/ProfilePerformanceTimeline";
import { useAuth } from "../../src/context/AuthContext";

export default function ProfileStatsScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const disciplines = useMemo(() => {
        const set = new Set<string>();
        user?.performanceTimeline?.forEach((point) => {
            if (point.discipline) set.add(point.discipline);
        });
        if (user?.mainDiscipline && !set.has(user.mainDiscipline)) set.add(user.mainDiscipline);
        return Array.from(set);
    }, [user?.performanceTimeline, user?.mainDiscipline]);

    const [selectedDiscipline, setSelectedDiscipline] = useState<string | undefined>(() => disciplines[0]);

    useEffect(() => {
        if (disciplines.length === 0) {
            setSelectedDiscipline(undefined);
            return;
        }
        if (!selectedDiscipline || !disciplines.includes(selectedDiscipline)) {
            setSelectedDiscipline(disciplines[0]);
        }
    }, [disciplines, selectedDiscipline]);

    if (!user) return null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.replace("/(main)/user-profile")} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={22} color="#e2e8f0" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>Performances</Text>
                        <Text style={styles.subtitle}>Toutes tes stats Track&Field</Text>
                    </View>
                </View>

                <ProfileStats user={user} />
                {disciplines.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.disciplineChips}
                        style={styles.disciplineChipsWrapper}
                    >
                        {disciplines.map((discipline) => {
                            const isActive = selectedDiscipline === discipline;
                            return (
                                <TouchableOpacity
                                    key={discipline}
                                    style={[styles.disciplineChip, isActive && styles.disciplineChipActive]}
                                    onPress={() => setSelectedDiscipline(discipline)}
                                >
                                    <Text style={[styles.disciplineChipText, isActive && styles.disciplineChipTextActive]}>
                                        {discipline}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}

                {selectedDiscipline ? (
                    <ProfilePerformanceTimeline
                        timeline={user.performanceTimeline}
                        discipline={selectedDiscipline}
                        title={`Progression ${selectedDiscipline}`}
                    />
                ) : (
                    <View style={styles.emptyDisciplineBox}>
                        <Text style={styles.emptyDisciplineText}>Aucune performance disponible pour afficher la progression.</Text>
                    </View>
                )}
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
        padding: 18,
        paddingBottom: 80,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
        gap: 14,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(15,23,42,0.7)",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#f8fafc",
    },
    subtitle: {
        color: "#94a3b8",
        fontSize: 14,
    },
    disciplineChipsWrapper: {
        marginBottom: 16,
    },
    disciplineChips: {
        paddingRight: 24,
    },
    disciplineChip: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.4)",
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 10,
        backgroundColor: "rgba(15,23,42,0.4)",
    },
    disciplineChipActive: {
        backgroundColor: "#22d3ee",
        borderColor: "#22d3ee",
    },
    disciplineChipText: {
        color: "#cbd5e1",
        fontWeight: "600",
        fontSize: 13,
    },
    disciplineChipTextActive: {
        color: "#02131d",
    },
    emptyDisciplineBox: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: "rgba(15,23,42,0.4)",
    },
    emptyDisciplineText: {
        color: "#cbd5e1",
        textAlign: "center",
    },
});
