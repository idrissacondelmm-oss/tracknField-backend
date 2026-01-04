import { Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { requireOptionalNativeModule } from "expo-modules-core";

const PUSH_TOKEN_KEY = "expoPushToken";

export const ensureNotificationHandlerConfigured = () => {
    if (!isPushNotificationsAvailable()) return;

    const Notifications = getNotificationsModule();
    if (!Notifications) return;

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
};

type NotificationsModule = typeof import("expo-notifications");
type DeviceModule = typeof import("expo-device");

export const isPushNotificationsAvailable = (): boolean => {
    try {
        // expo-notifications requires this native module at import time.
        // If the current runtime/binary doesn't include it, requiring expo-notifications will crash.
        return Boolean(requireOptionalNativeModule("ExpoPushTokenManager"));
    } catch {
        return false;
    }
};

const getNotificationsModule = (): NotificationsModule | null => {
    try {
        if (!isPushNotificationsAvailable()) return null;
        // Lazy require to avoid crashing when the native module isn't included
        // (e.g., outdated dev-client build).
        return require("expo-notifications") as NotificationsModule;
    } catch {
        return null;
    }
};

const getDeviceModule = (): DeviceModule | null => {
    try {
        return require("expo-device") as DeviceModule;
    } catch {
        return null;
    }
};

const getProjectId = (): string | undefined => {
    const fromExpoConfig = (Constants.expoConfig as any)?.extra?.eas?.projectId;
    const fromEasConfig = (Constants as any)?.easConfig?.projectId;
    return fromExpoConfig || fromEasConfig;
};

export const getStoredExpoPushToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    } catch {
        return null;
    }
};

export const clearStoredExpoPushToken = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
    } catch {
        // ignore
    }
};

const storeExpoPushToken = async (token: string): Promise<void> => {
    try {
        await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
    } catch {
        // ignore
    }
};

export type RegisterForPushOptions = {
    promptIfNeeded?: boolean;
};

export const registerForPushNotificationsAsync = async (
    options: RegisterForPushOptions = { promptIfNeeded: true },
): Promise<string | null> => {
    const Notifications = getNotificationsModule();
    if (!Notifications) return null;

    const Device = getDeviceModule();
    const isDevice = Device?.isDevice ?? true;
    if (!isDevice) return null;

    // Android requires a channel.
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#22d3ee",
        });
    }

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (finalStatus !== "granted" && options.promptIfNeeded) {
        const requested = await Notifications.requestPermissionsAsync();
        finalStatus = requested.status;
    }

    if (finalStatus !== "granted") {
        return null;
    }

    // On Android, expo-notifications relies on Firebase/FCM at runtime.
    // If google-services.json isn't integrated in the native build, token fetch can fail with:
    // "Default FirebaseApp is not initialized...".
    if (Platform.OS === "android") {
        const googleServicesFile = (Constants.expoConfig as any)?.android?.googleServicesFile;
        if (!googleServicesFile) {
            throw new Error(
                "Notifications Android: FCM n'est pas configuré. Crée un projet Firebase, ajoute l'app Android (package: com.kirikoutrackandfield.tracknfieldmobile), télécharge google-services.json, place-le à la racine de tracknfield-mobile, puis ajoute android.googleServicesFile dans app.json et rebuild (expo run:android).",
            );
        }
    }

    const projectId = getProjectId();
    let tokenResponse: { data: string };
    try {
        tokenResponse = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined,
        );
    } catch (error: any) {
        const message = String(error?.message || "");
        if (message.includes("Default FirebaseApp is not initialized")) {
            throw new Error(
                "Notifications Android: Firebase/FCM n'est pas initialisé dans cette build. Ajoute google-services.json (Firebase), configure app.json (android.googleServicesFile), puis rebuild l'app (expo run:android).",
            );
        }
        throw error;
    }

    const token = tokenResponse.data;
    if (typeof token === "string" && token.length > 0) {
        await storeExpoPushToken(token);
        return token;
    }

    return null;
};
