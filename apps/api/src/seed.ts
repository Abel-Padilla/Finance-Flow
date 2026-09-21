import { db, pool } from "./db";
import { categories, users } from "./schema";
export const expenseNames = [
  "Vivienda",
  "Alimentación",
  "Transporte",
  "Salud",
  "Servicios",
  "Entretenimiento",
  "Compras",
  "Educación",
  "Viajes",
  "Otros",
];
export async function seedCategories(userId: string, tx: any = db) {
  await tx
    .insert(categories)
    .values([
      ...expenseNames.map((name, i) => ({
        userId,
        name,
        type: "EXPENSE",
        classification: [5, 6, 8, 9].includes(i) ? "WANT" : "NEED",
      })),
      ...["Salario", "Freelance", "Negocio", "Inversiones", "Otros"].map(
        (name) => ({ userId, name, type: "INCOME", classification: "NEED" }),
      ),
    ])
    .onConflictDoNothing();
}
if (process.argv[1]?.endsWith("seed.ts")) {
  (async () => {
    for (const u of await db.select().from(users)) await seedCategories(u.id);
    await pool.end();
    console.log("Default categories ready");
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
