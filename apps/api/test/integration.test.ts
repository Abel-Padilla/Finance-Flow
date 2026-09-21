import { test, after } from "node:test";
import assert from "node:assert/strict";
import { pool } from "../src/db";
const base = process.env.TEST_API_URL || "http://localhost:4016/api/v1";
const ids: string[] = [];
async function request(
  path: string,
  method = "GET",
  body?: any,
  token?: string,
  cookie?: string,
) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: res.status,
    body: await res.json(),
    cookie: res.headers.get("set-cookie")?.split(";")[0],
    headers: res.headers,
  };
}
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
test("secure authentication, complete financial lifecycle and two-user isolation", async (t) => {
  const email = `qa-${Date.now()}@example.test`,
    password = "CorrectPassword123";
  assert.equal((await request("/accounts")).status, 401);
  assert.equal(
    (
      await request("/auth/register", "POST", {
        name: "Test",
        email,
        password: "weak",
        currency: "MXN",
      })
    ).status,
    400,
  );
  const a = await request("/auth/register", "POST", {
    name: "Prueba A",
    email,
    password,
    currency: "MXN",
  });
  assert.equal(a.status, 201);
  ids.push(a.body.user.id);
  assert.ok(a.headers.get("set-cookie")?.includes("HttpOnly"));
  assert.equal(a.body.user.passwordHash, undefined);
  const token = a.body.accessToken;
  const b = await request("/auth/register", "POST", {
    name: "Prueba B",
    email: "b-" + email,
    password,
    currency: "MXN",
  });
  assert.equal(b.status, 201);
  ids.push(b.body.user.id);
  const other = b.body.accessToken;
  await t.test(
    "login, refresh rotation, revocation and CSRF origin protection",
    async () => {
      assert.equal(
        (await request("/auth/login", "POST", { email, password: "incorrect" }))
          .status,
        401,
      );
      assert.equal(
        (await request("/auth/login", "POST", { email, password })).status,
        201,
      );
      const fresh = await request(
        "/auth/refresh",
        "POST",
        undefined,
        undefined,
        a.cookie,
      );
      assert.equal(fresh.status, 201);
      assert.equal(
        (await request("/auth/refresh", "POST", undefined, undefined, a.cookie))
          .status,
        401,
      );
      assert.equal(
        (
          await request(
            "/auth/logout",
            "POST",
            undefined,
            undefined,
            fresh.cookie,
          )
        ).status,
        201,
      );
      assert.equal(
        (
          await request(
            "/auth/refresh",
            "POST",
            undefined,
            undefined,
            fresh.cookie,
          )
        ).status,
        401,
      );
      const csrf = await fetch(base + "/auth/refresh", {
        method: "POST",
        headers: { Origin: "https://attacker.example" },
      });
      assert.equal(csrf.status, 403);
    },
  );
  await t.test("onboarding runs once and validates allocations", async () => {
    assert.equal(
      (
        await request(
          "/users/onboarding",
          "POST",
          {
            initialBalance: "1000.10",
            monthlyIncome: "2000",
            currency: "MXN",
            needs: 50,
            wants: 30,
            savings: 19,
          },
          token,
        )
      ).status,
      400,
    );
    const d = {
      initialBalance: "1000.10",
      monthlyIncome: "2000",
      currency: "MXN",
      needs: 50,
      wants: 30,
      savings: 20,
    };
    assert.equal(
      (await request("/users/onboarding", "POST", d, token)).status,
      201,
    );
    assert.equal(
      (await request("/users/onboarding", "POST", d, token)).status,
      409,
    );
    assert.equal(
      (await request("/auth/me", "GET", undefined, token)).body.onboarded,
      true,
    );
  });
  const account = (await request("/accounts", "GET", undefined, token)).body[0];
  const cats = (await request("/categories", "GET", undefined, token)).body;
  const inc = cats.find((c: any) => c.type === "INCOME"),
    expense = cats.find((c: any) => c.type === "EXPENSE");
  const goal = (
    await request(
      "/savings-goals",
      "POST",
      { name: "Fondo", targetAmount: "200" },
      token,
    )
  ).body;
  const date = "2026-09-15";
  const income = {
    accountId: account.id,
    type: "INCOME",
    amount: "2000.20",
    categoryId: inc.id,
    description: "Ingreso QA",
    transactionDate: date,
  };
  const spending = {
    ...income,
    type: "EXPENSE",
    amount: "300.10",
    categoryId: expense.id,
    description: "Gasto QA",
  };
  const saving = {
    accountId: account.id,
    type: "SAVING",
    amount: "200.00",
    savingsGoalId: goal.id,
    description: "Ahorro QA",
    transactionDate: date,
  };
  assert.equal(
    (await request("/transactions", "POST", income, token)).status,
    201,
  );
  const exp = await request("/transactions", "POST", spending, token);
  assert.equal(exp.status, 201);
  const sav = await request("/transactions", "POST", saving, token);
  assert.equal(sav.status, 201);
  await t.test("persisted money, budget and goal calculations", async () => {
    let d = (
      await request("/dashboard/summary?month=2026-09", "GET", undefined, token)
    ).body;
    assert.equal(d.available, "2500.20");
    assert.equal(d.income, "2000.20");
    assert.equal(d.expenses, "300.10");
    assert.equal(d.saved, "200.00");
    assert.equal(d.totalSaved, "200.00");
    assert.equal(d.cashFlow, "1700.10");
    assert.equal(d.goals[0].progress, "100.00");
    assert.equal(d.allocations[0].planned, "1000.10");
    assert.equal(
      (
        await request(
          "/transactions/" + exp.body.id,
          "PATCH",
          { ...spending, amount: "400.10" },
          token,
        )
      ).status,
      200,
    );
    d = (
      await request("/dashboard/summary?month=2026-09", "GET", undefined, token)
    ).body;
    assert.equal(d.available, "2400.20");
    assert.equal(
      (
        await request(
          "/transactions/" + sav.body.id,
          "DELETE",
          undefined,
          token,
        )
      ).status,
      200,
    );
    d = (
      await request("/dashboard/summary?month=2026-09", "GET", undefined, token)
    ).body;
    assert.equal(d.available, "2600.20");
    assert.equal(d.goals[0].saved, "0.00");
    assert.equal(
      (
        await request(
          "/budget",
          "PUT",
          { needs: 60, wants: 20, savings: 20 },
          token,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await request(
          "/budget",
          "PUT",
          { needs: 60, wants: 20, savings: 25 },
          token,
        )
      ).status,
      400,
    );
  });
  await t.test(
    "User B cannot read, mutate or delete User A resources by UUID",
    async () => {
      for (const [kind, id, payload] of [
        [
          "accounts",
          account.id,
          {
            name: "Hacked",
            type: "BANK",
            initialBalance: "0",
            currency: "MXN",
          },
        ],
        [
          "categories",
          expense.id,
          { name: "Hacked", type: "EXPENSE", classification: "WANT" },
        ],
        ["savings-goals", goal.id, { name: "Hacked", targetAmount: "10" }],
        ["transactions", exp.body.id, spending],
      ] as const) {
        assert.equal(
          (await request("/" + kind + "/" + id, "GET", undefined, other))
            .status,
          404,
        );
        assert.equal(
          (await request("/" + kind + "/" + id, "PATCH", payload, other))
            .status,
          404,
        );
        assert.equal(
          (await request("/" + kind + "/" + id, "DELETE", undefined, other))
            .status,
          404,
        );
      }
      assert.equal(
        (await request("/transactions", "POST", income, other)).status,
        404,
      );
      assert.equal(
        (await request("/transactions", "GET", undefined, other)).body.total,
        0,
      );
      assert.equal(
        (await request("/accounts", "GET", undefined, other)).body.length,
        0,
      );
    },
  );
  await t.test(
    "validation, ownership references, pagination and history retention",
    async () => {
      assert.equal(
        (
          await request(
            "/transactions",
            "POST",
            { ...income, amount: "0" },
            token,
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await request(
            "/transactions",
            "POST",
            { ...income, userId: b.body.user.id },
            token,
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await request(
            "/transactions",
            "POST",
            { ...income, categoryId: expense.id },
            token,
          )
        ).status,
        400,
      );
      assert.equal(
        (await request("/accounts/" + account.id, "DELETE", undefined, token))
          .status,
        409,
      );
      assert.equal(
        (await request("/transactions?limit=1&page=2", "GET", undefined, token))
          .body.items.length,
        1,
      );
      assert.equal(
        (
          await request(
            "/transactions?type=EXPENSE&search=Gasto",
            "GET",
            undefined,
            token,
          )
        ).body.total,
        1,
      );
      assert.equal(
        (await request("/transactions?page=0", "GET", undefined, token)).status,
        400,
      );
      const otherAccount = (
        await request(
          "/accounts",
          "POST",
          {
            name: "B cuenta",
            type: "CASH",
            initialBalance: "0",
            currency: "MXN",
          },
          other,
        )
      ).body;
      assert.equal(
        (
          await request(
            "/transactions",
            "POST",
            { ...income, accountId: otherAccount.id },
            token,
          )
        ).status,
        404,
      );
      const otherGoal = (
        await request(
          "/savings-goals",
          "POST",
          { name: "B meta", targetAmount: "100" },
          other,
        )
      ).body;
      assert.equal(
        (
          await request(
            "/transactions",
            "POST",
            { ...saving, savingsGoalId: otherGoal.id },
            token,
          )
        ).status,
        404,
      );
      const otherCategory = (
        await request("/categories", "GET", undefined, other)
      ).body.find((c: any) => c.type === "INCOME");
      assert.equal(
        (
          await request(
            "/transactions",
            "POST",
            { ...income, categoryId: otherCategory.id },
            token,
          )
        ).status,
        404,
      );
    },
  );
});
