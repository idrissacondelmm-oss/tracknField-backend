import React, { createContext, useState, useEffect, useContext } from "react";
import * as SecureStore from "expo-secure-store";
import { login as apiLogin, signup as apiSignup } from "../api/authService";
import { getUserProfile } from "../api/userService";
import { User } from "../types/User";

type AuthContextType = {
    user: User | null;
    token: string | null;
    loading: boolean;
    signup: (name: string, email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // 🔹 Chargement initial du token et du profil utilisateur
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const savedToken = await SecureStore.getItemAsync("token");
                if (!savedToken || savedToken === "null") {
                    setUser(null);
                    setLoading(false);
                    return;
                }
                setToken(savedToken);
                const profile = await getUserProfile();
                setUser(profile);
                console.warn("✅ Utilisateur chargé depuis le stockage sécurisé");
            } catch (err) {
                console.log("⚠️ Token invalide ou expiré, suppression du token...");
                await SecureStore.deleteItemAsync("token");
                setUser(null);
                setToken(null);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, []);

    // 🔹 Inscription
    const signup = async (name: string, email: string, password: string) => {
        const data = await apiSignup(name, email, password);
        await SecureStore.setItemAsync("token", data.token);
        setUser(data.user);
        setToken(data.token);
        const profile = await getUserProfile();
        setUser(profile);
    };

    // 🔹 Connexion
    const login = async (email: string, password: string) => {
        const data = await apiLogin(email, password);
        await SecureStore.setItemAsync("token", data.token);
        setUser(data.user);
        const profile = await getUserProfile();
        setUser(profile);
        setToken(data.token);
    };

    // 🔹 Déconnexion
    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync("token");
            await SecureStore.setItemAsync("token", ""); // ✅ sécurité anti-cache
            setUser(null);
            setToken(null);
            console.log("✅ Déconnexion réussie");
        } catch (error) {
            console.error("Erreur lors de la déconnexion :", error);
        }
    };

    // 🔹 Rafraîchissement manuel du profil
    const refreshProfile = async () => {
        if (!token) return;
        try {
            const profile = await getUserProfile();
            setUser(profile);
        } catch (err) {
            console.warn("Erreur lors du rafraîchissement du profil :", err);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                signup,
                login,
                logout,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// 🔹 Hook personnalisé pour l’utiliser facilement
export const useAuth = () => useContext(AuthContext);
