import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { User } from "../types/User";

// 🔹 Détection automatique de l’adresse selon le contexte
const API_URL = process.env.EXPO_PUBLIC_API_URL;

/** 🧠 Récupération du token JWT depuis SecureStore */
const getAuthHeaders = async () => {
    const token = await SecureStore.getItemAsync("token");
    if (!token) throw new Error("Aucun token trouvé, utilisateur non connecté");
    return { Authorization: `Bearer ${token}` };
};

/** 🔹 Récupère le profil utilisateur connecté */
export const getUserProfile = async (): Promise<User> => {
    try {
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
    photoUrl?: string;
};

export const saveReadyPlayerMeAvatar = async (payload: ReadyPlayerMeAvatarPayload): Promise<User> => {
    return updateUserProfile(payload);
};
