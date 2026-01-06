import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, StyleSheet, View, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import { PerformancePoint } from "../../types/User";
import { colors } from "../../styles/theme";
import { DisciplineTimelinePoint, getDisciplineMetricMeta, getDisciplineTimeline, parseTimeToSeconds, preferParenthesizedTimeText } from "../../utils/performance";

const CHART_HEIGHT = 180;
const CHART_WIDTH = Math.max(Dimensions.get("window").width - 64, 220);
const CHART_PADDING_X = 16;
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

    const getX = (index: number) => CHART_PADDING_X + innerWidth * (points.length === 1 ? 0.5 : index / (points.length - 1));
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
    const baseY = chartBottom;
    areaPath += ` L ${lastX} ${baseY} L ${CHART_PADDING_X} ${baseY} Z`;

    return { linePath, areaPath, markerPoints };
};

type EnrichedPoint = PerformancePoint & { rawPerformance?: string };

const parseWind = (raw?: string | number | null) => {
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : undefined;
    const cleaned = String(raw).replace(/,/g, ".");
    const match = cleaned.match(/[+-]?\d+(?:\.\d+)?/);
    if (!match) return undefined;
    const value = parseFloat(match[0]);
    return Number.isFinite(value) ? value : undefined;
};

const parseWindFromPerfString = (raw?: string | number | null) => {
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw !== "string") return undefined;
    const str = raw;
    // Accept explicit m/s mention even without a sign (e.g. "2.3 m/s").
    const mpsMatch = str.match(/([+-]?\d+(?:[.,]\d+)?)\s*m\/s/i);
    if (mpsMatch) {
        const value = parseFloat(mpsMatch[1].replace(/,/g, "."));
        return Number.isFinite(value) ? value : undefined;
    }
    // Only treat as wind if a sign is present or explicit "vent" marker, to avoid misreading chronos as wind.
    if (!/[+-]/.test(str) && !/vent/i.test(str)) return undefined;
    const match = str.match(/[+-]\d+(?:[.,]\d+)?/);
    if (!match) return undefined;
    const value = parseFloat(match[0].replace(/,/g, "."));
    return Number.isFinite(value) ? value : undefined;
};

const getWindForPoint = (p: PerformancePoint | EnrichedPoint) => {
    const direct = (p as EnrichedPoint & { wind?: number }).wind;
    if (direct !== undefined && direct !== null) return direct;

    const rawPerf = (p as EnrichedPoint).rawPerformance ?? p.value;
    const fromPerf = parseWindFromPerfString(rawPerf as any);
    if (fromPerf !== undefined) return fromPerf;

    if (p.meeting && /vent/i.test(p.meeting)) {
        const match = p.meeting.match(/vent[^0-9-+]*([+-]?\d+(?:[.,]\d+)?)/i);
        if (match) return parseWind(match[1]);
    }

    if ((p as any).notes && /vent/i.test(String((p as any).notes))) {
        const match = String((p as any).notes).match(/vent[^0-9-+]*([+-]?\d+(?:[.,]\d+)?)/i);
        if (match) return parseWind(match[1]);
    }

    const fromValue = typeof p.value === "string" ? parseWindFromPerfString(p.value) : undefined;
    if (fromValue !== undefined) return fromValue;

    return undefined;
};

const normalizeDateKey = (iso: string) => iso?.slice(0, 10) || iso;

const toIsoDateLabel = (date: string) => {
    if (!date) return "-";
    const trimmed = date.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return trimmed;
};

const pickBestPerDay = (points: DisciplineTimelinePoint[], direction: "lower" | "higher") => {
    const byDay: Record<string, DisciplineTimelinePoint> = {};
    points.forEach((p) => {
        const key = normalizeDateKey(p.date);
        const current = byDay[key];
        if (!current) {
            byDay[key] = p;
            return;
        }
        const isBetter = direction === "lower" ? p.value < current.value : p.value > current.value;
        if (isBetter) byDay[key] = p;
    });
    return Object.values(byDay).sort((a, b) => a.timestamp - b.timestamp);
};

export default function ProfilePerformanceTimeline({ timeline, discipline, title }: Props) {
    const meta = useMemo(() => getDisciplineMetricMeta(discipline), [discipline]);

    const disciplinePoints = useMemo(() => {
        return (timeline || []).filter((p) => p.discipline?.trim().toLowerCase() === discipline.trim().toLowerCase()) as EnrichedPoint[];
    }, [timeline, discipline]);

    const chartBase = useMemo(() => {
        const eligiblePoints = disciplinePoints.filter((p) => {
            const rawLabel = (p as EnrichedPoint).rawPerformance ?? p.value;
            const rawStr = rawLabel !== undefined && rawLabel !== null ? String(rawLabel).toLowerCase() : "";
            const hasInvalidKeyword = /(\bdnf\b|\bdns\b|\bdq\b|\bdsq\b|\bnp\b|\bnc\b|did not finish|did not start)/i.test(rawStr);
            const wind = getWindForPoint(p);
            const isNotHomologated = wind !== undefined && wind !== null && Number(wind) > 2.0;
            return !hasInvalidKeyword && !isNotHomologated;
        }) as PerformancePoint[];

        const timelinePoints = getDisciplineTimeline(eligiblePoints, discipline).filter((p) => Number.isFinite(p.value) && p.value > 0);
        return pickBestPerDay(timelinePoints, meta.direction);
    }, [disciplinePoints, discipline, meta.direction]);
    const availableYears = useMemo(() => {
        const uniqueYears = Array.from(new Set(chartBase.map((point) => point.year))).filter(Boolean);
        return uniqueYears.sort((a, b) => b.localeCompare(a));
    }, [chartBase]);

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
        if (selectedYear === "all") return chartBase;
        return chartBase.filter((point) => point.year === selectedYear);
    }, [chartBase, selectedYear]);

    const isCondensedAllYears = selectedYear === "all" && chartBase.length > 10;
    const displayTimeline = useMemo(() => {
        if (!isCondensedAllYears) return yearFilteredTimeline;
        const bestByYear = new Map<string, DisciplineTimelinePoint>();
        chartBase.forEach((point) => {
            if (!point.year) return;
            const current = bestByYear.get(point.year);
            if (!current || (meta.direction === "lower" ? point.value < current.value : point.value > current.value)) {
                bestByYear.set(point.year, point);
            }
        });
        return Array.from(bestByYear.values()).sort((a, b) => a.timestamp - b.timestamp);
    }, [chartBase, yearFilteredTimeline, isCondensedAllYears, meta.direction]);

    const chartMetrics = useMemo(() => buildChartMetrics(displayTimeline), [displayTimeline]);
    // (Delta label currently not displayed in UI; keep computation removed to avoid unused variable warnings.)

    const tableTimeline = useMemo(() => {
        return [...disciplinePoints].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [disciplinePoints]);
    const gradientId = useMemo(() => `perfGradient-${discipline.toLowerCase().replace(/[^a-z0-9]/g, "")}`, [discipline]);

    const lastPoint = displayTimeline.length > 0 ? displayTimeline[displayTimeline.length - 1] : undefined;
    const headlineValue = lastPoint?.value;
    const extrema = displayTimeline.reduce((best, point) => (meta.direction === "lower" ? Math.min(best, point.value) : Math.max(best, point.value)), meta.direction === "lower" ? Infinity : -Infinity);

    return (
        <LinearGradient colors={["rgba(15,23,42,0.95)", "rgba(15,23,42,0.8)"]} style={styles.card}>
            <View style={styles.headerRow}>
                <View style={styles.valueBadge}>
                    <Text style={styles.valueBadgeText}>{yearFilteredTimeline.length}</Text>
                </View>
                <View style={{ backgroundColor: "rgba(15, 63, 38, 1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={styles.title}>{title || `${discipline}`}</Text>
                </View>

            </View>

            {availableYears.length > 0 && (
                <View style={styles.yearFilterRow}>
                    <TouchableOpacity onPress={() => setSelectedYear("all")} style={[styles.yearChip, selectedYear === "all" && styles.yearChipActive]}>
                        <Text style={[styles.yearChipText, selectedYear === "all" && styles.yearChipTextActive]}>Bilan</Text>
                    </TouchableOpacity>
                    {availableYears.map((year) => (
                        <TouchableOpacity key={year} onPress={() => setSelectedYear(year)} style={[styles.yearChip, selectedYear === year && styles.yearChipActive]}>
                            <Text style={[styles.yearChipText, selectedYear === year && styles.yearChipTextActive]}>{year}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {isCondensedAllYears && <Text style={styles.condensedHint}>Top annuel affiché (plus de 10 courses)</Text>}

            {displayTimeline.length >= 1 ? (
                <View style={styles.chartWrapper}>
                    <View style={styles.chartStats}>
                        <View>
                            <Text style={styles.statLabel}>Dernière perf</Text>
                            <Text style={styles.statValue}>{headlineValue !== undefined ? meta.formatValue(headlineValue) : "-"}</Text>
                        </View>
                        <View>
                            <Text style={styles.statLabel}>Meilleur</Text>
                            <Text style={styles.statValue}>{Number.isFinite(extrema) ? meta.formatValue(extrema) : "-"}</Text>
                        </View>

                    </View>

                    {displayTimeline.length >= 2 ? (
                        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                            <Defs>
                                <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0%" stopColor="rgba(235, 59, 19, 0.5)" />
                                    <Stop offset="100%" stopColor="rgba(17, 237, 182, 0.05)" />
                                </SvgLinearGradient>
                            </Defs>
                            {chartMetrics.areaPath ? <Path d={chartMetrics.areaPath} fill={`url(#${gradientId})`} opacity={0.4} /> : null}
                            {chartMetrics.linePath ? (
                                <Path d={chartMetrics.linePath} stroke={colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" />
                            ) : null}
                            {(() => {
                                const seenYears = new Set<string>();
                                const seenMonths = new Set<string>();
                                const manyPoints = displayTimeline.length > 5;
                                const manyPointsInYear = selectedYear !== "all" && displayTimeline.length > 7;

                                const getMonthKey = (rawDate: string) => {
                                    if (!rawDate) return "";
                                    if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) return rawDate.slice(0, 7);
                                    const parsed = new Date(rawDate);
                                    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 7);
                                    return rawDate;
                                };

                                return chartMetrics.markerPoints.map((marker, index) => {
                                    const point = displayTimeline[index];
                                    if (!point) return null;

                                    let dateLabel = "";
                                    if (selectedYear === "all") {
                                        const yearLabel = point.date?.slice(0, 4) || point.year;
                                        if (manyPoints) {
                                            if (yearLabel && !seenYears.has(yearLabel)) {
                                                dateLabel = yearLabel;
                                                seenYears.add(yearLabel);
                                            }
                                        } else {
                                            dateLabel = point.date.includes("-") ? point.date.slice(0, 7) : (yearLabel || point.date);
                                        }
                                    } else {
                                        if (manyPointsInYear) {
                                            const monthKey = getMonthKey(point.date);
                                            if (monthKey && !seenMonths.has(monthKey)) {
                                                dateLabel = point.date.includes("-") ? point.date.slice(5) : point.date;
                                                seenMonths.add(monthKey);
                                            }
                                        } else {
                                            dateLabel = point.date.includes("-") ? point.date.slice(5) : point.date;
                                        }
                                    }

                                    const minLabelX = CHART_PADDING_X + 12;
                                    const maxLabelX = CHART_WIDTH - CHART_PADDING_X - 12;
                                    const labelX = Math.min(Math.max(marker.x, minLabelX), maxLabelX);
                                    return (
                                        <React.Fragment key={`marker-${point.date}-${point.value}`}>
                                            <Circle cx={marker.x} cy={marker.y} r={4} fill={colors.white} stroke={colors.primary} strokeWidth={1} />
                                            <SvgText x={labelX} y={marker.y - 10} fill={colors.white} fontSize={10} fontWeight="600" textAnchor="middle">
                                                {meta.formatValue(point.value, "compact")}
                                            </SvgText>
                                            {dateLabel ? (
                                                <SvgText x={labelX} y={CHART_HEIGHT - 2} fill={colors.textLight} fontSize={9} textAnchor="middle">
                                                    {dateLabel}
                                                </SvgText>
                                            ) : null}
                                        </React.Fragment>
                                    );
                                });
                            })()}
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
                        <Text style={styles.tableHeaderText}>Toutes les perfs</Text>
                    </View>
                    {tableTimeline.map((point, index) => {
                        const numericValue = Number(point.value);
                        const isNumeric = Number.isFinite(numericValue);
                        const rawPerformance = (point as EnrichedPoint).rawPerformance ?? point.value;
                        const hasPerformance = rawPerformance !== undefined && rawPerformance !== null && String(rawPerformance).trim() !== "";
                        const place = (point as EnrichedPoint & { place?: string | number }).place;

                        const rawText = rawPerformance !== undefined && rawPerformance !== null ? String(rawPerformance).trim() : "";
                        const rawLower = rawText.toLowerCase();
                        const hasInvalidKeyword = /(\bdnf\b|\bdns\b|\bdq\b|\bdsq\b|\bnp\b|\bnc\b|did not finish|did not start)/i.test(rawLower);
                        const cleanedForParse = rawText.replace(/\(.*?\)/g, "").trim();

                        const parsedFormattedLabel = (() => {
                            if (!cleanedForParse) return null;
                            if (hasInvalidKeyword) return null;
                            if (/\bplace\b/i.test(cleanedForParse)) return null;

                            if (meta.kind.startsWith("time")) {
                                // Keep the parentheses for parsing, because some feeds store the real perf inside them.
                                const parsedSeconds = parseTimeToSeconds(rawText);
                                if (parsedSeconds !== null && Number.isFinite(parsedSeconds) && parsedSeconds > 0) {
                                    return meta.formatValue(parsedSeconds, "compact");
                                }
                                return null;
                            }

                            const match = cleanedForParse.replace(/\u00A0/g, " ").match(/[+-]?\d+(?:[.,]\d+)?/);
                            if (!match) return null;
                            const parsed = parseFloat(match[0].replace(/,/g, "."));
                            if (!Number.isFinite(parsed) || parsed <= 0) return null;
                            return meta.formatValue(parsed, "compact");
                        })();

                        let label = "-";
                        if (isNumeric) {
                            label = meta.formatValue(numericValue, "compact");
                        } else if (!hasPerformance && place !== undefined && place !== null) {
                            label = `Place ${place}`;
                        } else if (parsedFormattedLabel) {
                            label = parsedFormattedLabel;
                        } else if (rawPerformance !== undefined && rawPerformance !== null) {
                            label = preferParenthesizedTimeText(String(rawPerformance)) ?? String(rawPerformance);
                        }
                        const isoDate = toIsoDateLabel(point.date);
                        return (
                            <View key={`${point.date}-${point.value}-${index}`} style={styles.tableRow}>
                                <Text style={styles.tableDate}>{isoDate}</Text>
                                <Text style={styles.tableValue}>{label}</Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        padding: 10,
        marginTop: 12,
        marginBottom: 12,
        gap: 18,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 4,

    },
    title: {
        color: colors.white,
        fontSize: 14,
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
        backgroundColor: "rgba(15, 63, 38, 1)",
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(218, 224, 232, 0.4)",
    },
    valueBadgeText: {
        color: colors.white,
        fontWeight: "600",
        fontSize: 14,
    },
    chartWrapper: {
        gap: 1,
    },
    chartStats: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "rgba(15,23,42,0.5)",
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginBottom: 12,
    },
    statLabel: {
        color: colors.textLight,
        fontSize: 11,
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
        gap: 1,
    },
    tableHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 8,
    },
    tableHeaderText: {
        fontSize: 16,
        fontStyle: "italic",
        color: colors.textLight,
        fontWeight: "600",
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
    chart: {
        width: CHART_WIDTH,
        height: CHART_HEIGHT,
    },
});
