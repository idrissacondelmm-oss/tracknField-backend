import { MD3LightTheme as DefaultTheme } from "react-native-paper";

export const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: "#0ea5e9", // bleu principal
        secondary: "#10b981", // vert succès
        error: "#ef4444",
        background: "#f8fafc",
        surface: "#ffffff",
        text: "#0f172a",
    },
    roundness: 10,
};

export const colors = {
    primary: "#0ea5e9",
    secondary: "#facc15",
    background: "#f8fafc",
    text: "#334155",
    textLight: "#64748b",
    white: "#fff",
    card: "#ffffff",
};
