import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ProfileStats from "../../src/components/profile/ProfileStats";
import ProfilePerformanceTimeline from "../../src/components/profile/ProfilePerformanceTimeline";
import { useAuth } from "../../src/context/AuthContext";
import { DISCIPLINE_GROUPS, type DisciplineGroup } from "../../src/constants/disciplineGroups";

export default function ProfileStatsScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const userDisciplines = useMemo(() => {
        const set = new Set<string>();
        user?.performanceTimeline?.forEach((point) => {
            if (point.discipline) set.add(point.discipline);
        });
        user?.performances?.forEach((perf) => {
            if (perf.epreuve) set.add(perf.epreuve);
        });
        if (user?.mainDiscipline) set.add(user.mainDiscipline);
        return Array.from(set);
    }, [user?.performanceTimeline, user?.performances, user?.mainDiscipline]);

    const groupedDisciplines = useMemo<DisciplineGroup[]>(() => {
        const disciplineSet = new Set(userDisciplines);
        return DISCIPLINE_GROUPS.map((group) => ({
            ...group,
            disciplines: group.disciplines.filter((name) => disciplineSet.has(name)),
        }));
    }, [userDisciplines]);

    const firstGroupWithData = useMemo(
        () => groupedDisciplines.find((group) => group.disciplines.length > 0),
        [groupedDisciplines]
    );

    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
        () => firstGroupWithData?.id ?? groupedDisciplines[0]?.id
    );
    const [selectedDiscipline, setSelectedDiscipline] = useState<string | undefined>(
        () => firstGroupWithData?.disciplines[0]
    );

    useEffect(() => {
        if (groupedDisciplines.length === 0) {
            setSelectedCategory(undefined);
            setSelectedDiscipline(undefined);
            return;
        }

        const fallbackCategory =
            groupedDisciplines.find((group) => group.id === selectedCategory)?.id ?? firstGroupWithData?.id ?? groupedDisciplines[0]?.id;

        const activeCategory = groupedDisciplines.find((group) => group.id === fallbackCategory);

        if (!activeCategory) {
            setSelectedCategory(undefined);
            setSelectedDiscipline(undefined);
            return;
        }

        if (selectedCategory !== activeCategory.id) {
            setSelectedCategory(activeCategory.id);
        }

        if (activeCategory.disciplines.length === 0) {
            if (selectedDiscipline !== undefined) {
                setSelectedDiscipline(undefined);
            }
            return;
        }

        if (!selectedDiscipline || !activeCategory.disciplines.includes(selectedDiscipline)) {
            setSelectedDiscipline(activeCategory.disciplines[0]);
        }
    }, [groupedDisciplines, firstGroupWithData, selectedCategory, selectedDiscipline]);

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

                {groupedDisciplines.length > 0 && (
                    <>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.disciplineChips}
                            style={styles.disciplineChipsWrapper}
                        >
                            {groupedDisciplines.map((group) => {
                                const isActive = selectedCategory === group.id;
                                return (
                                    <TouchableOpacity
                                        key={group.id}
                                        style={[
                                            styles.categoryChip,
                                            isActive && styles.categoryChipActive,
                                            group.disciplines.length === 0 && styles.categoryChipDisabled,
                                        ]}
                                        onPress={() => {
                                            setSelectedCategory(group.id);
                                            setSelectedDiscipline(group.disciplines[0] ?? undefined);
                                        }}
                                    >
                                        <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                                            {group.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {(() => {
                            const selectedGroup = groupedDisciplines.find((group) => group.id === selectedCategory);
                            if (!selectedGroup || selectedGroup.disciplines.length === 0) {
                                return (
                                    <View style={[styles.emptyDisciplineBox, styles.emptyDisciplineCompact]}>
                                        <Text style={styles.emptyDisciplineText}>
                                            Aucune discipline enregistrée pour cette famille.
                                        </Text>
                                    </View>
                                );
                            }

                            return (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.disciplineChips}
                                    style={styles.disciplineChipsWrapper}
                                >
                                    {selectedGroup.disciplines.map((discipline) => {
                                        const isActive = selectedDiscipline === discipline;
                                        return (
                                            <TouchableOpacity
                                                key={discipline}
                                                style={[styles.disciplineChip, isActive && styles.disciplineChipActive]}
                                                onPress={() => setSelectedDiscipline(discipline)}
                                            >
                                                <Text
                                                    style={[styles.disciplineChipText, isActive && styles.disciplineChipTextActive]}
                                                >
                                                    {discipline}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            );
                        })()}
                    </>
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
        marginBottom: 12,
    },
    disciplineChips: {
        paddingRight: 24,
    },
    categoryChip: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.4)",
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 10,
        backgroundColor: "rgba(15,23,42,0.3)",
    },
    categoryChipActive: {
        backgroundColor: "#22d3ee",
        borderColor: "#22d3ee",
    },
    categoryChipText: {
        color: "#cbd5e1",
        fontWeight: "600",
        fontSize: 13,
    },
    categoryChipTextActive: {
        color: "#02131d",
    },
    categoryChipDisabled: {
        opacity: 0.45,
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
    emptyDisciplineCompact: {
        marginBottom: 12,
        paddingVertical: 12,
    },
});
