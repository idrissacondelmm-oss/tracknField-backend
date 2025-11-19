// src/constants/disciplines.ts

/** 🏃 Liste des disciplines principales disponibles */
export enum DisciplineType {
    Sprint = "Sprint",
    DemiFond = "Demi-fond",
    Fond = "Fond",
    Saut = "Saut",
    Lancer = "Lancer",
    Combine = "Combiné",
}

/** 📊 Liste des épreuves associées à chaque discipline */
export const RECORDS_BY_DISCIPLINE: Record<DisciplineType, string[]> = {
    [DisciplineType.Sprint]: ["60m", "100m", "200m", "400m"],
    [DisciplineType.DemiFond]: ["800m", "1500m", "3000m"],
    [DisciplineType.Fond]: ["5000m", "10 000m"],
    [DisciplineType.Saut]: ["Longueur", "Hauteur", "Triple saut"],
    [DisciplineType.Lancer]: ["Poids", "Disque", "Javelot"],
    [DisciplineType.Combine]: ["Décathlon", "Heptathlon"],
};
