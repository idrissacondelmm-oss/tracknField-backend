import React from "react";
import { Redirect, Slot } from "expo-router";
import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
    children?: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user } = useAuth();

    // 🔒 Si aucun utilisateur connecté → redirige vers la page d'accueil
    if (!user) {
        return <Redirect href="/" />;
    }

    // ✅ Si connecté → on affiche le contenu enfant (les pages du groupe)
    return <>{children ? children : <Slot />}</>;
}
