// src/types/User.ts
import { Badge } from "./Badge";

export interface Performance {
    epreuve: string;        // ex: "100m"
    record: string;         // ex: "10.52"
    bestSeason?: string;    // ex: "10.64"
}

export interface User {
    _id: string;                 // _id du user
    id: string;                  // ID utilisateur
    fullName: string;           // Nom complet
    username?: string;          // Nom d'utilisateur unique
    email: string;              // Adresse mail
    photoUrl?: string;          // Lien photo profil
    rpmAvatarUrl?: string;      // URL du modèle Ready Player Me (.glb)
    rpmAvatarPreviewUrl?: string; // Aperçu PNG/JPG généré par RPM
    rpmAvatarMeta?: Record<string, any>; // Métadonnées RPM renvoyées par l'export
    rpmAvatarId?: string;       // Identifiant Ready Player Me associé
    rpmUserId?: string;         // Identifiant anonyme Ready Player Me

    // 🧍 Informations personnelles
    gender?: "male" | "female";
    birthDate?: string;
    country?: string;
    city?: string;
    language?: "fr" | "en";

    // 🏃 Informations sportives
    mainDiscipline?: string;
    otherDisciplines?: string[];
    club?: string;
    level?: "beginner" | "intermediate" | "advanced" | "pro";
    category?: string;
    goals?: string;
    dominantLeg?: "left" | "right" | "unknown";

    // 📊 Statistiques
    records?: Record<string, string>;
    seasonPerformances?: Record<string, string>; // Ex: { "100m": "10.92s" }
    performances?: Performance[];
    competitionsCount?: number;
    challengesCount?: number;
    rankGlobal?: number;
    rankNational?: number;
    trackPoints?: number;
    badges?: Badge[];

    // ⚙️ Préférences
    isProfilePublic?: boolean;
    notificationsEnabled?: boolean;
    autoSharePerformance?: boolean;
    theme?: "light" | "dark" | "system";

    // 🔗 Réseaux sociaux
    instagram?: string;
    strava?: string;
    tiktok?: string;
    website?: string;

    // 🕓 Métadonnées
    createdAt?: string;
    updatedAt?: string;

    // ✅ Données de progression et d'interaction
    totalDistance?: number;             // km cumulés sur toutes les sessions
    bestPerformance?: string;           // ex: "400m - 47.92s"
    lastActivityDate?: string;          // Dernière activité ou compétition
    streakDays?: number;                // Nombre de jours consécutifs actifs

    // 🏅 Système de réputation
    xp?: number;                        // Points d'expérience
    levelName?: string;                 // Nom symbolique du niveau (Rookie, Elite...)
    medals?: {                          // Détail des médailles
        gold: number;
        silver: number;
        bronze: number;
    };

    // 👥 Social / communauté
    followers?: number;
    following?: number;
    friends?: string[];                 // Liste d'IDs d'amis
    achievements?: string[];            // Succès particuliers (ex: "Premier 800m")

    // 🏠 Informations complémentaires
    bio?: string;                       // Courte description de soi
    favoriteSurface?: "track" | "road" | "trail";
    preferredTrainingTime?: "morning" | "evening" | "night";


}
