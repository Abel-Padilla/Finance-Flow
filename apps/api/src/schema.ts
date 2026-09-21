import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  boolean,
  date,
  integer,
} from "drizzle-orm/pg-core";
const id = () => uuid("id").primaryKey().defaultRandom();
const owner = () =>
  uuid("user_id")
    .notNull()
    .references(() => users.id);
const money = (name: string) =>
  numeric(name, { precision: 16, scale: 2 }).notNull();
export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  currency: text("currency").notNull().default("MXN"),
  onboarded: boolean("onboarded").notNull().default(false),
  monthlyIncome: money("monthly_income").default("0"),
});
export const refreshTokens = pgTable("refresh_tokens", {
  id: id(),
  userId: owner(),
  hash: text("hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const accounts = pgTable("accounts", {
  id: id(),
  userId: owner(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  initialBalance: money("initial_balance"),
  currency: text("currency").notNull(),
});
export const categories = pgTable("categories", {
  id: id(),
  userId: owner(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  classification: text("classification").notNull(),
});
export const savingsGoals = pgTable("savings_goals", {
  id: id(),
  userId: owner(),
  name: text("name").notNull(),
  targetAmount: money("target_amount"),
  targetDate: date("target_date"),
});
export const transactions = pgTable("transactions", {
  id: id(),
  userId: owner(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  categoryId: uuid("category_id").references(() => categories.id),
  savingsGoalId: uuid("savings_goal_id").references(() => savingsGoals.id),
  type: text("type").notNull(),
  amount: money("amount"),
  description: text("description").notNull(),
  transactionDate: date("transaction_date").notNull(),
});
export const budgetStrategies = pgTable("budget_strategies", {
  id: id(),
  userId: owner().unique(),
  name: text("name").notNull(),
});
export const budgetAllocations = pgTable("budget_allocations", {
  id: id(),
  strategyId: uuid("strategy_id")
    .notNull()
    .references(() => budgetStrategies.id),
  bucket: text("bucket").notNull(),
  percentage: integer("percentage").notNull(),
});
