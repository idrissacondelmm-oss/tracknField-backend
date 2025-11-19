import { useCallback, useRef, useState, useEffect } from "react";
import type {
    PanGestureHandlerGestureEvent,
    PanGestureHandlerStateChangeEvent,
    PinchGestureHandlerGestureEvent,
    PinchGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";
import { State } from "react-native-gesture-handler";
import type { AABB } from "react-native-filament";

type Vector3 = [number, number, number];
const DEFAULT_POSITION: Vector3 = [0, 0, 3];
const DEFAULT_TARGET: Vector3 = [0, 0, 0];

export type AvatarCameraHook = {
    rotationY: number;
    zoom: number;
    cameraPosition: Vector3;
    cameraTarget: Vector3;
    panHandlers: {
        onGestureEvent: (event: PanGestureHandlerGestureEvent) => void;
        onHandlerStateChange: (event: PanGestureHandlerStateChangeEvent) => void;
    };
    pinchHandlers: {
        onGestureEvent: (event: PinchGestureHandlerGestureEvent) => void;
        onHandlerStateChange: (event: PinchGestureHandlerStateChangeEvent) => void;
    };
    registerBounds: (bbox: AABB) => void;
    resetView: () => void;
};

export function useAvatarCamera(): AvatarCameraHook {
    const [rotationY, setRotationY] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [cameraPosition, setCameraPosition] = useState<Vector3>(DEFAULT_POSITION);
    const [cameraTarget, setCameraTarget] = useState<Vector3>(DEFAULT_TARGET);
    const rotationOffset = useRef(0);
    const zoomOffset = useRef(1);
    const boundsRef = useRef<AABB | null>(null);

    const clampZoom = useCallback((value: number) => Math.min(1.8, Math.max(0.6, value)), []);

    const centerCamera = useCallback(() => {
        const bbox = boundsRef.current;
        if (!bbox) {
            setCameraPosition(DEFAULT_POSITION);
            setCameraTarget(DEFAULT_TARGET);
            return;
        }

        const maxHalfExtent = Math.max(bbox.halfExtent[0], bbox.halfExtent[1], bbox.halfExtent[2]);
        const distance = maxHalfExtent * 2.8;
        setCameraPosition([0, bbox.center[1], distance]);
        setCameraTarget([bbox.center[0], bbox.center[1], bbox.center[2]]);
    }, []);

    const resetView = useCallback(() => {
        rotationOffset.current = 0;
        zoomOffset.current = 1;
        setRotationY(0);
        setZoom(1);
        centerCamera();
    }, [centerCamera]);

    const registerBounds = useCallback((bbox: AABB) => {
        boundsRef.current = bbox;
        centerCamera();
    }, [centerCamera]);

    const onPanGesture = useCallback((event: PanGestureHandlerGestureEvent) => {
        if (event.nativeEvent.state !== State.ACTIVE) return;
        const delta = event.nativeEvent.translationX * 0.01;
        setRotationY(rotationOffset.current + delta);
    }, []);

    const onPanStateChange = useCallback((event: PanGestureHandlerStateChangeEvent) => {
        if (event.nativeEvent.oldState !== State.ACTIVE) return;
        const delta = event.nativeEvent.translationX * 0.01;
        rotationOffset.current += delta;
        setRotationY(rotationOffset.current);
    }, []);

    const onPinchGesture = useCallback((event: PinchGestureHandlerGestureEvent) => {
        if (event.nativeEvent.state !== State.ACTIVE) return;
        const next = clampZoom(zoomOffset.current * event.nativeEvent.scale);
        setZoom(next);
    }, [clampZoom]);

    const onPinchStateChange = useCallback((event: PinchGestureHandlerStateChangeEvent) => {
        if (event.nativeEvent.oldState !== State.ACTIVE) return;
        const next = clampZoom(zoomOffset.current * event.nativeEvent.scale);
        zoomOffset.current = next;
        setZoom(next);
    }, [clampZoom]);

    useEffect(() => {
        resetView();
    }, [resetView]);

    return {
        rotationY,
        zoom,
        cameraPosition,
        cameraTarget,
        panHandlers: {
            onGestureEvent: onPanGesture,
            onHandlerStateChange: onPanStateChange,
        },
        pinchHandlers: {
            onGestureEvent: onPinchGesture,
            onHandlerStateChange: onPinchStateChange,
        },
        registerBounds,
        resetView,
    };
}
