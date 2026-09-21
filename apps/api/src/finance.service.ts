import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { and, eq, desc, gte, lte, ilike, sql } from "drizzle-orm";
import { db } from "./db";
import {
  accounts,
  categories,
  transactions,
  savingsGoals,
  budgetStrategies,
  budgetAllocations,
  users,
} from "./schema";
import {
  AccountDto,
  CategoryDto,
  GoalDto,
  TransactionDto,
  BudgetDto,
  OnboardDto,
  QueryDto,
  SettingsDto,
} from "./dto";
import { D, sum, totals, goalProgress, allocation } from "./finance";
const tables = {
  accounts,
  categories,
  transactions,
  "savings-goals": savingsGoals,
};
export type Resource = keyof typeof tables;
@Injectable()
export class FinanceService {
  async own(kind: Resource, userId: string, id: string, tx: any = db) {
    const table = tables[kind];
    const [row] = await tx
      .select()
      .from(table)
      .where(and(eq(table.userId, userId), eq(table.id, id)));
    if (!row) throw new NotFoundException("No se encontró el recurso.");
    return row;
  }
  async list(kind: Resource, userId: string): Promise<any[]> {
    const table = tables[kind];
    const rows: any[] = await db
      .select()
      .from(table)
      .where(eq(table.userId, userId));
    if (kind === "accounts") {
      const ts = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId));
      return rows.map((r) => ({
        ...r,
        balance: totals(
          [r],
          ts.filter((t) => t.accountId === r.id),
        ).balance,
      }));
    }
    if (kind === "savings-goals") {
      const ts = await db
        .select()
        .from(transactions)
        .where(
          and(eq(transactions.userId, userId), eq(transactions.type, "SAVING")),
        );
      return rows.map((r) => ({
        ...r,
        ...goalProgress(
          r.targetAmount,
          sum(ts.filter((t) => t.savingsGoalId === r.id)).toFixed(2),
        ),
      }));
    }
    return rows;
  }
  async save(
    kind: Resource,
    userId: string,
    data: AccountDto | CategoryDto | GoalDto | TransactionDto,
    id?: string,
  ) {
    return db.transaction(async (tx) => {
      if (id) await this.own(kind, userId, id, tx);
      if (kind === "savings-goals" && !D((data as GoalDto).targetAmount).gt(0))
        throw new BadRequestException("La meta debe ser mayor que cero.");
      if (kind === "categories" && id) {
        const old = await this.own(kind, userId, id, tx);
        if (old.type !== (data as CategoryDto).type) {
          const used = await tx
            .select()
            .from(transactions)
            .where(
              and(
                eq(transactions.userId, userId),
                eq(transactions.categoryId, id),
              ),
            )
            .limit(1);
          if (used.length)
            throw new ConflictException(
              "La categoría tiene movimientos; conserva su tipo.",
            );
        }
      }
      if (kind === "transactions") {
        const d = data as TransactionDto;
        if (!D(d.amount).gt(0))
          throw new BadRequestException("El monto debe ser mayor que cero.");
        await this.own("accounts", userId, d.accountId, tx);
        if (d.type === "SAVING") {
          if (d.categoryId)
            throw new BadRequestException(
              "El ahorro no es un gasto por categoría.",
            );
          if (d.savingsGoalId)
            await this.own("savings-goals", userId, d.savingsGoalId, tx);
        } else {
          if (d.savingsGoalId || !d.categoryId)
            throw new BadRequestException("Selecciona una categoría válida.");
          const c = await this.own("categories", userId, d.categoryId, tx);
          if (c.type !== d.type)
            throw new BadRequestException(
              "La categoría no corresponde al movimiento.",
            );
        }
        data = {
          ...d,
          categoryId: d.categoryId ?? null,
          savingsGoalId: d.savingsGoalId ?? null,
        } as any;
      }
      const table = tables[kind];
      const values = { ...data, userId };
      const rows = id
        ? await tx
            .update(table)
            .set(values)
            .where(and(eq(table.id, id), eq(table.userId, userId)))
            .returning()
        : await tx
            .insert(table)
            .values(values as any)
            .returning();
      return rows[0];
    });
  }
  async remove(kind: Resource, userId: string, id: string) {
    await this.own(kind, userId, id);
    const t = tables[kind];
    await db.delete(t).where(and(eq(t.id, id), eq(t.userId, userId)));
    return { success: true };
  }
  async history(userId: string, q: QueryDto) {
    const filters = [eq(transactions.userId, userId)];
    if (q.type) filters.push(eq(transactions.type, q.type));
    if (q.accountId) filters.push(eq(transactions.accountId, q.accountId));
    if (q.categoryId) filters.push(eq(transactions.categoryId, q.categoryId));
    if (q.from) filters.push(gte(transactions.transactionDate, q.from));
    if (q.to) filters.push(lte(transactions.transactionDate, q.to));
    if (q.search)
      filters.push(ilike(transactions.description, `%${q.search}%`));
    const where = and(...filters);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(where);
    const items = await db
      .select()
      .from(transactions)
      .where(where)
      .orderBy(desc(transactions.transactionDate), desc(transactions.id))
      .limit(q.limit)
      .offset((q.page - 1) * q.limit);
    return { items, total: count, page: q.page, limit: q.limit };
  }
  validateBudget(d: BudgetDto) {
    if (d.needs + d.wants + d.savings !== 100)
      throw new BadRequestException("Los porcentajes deben sumar 100%.");
  }
  async setBudget(userId: string, d: BudgetDto, tx?: any): Promise<BudgetDto> {
    if (!tx) return db.transaction((t) => this.setBudget(userId, d, t));
    this.validateBudget(d);
    const [strategy] = await tx
      .insert(budgetStrategies)
      .values({
        userId,
        name:
          d.needs === 50 && d.wants === 30 && d.savings === 20
            ? "50/30/20"
            : "Personalizado",
      })
      .onConflictDoUpdate({
        target: budgetStrategies.userId,
        set: { name: "Personalizado" },
      })
      .returning();
    for (const bucket of ["needs", "wants", "savings"] as const)
      await tx
        .insert(budgetAllocations)
        .values({ strategyId: strategy.id, bucket, percentage: d[bucket] })
        .onConflictDoUpdate({
          target: [budgetAllocations.strategyId, budgetAllocations.bucket],
          set: { percentage: d[bucket] },
        });
    return d;
  }
  async budget(userId: string) {
    const rows = await db
      .select({
        bucket: budgetAllocations.bucket,
        percentage: budgetAllocations.percentage,
      })
      .from(budgetStrategies)
      .innerJoin(
        budgetAllocations,
        eq(budgetAllocations.strategyId, budgetStrategies.id),
      )
      .where(eq(budgetStrategies.userId, userId));
    return rows.length
      ? Object.fromEntries(rows.map((r) => [r.bucket, r.percentage]))
      : { needs: 50, wants: 30, savings: 20 };
  }
  async onboarding(userId: string, d: OnboardDto) {
    this.validateBudget(d);
    return db.transaction(async (tx) => {
      const [u] = await tx
        .update(users)
        .set({ onboarded: true, monthlyIncome: d.monthlyIncome })
        .where(and(eq(users.id, userId), eq(users.onboarded, false)))
        .returning();
      if (!u)
        throw new ConflictException(
          "La configuración inicial ya fue completada.",
        );
      const existing = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId));
      if (!existing.length)
        await tx
          .insert(accounts)
          .values({
            userId,
            name: "Cuenta principal",
            type: "BANK",
            initialBalance: d.initialBalance,
            currency: d.currency,
          });
      await this.setBudget(userId, d, tx);
      if (d.goalName) {
        if (!d.goalTarget || !D(d.goalTarget).gt(0))
          throw new BadRequestException(
            "Ingresa un monto positivo para la meta.",
          );
        await tx
          .insert(savingsGoals)
          .values({ userId, name: d.goalName, targetAmount: d.goalTarget });
      }
      return { success: true };
    });
  }
  async settings(userId: string, d: SettingsDto) {
    await db.update(users).set(d).where(eq(users.id, userId));
    return { success: true };
  }
  async reset(userId: string) {
    await db
      .update(users)
      .set({ onboarded: false })
      .where(eq(users.id, userId));
    return { success: true };
  }
  async dashboard(userId: string, month?: string) {
    const all = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
    const ac = await this.list("accounts", userId);
    const cats = await this.list("categories", userId);
    const goals = await this.list("savings-goals", userId);
    const [u] = await db.select().from(users).where(eq(users.id, userId));
    const selected =
      month ??
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Mexico_City",
        year: "numeric",
        month: "2-digit",
      })
        .format(new Date())
        .slice(0, 7);
    const current = all.filter((t) => t.transactionDate.startsWith(selected));
    const [year, m] = selected.split("-").map(Number);
    const prevDate = new Date(Date.UTC(year, m - 2, 1));
    const previous = prevDate.toISOString().slice(0, 7);
    const prior = all.filter((t) => t.transactionDate.startsWith(previous));
    const total = totals(ac, all),
      period = totals([], current);
    const budget = await this.budget(userId);
    const base = D(period.income).gt(0) ? period.income : u.monthlyIncome;
    const usage = {
      needs: sum(
        current.filter((t) =>
          cats.some(
            (c) => c.id === t.categoryId && c.classification === "NEED",
          ),
        ),
        "EXPENSE",
      ).toFixed(2),
      wants: sum(
        current.filter((t) =>
          cats.some(
            (c) => c.id === t.categoryId && c.classification === "WANT",
          ),
        ),
        "EXPENSE",
      ).toFixed(2),
      savings: period.saved,
    };
    const allocations = ["needs", "wants", "savings"].map((bucket) => ({
      bucket,
      percentage: budget[bucket],
      planned: allocation(base, budget[bucket]),
      actual: usage[bucket as keyof typeof usage],
    }));
    const categorySpending = cats
      .filter((c) => c.type === "EXPENSE")
      .map((c) => ({
        name: c.name,
        amount: sum(
          current.filter((t) => t.categoryId === c.id),
          "EXPENSE",
        ).toFixed(2),
      }))
      .filter((c) => D(c.amount).gt(0));
    const cashFlow = Array.from({ length: 6 }, (_, i) => {
      const key = new Date(Date.UTC(year, m - 6 + i, 1))
        .toISOString()
        .slice(0, 7);
      const r = totals(
        [],
        all.filter((t) => t.transactionDate.startsWith(key)),
      );
      return {
        month: key,
        income: r.income,
        expenses: r.expenses,
        saved: r.saved,
      };
    });
    const insights = [
      `Tu tasa de ahorro este mes es de ${period.savingsRate}%.`,
      `Tienes $${total.balance} MXN disponibles y $${total.saved} MXN reservados.`,
    ];
    const before = sum(prior, "EXPENSE");
    if (before.gt(0))
      insights.push(
        `Tus gastos cambiaron ${D(period.expenses).minus(before).div(before).mul(100).toFixed(1)}% respecto al mes anterior.`,
      );
    for (const a of allocations)
      if (D(a.planned).gt(0) && D(a.actual).div(a.planned).gte(0.8))
        insights.push(
          `Has utilizado ${D(a.actual).div(a.planned).mul(100).toFixed(0)}% de tu asignación de ${a.bucket === "needs" ? "necesidades" : a.bucket === "wants" ? "deseos" : "ahorro"}.`,
        );
    return {
      month: selected,
      ...period,
      balance: total.balance,
      totalSaved: total.saved,
      available: total.balance,
      allocations,
      categorySpending,
      cashFlowSeries: cashFlow,
      goals,
      insights,
      recent: [...all]
        .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
        .slice(0, 6),
      budgetBase: base,
    };
  }
}
