// src/utils/disciplineUtils.ts

import { DisciplineType, RECORDS_BY_DISCIPLINE } from "../constants/disciplines";

/**
 * Retourne la liste des épreuves associées à une discipline donnée.
 * Si la discipline n’existe pas dans le dictionnaire, renvoie un tableau vide.
 */
export function getEventsForDiscipline(discipline: string): string[] {
    // Vérifie si la valeur passée correspond à une des clés de l’enum
    const isValidDiscipline = Object.values(DisciplineType).includes(
        discipline as DisciplineType
    );

    if (isValidDiscipline) {
        return RECORDS_BY_DISCIPLINE[discipline as DisciplineType];
    }

    // Si non valide → retourne tableau vide
    return [];
}
