"use client";
import { useState } from "react";
import { z } from "zod";
import { sileo } from "sileo";
import { Pencil, Trash2, Plus, Wallet, Tag } from "lucide-react";
import { useData } from "../lib/use-data";
import { api, send } from "../lib/api";
import { money } from "../lib/utils";
import { DataForm, positive, name, type Field } from "./form";
import { Button } from "./ui/button";
import { ConfirmDeleteDialog } from "./ui/confirm-delete-dialog";
import { GoalCard } from "./dashboard";
import { Skeleton } from "./shell";
const accountTypes = [
  { value: "BANK", label: "Banco" },
  { value: "CASH", label: "Efectivo" },
  { value: "DEBIT", label: "Débito" },
  { value: "OTHER", label: "Otra" },
];
const definitions = {
  accounts: {
    title: "Mis cuentas",
    subtitle: "Sabe dónde está tu dinero, en todo momento.",
    singular: "cuenta",
    schema: z.object({
      name,
      type: z.enum(["BANK", "CASH", "DEBIT", "OTHER"]),
      initialBalance: z
        .string()
        .regex(/^-?\d{1,12}(\.\d{1,2})?$/, "Ingresa un saldo válido."),
    }),
    initial: { name: "", type: "BANK", initialBalance: "0" },
    fields: [
      { name: "name", label: "Nombre de la cuenta" },
      { name: "type", label: "Tipo de cuenta", options: accountTypes },
      {
        name: "initialBalance",
        label: "Saldo inicial (MXN)",
        type: "number",
        hint: "Saldo antes de los movimientos registrados.",
      },
    ],
  },
  "savings-goals": {
    title: "Metas de ahorro",
    subtitle: "Convierte tus planes en algo que puedes alcanzar.",
    singular: "meta",
    schema: z.object({ name, targetAmount: positive, targetDate: z.string() }),
    initial: { name: "", targetAmount: "", targetDate: "" },
    fields: [
      { name: "name", label: "Nombre de la meta" },
      { name: "targetAmount", label: "Monto objetivo (MXN)", type: "number" },
      { name: "targetDate", label: "Fecha objetivo (opcional)", type: "date" },
    ],
  },
  categories: {
    title: "Categorías",
    subtitle: "Organiza tus ingresos y clasifica tus gastos.",
    singular: "categoría",
    schema: z.object({
      name,
      type: z.enum(["INCOME", "EXPENSE"]),
      classification: z.enum(["NEED", "WANT"]),
    }),
    initial: { name: "", type: "EXPENSE", classification: "NEED" },
    fields: [
      { name: "name", label: "Nombre" },
      {
        name: "type",
        label: "Tipo",
        options: [
          { value: "EXPENSE", label: "Gasto" },
          { value: "INCOME", label: "Ingreso" },
        ],
      },
      {
        name: "classification",
        label: "Asignación del gasto",
        options: [
          { value: "NEED", label: "Necesidad" },
          { value: "WANT", label: "Deseo" },
        ],
      },
    ],
  },
};
export function Resources({ kind }: { kind: keyof typeof definitions }) {
  const def = definitions[kind],
    { data, loading, error, reload } = useData<any[]>("/" + kind),
    [editing, setEditing] = useState<any>(null),
    [deleting, setDeleting] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <div className="section-head">
        <div>
          <h1>{def.title}</h1>
          <p className="muted mt-2">{def.subtitle}</p>
        </div>
        <Button onClick={() => setEditing({})}>
          <Plus size={17} />
          Nueva {def.singular}
        </Button>
      </div>
      {editing && (
        <section className="card">
          <div className="section-head">
            <h2>
              {editing.id ? "Editar" : "Nueva"} {def.singular}
            </h2>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cerrar
            </Button>
          </div>
          <DataForm
            key={editing.id || "new"}
            fields={def.fields as Field[]}
            schema={def.schema}
            initial={{
              ...def.initial,
              ...editing,
              targetDate: editing.targetDate || "",
            }}
            onSubmit={async (v) => {
              try {
                const payload = { ...v };
                if (kind === "accounts") payload.currency = "MXN";
                if (kind === "savings-goals" && !payload.targetDate)
                  payload.targetDate = null;
                await send(
                  "/" + kind + (editing.id ? "/" + editing.id : ""),
                  payload,
                  editing.id ? "PATCH" : "POST",
                );
                sileo.success({ title: "Cambios guardados" });
                setEditing(null);
                await reload();
              } catch (e) {
                sileo.error({
                  title: "No se pudo guardar",
                  description: (e as Error).message,
                });
              }
            }}
          />
        </section>
      )}
      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="card">
          {error}
          <Button onClick={reload}>Reintentar</Button>
        </div>
      ) : data?.length ? (
        <div className="three-col">
          {data.map((r) => (
            <div className="card" key={r.id}>
              {kind === "savings-goals" ? (
                <GoalCard goal={r} />
              ) : (
                <>
                  <span className="icon-tile mb-4">
                    {kind === "accounts" ? (
                      <Wallet size={20} />
                    ) : (
                      <Tag size={20} />
                    )}
                  </span>
                  <h2>{r.name}</h2>
                  <p className="muted text-xs mt-2">
                    {kind === "accounts"
                      ? accountTypes.find((t) => t.value === r.type)?.label
                      : r.type === "INCOME"
                        ? "Ingreso"
                        : r.classification === "NEED"
                          ? "Gasto · Necesidad"
                          : "Gasto · Deseo"}
                  </p>
                  {kind === "accounts" && (
                    <>
                      <p className="kpi-value mt-5">{money(r.balance)}</p>
                      <p className="muted text-xs mt-1">
                        Saldo disponible · MXN
                      </p>
                    </>
                  )}
                </>
              )}
              <div className="flex justify-end gap-1 mt-5 border-t border-[var(--line)] pt-3">
                <Button
                  variant="ghost"
                  onClick={() => setEditing(r)}
                  aria-label={"Editar " + r.name}
                >
                  <Pencil size={15} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setDeleting(r.id)}
                  aria-label={"Eliminar " + r.name}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty">
          Aún no tienes {def.title.toLowerCase()}.
          <p className="text-sm mt-2">Usa el botón de arriba para empezar.</p>
        </div>
      )}
      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        onConfirm={async () => {
          try {
            await api("/" + kind + "/" + deleting, { method: "DELETE" });
            sileo.success({ title: "Registro eliminado" });
            await reload();
          } catch (e) {
            sileo.error({
              title: "No se pudo eliminar",
              description: (e as Error).message,
            });
          } finally {
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
