import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppearanceProvider, useAppearance } from "../src/store/theme";
import { SessionProvider, useSession } from "../src/store/session";
import { Loading, ErrorBox, Screen } from "../src/components/ui";
function Navigation() {
  const { user, loading, error, restore } = useSession(),
    { colors, mode } = useAppearance();
  if (loading)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (error)
    return (
      <Screen title="Conecta con Nexum">
        <ErrorBox message={error} retry={restore} />
      </Screen>
    );
  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.color,
          contentStyle: { backgroundColor: colors.background },
          headerBackTitle: "Volver",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!!user && !user.onboarded}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!!user && user.onboarded}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="transaction/[id]"
            options={{ title: "Movimiento" }}
          />
          <Stack.Screen
            name="transaction/edit"
            options={{ title: "Registrar movimiento", presentation: "modal" }}
          />
          <Stack.Screen
            name="accounts/index"
            options={{ title: "Mis cuentas" }}
          />
          <Stack.Screen name="accounts/[id]" options={{ title: "Cuenta" }} />
          <Stack.Screen
            name="accounts/edit"
            options={{ title: "Editar cuenta", presentation: "modal" }}
          />
          <Stack.Screen
            name="goal/[id]"
            options={{ title: "Meta de ahorro" }}
          />
          <Stack.Screen
            name="goal/edit"
            options={{ title: "Editar meta", presentation: "modal" }}
          />
          <Stack.Screen
            name="budget/edit"
            options={{ title: "Distribución mensual", presentation: "modal" }}
          />
          <Stack.Screen
            name="categories/index"
            options={{ title: "Categorías" }}
          />
          <Stack.Screen
            name="categories/edit"
            options={{ title: "Editar categoría", presentation: "modal" }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
}
export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppearanceProvider>
          <SessionProvider>
            <Navigation />
          </SessionProvider>
        </AppearanceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
