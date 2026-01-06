import React, { useEffect, useMemo, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { View, StyleSheet, Text } from "react-native";
import { Button, ActivityIndicator } from "react-native-paper";
import {
    FilamentScene,
    FilamentView,
    Camera,
    DefaultLight,
    useModel,
    ModelRenderer,
} from "react-native-filament";
import type { AABB } from "react-native-filament";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PanGestureHandler, PinchGestureHandler } from "react-native-gesture-handler";
import { useAvatarCamera } from "../src/hooks/useAvatarCamera";
import { useAuth } from "../src/context/AuthContext";

const avatarModel = require("../assets/avatar/avatar01.glb");

export default function AvatarLoaderScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const { rotationY, zoom, cameraPosition, cameraTarget, panHandlers, pinchHandlers, registerBounds } = useAvatarCamera();
    const panRef = useRef<PanGestureHandler>(null);
    const pinchRef = useRef<PinchGestureHandler>(null);

    const modelSource = useMemo(() => {
        if (user?.rpmAvatarUrl) {
            return { uri: user.rpmAvatarUrl } as const;
        }
        return avatarModel;
    }, [user?.rpmAvatarUrl]);

    const hasCustomAvatar = Boolean(user?.rpmAvatarUrl);

    const screenOptions = useMemo(() => ({ title: "Avatar 3D", headerShown: true }), []);

    return (
        <>
            <Stack.Screen options={screenOptions} />

            <View style={[styles.container, {
                paddingTop: insets.top + 16,
                paddingBottom: Math.max(insets.bottom, 16),
            }]}>
                <Text style={styles.title}>Prévisualisation</Text>
                <Text style={styles.subtitle}>
                    Auto-centering + auto-zoom du modèle 3D (.glb)
                </Text>
                <Text style={[styles.status, hasCustomAvatar ? styles.statusSuccess : styles.statusWarning]}>
                    {hasCustomAvatar
                        ? "Avatar Ready Player Me chargé"
                        : "Aucun avatar personnalisé : modèle de démo"}
                </Text>

                <PanGestureHandler
                    ref={panRef}
                    simultaneousHandlers={pinchRef}
                    onGestureEvent={panHandlers.onGestureEvent}
                    onHandlerStateChange={panHandlers.onHandlerStateChange}
                >
                    <PinchGestureHandler
                        ref={pinchRef}
                        simultaneousHandlers={panRef}
                        onGestureEvent={pinchHandlers.onGestureEvent}
                        onHandlerStateChange={pinchHandlers.onHandlerStateChange}
                    >
                        <View style={styles.viewerCard}>
                            <FilamentScene
                                fallback={
                                    <View style={styles.loadingState}>
                                        <ActivityIndicator size="large" color="#38bdf8" />
                                        <Text style={styles.loadingText}>Chargement...</Text>
                                    </View>
                                }
                            >
                                <FilamentView style={styles.viewer}>
                                    <Camera cameraPosition={cameraPosition} cameraTarget={cameraTarget} />

                                    <DefaultLight />

                                    <AvatarModel
                                        rotationY={rotationY}
                                        zoom={zoom}
                                        registerBounds={registerBounds}
                                        modelSource={modelSource}
                                    />
                                </FilamentView>
                            </FilamentScene>
                        </View>
                    </PinchGestureHandler>
                </PanGestureHandler>

                <Button
                    mode="contained"
                    style={styles.primaryButton}
                    onPress={() => router.push("/(main)/account")}
                >
                    Créer ou modifier mon avatar
                </Button>
                <Button
                    mode="contained-tonal"
                    style={styles.button}
                    onPress={() => (router.canGoBack?.() ? router.back() : router.replace("/(main)/account"))}
                >
                    Retour
                </Button>
            </View>
        </>
    );
}

type AvatarModelProps = {
    rotationY: number;
    zoom: number;
    registerBounds: (bbox: AABB) => void;
    modelSource: any;
};

function AvatarModel({ rotationY, zoom, registerBounds, modelSource }: AvatarModelProps) {
    const model = useModel(modelSource);
    const lastBoundsRef = useRef<AABB | null>(null);
    const boundingBox = model.state === "loaded" ? model.boundingBox : null;

    useEffect(() => {
        if (!boundingBox) {
            return;
        }

        const bounds = boundingBox;
        const previous = lastBoundsRef.current;
        const sameBounds =
            previous?.center?.every((value, idx) => value === bounds.center[idx]) &&
            previous?.halfExtent?.every((value, idx) => value === bounds.halfExtent[idx]);

        if (sameBounds) {
            return;
        }

        lastBoundsRef.current = bounds;
        registerBounds(bounds);
    }, [boundingBox, registerBounds]);

    if (model.state !== "loaded") {
        return null;
    }

    return (
        <ModelRenderer
            model={model}
            transformToUnitCube
            castShadow
            receiveShadow
            multiplyWithCurrentTransform={false}
            rotate={[0, rotationY, 0]}
            scale={[zoom, zoom, zoom]}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#020617",
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#f8fafc",
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 15,
        color: "#cbd5f5",
        marginBottom: 16,
    },
    status: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 12,
    },
    statusSuccess: {
        color: "#4ade80",
    },
    statusWarning: {
        color: "#fbbf24",
    },
    viewerCard: {
        flex: 1,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#1e293b",
        backgroundColor: "#0f172a",
    },
    viewer: {
        flex: 1,
    },
    loadingState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingText: {
        color: "#93c5fd",
        fontSize: 14,
    },
    primaryButton: {
        marginTop: 18,
        alignSelf: "stretch",
        borderRadius: 10,
        paddingHorizontal: 24,
        backgroundColor: "#38bdf8",
    },
    button: {
        marginTop: 18,
        alignSelf: "center",
        borderRadius: 10,
        paddingHorizontal: 24,
    },
});
