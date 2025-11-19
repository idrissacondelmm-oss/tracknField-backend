// src/api/authService.ts
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ⚠️ Si tu testes sur un vrai téléphone : remplace 10.0.2.2 par ton IP locale (ex : 192.168.1.25)

/** 🔹 Inscription utilisateur */
export const signup = async (name: string, email: string, password: string) => {
    const response = await axios.post(`${API_URL}/auth/signup`, {
        name,
        email,
        password,
    });
    return response.data;
};

/** 🔹 Connexion utilisateur */
export const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
    });
    return response.data;
};
