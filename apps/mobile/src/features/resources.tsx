import { money, dateLabel } from "../utils/format";
import { useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable } from "react-native";
import { Text } from "tamagui";
import {
  Screen,
  Card,
  Loading,
  ErrorBox,
  Empty,
  Action,
  confirmDelete,
  notify,
} from "../components/ui";
import { GoalCard, Money } from "../components/financial";
import { Form } from "../components/form";
import { useResource } from "../hooks/use-resource";
import { api } from "../services/api";
import type { Account, Goal, Category } from "../types/api";
import { accountSchema, goalSchema, categorySchema } from "./schemas";
export const accountOptions = [
  { value: "BANK", label: "Banco" },
  { value: "CASH", label: "Efectivo" },
  { value: "DEBIT", label: "Débito" },
  { value: "OTHER", label: "Otra" },
];
type Kind = "accounts" | "goals" | "categories";
type Item = Account | Goal | Category;
const paths = {
  accounts: "/accounts",
  goals: "/savings-goals",
  categories: "/categories",
};
const titles = {
  accounts: "Mis cuentas",
  goals: "Metas de ahorro",
  categories: "Categorías",
};
const editor = {
  accounts: "/accounts/edit",
  goals: "/goal/edit",
  categories: "/categories/edit",
} as const;
export function ResourceList({ kind }: { kind: Kind }) {
  const state = useResource(
    useCallback(() => api.request<Item[]>(paths[kind]), [kind]),
  );
  return (
    <Screen
      title={titles[kind]}
      subtitle={
        kind === "goals"
          ? "Acércate a lo que quieres lograr."
          : "Todo tu dinero, bien organizado."
      }
      onRefresh={state.reload}
      refreshing={state.refreshing}
    >
      <Action onPress={() => router.push(editor[kind])}>
        +{" "}
        {kind === "accounts"
          ? "Nueva cuenta"
          : kind === "goals"
            ? "Nueva meta"
            : "Nueva categoría"}
      </Action>
      {state.error && <ErrorBox message={state.error} retry={state.reload} />}
      {state.loading ? (
        <Loading />
      ) : !state.data?.length ? (
        <Empty text="Aún no tienes registros. Crea el primero." />
      ) : (
        state.data.map((item) =>
          "targetAmount" in item ? (
            <GoalCard key={item.id} goal={item} />
          ) : (
            <Pressable
              accessibilityRole="button"
              key={item.id}
              onPress={() =>
                router.push({
                  pathname:
                    kind === "accounts" ? "/accounts/[id]" : "/categories/edit",
                  params: { id: item.id },
                })
              }
            >
              <Card>
                <Text fontSize="$6" fontWeight="700">
                  {item.name}
                </Text>
                {"initialBalance" in item ? (
                  <>
                    <Money value={item.balance || "0"} />
                    <Text color="$muted">
                      Saldo disponible · {item.currency}
                    </Text>
                  </>
                ) : (
                  <Text color="$muted">
                    {"type" in item && item.type === "INCOME"
                      ? "Ingreso"
                      : "classification" in item &&
                          item.classification === "NEED"
                        ? "Gasto · Necesidad"
                        : "Gasto · Deseo"}
                  </Text>
                )}
              </Card>
            </Pressable>
          ),
        )
      )}
    </Screen>
  );
}
export function ResourceDetail({ kind }: { kind: "accounts" | "goals" }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useResource(
    useCallback(async () => {
      const items = await api.request<(Account | Goal)[]>(paths[kind]);
      const item = items.find((x) => x.id === id);
      if (!item) throw new Error("No se encontró el registro.");
      return item;
    }, [kind, id]),
  );
  const item = state.data;
  return (
    <Screen
      title={item?.name || titles[kind]}
      onRefresh={state.reload}
      refreshing={state.refreshing}
    >
      {state.error && <ErrorBox message={state.error} retry={state.reload} />}
      {state.loading ? (
        <Loading />
      ) : (
        item && (
          <>
            <Card>
              {"initialBalance" in item ? (
                <>
                  <Text color="$muted">Saldo disponible</Text>
                  <Money value={item.balance || "0"} size="$8" />
                  <Text color="$muted">
                    Saldo inicial: {money(item.initialBalance, item.currency)}
                  </Text>
                </>
              ) : (
                <>
                  <Money value={item.saved || "0"} type="SAVING" size="$8" />
                  <Text>Objetivo: {money(item.targetAmount)}</Text>
                  <Text color="$muted">
                    Te faltan {money(item.remaining || "0")} · {item.progress}%
                  </Text>
                  {item.targetDate && (
                    <Text color="$muted">
                      Fecha objetivo: {dateLabel(item.targetDate)}
                    </Text>
                  )}
                </>
              )}
            </Card>
            <Action
              onPress={() =>
                router.push({ pathname: editor[kind], params: { id } })
              }
            >
              Editar
            </Action>
            {kind === "goals" && (
              <Action
                secondary
                onPress={() =>
                  router.push({
                    pathname: "/transaction/edit",
                    params: { type: "SAVING", goalId: id },
                  })
                }
              >
                Registrar ahorro
              </Action>
            )}
            <Action
              danger
              onPress={() =>
                confirmDelete(() => {
                  void api
                    .request(paths[kind] + "/" + id, "DELETE")
                    .then(() => {
                      notify("Registro eliminado");
                      router.back();
                    })
                    .catch((e) => notify("No se pudo eliminar", e.message));
                })
              }
            >
              Eliminar
            </Action>
          </>
        )
      )}
    </Screen>
  );
}
export function ResourceEditor({ kind }: { kind: Kind }) {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const state = useResource(
    useCallback(
      () =>
        id ? api.request<Item>(paths[kind] + "/" + id) : Promise.resolve(null),
      [kind, id],
    ),
  );
  if (state.loading)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (state.error)
    return (
      <Screen>
        <ErrorBox message={state.error} retry={state.reload} />
      </Screen>
    );
  const row = state.data;
  const schema =
    kind === "accounts"
      ? accountSchema
      : kind === "goals"
        ? goalSchema
        : categorySchema;
  const fields =
    kind === "accounts"
      ? [
          { name: "name", label: "Nombre de la cuenta" },
          { name: "type", label: "Tipo", options: accountOptions },
          {
            name: "initialBalance",
            label: "Saldo inicial (MXN)",
            type: "money" as const,
          },
        ]
      : kind === "goals"
        ? [
            { name: "name", label: "Nombre de la meta" },
            {
              name: "targetAmount",
              label: "Objetivo (MXN)",
              type: "money" as const,
            },
            {
              name: "targetDate",
              label: "Fecha objetivo (opcional)",
              type: "date" as const,
            },
          ]
        : [
            { name: "name", label: "Nombre" },
            {
              name: "type",
              label: "Tipo",
              options: [
                { value: "INCOME", label: "Ingreso" },
                { value: "EXPENSE", label: "Gasto" },
              ],
            },
            {
              name: "classification",
              label: "Asignación del gasto",
              options: [
                { value: "NEED", label: "Necesidad" },
                { value: "WANT", label: "Deseo" },
              ],
            },
          ];
  return (
    <Screen title={id ? "Editar" : "Crear registro"}>
      <Card>
        <Form
          schema={schema}
          initial={{
            name: "",
            type: kind === "accounts" ? "BANK" : "EXPENSE",
            classification: "NEED",
            initialBalance: "0",
            targetAmount: "",
            currency: "MXN",
            ...row,
            targetDate: row && "targetDate" in row ? row.targetDate || "" : "",
          }}
          fields={fields}
          onSubmit={async (v) => {
            await api.request(
              paths[kind] + (id ? "/" + id : ""),
              id ? "PATCH" : "POST",
              v,
            );
            notify("Cambios guardados");
            router.back();
          }}
        />
      </Card>
      {kind === "categories" && id && (
        <Action
          danger
          onPress={() =>
            confirmDelete(() => {
              void api
                .request(paths[kind] + "/" + id, "DELETE")
                .then(() => router.back())
                .catch((e) => notify("No se pudo eliminar", e.message));
            })
          }
        >
          Eliminar categoría
        </Action>
      )}
    </Screen>
  );
}
