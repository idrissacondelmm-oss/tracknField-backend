import { useState, useEffect } from "react";
import { Badge } from "../types/Badge";

/**
 * 🔥 Hook pour simuler les badges d'un utilisateur.
 * Génère automatiquement des badges avec des statuts et raretés variés.
 */
export function useMockBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    // Simulation d’un chargement asynchrone (ex: API ou Firestore)
    const timeout = setTimeout(() => {
      const mockData: Badge[] = [];

      setBadges(mockData);
    }, 800); // simulateur de latence

    return () => clearTimeout(timeout);
  }, []);

  return { badges, isLoading: badges.length === 0 };
}
/*
{
          id: "first-race",
          name: "Première course",
          description: "A terminé sa première compétition officielle.",
          icon: "flag-outline",
          rarity: "common",
          unlockedAt: "2025-02-10",
        },
        {
          id: "personal-record",
          name: "Record personnel",
          description: "A battu son record sur 400m.",
          icon: "flame-outline",
          rarity: "rare",
          unlockedAt: "2025-03-18",
        },
        {
          id: "consistency",
          name: "Régulier",
          description: "S’est entraîné chaque semaine pendant 6 mois.",
          icon: "calendar-outline",
          rarity: "epic",
          unlockedAt: "2025-05-02",
        },
        {
          id: "champion",
          name: "Champion national",
          description: "A remporté un championnat officiel.",
          icon: "trophy-outline",
          rarity: "legendary",
          unlockedAt: "2025-06-22",
        },
        {
          id: "team-player",
          name: "Esprit d’équipe",
          description: "A participé à une compétition en relais.",
          icon: "people-outline",
          rarity: "common",
        },
        {
          id: "iron-athlete",
          name: "Iron Athlete",
          description: "A participé à 10 compétitions officielles.",
          icon: "medal-outline",
          rarity: "epic",
        },
*/