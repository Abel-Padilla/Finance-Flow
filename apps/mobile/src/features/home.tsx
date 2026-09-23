import { BrandLogo } from "../components/brand-logo";
import { useCallback } from "react";
import { router } from "expo-router";
import { Text, XStack, YStack } from "tamagui";
import {
  Screen,
  Card,
  Loading,
  ErrorBox,
  Action,
  Empty,
} from "../components/ui";
import { Money, TransactionRow } from "../components/financial";
import { useResource } from "../hooks/use-resource";
import { api } from "../services/api";
import { useSession } from "../store/session";
import type { Summary } from "../types/api";
import { money } from "../utils/format";
export default function Home() {
  const { user } = useSession();
  const state = useResource(
    useCallback(() => api.request<Summary>("/dashboard/summary"), []),
  );
  const d = state.data;
  const maximum = d
    ? Math.max(
        1,
        ...d.cashFlowSeries.flatMap((x) => [
          Number(x.income),
          Number(x.expenses),
        ]),
      )
    : 1;
  return (
    <Screen
      title={"Hola, " + user?.name.split(" ")[0]}
      subtitle="Tu dinero, con dirección."
      onRefresh={state.reload}
      refreshing={state.refreshing}
    >
      <BrandLogo width={152} />
      {state.error && <ErrorBox message={state.error} retry={state.reload} />}
      {state.loading ? (
        <Loading />
      ) : (
        d && (
          <>
            <Card>
              <Text color="$muted">Saldo disponible</Text>
              <Money value={d.available} size="$8" />
              <Text color="$accent">
                {money(d.totalSaved, user?.currency)} reservados por separado
              </Text>
            </Card>
            <XStack gap="$2" flexWrap="wrap">
              {[
                { label: "Ingresos", value: d.income, type: "INCOME" },
                { label: "Gastos", value: d.expenses, type: "EXPENSE" },
                { label: "Ahorro", value: d.saved, type: "SAVING" },
              ].map((k) => (
                <YStack key={k.type} flexBasis="45%" flexGrow={1}>
                  <Card>
                    <Text color="$muted">{k.label} del mes</Text>
                    <Money value={k.value} type={k.type} />
                  </Card>
                </YStack>
              ))}
            </XStack>
            <Text color="$muted">Tasa de ahorro: {d.savingsRate}%</Text>
            <XStack gap="$2" flexWrap="wrap">
              {[
                ["INCOME", "Ingreso"],
                ["EXPENSE", "Gasto"],
                ["SAVING", "Ahorro"],
              ].map(([type, label]) => (
                <Action
                  key={type}
                  secondary
                  onPress={() =>
                    router.push({
                      pathname: "/transaction/edit",
                      params: { type },
                    })
                  }
                >
                  + {label}
                </Action>
              ))}
            </XStack>
            <Card>
              <Text fontSize="$6" fontWeight="700">
                Flujo de efectivo
              </Text>
              <Money
                value={d.cashFlow}
                type={Number(d.cashFlow) < 0 ? "EXPENSE" : "INCOME"}
              />
              <Text color="$muted" fontSize="$2">
                Ingresos y gastos · últimos 6 meses
              </Text>
              {d.cashFlowSeries.map((row) => (
                <YStack key={row.month} gap="$1">
                  <Text fontSize="$2" color="$muted">
                    {row.month} · +{money(row.income)} / −{money(row.expenses)}
                  </Text>
                  <YStack
                    height={6}
                    width={`${(Number(row.income) / maximum) * 100}%`}
                    backgroundColor="$success"
                    borderRadius="$2"
                  />
                  <YStack
                    height={6}
                    width={`${(Number(row.expenses) / maximum) * 100}%`}
                    backgroundColor="$coral"
                    borderRadius="$2"
                  />
                </YStack>
              ))}
            </Card>
            <Card>
              <Text fontSize="$6" fontWeight="700">
                Gastos por categoría
              </Text>
              {d.categorySpending.length ? (
                d.categorySpending.map((c) => (
                  <XStack key={c.name} justifyContent="space-between">
                    <Text>{c.name}</Text>
                    <Money type="EXPENSE" value={c.amount} size="$4" />
                  </XStack>
                ))
              ) : (
                <Text color="$muted">Todavía no hay gastos este mes.</Text>
              )}
            </Card>
            <Text fontSize="$6" fontWeight="700">
              Movimientos recientes
            </Text>
            {d.recent.length ? (
              d.recent.map((t) => <TransactionRow key={t.id} item={t} />)
            ) : (
              <Empty text="Registra tu primer movimiento para comenzar." />
            )}
            <Card>
              <Text fontSize="$6" fontWeight="700">
                Tu resumen financiero
              </Text>
              {d.insights.map((t) => (
                <Text key={t} color="$muted">
                  {t}
                </Text>
              ))}
            </Card>
          </>
        )
      )}
    </Screen>
  );
}
