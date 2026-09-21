import Decimal from "decimal.js";
export const D = (v: Decimal.Value) => new Decimal(v);
export const sum = (rows: any[], kind?: string) =>
  rows
    .filter((t) => !kind || t.type === kind)
    .reduce((a, t) => a.plus(t.amount), D(0));
export function totals(accounts: any[], rows: any[]) {
  const income = sum(rows, "INCOME"),
    expenses = sum(rows, "EXPENSE"),
    saved = sum(rows, "SAVING");
  return {
    balance: accounts
      .reduce((a, t) => a.plus(t.initialBalance), D(0))
      .plus(income)
      .minus(expenses)
      .minus(saved)
      .toFixed(2),
    income: income.toFixed(2),
    expenses: expenses.toFixed(2),
    saved: saved.toFixed(2),
    cashFlow: income.minus(expenses).toFixed(2),
    savingsRate: income.isZero()
      ? "0.00"
      : saved.div(income).mul(100).toFixed(2),
  };
}
export function goalProgress(target: string, saved: string) {
  return {
    saved: D(saved).toFixed(2),
    remaining: Decimal.max(D(target).minus(saved), 0).toFixed(2),
    progress: D(saved).div(target).mul(100).toFixed(2),
  };
}
export function allocation(base: string, percent: number) {
  return D(base).mul(percent).div(100).toFixed(2);
}
