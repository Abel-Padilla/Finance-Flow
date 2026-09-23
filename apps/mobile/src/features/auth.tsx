import { BrandLogo } from "../components/brand-logo";
import { ApiError } from "../services/client-core";
import { router } from "expo-router";
import { Text, YStack } from "tamagui";
import { Screen, Card, Action, notify } from "../components/ui";
import { Form } from "../components/form";
import { loginSchema, registerSchema, onboardingSchema } from "./schemas";
import { api } from "../services/api";
import { useSession } from "../store/session";
export function AuthScreen({ register = false }: { register?: boolean }) {
  const { setUser } = useSession();
  return (
    <Screen>
      <YStack paddingVertical="$6" gap="$3">
        <BrandLogo width={220} />
        <Text fontSize="$8" fontWeight="700">
          {register ? "Crea tu cuenta" : "Qué bueno verte de nuevo"}
        </Text>
        <Text color="$muted">Tu dinero, con dirección.</Text>
      </YStack>
      <Card>
        <Form
          schema={register ? registerSchema : loginSchema}
          initial={{ name: "", email: "", password: "", currency: "MXN" }}
          fields={[
            ...(register ? [{ name: "name", label: "Nombre" }] : []),
            { name: "email", label: "Correo electrónico", type: "email" },
            {
              name: "password",
              label: "Contraseña",
              type: "password",
              hint: register
                ? "Al menos 8 caracteres, mayúscula, minúscula y número."
                : undefined,
            },
          ]}
          label={register ? "Crear cuenta" : "Iniciar sesión"}
          onSubmit={async (v) => {
            const user = await api.authenticate(
              register ? "register" : "login",
              v,
            );
            setUser(user);
            router.replace("/");
          }}
        />
      </Card>
      <Action
        secondary
        onPress={() =>
          router.replace(register ? "/(auth)/login" : "/(auth)/register")
        }
      >
        {register ? "Ya tengo cuenta" : "Crear una cuenta"}
      </Action>
    </Screen>
  );
}
export function Onboarding() {
  const { user, setUser, reload, logout } = useSession();
  return (
    <Screen
      title="Tu punto de partida"
      subtitle="Configura tu dinero en MXN y dale un destino."
    >
      <BrandLogo />
      <Card>
        <Form
          schema={onboardingSchema}
          initial={{
            initialBalance: "0",
            monthlyIncome: "0",
            needs: "50",
            wants: "30",
            savings: "20",
            goalName: "",
            goalTarget: "",
          }}
          fields={[
            {
              name: "initialBalance",
              label: "Dinero disponible hoy",
              type: "money",
            },
            {
              name: "monthlyIncome",
              label: "Ingreso mensual estimado",
              type: "money",
            },
            { name: "needs", label: "Necesidades (%)", type: "money" },
            { name: "wants", label: "Deseos (%)", type: "money" },
            { name: "savings", label: "Ahorro (%)", type: "money" },
            { name: "goalName", label: "Primera meta (opcional)" },
            { name: "goalTarget", label: "Monto objetivo", type: "money" },
          ]}
          label="Empezar"
          onSubmit={async (v) => {
            try {
              await api.request("/users/onboarding", "POST", v);
              if (user)
                setUser({
                  ...user,
                  onboarded: true,
                  monthlyIncome: String(v.monthlyIncome),
                });
            } catch (e) {
              // A lost response may leave the server already onboarded. Restore its state.
              if (e instanceof ApiError && e.status === 409) await reload();
              else throw e;
            }
            router.replace("/");
          }}
        />
      </Card>
      <Action
        secondary
        onPress={() => {
          void logout().catch(() =>
            notify("Sesión cerrada en este dispositivo"),
          );
        }}
      >
        Cerrar sesión
      </Action>
    </Screen>
  );
}
