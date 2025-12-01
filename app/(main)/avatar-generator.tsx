import React, { useMemo, useState, useCallback, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Button, Snackbar } from "react-native-paper";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useAuth } from "../../src/context/AuthContext";
import { saveReadyPlayerMeAvatar, createReadyPlayerMeDraft } from "../../src/api/userService";

const DEFAULT_RPM_URL = "https://kirikou.readyplayer.me/avatar";

const buildHtmlWrapper = (rpmUrl: string) => `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #020617; }
  iframe { border: 0; width: 100%; height: 100%; }
</style>
</head>
<body>
<iframe id="rpm-frame" allow="camera *; microphone *; clipboard-write" title="Ready Player Me"></iframe>
<script>
(function() {
  const FRAME_URL = ${JSON.stringify(rpmUrl)};
  const frame = document.getElementById('rpm-frame');

  function subscribe(eventName) {
    frame.contentWindow.postMessage(JSON.stringify({
      target: 'readyplayerme',
      type: 'subscribe',
      eventName
    }), '*');
  }

  window.addEventListener('message', function(event) {
    let data = event.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (err) { return; }
    }
    if (!data || data.source !== 'readyplayerme') return;
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
  });

  frame.addEventListener('load', function() {
    subscribe('v1.avatar.exported');
    subscribe('v1.user.set');
  });

  frame.src = FRAME_URL;
})();
</script>
</body>
</html>`;

export default function AvatarGeneratorScreen() {
    const router = useRouter();
    const { refreshProfile, user } = useAuth();
    const [webViewLoading, setWebViewLoading] = useState(true);
    const [initializingDraft, setInitializingDraft] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ visible: false, message: "", isError: false });
    const [draftIdentity, setDraftIdentity] = useState<{
        ownerUserId: string;
        rpmUserId?: string;
        rpmAvatarId?: string;
    } | null>(null);

    const ensureReadyPlayerMeDraft = useCallback(async () => {
        if (!user?._id) return;
        if (user?.rpmAvatarId && user?.rpmUserId) return;

        setInitializingDraft(true);
        try {
            const draft = await createReadyPlayerMeDraft();
            setDraftIdentity({ ownerUserId: user._id, rpmUserId: draft.rpmUserId, rpmAvatarId: draft.avatarId });
            await refreshProfile();
        } catch (error: any) {
            setSnackbar({
                visible: true,
                message: error?.message || "Impossible de préparer ton avatar.",
                isError: true,
            });
        } finally {
            setInitializingDraft(false);
        }
    }, [user?._id, user?.rpmAvatarId, user?.rpmUserId, refreshProfile]);

    useEffect(() => {
        ensureReadyPlayerMeDraft();
    }, [ensureReadyPlayerMeDraft]);

    const activeDraftIdentity = useMemo(() => {
        if (!draftIdentity) return null;
        if (!user?._id || draftIdentity.ownerUserId !== user._id) {
            return null;
        }
        return draftIdentity;
    }, [draftIdentity, user?._id]);

    useEffect(() => {
        if (user?.rpmAvatarId && user?.rpmUserId && activeDraftIdentity) {
            setDraftIdentity(null);
        }
    }, [activeDraftIdentity, user?.rpmAvatarId, user?.rpmUserId]);

    const rpmUrl = useMemo(() => {
        const raw = process.env.EXPO_PUBLIC_RPM_SUBDOMAIN || DEFAULT_RPM_URL;
        const sanitized = raw.endsWith("/") ? raw.slice(0, -1) : raw;
        const base = sanitized.includes("?") ? `${sanitized}&frameApi` : `${sanitized}?frameApi`;
        const rpmUser = activeDraftIdentity?.rpmUserId || user?.rpmUserId;
        const userParam = rpmUser ? `&user=${encodeURIComponent(rpmUser)}` : "";
        const hasExportedAvatar = Boolean(user?.rpmAvatarUrl);
        const rpmId = hasExportedAvatar ? activeDraftIdentity?.rpmAvatarId || user?.rpmAvatarId : undefined;
        const idParam = rpmId ? `&id=${encodeURIComponent(rpmId)}` : "";
        const clearCache = hasExportedAvatar ? "" : "&clearCache";
        return `${base}${userParam}${idParam}${clearCache}`;
    }, [activeDraftIdentity?.rpmAvatarId, activeDraftIdentity?.rpmUserId, user?.rpmAvatarId, user?.rpmUserId, user?.rpmAvatarUrl]);

    const htmlDocument = useMemo(() => buildHtmlWrapper(rpmUrl), [rpmUrl]);

    const waitingForDraft = (() => {
        if (initializingDraft) return true;
        const rpmUser = activeDraftIdentity?.rpmUserId || user?.rpmUserId;
        if (!rpmUser) return true;
        const hasExportedAvatar = Boolean(user?.rpmAvatarUrl);
        if (!hasExportedAvatar) {
            return false; // user id suffit pour ouvrir le studio en mode création
        }
        const rpmId = activeDraftIdentity?.rpmAvatarId || user?.rpmAvatarId;
        return !rpmId;
    })();

    const handleAvatarExported = useCallback(async (payload: any) => {
        const rpmFiles = Array.isArray(payload?.data?.files)
            ? payload.data.files
            : Array.isArray(payload?.files)
                ? payload.files
                : [];
        const urlFromPayload = payload?.data?.url || payload?.url;
        const glbUrl = rpmFiles.find((file: any) => file.type === "glb")?.url || urlFromPayload;
        const previewUrl = rpmFiles.find((file: any) => file.type === "png")?.url || payload?.data?.thumbnailUrl;
        const avatarId = payload?.data?.id || payload?.data?.avatarId || payload?.avatarId;

        if (!glbUrl) {
            setSnackbar({ visible: true, message: "Impossible de récupérer l'URL de l'avatar.", isError: true });
            return;
        }

        setSaving(true);
        try {
            await saveReadyPlayerMeAvatar({
                rpmAvatarUrl: glbUrl,
                rpmAvatarPreviewUrl: previewUrl,
                rpmAvatarId: avatarId,
                rpmAvatarMeta: payload?.data ?? payload,
            });
            await refreshProfile();
            setSnackbar({ visible: true, message: "Avatar sauvegardé avec succès !", isError: false });
        } catch (error: any) {
            setSnackbar({
                visible: true,
                message: error?.message || "Erreur lors de la sauvegarde de l'avatar.",
                isError: true,
            });
        } finally {
            setSaving(false);
        }
    }, [refreshProfile]);

    const onMessage = useCallback((event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.eventName === "v1.avatar.exported") {
                handleAvatarExported(data);
            }
        } catch {
            // ignore messages qui ne sont pas du JSON RPM
        }
    }, [handleAvatarExported]);

    return (
        <>
            <Stack.Screen options={{ title: "Créateur d'avatar" }} />
            <View style={styles.container}>
                <View style={styles.helperCard}>
                    <Text style={styles.helperTitle}>
                        {user?.rpmAvatarUrl ? "Modifie ton avatar Ready Player Me" : "Crée ton avatar Ready Player Me"}
                    </Text>
                    <Text style={styles.helperSubtitle}>
                        {user?.rpmAvatarUrl
                            ? "Tu peux ajuster ton avatar autant que tu veux, nous écrasons simplement l'ancien modèle."
                            : "Personnalise ton avatar sans créer de compte Ready Player Me. Une fois validé, il sera automatiquement associé à ton profil Track&Field."}
                    </Text>
                </View>

                <View style={styles.webViewWrapper}>
                    {waitingForDraft ? (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#38bdf8" />
                            <Text style={styles.loadingText}>Préparation de ton avatar...</Text>
                        </View>
                    ) : (
                        <>
                            {webViewLoading && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator size="large" color="#38bdf8" />
                                    <Text style={styles.loadingText}>Chargement du studio...</Text>
                                </View>
                            )}
                            <WebView
                                originWhitelist={["*"]}
                                source={{ html: htmlDocument }}
                                onLoadEnd={() => setWebViewLoading(false)}
                                onMessage={onMessage}
                                javaScriptEnabled
                                allowsInlineMediaPlayback
                                mediaPlaybackRequiresUserAction={false}
                                mixedContentMode="always"
                                style={styles.webView}
                            />
                        </>
                    )}
                </View>

                <View style={styles.actions}>
                    <Button mode="contained-tonal" style={styles.primaryAction} onPress={() => router.push("/avatar-loader")}>
                        Prévisualiser dans l{"'"}app
                    </Button>
                    <Button mode="contained" style={styles.secondaryAction} onPress={() => router.back()}>
                        Terminer
                    </Button>
                </View>
            </View>

            <Snackbar
                visible={snackbar.visible}
                onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
                duration={4000}
                style={snackbar.isError ? styles.errorSnackbar : styles.successSnackbar}
            >
                {snackbar.message}
            </Snackbar>

            {saving && (
                <View style={styles.savingOverlay}>
                    <ActivityIndicator size="large" color="#f8fafc" />
                    <Text style={styles.savingText}>Sauvegarde en cours...</Text>
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#020617",
        padding: 16,
        gap: 16,
    },
    helperCard: {
        backgroundColor: "#0f172a",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#1e293b",
    },
    helperTitle: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    helperSubtitle: {
        color: "#94a3b8",
        fontSize: 14,
        lineHeight: 20,
    },
    webViewWrapper: {
        flex: 1,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#1e293b",
        backgroundColor: "#0f172a",
    },
    webView: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2,
        backgroundColor: "rgba(2, 6, 23, 0.85)",
        gap: 12,
    },
    loadingText: {
        color: "#94a3b8",
        fontSize: 14,
    },
    actions: {
        flexDirection: "row",
        gap: 12,
        justifyContent: "space-between",
    },
    primaryAction: {
        flex: 1,
        borderRadius: 12,
    },
    secondaryAction: {
        flex: 1,
        backgroundColor: "#38bdf8",
    },
    errorSnackbar: {
        backgroundColor: "#ef4444",
    },
    successSnackbar: {
        backgroundColor: "#16a34a",
    },
    savingOverlay: {
        position: "absolute",
        bottom: 32,
        left: 16,
        right: 16,
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    savingText: {
        color: "#f8fafc",
        fontSize: 15,
        fontWeight: "600",
    },
});
