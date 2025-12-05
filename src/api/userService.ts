import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { User } from "../types/User";
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

/** 🧠 Récupération du token JWT depuis SecureStore */
const getAuthHeaders = async () => {
    const token = await SecureStore.getItemAsync("token");
    if (!token) throw new Error("Aucun token trouvé, utilisateur non connecté");
    return { Authorization: `Bearer ${token}` };
};

/** 🔹 Récupère le profil utilisateur connecté */
export const getUserProfile = async (): Promise<User> => {
    try {
        if (USE_PROFILE_MOCK) {
            return cloneMockProfile();
        }
        const headers = await getAuthHeaders();
        const response = await axios.get<User>(`${API_URL}/user/me`, { headers });
        return response.data;
    } catch (error: any) {
        console.error("Erreur getUserProfile :", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Erreur lors du chargement du profil");
    }
};

/** 🔹 Met à jour le profil utilisateur (club, discipline, pays, etc.) */
export const updateUserProfile = async (updates: Partial<User>): Promise<User> => {
    try {
        if (USE_PROFILE_MOCK) {
            return updateMockProfileState(updates);
        }
        const headers = await getAuthHeaders();
        const response = await axios.put<User>(`${API_URL}/user/update`, updates, { headers });
        return response.data;
    } catch (error: any) {
        console.error("Erreur updateUserProfile :", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Erreur lors de la mise à jour du profil");
    }
};

/** 🔹 Upload de la photo de profil */
export const uploadProfilePhoto = async (imageUri: string): Promise<string> => {
    try {
        if (USE_PROFILE_MOCK) {
            const updated = updateMockProfileState({ photoUrl: imageUri });
            return updated.photoUrl ?? imageUri;
        }
        const headers = await getAuthHeaders();
        const formData = new FormData();
        formData.append("photo", {
            uri: imageUri,
            type: "image/jpeg",
            name: "profile.jpg",
        } as any);

        const response = await axios.post<{ photoUrl: string }>(
            `${API_URL}/user/photo`,
            formData,
            {
                headers: {
                    ...headers,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

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
        const headers = await getAuthHeaders();
        const response = await axios.post<User>(`${API_URL}/avatar/save`, payload, { headers });
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
        const headers = await getAuthHeaders();
        const response = await axios.get<{ templates: ReadyPlayerMeTemplate[] }>(`${API_URL}/avatar/templates`, { headers });
        return response.data.templates;
    } catch (error: any) {
        console.error("Erreur fetchReadyPlayerMeTemplates:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Impossible de récupérer les templates Ready Player Me");
    }
};

export const createReadyPlayerMeDraft = async (templateId?: string): Promise<ReadyPlayerMeDraftResponse> => {
    try {
        const headers = await getAuthHeaders();
        const response = await axios.post<ReadyPlayerMeDraftResponse>(
            `${API_URL}/avatar/draft`,
            templateId ? { templateId } : {},
            { headers }
        );
        return response.data;
    } catch (error: any) {
        console.error("Erreur createReadyPlayerMeDraft:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Impossible de préparer l'avatar Ready Player Me");
    }
};
