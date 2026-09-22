"use client";
import { z } from "zod";
import { sileo } from "sileo";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "../lib/use-data";
import { send, api } from "../lib/api";
import { useSession } from "./providers";
import { DataForm, name, amount } from "./form";
import { Resources } from "./resources";
import { Button } from "./ui/button";
import { ConfirmDeleteDialog } from "./ui/confirm-delete-dialog";
import { money } from "../lib/utils";
import { Skeleton } from "./shell";
const schema = z
  .object({
    needs: z.coerce.number().int().min(0).max(100),
    wants: z.coerce.number().int().min(0).max(100),
    savings: z.coerce.number().int().min(0).max(100),
  })
  .refine((v) => v.needs + v.wants + v.savings === 100, {
    path: ["savings"],
    message: "Los porcentajes deben sumar exactamente 100%.",
  });
export function Budget() {
  const { data, reload, loading } = useData("/budget"),
    { data: summary, reload: reloadSummary } = useData("/dashboard/summary");
  if (loading) return <Skeleton />;
  return (
    <div className="space-y-7">
      <div>
        <h1>Tu presupuesto</h1>
        <p className="muted mt-2">
          Dale espacio a lo necesario, lo que disfrutas y lo que viene.
        </p>
      </div>
      <section className="card">
        <h2 className="mb-6">Distribución mensual</h2>
        {data && (
          <DataForm
            key={JSON.stringify(data)}
            initial={data}
            schema={schema}
            fields={[
              { name: "needs", label: "Necesidades (%)", type: "number" },
              { name: "wants", label: "Deseos (%)", type: "number" },
              { name: "savings", label: "Ahorro (%)", type: "number" },
            ]}
            onSubmit={async (v) => {
              try {
                await send("/budget", v, "PUT");
                sileo.success({ title: "Presupuesto actualizado" });
                await reload();
                await reloadSummary();
              } catch (e) {
                sileo.error({
                  title: "No se pudo guardar",
                  description: (e as Error).message,
                });
              }
            }}
          />
        )}
        <Button
          className="mt-4"
          variant="outline"
          onClick={async () => {
            try {
              await send(
                "/budget",
                { needs: 50, wants: 30, savings: 20 },
                "PUT",
              );
              await reload();
              await reloadSummary();
              sileo.success({ title: "Estrategia 50/30/20 aplicada" });
            } catch (e) {
              sileo.error({ title: (e as Error).message });
            }
          }}
        >
          Aplicar 50/30/20
        </Button>
      </section>
      <div className="three-col">
        {summary?.allocations.map((a: any) => (
          <div className="card" key={a.bucket}>
            <h2>
              {a.bucket === "needs"
                ? "Necesidades"
                : a.bucket === "wants"
                  ? "Deseos"
                  : "Ahorro"}{" "}
              · {a.percentage}%
            </h2>
            <p className="kpi-value mt-5">{money(a.planned)}</p>
            <p className="muted mt-2">
              {money(a.actual)}{" "}
              {a.bucket === "savings" ? "reservados" : "utilizados"}
            </p>
            {Number(a.actual) > Number(a.planned) && (
              <p className="text-[var(--coral-text)] text-xs mt-4">
                Superaste el monto planificado.
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="muted text-xs">
        Usamos tus ingresos registrados del mes; si no hay ingresos, usamos tu
        estimación mensual. Las categorías comparten el presupuesto de
        Necesidades o Deseos.
      </p>
      <Resources kind="categories" />
    </div>
  );
}
export function Settings() {
  const { user, reload } = useSession(),
    router = useRouter(),
    [confirm, setConfirm] = useState(false);
  return (
    <div className="space-y-7 max-w-3xl">
      <div>
        <h1>Configuración</h1>
        <p className="muted mt-2">Tu perfil y tus preferencias.</p>
      </div>
      <section className="card">
        <p className="muted mb-6">{user?.email} · Moneda: MXN</p>
        <DataForm
          schema={z.object({ name, monthlyIncome: amount })}
          initial={{
            name: user?.name || "",
            monthlyIncome: user?.monthlyIncome || "0",
          }}
          fields={[
            { name: "name", label: "Nombre" },
            {
              name: "monthlyIncome",
              label: "Ingreso mensual estimado (MXN)",
              type: "number",
            },
          ]}
          onSubmit={async (v) => {
            try {
              await send("/users/settings", v, "PATCH");
              await reload();
              sileo.success({ title: "Perfil actualizado" });
            } catch (e) {
              sileo.error({ title: (e as Error).message });
            }
          }}
        />
      </section>
      <section className="card">
        <h2>Revisar mi punto de partida</h2>
        <p className="muted my-4">
          Vuelve a recorrer la configuración inicial. Tus cuentas, movimientos y
          metas existentes se conservarán. El saldo inicial no reemplazará el de
          tus cuentas.
        </p>
        <Button variant="outline" onClick={() => setConfirm(true)}>
          Reabrir configuración inicial
        </Button>
      </section>
      <ConfirmDeleteDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="¿Reabrir la configuración?"
        description="Se conservarán tus datos financieros y podrás revisar tus preferencias."
        onConfirm={async () => {
          try {
            await api("/users/reset-onboarding", { method: "POST" });
            await reload();
            router.push("/onboarding");
          } catch (e) {
            sileo.error({ title: (e as Error).message });
          }
        }}
      />
    </div>
  );
}
