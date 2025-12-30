import http from "./http";
import { RelationshipSummary, User, PerformancePoint } from "../types/User";
import { mockUserProfile } from "../mocks/userProfile";

// 🔹 Détection automatique de l’adresse selon le contexte
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const USE_PROFILE_MOCK = process.env.EXPO_PUBLIC_USE_PROFILE_MOCK === "true";

let mockProfileState: User = { ...mockUserProfile };

const cloneMockProfile = (): User => JSON.parse(JSON.stringify(mockProfileState));

const updateMockProfileState = (updates: Partial<User> = {}): User => {
    const sanitizedEntries = Object.entries(updates).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            (acc as any)[key] = value;
        }
        return acc;
    }, {} as Partial<User>);

    mockProfileState = { ...mockProfileState, ...sanitizedEntries };
    return cloneMockProfile();
};

export type UserSearchResult = {
    id: string;
    fullName?: string;
    username?: string;
    photoUrl?: string;
};

/** 🔹 Récupère le profil utilisateur connecté */
export const getUserProfile = async (): Promise<User> => {
    try {
        if (USE_PROFILE_MOCK) {
            return cloneMockProfile();
        }
        const response = await http.get<User>(`${API_URL}/user/me`);
        return response.data;
    } catch (error: any) {
        console.error("Erreur getUserProfile :", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Erreur lors du chargement du profil");
    }
};

export const getUserProfileById = async (userId: string): Promise<User> => {
    const trimmedId = userId?.trim();
    if (!trimmedId) {
        throw new Error("Identifiant utilisateur requis");
    }

    try {
        if (USE_PROFILE_MOCK) {
            return cloneMockProfile();
        }
        const response = await http.get<User>(`${API_URL}/user/${trimmedId}`);
        return response.data;
    } catch (error: any) {
        console.error("Erreur getUserProfileById:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Impossible de charger ce profil");
    }
};

/** 🔹 Met à jour le profil utilisateur (club, discipline, pays, etc.) */
export const updateUserProfile = async (updates: Partial<User>): Promise<User> => {
    try {
        if (USE_PROFILE_MOCK) {
            return updateMockProfileState(updates);
        }
        const response = await http.put<User>(`${API_URL}/user/update`, updates);
        return response.data;
    } catch (error: any) {
        console.error("Erreur updateUserProfile :", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Erreur lors de la mise à jour du profil");
    }
};

export const updateUserCredentials = async (payload: {
    currentPassword: string;
    newPassword?: string;
    newEmail?: string;
}): Promise<{ ok: true; message: string; user: User } | { ok: false; message: string }> => {
    try {
        const response = await http.put<{ message: string; user: User }>(`${API_URL}/user/credentials`, payload);
        return { ok: true, message: response.data.message, user: response.data.user };
    } catch (error: any) {
        const serverMsg = error?.response?.data?.message;
        const message = serverMsg || error?.message || "Impossible de mettre à jour le mot de passe";
        if (__DEV__) {
            console.warn("updateUserCredentials", message);
        }
        return { ok: false, message };
    }
};

export const deleteAccount = async (): Promise<void> => {
    try {
        if (USE_PROFILE_MOCK) {
            mockProfileState = { ...mockUserProfile };
            return;
        }
        await http.delete(`${API_URL}/user/delete`);
    } catch (error: any) {
        console.error("Erreur deleteAccount :", error.response?.data || error.message);
        throw new Error(
            error?.response?.data?.message ||
            (error?.response?.status === 404
                ? "Compte introuvable"
                : "Suppression du compte impossible pour le moment"),
        );
    }
};

/** 🔹 Upload de la photo de profil */
export const uploadProfilePhoto = async (imageUri: string): Promise<string> => {
    try {
        if (USE_PROFILE_MOCK) {
            const updated = updateMockProfileState({ photoUrl: imageUri });
            return updated.photoUrl ?? imageUri;
        }
        const formData = new FormData();
        formData.append("photo", {
            uri: imageUri,
            type: "image/jpeg",
            name: "profile.jpg",
        } as any);

        const response = await http.post<{ photoUrl: string }>(`${API_URL}/user/photo`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return response.data.photoUrl;
    } catch (error: any) {
        console.error("Erreur uploadProfilePhoto :", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Erreur lors de l’upload de la photo");
    }
};

export type ReadyPlayerMeAvatarPayload = {
    rpmAvatarUrl: string;
    rpmAvatarPreviewUrl?: string;
    rpmAvatarMeta?: Record<string, any>;
    rpmAvatarId?: string;
};

export const saveReadyPlayerMeAvatar = async (payload: ReadyPlayerMeAvatarPayload): Promise<User> => {
    try {
        if (USE_PROFILE_MOCK) {
            return updateMockProfileState(payload);
        }
        const response = await http.post<User>(`${API_URL}/avatar/save`, payload);
        return response.data;
    } catch (error: any) {
        console.error("Erreur saveReadyPlayerMeAvatar:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Impossible d'enregistrer l'avatar");
    }
};

export type ReadyPlayerMeTemplate = {
    id: string;
    imageUrl: string;
    gender?: string;
    usageType?: string;
};

export type ReadyPlayerMeDraftResponse = {
    avatarId: string;
    rpmUserId: string;
    templateId: string;
    glbUrl?: string;
    previewUrl?: string;
    assets?: Record<string, any>;
};

export const fetchReadyPlayerMeTemplates = async (): Promise<ReadyPlayerMeTemplate[]> => {
    try {
        const response = await http.get<{ templates: ReadyPlayerMeTemplate[] }>(`${API_URL}/avatar/templates`);
        return response.data.templates;
    } catch (error: any) {
        console.error("Erreur fetchReadyPlayerMeTemplates:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Impossible de récupérer les templates Ready Player Me");
    }
};

export const createReadyPlayerMeDraft = async (templateId?: string): Promise<ReadyPlayerMeDraftResponse> => {
    try {
        const response = await http.post<ReadyPlayerMeDraftResponse>(
            `${API_URL}/avatar/draft`,
            templateId ? { templateId } : {},
        );
        return response.data;
    } catch (error: any) {
        console.error("Erreur createReadyPlayerMeDraft:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Impossible de préparer l'avatar Ready Player Me");
    }
};

export const getFfaPerformanceTimeline = async (
    discipline?: string
): Promise<PerformancePoint[] | Record<string, PerformancePoint[]>> => {
    try {
        const response = await http.get<PerformancePoint[] | Record<string, PerformancePoint[]>>(
            `${API_URL}/user/ffa/performance-timeline`,
            discipline ? { params: { discipline } } : undefined,
        );
        return response.data;
    } catch (error: any) {
        console.error("Erreur getFfaPerformanceTimeline:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Impossible de charger la timeline FFA");
    }
};

// 🔹 Récupère uniquement les données ffaMergedByEvent (format objet par discipline)
export const getFfaMergedByEvent = async (
    discipline?: string
): Promise<PerformancePoint[] | Record<string, PerformancePoint[]>> => {
    try {
        const response = await http.get<PerformancePoint[] | Record<string, PerformancePoint[]>>(
            `${API_URL}/user/ffa/merged-by-event`,
            discipline ? { params: { discipline } } : undefined,
        );
        return response.data;
    } catch (error: any) {
        console.error("Erreur getFfaMergedByEvent:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Impossible de charger ffaMergedByEvent");
    }
};

export const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
    const trimmed = query.trim();
    if (!trimmed) {
        return [];
    }

    if (USE_PROFILE_MOCK) {
        const lowered = trimmed.toLowerCase();
        const match =
            mockProfileState.fullName?.toLowerCase().startsWith(lowered) ||
            mockProfileState.username?.toLowerCase().startsWith(lowered);
        if (!match) {
            return [];
        }
        return [
            {
                id: (mockProfileState as any).id || (mockProfileState as any)._id || "mock-user",
                fullName: mockProfileState.fullName,
                username: mockProfileState.username,
                photoUrl: mockProfileState.photoUrl,
            },
        ];
    }

    try {
        const response = await http.get<UserSearchResult[]>(`${API_URL}/user/search`, {
            params: { q: trimmed },
        });
        return response.data;
    } catch (error: any) {
        console.error("Erreur searchUsers:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Impossible de rechercher des athlètes");
    }
};

export type FriendRequestResponse = {
    status: "pending" | "accepted" | "declined" | "removed";
    relationship: RelationshipSummary;
    message?: string;
};

export const sendFriendInvitation = async (targetUserId: string): Promise<FriendRequestResponse> => {
    const trimmedId = targetUserId?.trim();
    if (!trimmedId) {
        throw new Error("Identifiant utilisateur requis");
    }

    if (USE_PROFILE_MOCK) {
        mockProfileState.relationship = {
            status: "outgoing",
            isSelf: false,
            areFriends: false,
            outgoingRequest: true,
            incomingRequest: false,
        };
        return {
            status: "pending",
            relationship: mockProfileState.relationship,
            message: "Invitation envoyée",
        };
    }

    try {
        const response = await http.post<FriendRequestResponse>(
            `${API_URL}/user/${trimmedId}/friend-request`,
            {},
        );
        return response.data;
    } catch (error: any) {
        console.error("Erreur sendFriendInvitation:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Impossible d'envoyer l'invitation");
    }
};

export const respondToFriendInvitation = async (
    requesterId: string,
    action: "accept" | "decline",
): Promise<FriendRequestResponse> => {
    const trimmedId = requesterId?.trim();
    if (!trimmedId) {
        throw new Error("Identifiant utilisateur requis");
    }

    if (USE_PROFILE_MOCK) {
        mockProfileState.relationship = {
            status: action === "accept" ? "friends" : "none",
            isSelf: false,
            areFriends: action === "accept",
            outgoingRequest: false,
            incomingRequest: false,
        };
        return {
            status: action === "accept" ? "accepted" : "declined",
            relationship: mockProfileState.relationship,
            message: action === "accept" ? "Invitation acceptée" : "Invitation refusée",
        };
    }

    try {
        const response = await http.post<FriendRequestResponse>(
            `${API_URL}/user/${trimmedId}/friend-request/respond`,
            { action },
        );
        return response.data;
    } catch (error: any) {
        console.error("Erreur respondToFriendInvitation:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Impossible de traiter l'invitation");
    }
};

export const removeFriend = async (targetUserId: string): Promise<FriendRequestResponse> => {
    const trimmedId = targetUserId?.trim();
    if (!trimmedId) {
        throw new Error("Identifiant utilisateur requis");
    }

    if (USE_PROFILE_MOCK) {
        const currentCount = mockProfileState.relationship?.friendsCount ?? 0;
        mockProfileState.relationship = {
            status: "none",
            isSelf: false,
            areFriends: false,
            outgoingRequest: false,
            incomingRequest: false,
            friendsCount: Math.max(currentCount - 1, 0),
        };
        return {
            status: "removed",
            relationship: mockProfileState.relationship,
            message: "Vous ne suivez plus cet athlète",
        };
    }

    try {
        const response = await http.delete<FriendRequestResponse>(
            `${API_URL}/user/${trimmedId}/friend`,
        );
        return response.data;
    } catch (error: any) {
        console.error("Erreur removeFriend:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Impossible de se désabonner");
    }
};
