import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, StyleSheet, View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import { PerformancePoint } from "../../types/User";
import { colors } from "../../styles/theme";
import {
    DisciplineMetricMeta,
    DisciplineTimelinePoint,
    getDisciplineMetricMeta,
    getDisciplineTimeline,
} from "../../utils/performance";

const CHART_HEIGHT = 160;
const CHART_WIDTH = Math.max(Dimensions.get("window").width - 64, 220);
const CHART_PADDING_X = 12;
const CHART_PADDING_TOP = 26;
const CHART_PADDING_BOTTOM = 12;

type Props = {
    timeline?: PerformancePoint[];
    discipline: string;
    title?: string;
};

type ChartMetrics = {
    linePath: string;
    areaPath: string;
    markerPoints: { x: number; y: number }[];
};

const buildChartMetrics = (points: DisciplineTimelinePoint[]): ChartMetrics => {
    if (points.length === 0) {
        return { linePath: "", areaPath: "", markerPoints: [] };
    }

    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const innerWidth = CHART_WIDTH - CHART_PADDING_X * 2;
    const chartTop = CHART_PADDING_TOP;
    const chartBottom = CHART_HEIGHT - CHART_PADDING_BOTTOM;
    const innerHeight = chartBottom - chartTop;

    const getX = (index: number) =>
        CHART_PADDING_X + (innerWidth * (points.length === 1 ? 0.5 : index / (points.length - 1)));
    const getY = (value: number) => chartBottom - ((value - min) / range) * innerHeight;

    let linePath = "";
    let areaPath = "";
    const markerPoints: { x: number; y: number }[] = [];

    points.forEach((point, index) => {
        const x = getX(index);
        const y = getY(point.value);
        markerPoints.push({ x, y });

        if (index === 0) {
            linePath = `M ${x} ${y}`;
            areaPath = `M ${x} ${y}`;
            return;
        }

        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
    });

    const lastX = getX(points.length - 1);
    const baseY = CHART_HEIGHT - CHART_PADDING_BOTTOM;
    areaPath += ` L ${lastX} ${baseY} L ${CHART_PADDING_X} ${baseY} Z`;

    return { linePath, areaPath, markerPoints };
};

const formatDelta = (points: DisciplineTimelinePoint[], meta: DisciplineMetricMeta) => {
    if (points.length < 2) return null;
    const first = points[0].value;
    const last = points[points.length - 1].value;
    const delta = meta.kind === "distance" || meta.kind === "points" ? last - first : first - last;
    if (Math.abs(delta) < meta.deltaThreshold) return "Stable";
    const sign = meta.kind === "distance" || meta.kind === "points" ? (delta > 0 ? "+" : "-") : delta > 0 ? "-" : "+";
    const formattedDelta = meta.formatValue(Math.abs(delta), "compact");
    return `${sign}${formattedDelta} vs début`;
};

export default function ProfilePerformanceTimeline({ timeline, discipline, title }: Props) {
    const baseTimeline = useMemo(() => getDisciplineTimeline(timeline, discipline), [timeline, discipline]);
    const metricMeta = useMemo(() => getDisciplineMetricMeta(discipline), [discipline]);

    const availableYears = useMemo(() => {
        const uniqueYears = Array.from(new Set(baseTimeline.map((point) => point.year))).filter(Boolean);
        return uniqueYears.sort((a, b) => b.localeCompare(a));
    }, [baseTimeline]);

    const [selectedYear, setSelectedYear] = useState<string>("all");

    useEffect(() => {
        setSelectedYear("all");
    }, [discipline]);

    useEffect(() => {
        if (selectedYear === "all") return;
        if (!availableYears.includes(selectedYear)) {
            setSelectedYear(availableYears[0] ?? "all");
        }
    }, [availableYears, selectedYear]);

    const yearFilteredTimeline = useMemo(() => {
        if (selectedYear === "all") return baseTimeline;
        return baseTimeline.filter((point) => point.year === selectedYear);
    }, [baseTimeline, selectedYear]);

    const isCondensedAllYears = selectedYear === "all" && baseTimeline.length > 10;

    const displayTimeline = useMemo(() => {
        if (!isCondensedAllYears) return yearFilteredTimeline;
        const bestByYear = new Map<string, DisciplineTimelinePoint>();
        baseTimeline.forEach((point) => {
            if (!point.year) return;
            const current = bestByYear.get(point.year);
            if (!current) {
                bestByYear.set(point.year, point);
                return;
            }
            const shouldReplace = metricMeta.direction === "lower" ? point.value < current.value : point.value > current.value;
            if (shouldReplace) {
                bestByYear.set(point.year, point);
            }
        });
        return Array.from(bestByYear.values()).sort((a, b) => a.timestamp - b.timestamp);
    }, [baseTimeline, yearFilteredTimeline, isCondensedAllYears, metricMeta.direction]);

    const chartMetrics = useMemo(() => buildChartMetrics(displayTimeline), [displayTimeline]);
    const deltaLabel = useMemo(() => formatDelta(displayTimeline, metricMeta), [displayTimeline, metricMeta]);
    const tableTimeline = useMemo(
        () => [...displayTimeline].sort((a, b) => b.timestamp - a.timestamp),
        [displayTimeline]
    );

    const gradientId = useMemo(
        () => `perfGradient-${discipline.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        [discipline]
    );

    const lastPoint = displayTimeline.length > 0 ? displayTimeline[displayTimeline.length - 1] : undefined;
    const headlineValue = lastPoint?.value;

    const bestValue = displayTimeline.reduce(
        (best, point) => {
            if (metricMeta.direction === "lower") {
                return Math.min(best, point.value);
            }
            return Math.max(best, point.value);
        },
        metricMeta.direction === "lower" ? Infinity : -Infinity
    );

    const formatValue = (value?: number, variant: "default" | "compact" = "default") => {
        if (value === undefined || !Number.isFinite(value)) return "-";
        return metricMeta.formatValue(value, variant);
    };

    const isTimeMetric =
        metricMeta.kind === "time-short" || metricMeta.kind === "time-long" || metricMeta.kind === "time-marathon";
    const countLabel = isTimeMetric ? "courses" : "performances";
    const latestLabel = "dernier";
    const bestLabel = "meilleur";
    const condensedHintText = isTimeMetric
        ? "Top chrono annuel"
        : "Top performance annuelle";

    return (
        <LinearGradient colors={["rgba(15,23,42,0.95)", "rgba(15,23,42,0.8)"]} style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.headerText}>
                    <Text style={styles.title}>{title || `Progression ${discipline}`}</Text>
                </View>
                <View style={styles.valueBadge}>
                    <Text style={styles.valueBadgeText}>
                        {yearFilteredTimeline.length} {countLabel}
                    </Text>
                </View>
            </View>

            {availableYears.length > 1 && (
                <View style={styles.yearFilterRow}>
                    <TouchableOpacity
                        onPress={() => setSelectedYear("all")}
                        style={[styles.yearChip, selectedYear === "all" && styles.yearChipActive]}
                    >
                        <Text style={[styles.yearChipText, selectedYear === "all" && styles.yearChipTextActive]}>Bilan</Text>
                    </TouchableOpacity>
                    {availableYears.map((year) => (
                        <TouchableOpacity
                            key={year}
                            onPress={() => setSelectedYear(year)}
                            style={[styles.yearChip, selectedYear === year && styles.yearChipActive]}
                        >
                            <Text style={[styles.yearChipText, selectedYear === year && styles.yearChipTextActive]}>{year}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {isCondensedAllYears && <Text style={styles.condensedHint}>{condensedHintText}</Text>}

            {displayTimeline.length >= 1 ? (
                <View style={styles.chartWrapper}>
                    <View style={styles.chartStats}>
                        <View>
                            <Text style={styles.statLabel}>{latestLabel}</Text>
                            <Text style={styles.statValue}>{formatValue(headlineValue)}</Text>
                        </View>
                        <View>
                            <Text style={styles.statLabel}>{bestLabel}</Text>
                            <Text style={styles.statValue}>{isFinite(bestValue) ? formatValue(bestValue) : "-"}</Text>
                        </View>
                        <View>
                            <Text style={styles.statLabel}>Tendance</Text>
                            <Text style={styles.statValue}>{deltaLabel || "N/A"}</Text>
                        </View>
                    </View>

                    {displayTimeline.length >= 2 ? (
                        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                            <Defs>
                                <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0%" stopColor="rgba(34,211,238,0.5)" />
                                    <Stop offset="100%" stopColor="rgba(14,165,233,0.05)" />
                                </SvgLinearGradient>
                            </Defs>
                            {chartMetrics.areaPath ? (
                                <Path d={chartMetrics.areaPath} fill={`url(#${gradientId})`} opacity={0.4} />
                            ) : null}
                            {chartMetrics.linePath ? (
                                <Path
                                    d={chartMetrics.linePath}
                                    stroke={colors.primary}
                                    strokeWidth={2.5}
                                    fill="none"
                                    strokeLinecap="round"
                                />
                            ) : null}
                            {chartMetrics.markerPoints.map((marker, index) => {
                                const point = displayTimeline[index];
                                if (!point) return null;
                                const dateLabel = isCondensedAllYears
                                    ? point.year
                                    : point.date.includes("-")
                                        ? point.date.slice(5)
                                        : point.date;
                                const minLabelX = CHART_PADDING_X + 12;
                                const maxLabelX = CHART_WIDTH - CHART_PADDING_X - 12;
                                const labelX = Math.min(Math.max(marker.x, minLabelX), maxLabelX);
                                return (
                                    <React.Fragment key={`marker-${point.date}-${point.value}-${index}`}>
                                        <Circle
                                            cx={marker.x}
                                            cy={marker.y}
                                            r={4}
                                            fill={colors.white}
                                            stroke={colors.primary}
                                            strokeWidth={1}
                                        />
                                        <SvgText
                                            x={labelX}
                                            y={marker.y - 10}
                                            fill={colors.white}
                                            fontSize={10}
                                            fontWeight="600"
                                            textAnchor="middle"
                                        >
                                            {formatValue(point.value, "compact")}
                                        </SvgText>
                                        <SvgText
                                            x={labelX}
                                            y={CHART_HEIGHT - 2}
                                            fill={colors.textLight}
                                            fontSize={9}
                                            textAnchor="middle"
                                        >
                                            {dateLabel}
                                        </SvgText>
                                    </React.Fragment>
                                );
                            })}
                        </Svg>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>Ajoute une seconde mesure pour visualiser la tendance.</Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                        Aucune donnée pour la discipline {discipline}. Enregistre une performance pour démarrer la progression.
                    </Text>
                </View>
            )}

            {tableTimeline.length > 0 && (
                <View style={styles.tableWrapper}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.tableHeaderText}>Date (ISO)</Text>
                        <Text style={styles.tableHeaderText}>{metricMeta.tableLabel}</Text>
                    </View>
                    {tableTimeline.map((point, idx) => (
                        <View key={`${point.timestamp || point.date || ""}-${point.value}-${idx}`} style={styles.tableRow}>
                            <Text style={styles.tableDate}>{point.date}</Text>
                            <Text style={styles.tableValue}>{formatValue(point.value)}</Text>
                        </View>
                    ))}
                </View>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        padding: 18,
        marginTop: 12,
        marginBottom: 12,
        gap: 18,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        columnGap: 12,
        rowGap: 6,
    },
    headerText: {
        flexShrink: 1,
        flexGrow: 1,
    },
    title: {
        color: colors.white,
        fontSize: 20,
        fontWeight: "700",
    },
    subtitle: {
        color: colors.textLight,
        fontSize: 12,
    },
    condensedHint: {
        color: colors.textLight,
        fontSize: 11,
        fontStyle: "italic",
    },
    yearFilterRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    yearChip: {
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.4)",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "rgba(15,23,42,0.4)",
    },
    yearChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    yearChipText: {
        color: colors.textLight,
        fontSize: 12,
        fontWeight: "600",
    },
    yearChipTextActive: {
        color: colors.background,
    },
    valueBadge: {
        backgroundColor: "rgba(15,23,42,0.6)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.4)",
        alignSelf: "flex-start",
    },
    valueBadgeText: {
        color: colors.white,
        fontWeight: "600",
        fontSize: 12,
    },
    chartWrapper: {
        gap: 12,
    },
    chartStats: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "rgba(15,23,42,0.5)",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
    },
    statLabel: {
        color: colors.textLight,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statValue: {
        color: colors.white,
        fontWeight: "700",
        fontSize: 14,
    },
    emptyState: {
        backgroundColor: "rgba(15,23,42,0.4)",
        borderRadius: 18,
        padding: 16,
    },
    emptyStateText: {
        color: colors.textLight,
        fontSize: 13,
        textAlign: "center",
    },
    tableWrapper: {
        gap: 8,
    },
    tableHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 8,
    },
    tableHeaderText: {
        color: colors.textLight,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    tableRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: "rgba(15,23,42,0.35)",
    },
    tableDate: {
        color: colors.white,
        fontSize: 14,
        fontWeight: "500",
    },
    tableValue: {
        color: colors.white,
        fontSize: 14,
        fontWeight: "600",
    },
});
