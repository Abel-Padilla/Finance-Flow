import { test, after } from "node:test";
import assert from "node:assert/strict";
import { pool } from "../../api/src/db";
import {
  ApiClient,
  ApiError,
  type Credentials,
  type Vault,
} from "../src/services/client-core";
import {
  onboardingSchema,
  transactionSchema,
  goalSchema,
  accountSchema,
  budgetSchema,
  categorySchema,
} from "../src/features/schemas";
import type {
  Account,
  Category,
  Goal,
  Transaction,
  Summary,
  Page,
} from "../src/types/api";
const base = process.env.TEST_API_URL || "http://localhost:4016/api/v1";
if (
  !["localhost", "127.0.0.1"].includes(new URL(base).hostname) ||
  !["localhost", "127.0.0.1"].includes(
    new URL(process.env.DATABASE_URL || "http://invalid").hostname,
  )
)
  throw new Error("Integration tests require a local API and local database.");
const ids: string[] = [];
after(async () => {
  for (const id of ids) {
    await pool.query("DELETE FROM transactions WHERE user_id=$1", [id]);
    await pool.query(
      "DELETE FROM budget_allocations WHERE strategy_id IN (SELECT id FROM budget_strategies WHERE user_id=$1)",
      [id],
    );
    for (const table of [
      "budget_strategies",
      "refresh_tokens",
      "accounts",
      "categories",
      "savings_goals",
    ])
      await pool.query(`DELETE FROM ${table} WHERE user_id=$1`, [id]);
    await pool.query("DELETE FROM users WHERE id=$1", [id]);
  }
  await pool.end();
});
test("mobile client completes real API lifecycle and cookie rotation", async () => {
  let saved: Credentials | null = null;
  const vault: Vault = {
    read: async () => saved,
    write: async (v) => {
      saved = v;
    },
    clear: async () => {
      saved = null;
    },
  };
  const client = new ApiClient(base, vault, fetch);
  const user = await client.authenticate("register", {
    name: "Mobile verification",
    email: `mobile-${crypto.randomUUID()}@example.test`,
    password: "MobileCheck123",
    currency: "MXN",
  });
  ids.push(user.id);
  assert.ok(saved);
  const before = (await vault.read())!.refreshToken;
  await client.request(
    "/users/onboarding",
    "POST",
    onboardingSchema.parse({
      initialBalance: "1000.10",
      monthlyIncome: "2000",
      needs: "50",
      wants: "30",
      savings: "20",
      goalName: "",
      goalTarget: "",
    }),
  );
  const resumed = new ApiClient(base, vault, fetch);
  assert.equal((await resumed.restore())?.onboarded, true);
  assert.notEqual((await vault.read())!.refreshToken, before);
  const accounts = await resumed.request<Account[]>("/accounts");
  const categories = await resumed.request<Category[]>("/categories");
  const expense = categories.find((c) => c.type === "EXPENSE")!;
  const goal = await resumed.request<Goal>(
    "/savings-goals",
    "POST",
    goalSchema.parse({
      name: "Fondo móvil",
      targetAmount: "300",
      targetDate: "",
    }),
  );
  const common = {
    accountId: accounts[0].id,
    amount: "100.10",
    description: "Mobile test",
    transactionDate: "2026-09-22",
    categoryId: expense.id,
    savingsGoalId: goal.id,
  };
  const tx = await resumed.request<Transaction>(
    "/transactions",
    "POST",
    transactionSchema.parse({ ...common, type: "EXPENSE" }),
  );
  const saving = await resumed.request<Transaction>(
    "/transactions",
    "POST",
    transactionSchema.parse({ ...common, type: "SAVING", amount: "200.00" }),
  );
  let summary = await resumed.request<Summary>(
    "/dashboard/summary?month=2026-09",
  );
  assert.equal(summary.available, "700.00");
  assert.equal(summary.totalSaved, "200.00");
  assert.equal(summary.goals.find((g) => g.id === goal.id)?.saved, "200.00");
  await resumed.request(
    "/transactions/" + tx.id,
    "PATCH",
    transactionSchema.parse({ ...common, type: "EXPENSE", amount: "200.10" }),
  );
  summary = await resumed.request<Summary>("/dashboard/summary?month=2026-09");
  assert.equal(summary.available, "600.00");
  const page = await resumed.request<Page<Transaction>>(
    "/transactions?type=EXPENSE&categoryId=" + expense.id + "&limit=1&page=1",
  );
  assert.equal(page.total, 1);
  assert.equal(page.items[0].id, tx.id);
  await resumed.request(
    "/budget",
    "PUT",
    budgetSchema.parse({ needs: "60", wants: "20", savings: "20" }),
  );
  await resumed.request(
    "/savings-goals/" + goal.id,
    "PATCH",
    goalSchema.parse({
      name: "Fondo actualizado",
      targetAmount: "400",
      targetDate: "2026-12-31",
    }),
  );
  await assert.rejects(
    () => resumed.request("/accounts/" + accounts[0].id, "DELETE"),
    (e: unknown) => e instanceof ApiError && e.status === 409,
  );
  const accountPayload = {
    name: "Cuenta temporal",
    type: "CASH",
    initialBalance: "0",
    currency: "MXN",
  };
  const extra = await resumed.request<Account>(
    "/accounts",
    "POST",
    accountSchema.parse(accountPayload),
  );
  await resumed.request(
    "/accounts/" + extra.id,
    "PATCH",
    accountSchema.parse({ ...accountPayload, name: "Renombrada" }),
  );
  await resumed.request("/accounts/" + extra.id, "DELETE");
  const categoryPayload = {
    name: "Categoría temporal",
    type: "EXPENSE",
    classification: "WANT",
  };
  const category = await resumed.request<Category>(
    "/categories",
    "POST",
    categorySchema.parse(categoryPayload),
  );
  await resumed.request(
    "/categories/" + category.id,
    "PATCH",
    categorySchema.parse({ ...categoryPayload, name: "Editada" }),
  );
  await resumed.request("/categories/" + category.id, "DELETE");
  await resumed.request("/transactions/" + saving.id, "DELETE");
  await resumed.request("/transactions/" + tx.id, "DELETE");
  await resumed.request("/savings-goals/" + goal.id, "DELETE");
  await resumed.request("/users/settings", "PATCH", {
    name: "Actualizado",
    monthlyIncome: "3000",
  });
  const refresh = (await vault.read())!.refreshToken;
  await resumed.logout();
  assert.equal(await vault.read(), null);
  const revoked = await fetch(base + "/auth/refresh", {
    method: "POST",
    headers: { Cookie: "ff_refresh=" + refresh },
  });
  assert.equal(revoked.status, 401);
});
