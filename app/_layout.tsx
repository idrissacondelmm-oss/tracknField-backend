// app/_layout.tsx
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "../src/context/AuthContext";
import AuthGate from "../src/components/AuthGate";
import { theme } from "../src/styles/theme";
import { GestureHandlerRootView } from "react-native-gesture-handler";


export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <AuthGate>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(main)" />
                <Stack.Screen name="avatar-loader" />
              </Stack>
            </GestureHandlerRootView>
          </AuthGate>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
