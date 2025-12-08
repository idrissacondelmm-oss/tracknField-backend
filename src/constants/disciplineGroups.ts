export type DisciplineSubGroup = {
    id: string;
    label: string;
    disciplines: string[];
};

export type DisciplineGroup = {
    id: string;
    label: string;
    disciplines: string[];
    subGroups?: DisciplineSubGroup[];
};

export const getDisciplinesForPrimary = (group: DisciplineGroup, primaryLabel: string | undefined) => {
    if (!primaryLabel) return group.disciplines;
    if (!group.subGroups || group.subGroups.length === 0) return group.disciplines;
    const normalized = primaryLabel.trim().toLowerCase();
    const match = group.subGroups.find((sub) => sub.label.trim().toLowerCase() === normalized);
    return match ? match.disciplines : group.disciplines;
};

const COURSE_SUBGROUPS: DisciplineSubGroup[] = [
    {
        id: "courses-sprint",
        label: "Sprint",
        disciplines: ["60m", "100m", "200m", "400m", "4x100m", "4x400m"],
    },
    {
        id: "courses-haies",
        label: "Haies",
        disciplines: ["60m haies", "100m haies", "110m haies", "400m haies"],
    },
    {
        id: "courses-demi-fond",
        label: "Demi-fond",
        disciplines: ["800m", "1500m"],
    },
    {
        id: "courses-fond",
        label: "Fond",
        disciplines: ["3000m", "5000m", "10000m"],
    },
    {
        id: "courses-route",
        label: "Route",
        disciplines: ["10 km", "Semi-marathon", "Marathon"],
    },
];

export const DISCIPLINE_GROUPS: DisciplineGroup[] = [
    {
        id: "courses",
        label: "Courses",
        disciplines: COURSE_SUBGROUPS.flatMap((subGroup) => subGroup.disciplines),
        subGroups: COURSE_SUBGROUPS,
    },
    {
        id: "sauts",
        label: "Sauts",
        disciplines: ["Saut en longueur", "Saut en hauteur", "Triple saut", "Saut à la perche"],
    },
    {
        id: "lancers",
        label: "Lancers",
        disciplines: ["Poids", "Disque", "Marteau", "Javelot"],
    },
    {
        id: "combi",
        label: "Épreuves combinées",
        disciplines: ["Décathlon", "Heptathlon", "Pentathlon"],
    },
];
