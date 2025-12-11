// app/_layout.tsx
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../src/context/AuthContext";
import { TrainingProvider } from "../src/context/TrainingContext";
import AuthGate from "../src/components/AuthGate";
import AppBackground from "../src/components/layout/AppBackground";
import { theme } from "../src/styles/theme";


export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <TrainingProvider>
            <AuthGate>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <AppBackground>
                  <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(main)" />
                    <Stack.Screen name="avatar-loader" />
                  </Stack>
                </AppBackground>
              </GestureHandlerRootView>
            </AuthGate>
          </TrainingProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
