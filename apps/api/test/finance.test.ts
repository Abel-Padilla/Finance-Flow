import { test } from "node:test";
import assert from "node:assert/strict";
import { totals, goalProgress, allocation } from "../src/finance";
test("decimal calculations are exact and savings are reserved only once", () => {
  assert.deepEqual(
    totals(
      [{ initialBalance: "0.10" }],
      [
        { type: "INCOME", amount: "0.20" },
        { type: "SAVING", amount: "0.10" },
      ],
    ),
    {
      balance: "0.20",
      income: "0.20",
      expenses: "0.00",
      saved: "0.10",
      cashFlow: "0.20",
      savingsRate: "50.00",
    },
  );
});
test("zero income, goals, and allocations remain safe and reproducible", () => {
  assert.equal(totals([], []).savingsRate, "0.00");
  assert.equal(allocation("1000.10", 50), "500.05");
  assert.equal(goalProgress("100", "120").remaining, "0.00");
  assert.equal(goalProgress("100", "120").progress, "120.00");
});
