import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { CreateTrainingSessionPayload, TrainingSession } from "../types/training";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const TRAINING_ENDPOINT = `${API_URL}/trainings`;

const getAuthHeaders = async () => {
    const token = await SecureStore.getItemAsync("token");
    if (!token) throw new Error("Utilisateur non authentifié");
    return { Authorization: `Bearer ${token}` };
};

export const createTrainingSession = async (
    payload: CreateTrainingSessionPayload
): Promise<TrainingSession> => {
    const headers = await getAuthHeaders();
    const response = await axios.post<TrainingSession>(TRAINING_ENDPOINT, payload, { headers });
    return response.data;
};

export const getTrainingSession = async (id: string): Promise<TrainingSession> => {
    const headers = await getAuthHeaders();
    const response = await axios.get<TrainingSession>(`${TRAINING_ENDPOINT}/${id}`, { headers });
    return response.data;
};

export const listTrainingSessions = async (): Promise<TrainingSession[]> => {
    const headers = await getAuthHeaders();
    const response = await axios.get<TrainingSession[]>(TRAINING_ENDPOINT, { headers });
    return response.data;
};

export const deleteTrainingSession = async (id: string): Promise<void> => {
    const headers = await getAuthHeaders();
    await axios.delete(`${TRAINING_ENDPOINT}/${id}`, { headers });
};

export const updateTrainingSession = async (
    id: string,
    payload: CreateTrainingSessionPayload
): Promise<TrainingSession> => {
    const headers = await getAuthHeaders();
    const response = await axios.put<TrainingSession>(`${TRAINING_ENDPOINT}/${id}`, payload, { headers });
    return response.data;
};
