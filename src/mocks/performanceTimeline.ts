import { PerformancePoint } from "../types/User";

const baseRaces = [
    { date: "2025-01-18T18:30:00.000Z", meeting: "Meeting indoor de Lyon", city: "Lyon" },
    { date: "2025-02-16T18:30:00.000Z", meeting: "Meeting Metz Moselle Athlé", city: "Metz" },
    { date: "2025-03-28T18:30:00.000Z", meeting: "Interclubs N1", city: "Clermont-Ferrand" },
    { date: "2024-05-09T18:30:00.000Z", meeting: "Meeting international de Marseille", city: "Marseille" },
    { date: "2024-08-09T18:30:00.000Z", meeting: "Meeting international de Marseille", city: "Marseille" },
    { date: "2025-06-14T18:30:00.000Z", meeting: "Championnat de France Elite", city: "Angers" },
    { date: "2025-04-05T18:30:00.000Z", meeting: "Diamond League Monaco", city: "Monaco" },
    { date: "2023-04-05T18:30:00.000Z", meeting: "Diamond League Monaco", city: "Monaco" },
    { date: "2023-02-05T18:30:00.000Z", meeting: "Diamond League Monaco", city: "Monaco" },
    { date: "2022-06-05T18:30:00.000Z", meeting: "Diamond League Monaco", city: "Monaco" },
    { date: "2022-09-05T18:30:00.000Z", meeting: "Diamond League Monaco", city: "Monaco" },
    { date: "2021-01-05T18:30:00.000Z", meeting: "Diamond League Monaco", city: "Monaco" },
    { date: "2021-04-05T18:30:00.000Z", meeting: "Diamond League Monaco", city: "Monaco" },
    { date: "2020-04-05T18:30:00.000Z", meeting: "Diamond League Monaco", city: "Monaco" },
];

const createTimeline = (discipline: string, values: number[]): PerformancePoint[] => {
    if (values.length !== baseRaces.length) {
        throw new Error(`Unexpected value count for ${discipline}`);
    }

    return baseRaces.map((race, index) => ({
        ...race,
        discipline,
        value: values[index],
    }));
};

const values100m = [
    10.94,
    10.88,
    10.8,
    10.71,
    10.6,
    10.64,
    10.58,
    11.0,
    10.9,
    11.2,
    10.98,
    11.3,
    11.4,
    11.58,
];

const values60m = [
    6.74,
    6.7,
    6.66,
    6.78,
    6.75,
    6.68,
    6.64,
    6.89,
    6.82,
    7.05,
    6.96,
    7.18,
    7.24,
    7.36,
];

const values200m = [
    20.84,
    20.7,
    20.62,
    20.95,
    20.88,
    20.76,
    20.58,
    21.2,
    21.05,
    21.68,
    21.34,
    21.92,
    22.08,
    22.55,
];

const values400m = [
    45.12,
    44.9,
    44.72,
    45.3,
    45.18,
    44.95,
    44.6,
    45.88,
    45.52,
    46.4,
    46.02,
    46.85,
    47.1,
    47.85,
];

export const timeline100m = createTimeline("100m", values100m);
export const timeline60m = createTimeline("60m", values60m);
export const timeline200m = createTimeline("200m", values200m);
export const timeline400m = createTimeline("400m", values400m);

export const performanceTimelines = {
    "60m": timeline60m,
    "100m": timeline100m,
    "200m": timeline200m,
    "400m": timeline400m,
};
