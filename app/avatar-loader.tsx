import React, { useEffect, useRef } from "react";
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

const avatarModel = require("../assets/avatar/avatar01.glb");

export default function AvatarLoaderScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { rotationY, zoom, cameraPosition, cameraTarget, panHandlers, pinchHandlers, registerBounds } = useAvatarCamera();
    const panRef = useRef<PanGestureHandler>(null);
    const pinchRef = useRef<PinchGestureHandler>(null);

    return (
        <>
            <Stack.Screen options={{ title: "Avatar 3D", headerShown: true }} />

            <View style={[styles.container, {
                paddingTop: insets.top + 16,
                paddingBottom: Math.max(insets.bottom, 16),
            }]}>
                <Text style={styles.title}>Prévisualisation</Text>
                <Text style={styles.subtitle}>
                    Auto-centering + auto-zoom du modèle 3D (.glb)
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
                                    />
                                </FilamentView>
                            </FilamentScene>
                        </View>
                    </PinchGestureHandler>
                </PanGestureHandler>

                <Button mode="contained-tonal" style={styles.button} onPress={() => router.back()}>
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
};

function AvatarModel({ rotationY, zoom, registerBounds }: AvatarModelProps) {
    const model = useModel(avatarModel);

    useEffect(() => {
        if (model.state === "loaded") {
            registerBounds(model.boundingBox);
        }
    }, [model, registerBounds]);

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
    button: {
        marginTop: 18,
        alignSelf: "center",
        borderRadius: 10,
        paddingHorizontal: 24,
    },
});
