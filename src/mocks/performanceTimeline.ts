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

const values800m = [
    111.4,
    110.9,
    110.1,
    109.6,
    109.1,
    108.5,
    108.0,
    111.8,
    110.7,
    112.3,
    111.7,
    113.1,
    114.0,
    114.8,
];

const values1500m = [
    230.4,
    229.6,
    228.8,
    228.0,
    227.2,
    226.4,
    225.6,
    231.5,
    230.7,
    233.0,
    232.1,
    234.6,
    236.2,
    237.8,
];

const values3000m = [
    505.3,
    503.8,
    502.1,
    500.7,
    499.8,
    498.5,
    497.2,
    507.6,
    505.9,
    511.4,
    509.8,
    514.6,
    518.2,
    521.9,
];

const values5000m = [
    802.5,
    799.2,
    796.8,
    794.3,
    792.6,
    791.1,
    788.4,
    807.6,
    804.3,
    812.8,
    809.5,
    818.2,
    824.9,
    831.6,
];

const values10000m = [
    1645.2,
    1638.8,
    1632.6,
    1627.4,
    1622.0,
    1616.8,
    1611.5,
    1654.7,
    1648.3,
    1666.4,
    1659.8,
    1678.2,
    1689.5,
    1701.8,
];

const values4x100m = [
    38.8,
    38.6,
    38.4,
    38.3,
    38.1,
    38.0,
    37.9,
    39.1,
    38.9,
    39.6,
    39.4,
    39.9,
    40.2,
    40.5,
];

const values4x400m = [
    163.4,
    162.7,
    162.2,
    161.6,
    161.1,
    160.4,
    159.8,
    164.9,
    164.0,
    166.5,
    165.7,
    167.8,
    169.4,
    171.0,
];

const valuesLongueur = [
    7.45,
    7.41,
    7.38,
    7.3,
    7.24,
    7.36,
    7.4,
    7.1,
    7.02,
    6.88,
    6.94,
    6.75,
    6.68,
    6.52,
];

const valuesHauteur = [
    2.16,
    2.14,
    2.11,
    2.08,
    2.06,
    2.13,
    2.15,
    2.02,
    2.04,
    1.98,
    2.0,
    1.95,
    1.92,
    1.9,
];

const valuesTripleSaut = [
    16.9,
    16.8,
    16.76,
    16.6,
    16.54,
    16.62,
    16.7,
    16.3,
    16.2,
    16.05,
    16.12,
    15.96,
    15.82,
    15.7,
];

const valuesPerche = [
    5.75,
    5.72,
    5.7,
    5.65,
    5.62,
    5.68,
    5.72,
    5.5,
    5.45,
    5.4,
    5.42,
    5.35,
    5.28,
    5.2,
];

const valuesPoids = [
    20.8,
    20.72,
    20.65,
    20.52,
    20.4,
    20.6,
    20.7,
    20.1,
    20.05,
    19.9,
    19.95,
    19.8,
    19.6,
    19.4,
];

const valuesDisque = [
    64.5,
    64.2,
    64.0,
    63.7,
    63.5,
    63.9,
    64.1,
    62.8,
    62.4,
    61.9,
    62.1,
    61.5,
    61.0,
    60.5,
];

const valuesMarteau = [
    78.5,
    78.1,
    77.9,
    77.6,
    77.4,
    77.8,
    78.0,
    76.8,
    76.4,
    75.9,
    76.1,
    75.4,
    74.9,
    74.3,
];

const valuesJavelot = [
    85.2,
    84.9,
    84.6,
    84.2,
    83.9,
    84.4,
    84.8,
    83.1,
    82.7,
    82.0,
    82.4,
    81.6,
    80.9,
    80.1,
];

const valuesDecathlon = [
    8350,
    8380,
    8405,
    8430,
    8460,
    8495,
    8520,
    8280,
    8310,
    8220,
    8260,
    8165,
    8090,
    8025,
];

const valuesHeptathlon = [
    6500,
    6525,
    6540,
    6565,
    6580,
    6605,
    6630,
    6475,
    6490,
    6420,
    6450,
    6385,
    6330,
    6275,
];

const valuesPentathlon = [
    4600,
    4625,
    4640,
    4660,
    4680,
    4705,
    4730,
    4560,
    4580,
    4520,
    4540,
    4485,
    4440,
    4395,
];

const values10km = [
    1815,
    1810,
    1804,
    1798,
    1792,
    1786,
    1780,
    1828,
    1820,
    1840,
    1832,
    1856,
    1870,
    1885,
];

const valuesSemiMarathon = [
    3655,
    3642,
    3630,
    3618,
    3605,
    3592,
    3580,
    3688,
    3670,
    3712,
    3695,
    3740,
    3776,
    3812,
];

const valuesMarathon = [
    7805,
    7782,
    7764,
    7740,
    7722,
    7700,
    7685,
    7838,
    7815,
    7872,
    7845,
    7918,
    7975,
    8028,
];

export const timeline100m = createTimeline("100m", values100m);
export const timeline60m = createTimeline("60m", values60m);
export const timeline200m = createTimeline("200m", values200m);
export const timeline400m = createTimeline("400m", values400m);
export const timeline800m = createTimeline("800m", values800m);
export const timeline1500m = createTimeline("1500m", values1500m);
export const timeline3000m = createTimeline("3000m", values3000m);
export const timeline5000m = createTimeline("5000m", values5000m);
export const timeline10000m = createTimeline("10000m", values10000m);
export const timeline4x100m = createTimeline("4x100m", values4x100m);
export const timeline4x400m = createTimeline("4x400m", values4x400m);
export const timelineLongueur = createTimeline("Saut en longueur", valuesLongueur);
export const timelineHauteur = createTimeline("Saut en hauteur", valuesHauteur);
export const timelineTripleSaut = createTimeline("Triple saut", valuesTripleSaut);
export const timelinePerche = createTimeline("Saut à la perche", valuesPerche);
export const timelinePoids = createTimeline("Poids", valuesPoids);
export const timelineDisque = createTimeline("Disque", valuesDisque);
export const timelineMarteau = createTimeline("Marteau", valuesMarteau);
export const timelineJavelot = createTimeline("Javelot", valuesJavelot);
export const timelineDecathlon = createTimeline("Décathlon", valuesDecathlon);
export const timelineHeptathlon = createTimeline("Heptathlon", valuesHeptathlon);
export const timelinePentathlon = createTimeline("Pentathlon", valuesPentathlon);
export const timeline10km = createTimeline("10 km", values10km);
export const timelineSemiMarathon = createTimeline("Semi-marathon", valuesSemiMarathon);
export const timelineMarathon = createTimeline("Marathon", valuesMarathon);

export const performanceTimelines = {
    "60m": timeline60m,
    "100m": timeline100m,
    "200m": timeline200m,
    "400m": timeline400m,
    "800m": timeline800m,
    "1500m": timeline1500m,
    "3000m": timeline3000m,
    "5000m": timeline5000m,
    "10000m": timeline10000m,
    "4x100m": timeline4x100m,
    "4x400m": timeline4x400m,
    "Saut en longueur": timelineLongueur,
    "Saut en hauteur": timelineHauteur,
    "Triple saut": timelineTripleSaut,
    "Saut à la perche": timelinePerche,
    "Poids": timelinePoids,
    "Disque": timelineDisque,
    "Marteau": timelineMarteau,
    "Javelot": timelineJavelot,
    "Décathlon": timelineDecathlon,
    "Heptathlon": timelineHeptathlon,
    "Pentathlon": timelinePentathlon,
    "10 km": timeline10km,
    "Semi-marathon": timelineSemiMarathon,
    "Marathon": timelineMarathon,
};
