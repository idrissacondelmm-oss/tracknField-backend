export type NewsItem = {
    id: string;
    headline: string;
    athleteName: string;
    discipline: string;
    club: string;
    country: string;
    summary: string;
    mediaUrl: string;
    likes: number;
    comments: number;
    publishedAt: string;
    tags: string[];
};

export const NEWS_FEED: NewsItem[] = [
    {
        id: "world-indoor-tour-paris",
        headline: "Tia Jones passe sous les 7,80 sur 60m haies",
        athleteName: "Tia Jones",
        discipline: "60m Haies",
        club: "adidas Elite",
        country: "USA",
        summary:
            "La vice-championne du monde décroche la meilleure perf mondiale de la saison en 7,78 lors du World Indoor Tour de Paris.",
        mediaUrl:
            "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
        likes: 248,
        comments: 39,
        publishedAt: "2025-12-01T19:30:00Z",
        tags: ["World Indoor Tour", "Record PB", "Sprint"],
    },
    {
        id: "meeting-monaco-800m",
        headline: "Habz signe 1'43,40 et confirme son statut",
        athleteName: "Benjamin Robert",
        discipline: "800m",
        club: "SATUC Toulouse",
        country: "France",
        summary:
            "Le Français s'impose au meeting de Monaco avec un negative split parfait et s'offre la meilleure marque européenne de l'année.",
        mediaUrl:
            "https://images.unsplash.com/photo-1445384763658-0400939829cd?auto=format&fit=crop&w=1200&q=80",
        likes: 192,
        comments: 24,
        publishedAt: "2025-11-30T21:05:00Z",
        tags: ["Diamond League", "Performance", "Europe"],
    },
    {
        id: "cross-country-euro",
        headline: "Carton plein pour le relais mixte tricolore",
        athleteName: "Équipe de France",
        discipline: "Relais Cross",
        club: "Equipe Nationale",
        country: "France",
        summary:
            "Cassandre Beaugrand lance idéalement les Bleus qui conservent leur titre européen devant l'Italie et la Grande-Bretagne.",
        mediaUrl:
            "https://images.unsplash.com/photo-1489942320500-4dce9b4b1d4c?auto=format&fit=crop&w=1200&q=80",
        likes: 305,
        comments: 51,
        publishedAt: "2025-11-28T15:10:00Z",
        tags: ["Championnats d'Europe", "Relais", "Cross"],
    },
    {
        id: "pole-vault-lavillenie",
        headline: "Lavillenie reprend du plaisir à Clermont",
        athleteName: "Renaud Lavillenie",
        discipline: "Perche",
        club: "Clermont Athlé",
        country: "France",
        summary:
            "Pour son meeting indoor, Renaud efface 5,82 dès son deuxième essai et annonce viser 5,95 avant les Europe.",
        mediaUrl:
            "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
        likes: 168,
        comments: 19,
        publishedAt: "2025-11-27T18:45:00Z",
        tags: ["Indoor", "Perche", "Road to Prague"],
    },
    {
        id: "training-camp-kenya",
        headline: "Camp altitude : les fondeurs kenyans affûtent",
        athleteName: "NN Running Team",
        discipline: "Marathon",
        club: "NN Running",
        country: "Kenya",
        summary:
            "À Iten, Kiptum et son groupe enchaînent les blocs à 3'00/km en préparation pour Tokyo et Berlin.",
        mediaUrl:
            "https://images.unsplash.com/photo-1468645547353-56d250ab0b37?auto=format&fit=crop&w=1200&q=80",
        likes: 221,
        comments: 33,
        publishedAt: "2025-11-25T06:20:00Z",
        tags: ["Training Camp", "Marathon", "Road"],
    },
];
