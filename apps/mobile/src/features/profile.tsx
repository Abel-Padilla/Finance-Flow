import { useState } from "react";
import { Text } from "tamagui";
import { router } from "expo-router";
import { Alert } from "react-native";
import { Screen, Card, Action, Picker, notify } from "../components/ui";
import { Form } from "../components/form";
import { useSession } from "../store/session";
import { useAppearance } from "../store/theme";
import { settingsSchema } from "./schemas";
import { api } from "../services/api";
export default function Profile() {
  const { user, reload, logout } = useSession(),
    { preference, setPreference } = useAppearance();
  const [busy, setBusy] = useState(false);
  return (
    <Screen title="Tu perfil" subtitle={user?.email}>
      <Card>
        <Text color="$muted">Moneda: {user?.currency} · cuenta personal</Text>
        <Form
          schema={settingsSchema}
          initial={{
            name: user?.name || "",
            monthlyIncome: user?.monthlyIncome || "0",
          }}
          fields={[
            { name: "name", label: "Nombre" },
            {
              name: "monthlyIncome",
              label: "Ingreso mensual estimado (MXN)",
              type: "money",
            },
          ]}
          onSubmit={async (v) => {
            await api.request("/users/settings", "PATCH", v);
            await reload();
            notify("Perfil actualizado");
          }}
        />
      </Card>
      <Card>
        <Text fontWeight="700">Apariencia</Text>
        <Picker
          label="Tema"
          value={preference}
          options={[
            { value: "system", label: "Según el dispositivo" },
            { value: "light", label: "Claro" },
            { value: "dark", label: "Oscuro" },
          ]}
          onChange={(v) => setPreference(v as "system" | "light" | "dark")}
        />
      </Card>
      <Action secondary onPress={() => router.push("/accounts")}>
        Administrar mis cuentas
      </Action>
      <Action
        secondary
        onPress={() =>
          Alert.alert(
            "¿Reabrir configuración inicial?",
            "Se conservarán tus cuentas, movimientos y metas.",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Continuar",
                onPress: () => {
                  void api
                    .request("/users/reset-onboarding", "POST")
                    .then(reload)
                    .catch((e) => notify("No se pudo actualizar", e.message));
                },
              },
            ],
          )
        }
      >
        Revisar mi punto de partida
      </Action>
      <Action
        danger
        disabled={busy}
        onPress={() => {
          setBusy(true);
          void logout()
            .catch(() =>
              notify(
                "Sesión cerrada en este dispositivo",
                "No fue posible confirmar la revocación remota.",
              ),
            )
            .finally(() => setBusy(false));
        }}
      >
        Cerrar sesión
      </Action>
    </Screen>
  );
}
