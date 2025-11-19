export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // nom Ionicon ou URL image
    rarity: BadgeRarity;
    unlockedAt?: string; // date d'obtention
    isUnlocked?: boolean; // pour l'affichage
    progress?: number;   // 0 à 1, pour les badges à progression
}
