"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { sileo } from "sileo";
import { DataForm, positive } from "./form";
import { useData } from "../lib/use-data";
import { send } from "../lib/api";
import { financialFeedback } from "../lib/notifications";
import { Button } from "./ui/button";
import { Skeleton } from "./shell";
export function TransactionEditor({
  editing,
  onSaved,
}: {
  editing?: any;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [type, setType] = useState(editing?.type || "EXPENSE");
  const { data: accounts, loading: a } = useData<any[]>("/accounts"),
    { data: categories, loading: c } = useData<any[]>("/categories"),
    { data: goals, loading: g } = useData<any[]>("/savings-goals");
  useEffect(() => {
    if (!editing) {
      const t = new URLSearchParams(window.location.search).get("type");
      if (t && ["INCOME", "EXPENSE", "SAVING"].includes(t)) setType(t);
    }
  }, [editing]);
  if (a || c || g) return <Skeleton />;
  if (!accounts?.length)
    return (
      <div className="card empty">
        Primero agrega una cuenta.
        <Link href="/accounts" className="!text-[var(--accent)] ml-2">
          Ir a mis cuentas →
        </Link>
      </div>
    );
  const options = categories?.filter((c) => c.type === type) || [];
  return (
    <section className="card max-w-3xl">
      <div className="flex gap-2 mb-7 flex-wrap">
        {[
          ["INCOME", "Ingreso"],
          ["EXPENSE", "Gasto"],
          ["SAVING", "Ahorro"],
        ].map(([t, l]) => (
          <Button
            key={t}
            variant={type === t ? "default" : "outline"}
            onClick={() => setType(t)}
          >
            {l}
          </Button>
        ))}
      </div>
      <DataForm
        key={type + (editing?.id || "")}
        initial={{
          amount: "",
          description: "",
          transactionDate: new Date().toLocaleDateString("en-CA", {
            timeZone: "America/Mexico_City",
          }),
          accountId: accounts[0].id,
          categoryId: options[0]?.id || "",
          ...editing,
          savingsGoalId: editing?.savingsGoalId || "",
        }}
        schema={z.object({
          amount: positive,
          description: z.string().max(240),
          transactionDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha."),
          accountId: z.uuid("Selecciona una cuenta."),
          ...(type === "SAVING"
            ? { savingsGoalId: z.string() }
            : { categoryId: z.uuid("Selecciona una categoría.") }),
        })}
        fields={[
          { name: "amount", label: "Monto (MXN)", type: "number" },
          { name: "transactionDate", label: "Fecha", type: "date" },
          {
            name: "accountId",
            label: "Cuenta",
            options: accounts.map((c) => ({ value: c.id, label: c.name })),
          },
          ...(type === "SAVING"
            ? [
                {
                  name: "savingsGoalId",
                  label: "Meta (opcional)",
                  options: [
                    { value: "", label: "Ahorro sin meta" },
                    ...(goals || []).map((g) => ({
                      value: g.id,
                      label: g.name,
                    })),
                  ],
                },
              ]
            : [
                {
                  name: "categoryId",
                  label: "Categoría",
                  options: options.map((c) => ({ value: c.id, label: c.name })),
                },
              ]),
          { name: "description", label: "Descripción", full: true },
        ]}
        submit={
          editing
            ? "Guardar cambios"
            : "Registrar " +
              (type === "INCOME"
                ? "ingreso"
                : type === "EXPENSE"
                  ? "gasto"
                  : "ahorro")
        }
        onSubmit={async (v) => {
          try {
            await send(
              "/transactions" + (editing ? "/" + editing.id : ""),
              {
                ...v,
                type,
                ...(type === "SAVING"
                  ? { savingsGoalId: v.savingsGoalId || undefined }
                  : {}),
              },
              editing ? "PATCH" : "POST",
            );
            sileo.success({
              title: editing
                ? "Movimiento actualizado"
                : type === "SAVING"
                  ? "Ahorro registrado"
                  : type === "INCOME"
                    ? "Ingreso registrado"
                    : "Gasto registrado",
              description: "Tu saldo y tus metas se actualizaron.",
            });
            void financialFeedback(type, v.savingsGoalId);
            if (onSaved) onSaved();
            else router.push("/transactions");
          } catch (e) {
            sileo.error({
              title: "No se pudo guardar",
              description: (e as Error).message,
            });
          }
        }}
      />
      {type === "SAVING" && (
        <p className="muted text-xs mt-5">
          Este monto se separa de tu saldo disponible. Sigue siendo tuyo y no se
          cuenta como gasto.
        </p>
      )}
    </section>
  );
}
