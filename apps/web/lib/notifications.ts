import { sileo } from "sileo";
import { api } from "./api";
/** Follow-up feedback is derived from persisted data; failed insight reads do not undo a saved transaction. */
export async function financialFeedback(type: string, goalId?: string) {
  try {
    const summary = await api("/dashboard/summary");
    if (type === "EXPENSE") {
      const near = summary.allocations.find(
        (a: any) =>
          a.bucket !== "savings" &&
          Number(a.planned) > 0 &&
          Number(a.actual) / Number(a.planned) >= 0.8,
      );
      if (near)
        sileo.warning({
          title:
            Number(near.actual) > Number(near.planned)
              ? "Presupuesto excedido"
              : "Presupuesto cerca del límite",
          description: `Revisa tu asignación de ${near.bucket === "needs" ? "necesidades" : "deseos"}.`,
        });
    }
    if (type === "SAVING" && goalId) {
      const goal = summary.goals.find((g: any) => g.id === goalId);
      if (goal && Number(goal.progress) >= 100)
        sileo.success({
          title: "Meta alcanzada",
          description: `Completaste ${goal.name}.`,
        });
    }
  } catch {
    /* The financial mutation already succeeded. */
  }
}
