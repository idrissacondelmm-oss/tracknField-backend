import { MD3DarkTheme as DefaultTheme } from "react-native-paper";

export const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: "#22d3ee",
        secondary: "#fbbf24",
        error: "#ef4444",
        background: "transparent",
        surface: "rgba(15,23,42,0.75)",
        surfaceVariant: "rgba(15,23,42,0.55)",
        outline: "rgba(148,163,184,0.4)",
        onSurface: "#f8fafc",
        onSurfaceVariant: "#cbd5e1",
        onPrimary: "#02131d",
    },
    roundness: 16,
};

export const colors = {
    primary: "#22d3ee",
    secondary: "#fbbf24",
    background: "#000000",
    text: "#f8fafc",
    textLight: "#cbd5e1",
    white: "#ffffff",
    card: "rgba(15,23,42,0.7)",
};
