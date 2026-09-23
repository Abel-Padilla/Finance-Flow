export type Money = string;
export type TransactionType = "INCOME" | "EXPENSE" | "SAVING";
export type AccountType = "CASH" | "BANK" | "DEBIT" | "OTHER";
export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  onboarded: boolean;
  monthlyIncome: Money;
}
export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: Money;
  currency: string;
  balance?: Money;
}
export interface Category {
  id: string;
  userId: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  classification: "NEED" | "WANT";
}
export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: Money;
  targetDate: string | null;
  saved?: Money;
  remaining?: Money;
  progress?: string;
}
export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string | null;
  savingsGoalId: string | null;
  type: TransactionType;
  amount: Money;
  description: string;
  transactionDate: string;
}
export interface Budget {
  needs: number;
  wants: number;
  savings: number;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
export interface Summary {
  month: string;
  balance: Money;
  available: Money;
  totalSaved: Money;
  income: Money;
  expenses: Money;
  saved: Money;
  cashFlow: Money;
  savingsRate: string;
  budgetBase: Money;
  allocations: {
    bucket: keyof Budget;
    percentage: number;
    planned: Money;
    actual: Money;
  }[];
  categorySpending: { name: string; amount: Money }[];
  cashFlowSeries: {
    month: string;
    income: Money;
    expenses: Money;
    saved: Money;
  }[];
  goals: Goal[];
  insights: string[];
  recent: Transaction[];
}
export type AccountInput = Pick<
  Account,
  "name" | "type" | "initialBalance" | "currency"
>;
export type GoalInput = Pick<Goal, "name" | "targetAmount"> & {
  targetDate?: string | null;
};
export type TransactionInput = Pick<
  Transaction,
  "accountId" | "type" | "amount" | "description" | "transactionDate"
> & { categoryId?: string; savingsGoalId?: string };
export type CategoryInput = Pick<Category, "name" | "type" | "classification">;
export type OnboardingInput = Budget & {
  initialBalance: Money;
  monthlyIncome: Money;
  currency: "MXN";
  goalName?: string;
  goalTarget?: Money;
};
