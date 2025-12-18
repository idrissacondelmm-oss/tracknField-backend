import axios from "axios";
import * as SecureStore from "expo-secure-store";
import {
    CreateTrainingGroupPayload,
    TrainingGroupSummary,
    UpdateTrainingGroupPayload,
} from "../types/trainingGroup";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const GROUPS_ENDPOINT = `${API_URL}/groups`;

const getAuthHeaders = async () => {
    const token = await SecureStore.getItemAsync("token");
    if (!token) throw new Error("Utilisateur non authentifié");
    return { Authorization: `Bearer ${token}` };
};

export const createTrainingGroup = async (payload: CreateTrainingGroupPayload): Promise<TrainingGroupSummary> => {
    const headers = await getAuthHeaders();
    const response = await axios.post<TrainingGroupSummary>(GROUPS_ENDPOINT, payload, { headers });
    return response.data;
};

export const searchTrainingGroups = async (query = "", limit = 25): Promise<TrainingGroupSummary[]> => {
    const headers = await getAuthHeaders();
    const response = await axios.get<TrainingGroupSummary[]>(GROUPS_ENDPOINT, {
        headers,
        params: { q: query, limit },
    });
    return response.data;
};

export const joinTrainingGroup = async (groupId: string): Promise<TrainingGroupSummary> => {
    const headers = await getAuthHeaders();
    const response = await axios.post<TrainingGroupSummary>(`${GROUPS_ENDPOINT}/${groupId}/join`, {}, { headers });
    return response.data;
};

export const addMemberToTrainingGroup = async (
    groupId: string,
    userId: string
): Promise<TrainingGroupSummary> => {
    const headers = await getAuthHeaders();
    const response = await axios.post<TrainingGroupSummary>(
        `${GROUPS_ENDPOINT}/${groupId}/members`,
        { userId },
        { headers }
    );
    return response.data;
};

export const removeMemberFromTrainingGroup = async (
    groupId: string,
    memberId: string
): Promise<TrainingGroupSummary> => {
    const headers = await getAuthHeaders();
    const response = await axios.delete<TrainingGroupSummary>(
        `${GROUPS_ENDPOINT}/${groupId}/members/${memberId}`,
        { headers }
    );
    return response.data;
};

export const listMyTrainingGroups = async (): Promise<TrainingGroupSummary[]> => {
    const headers = await getAuthHeaders();
    const response = await axios.get<TrainingGroupSummary[]>(`${GROUPS_ENDPOINT}/mine`, { headers });
    return response.data;
};

export const getTrainingGroup = async (groupId: string): Promise<TrainingGroupSummary> => {
    const headers = await getAuthHeaders();
    const response = await axios.get<TrainingGroupSummary>(`${GROUPS_ENDPOINT}/${groupId}`, { headers });
    return response.data;
};

export const updateTrainingGroup = async (
    groupId: string,
    payload: UpdateTrainingGroupPayload
): Promise<TrainingGroupSummary> => {
    const headers = await getAuthHeaders();
    const response = await axios.patch<TrainingGroupSummary>(`${GROUPS_ENDPOINT}/${groupId}`, payload, { headers });
    return response.data;
};
