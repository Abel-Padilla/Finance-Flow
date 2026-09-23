import { useCallback } from "react";
import { router } from "expo-router";
import { Text, XStack } from "tamagui";
import {
  Screen,
  Card,
  Action,
  ErrorBox,
  Loading,
  ProgressBar,
  notify,
} from "../components/ui";
import { Form } from "../components/form";
import { api } from "../services/api";
import { useResource } from "../hooks/use-resource";
import type { Summary, Budget } from "../types/api";
import { budgetSchema } from "./schemas";
import { money, bucketLabels } from "../utils/format";
export function Planning() {
  const state = useResource(
    useCallback(() => api.request<Summary>("/dashboard/summary"), []),
  );
  return (
    <Screen
      title="Planificación"
      subtitle="Dale un propósito a cada peso."
      onRefresh={state.reload}
      refreshing={state.refreshing}
    >
      <Action onPress={() => router.push("/budget/edit")}>
        Editar distribución
      </Action>
      <XStack gap="$3" flexWrap="wrap">
        <Action secondary onPress={() => router.push("/accounts")}>
          Mis cuentas
        </Action>
        <Action secondary onPress={() => router.push("/categories")}>
          Categorías
        </Action>
      </XStack>
      {state.error && <ErrorBox message={state.error} retry={state.reload} />}
      {state.loading ? (
        <Loading />
      ) : (
        state.data && (
          <>
            <Text color="$muted">
              Base del mes: {money(state.data.budgetBase)}
            </Text>
            {state.data.allocations.map((a) => (
              <Card key={a.bucket}>
                <XStack justifyContent="space-between">
                  <Text fontWeight="700">{bucketLabels[a.bucket]}</Text>
                  <Text color="$accent">{a.percentage}%</Text>
                </XStack>
                <Text fontSize="$7" fontWeight="700">
                  {money(a.planned)}
                </Text>
                <ProgressBar
                  value={
                    Number(a.planned) > 0
                      ? (Number(a.actual) / Number(a.planned)) * 100
                      : 0
                  }
                />
                <Text color="$muted">
                  {money(a.actual)}{" "}
                  {a.bucket === "savings" ? "reservados" : "utilizados"}
                </Text>
                {a.bucket !== "savings" &&
                  Number(a.actual) > Number(a.planned) && (
                    <Text color="$coral">Superaste el monto planificado.</Text>
                  )}
              </Card>
            ))}
            <Text color="$muted">
              Usamos los ingresos del mes; si no hay ingresos registrados,
              usamos tu estimación mensual.
            </Text>
          </>
        )
      )}
    </Screen>
  );
}
export function BudgetEditor() {
  const state = useResource(
    useCallback(() => api.request<Budget>("/budget"), []),
  );
  return (
    <Screen
      title="Tu distribución"
      subtitle="Los porcentajes deben sumar 100%."
    >
      {state.error ? (
        <ErrorBox message={state.error} retry={state.reload} />
      ) : state.loading ? (
        <Loading />
      ) : (
        state.data && (
          <Card>
            <Form
              schema={budgetSchema}
              initial={{
                needs: String(state.data.needs),
                wants: String(state.data.wants),
                savings: String(state.data.savings),
              }}
              fields={[
                { name: "needs", label: "Necesidades (%)", type: "money" },
                { name: "wants", label: "Deseos (%)", type: "money" },
                { name: "savings", label: "Ahorro (%)", type: "money" },
              ]}
              onSubmit={async (v) => {
                await api.request("/budget", "PUT", v);
                notify("Presupuesto actualizado");
                router.back();
              }}
            />
          </Card>
        )
      )}
    </Screen>
  );
}
