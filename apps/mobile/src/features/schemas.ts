import { z } from "zod";
const money = z
  .string()
  .regex(
    /^\d{1,12}(\.\d{1,2})?$/,
    "Ingresa un monto válido, con hasta 2 decimales.",
  );
const positive = money.refine(
  (v) => !/^0+(\.0+)?$/.test(v),
  "El monto debe ser mayor que cero.",
);
const name = z
  .string()
  .trim()
  .min(1, "Este campo es obligatorio.")
  .max(80, "Máximo 80 caracteres.");
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato AAAA-MM-DD.")
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "La fecha no es válida.",
  );
export const loginSchema = z.object({
  email: z.email("Correo inválido."),
  password: z.string().min(1, "Ingresa tu contraseña.").max(128),
});
export const registerSchema = loginSchema.extend({
  name,
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres.")
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Incluye mayúscula, minúscula y número.",
    ),
  currency: z.literal("MXN"),
});
export const accountSchema = z.object({
  name,
  type: z.enum(["BANK", "CASH", "DEBIT", "OTHER"]),
  initialBalance: z
    .string()
    .regex(/^-?\d{1,12}(\.\d{1,2})?$/, "Saldo inválido."),
  currency: z.literal("MXN"),
});
export const goalSchema = z.object({
  name,
  targetAmount: positive,
  targetDate: z.union([dateSchema, z.literal("")]).transform((v) => v || null),
});
export const categorySchema = z.object({
  name: name.max(60),
  type: z.enum(["INCOME", "EXPENSE"]),
  classification: z.enum(["NEED", "WANT"]),
});
const percentage = z
  .string()
  .regex(/^\d{1,3}$/, "Usa un porcentaje entero.")
  .transform(Number)
  .refine((v) => v <= 100, "Máximo 100%.");
export const budgetSchema = z
  .object({ needs: percentage, wants: percentage, savings: percentage })
  .refine((v) => v.needs + v.wants + v.savings === 100, {
    path: ["savings"],
    message: "Los porcentajes deben sumar 100%.",
  });
export const settingsSchema = z.object({ name, monthlyIncome: money });
export const onboardingSchema = z
  .object({
    initialBalance: money,
    monthlyIncome: money,
    needs: percentage,
    wants: percentage,
    savings: percentage,
    goalName: z.string().max(80),
    goalTarget: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.needs + v.wants + v.savings !== 100)
      ctx.addIssue({
        code: "custom",
        path: ["savings"],
        message: "Los porcentajes deben sumar 100%.",
      });
    if (v.goalName && !positive.safeParse(v.goalTarget).success)
      ctx.addIssue({
        code: "custom",
        path: ["goalTarget"],
        message: "Ingresa un objetivo mayor que cero.",
      });
  })
  .transform((v) => ({
    initialBalance: v.initialBalance,
    monthlyIncome: v.monthlyIncome,
    needs: v.needs,
    wants: v.wants,
    savings: v.savings,
    currency: "MXN" as const,
    ...(v.goalName ? { goalName: v.goalName, goalTarget: v.goalTarget } : {}),
  }));
export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE", "SAVING"]),
    accountId: z.uuid("Selecciona una cuenta."),
    amount: positive,
    description: z.string().max(240),
    transactionDate: dateSchema,
    categoryId: z.string(),
    savingsGoalId: z.string(),
  })
  .superRefine((v, c) => {
    if (v.type !== "SAVING" && !z.uuid().safeParse(v.categoryId).success)
      c.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Selecciona una categoría.",
      });
    if (
      v.type === "SAVING" &&
      v.savingsGoalId &&
      !z.uuid().safeParse(v.savingsGoalId).success
    )
      c.addIssue({
        code: "custom",
        path: ["savingsGoalId"],
        message: "Selecciona una meta válida.",
      });
  })
  .transform((v) => ({
    type: v.type,
    accountId: v.accountId,
    amount: v.amount,
    description: v.description,
    transactionDate: v.transactionDate,
    ...(v.type === "SAVING"
      ? v.savingsGoalId
        ? { savingsGoalId: v.savingsGoalId }
        : {}
      : { categoryId: v.categoryId }),
  }));
