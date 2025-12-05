export type DisciplineGroup = {
    id: string;
    label: string;
    disciplines: string[];
};

export const DISCIPLINE_GROUPS: DisciplineGroup[] = [
    {
        id: "courses",
        label: "Courses",
        disciplines: [
            "60m",
            "100m",
            "200m",
            "400m",
            "800m",
            "1500m",
            "3000m",
            "5000m",
            "10000m",
            "4x100m",
            "4x400m",
        ],
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
    {
        id: "route",
        label: "Route",
        disciplines: ["10 km", "Semi-marathon", "Marathon"],
    },
];
