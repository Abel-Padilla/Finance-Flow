import { useCallback, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Text, XStack, Input } from "tamagui";
import {
  Screen,
  Card,
  Action,
  Empty,
  ErrorBox,
  Loading,
  Picker,
  confirmDelete,
  notify,
} from "../components/ui";
import { Money, TransactionRow } from "../components/financial";
import { Form } from "../components/form";
import { api } from "../services/api";
import { useResource } from "../hooks/use-resource";
import type {
  Transaction,
  Page,
  Account,
  Category,
  Goal,
  TransactionType,
} from "../types/api";
import { transactionSchema, dateSchema } from "./schemas";
import { today, dateLabel, typeLabels } from "../utils/format";
export function Transactions() {
  const [page, setPage] = useState(1),
    [type, setType] = useState(""),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [accountId, setAccount] = useState(""),
    [categoryId, setCategory] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [dates, setDates] = useState({ from: "", to: "" });
  const accounts = useResource(
    useCallback(() => api.request<Account[]>("/accounts"), []),
  );
  const categories = useResource(
    useCallback(() => api.request<Category[]>("/categories"), []),
  );
  const state = useResource(
    useCallback(() => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      for (const [k, v] of Object.entries({
        type,
        search: query,
        accountId,
        categoryId,
        ...dates,
      }))
        if (v) params.set(k, v);
      return api.request<Page<Transaction>>(
        "/transactions?" + params.toString(),
      );
    }, [page, type, query, accountId, categoryId, dates]),
  );
  return (
    <Screen
      title="Movimientos"
      subtitle="Tu dinero, paso a paso."
      refreshing={state.refreshing}
      onRefresh={state.reload}
    >
      <Action onPress={() => router.push("/transaction/edit")}>
        + Nuevo movimiento
      </Action>
      <Card>
        <Input
          accessibilityLabel="Buscar movimientos"
          placeholder="Buscar descripción"
          value={search}
          onChangeText={setSearch}
        />
        <Picker
          label="Tipo de movimiento"
          value={type}
          options={[
            { value: "", label: "Todos los tipos" },
            ...Object.entries(typeLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          onChange={(v) => {
            setPage(1);
            setType(v);
          }}
        />
        <Picker
          label="Cuenta"
          value={accountId}
          options={[
            { value: "", label: "Todas las cuentas" },
            ...(accounts.data || []).map((a) => ({
              value: a.id,
              label: a.name,
            })),
          ]}
          onChange={(v) => {
            setPage(1);
            setAccount(v);
          }}
        />
        {accounts.error && (
          <ErrorBox message={accounts.error} retry={accounts.reload} />
        )}
        {categories.error && (
          <ErrorBox message={categories.error} retry={categories.reload} />
        )}
        <Picker
          label="Categoría"
          value={categoryId}
          options={[
            { value: "", label: "Todas las categorías" },
            ...(categories.data || []).map((c) => ({
              value: c.id,
              label: c.name,
            })),
          ]}
          onChange={(v) => {
            setPage(1);
            setCategory(v);
          }}
        />
        <Input
          accessibilityLabel="Desde"
          placeholder="Desde: AAAA-MM-DD"
          value={from}
          onChangeText={setFrom}
        />
        <Input
          accessibilityLabel="Hasta"
          placeholder="Hasta: AAAA-MM-DD"
          value={to}
          onChangeText={setTo}
        />
        <Action
          secondary
          onPress={() => {
            if ([from, to].some((v) => v && !dateSchema.safeParse(v).success)) {
              notify("Fecha inválida", "Usa AAAA-MM-DD.");
              return;
            }
            if (from && to && from > to) {
              notify(
                "Rango inválido",
                "La fecha inicial debe ser anterior a la final.",
              );
              return;
            }
            setPage(1);
            setQuery(search);
            setDates({ from, to });
          }}
        >
          Aplicar filtros
        </Action>
      </Card>
      {state.error && <ErrorBox message={state.error} retry={state.reload} />}
      {state.loading ? (
        <Loading />
      ) : state.data?.items.length ? (
        state.data.items.map((t) => <TransactionRow key={t.id} item={t} />)
      ) : (
        <Empty text="No hay movimientos con estos filtros." />
      )}
      <XStack justifyContent="space-between" alignItems="center">
        <Action
          secondary
          disabled={page === 1 || state.refreshing}
          onPress={() => setPage(page - 1)}
        >
          Anterior
        </Action>
        <Text>{page}</Text>
        <Action
          secondary
          disabled={page * 20 >= (state.data?.total || 0) || state.refreshing}
          onPress={() => setPage(page + 1)}
        >
          Siguiente
        </Action>
      </XStack>
    </Screen>
  );
}
export function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useResource(
    useCallback(async () => {
      const [item, accounts, categories, goals] = await Promise.all([
        api.request<Transaction>("/transactions/" + id),
        api.request<Account[]>("/accounts"),
        api.request<Category[]>("/categories"),
        api.request<Goal[]>("/savings-goals"),
      ]);
      return {
        item,
        account: accounts.find((x) => x.id === item.accountId),
        category: categories.find((x) => x.id === item.categoryId),
        goal: goals.find((x) => x.id === item.savingsGoalId),
      };
    }, [id]),
  );
  const d = state.data;
  return (
    <Screen
      title="Detalle del movimiento"
      onRefresh={state.reload}
      refreshing={state.refreshing}
    >
      {state.error && <ErrorBox message={state.error} retry={state.reload} />}
      {state.loading ? (
        <Loading />
      ) : (
        d && (
          <>
            <Card>
              <Text color="$muted">{typeLabels[d.item.type]}</Text>
              <Money value={d.item.amount} type={d.item.type} size="$8" />
              <Text fontSize="$6">
                {d.item.description || "Sin descripción"}
              </Text>
              <Text color="$muted">{dateLabel(d.item.transactionDate)}</Text>
              <Text>Cuenta: {d.account?.name}</Text>
              {d.category && <Text>Categoría: {d.category.name}</Text>}
              {d.goal && <Text>Meta: {d.goal.name}</Text>}
            </Card>
            <Action
              onPress={() =>
                router.push({ pathname: "/transaction/edit", params: { id } })
              }
            >
              Editar movimiento
            </Action>
            <Action
              danger
              onPress={() =>
                confirmDelete(() => {
                  void api
                    .request("/transactions/" + id, "DELETE")
                    .then(() => {
                      notify("Movimiento eliminado");
                      router.back();
                    })
                    .catch((e) => notify("No se pudo eliminar", e.message));
                })
              }
            >
              Eliminar movimiento
            </Action>
          </>
        )
      )}
    </Screen>
  );
}
export function TransactionEditor() {
  const {
    id,
    type: requested,
    goalId,
  } = useLocalSearchParams<{
    id?: string;
    type?: TransactionType;
    goalId?: string;
  }>();
  const [type, setType] = useState<TransactionType | undefined>(undefined);
  const state = useResource(
    useCallback(async () => {
      const [accounts, categories, goals, item] = await Promise.all([
        api.request<Account[]>("/accounts"),
        api.request<Category[]>("/categories"),
        api.request<Goal[]>("/savings-goals"),
        id
          ? api.request<Transaction>("/transactions/" + id)
          : Promise.resolve(null),
      ]);
      return { accounts, categories, goals, item };
    }, [id]),
  );
  const d = state.data;
  const selected =
    type ||
    d?.item?.type ||
    (["INCOME", "EXPENSE", "SAVING"].includes(requested || "")
      ? requested
      : "EXPENSE") ||
    "EXPENSE";
  const cats = d?.categories.filter((c) => c.type === selected) || [];
  return (
    <Screen title={id ? "Editar movimiento" : "Nuevo movimiento"}>
      {state.error ? (
        <ErrorBox message={state.error} retry={state.reload} />
      ) : state.loading ? (
        <Loading />
      ) : d && !d.accounts.length ? (
        <>
          <Empty text="Primero crea una cuenta para registrar movimientos." />
          <Action onPress={() => router.push("/accounts/edit")}>
            Crear cuenta
          </Action>
        </>
      ) : (
        d && (
          <>
            <XStack gap="$2" flexWrap="wrap">
              {(Object.keys(typeLabels) as TransactionType[]).map((t) => (
                <Action
                  key={t}
                  secondary={t !== selected}
                  onPress={() => setType(t)}
                >
                  {typeLabels[t]}
                </Action>
              ))}
            </XStack>
            <Card>
              <Form
                key={selected + id}
                schema={transactionSchema}
                initial={{
                  amount: d.item?.amount || "",
                  description: d.item?.description || "",
                  transactionDate: d.item?.transactionDate || today(),
                  accountId: d.item?.accountId || d.accounts[0]?.id || "",
                  type: selected,
                  categoryId: cats.some((c) => c.id === d.item?.categoryId)
                    ? d.item!.categoryId
                    : cats[0]?.id || "",
                  savingsGoalId: d.item?.savingsGoalId || goalId || "",
                }}
                fields={[
                  { name: "amount", label: "Monto (MXN)", type: "money" },
                  { name: "transactionDate", label: "Fecha", type: "date" },
                  {
                    name: "accountId",
                    label: "Cuenta",
                    options: d.accounts.map((a) => ({
                      value: a.id,
                      label: a.name,
                    })),
                  },
                  ...(selected === "SAVING"
                    ? [
                        {
                          name: "savingsGoalId",
                          label: "Meta (opcional)",
                          options: [
                            { value: "", label: "Ahorro sin meta" },
                            ...d.goals.map((g) => ({
                              value: g.id,
                              label: g.name,
                            })),
                          ],
                        },
                      ]
                    : [
                        {
                          name: "categoryId",
                          label: "Categoría",
                          options: cats.map((c) => ({
                            value: c.id,
                            label: c.name,
                          })),
                        },
                      ]),
                  { name: "description", label: "Descripción" },
                ]}
                label={
                  id
                    ? "Guardar cambios"
                    : "Registrar " + typeLabels[selected].toLowerCase()
                }
                onSubmit={async (v) => {
                  await api.request(
                    "/transactions" + (id ? "/" + id : ""),
                    id ? "PATCH" : "POST",
                    v,
                  );
                  notify(
                    "Movimiento guardado",
                    "Tu saldo y tus metas se actualizaron.",
                  );
                  router.back();
                }}
              />
            </Card>
            {selected === "SAVING" && (
              <Text color="$muted">
                El ahorro se reserva por separado y no se cuenta como gasto.
              </Text>
            )}
          </>
        )
      )}
    </Screen>
  );
}
