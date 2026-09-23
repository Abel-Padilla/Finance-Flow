import { test } from "node:test";
import assert from "node:assert/strict";
import {
  budgetSchema,
  transactionSchema,
  goalSchema,
  accountSchema,
  onboardingSchema,
} from "../src/features/schemas";
const id = "7fbecd90-dde6-4f71-9dac-e83e3e9ccbf2";
test("decimal amounts stay strings and excess precision is rejected", () => {
  const input = {
    name: "Cuenta",
    type: "BANK",
    currency: "MXN",
    initialBalance: "999999999999.99",
  };
  assert.equal(accountSchema.parse(input).initialBalance, input.initialBalance);
  assert.equal(
    accountSchema.safeParse({ ...input, initialBalance: "0.001" }).success,
    false,
  );
});
test("budget accepts only integer percentages totalling 100", () => {
  assert.deepEqual(
    budgetSchema.parse({ needs: "50", wants: "30", savings: "20" }),
    { needs: 50, wants: 30, savings: 20 },
  );
  assert.equal(
    budgetSchema.safeParse({ needs: "50", wants: "30", savings: "21" }).success,
    false,
  );
});
test("transactions remove irrelevant references and validate date/positive amount", () => {
  const input = {
    type: "SAVING",
    accountId: id,
    categoryId: id,
    savingsGoalId: id,
    amount: "0.10",
    description: "Ahorro",
    transactionDate: "2026-09-22",
  };
  const saving = transactionSchema.parse(input);
  assert.equal("categoryId" in saving, false);
  assert.equal(saving.amount, "0.10");
  const income = transactionSchema.parse({ ...input, type: "INCOME" });
  assert.equal("savingsGoalId" in income, false);
  assert.equal(
    transactionSchema.safeParse({ ...input, amount: "0.00" }).success,
    false,
  );
  assert.equal(
    transactionSchema.safeParse({ ...input, transactionDate: "2026-02-30" })
      .success,
    false,
  );
});
test("optional goal date becomes null and onboarding only sends completed goal", () => {
  assert.equal(
    goalSchema.parse({ name: "Meta", targetAmount: "10", targetDate: "" })
      .targetDate,
    null,
  );
  const input = {
    initialBalance: "0",
    monthlyIncome: "100",
    needs: "50",
    wants: "30",
    savings: "20",
    goalName: "",
    goalTarget: "",
  };
  assert.equal("goalName" in onboardingSchema.parse(input), false);
  assert.equal(
    onboardingSchema.safeParse({ ...input, goalName: "Fondo" }).success,
    false,
  );
});
