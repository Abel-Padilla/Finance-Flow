"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { sileo } from "sileo";
import { useSession } from "../../components/providers";
import { DataForm, amount } from "../../components/form";
import { Brand, Skeleton } from "../../components/shell";
import { send } from "../../lib/api";
export default function Onboarding() {
  const { user, loading, reload } = useSession(),
    router = useRouter();
  const [step, setStep] = useState(1),
    [values, setValues] = useState<any>({});
  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login");
      else if (user.onboarded) router.replace("/dashboard");
    }
  }, [user, loading, router]);
  if (loading || !user) return <Skeleton />;
  return (
    <main className="max-w-2xl mx-auto p-6 py-12">
      <Brand />
      <div className="flex gap-2 mt-12 mb-8">
        {[1, 2, 3].map((i) => (
          <span
            className={
              "h-1.5 flex-1 rounded " +
              (i <= step ? "bg-emerald-600" : "bg-[var(--line)]")
            }
            key={i}
          />
        ))}
      </div>
      <p className="muted text-xs mb-3">CONFIGURACIÓN · PASO {step} DE 3</p>
      <h1>
        {
          [
            "Tu situación actual",
            "Dale un destino a tu dinero",
            "Tu primera meta",
          ][step - 1]
        }
      </h1>
      <p className="muted mt-3 mb-7">
        {
          [
            "Empecemos con lo que tienes hoy. Todos los montos están en MXN.",
            "Elige 50/30/20 o ajusta la distribución. Debe sumar 100%.",
            "¿Para qué te gustaría ahorrar? Puedes omitir este paso.",
          ][step - 1]
        }
      </p>
      <div className="card">
        <DataForm
          key={step}
          initial={
            step === 1
              ? { initialBalance: "0", monthlyIncome: user.monthlyIncome }
              : step === 2
                ? { needs: "50", wants: "30", savings: "20" }
                : { goalName: "", goalTarget: "" }
          }
          fields={
            step === 1
              ? [
                  {
                    name: "initialBalance",
                    label: "Dinero disponible hoy",
                    type: "number",
                    hint: "Si ya tienes cuentas, conservaremos sus saldos.",
                  },
                  {
                    name: "monthlyIncome",
                    label: "Ingreso mensual estimado",
                    type: "number",
                  },
                ]
              : step === 2
                ? [
                    { name: "needs", label: "Necesidades (%)", type: "number" },
                    { name: "wants", label: "Deseos (%)", type: "number" },
                    { name: "savings", label: "Ahorro (%)", type: "number" },
                  ]
                : [
                    { name: "goalName", label: "Nombre de tu meta (opcional)" },
                    {
                      name: "goalTarget",
                      label: "Monto objetivo",
                      type: "number",
                    },
                  ]
          }
          schema={
            step === 1
              ? z.object({ initialBalance: amount, monthlyIncome: amount })
              : step === 2
                ? z
                    .object({
                      needs: z.coerce.number().int().min(0).max(100),
                      wants: z.coerce.number().int().min(0).max(100),
                      savings: z.coerce.number().int().min(0).max(100),
                    })
                    .refine((v) => v.needs + v.wants + v.savings === 100, {
                      path: ["savings"],
                      message: "Los porcentajes deben sumar 100%.",
                    })
                : z
                    .object({
                      goalName: z.string().max(80),
                      goalTarget: z.string(),
                    })
                    .refine(
                      (v) =>
                        !v.goalName ||
                        (/^\d{1,12}(\.\d{1,2})?$/.test(v.goalTarget) &&
                          Number(v.goalTarget) > 0),
                      {
                        path: ["goalTarget"],
                        message: "Ingresa un objetivo mayor que cero.",
                      },
                    )
          }
          submit={step < 3 ? "Continuar" : "Ir a mi resumen"}
          onSubmit={async (v) => {
            if (step < 3) {
              setValues({ ...values, ...v });
              setStep(step + 1);
              return;
            }
            try {
              await send("/users/onboarding", {
                ...values,
                currency: "MXN",
                ...(v.goalName ? v : {}),
              });
              await reload();
              sileo.success({
                title: "Todo listo",
                description: "Tu nueva etapa financiera empieza hoy.",
              });
              router.replace("/dashboard");
            } catch (e) {
              sileo.error({
                title: "No se pudo guardar",
                description: (e as Error).message,
              });
            }
          }}
        />
      </div>
    </main>
  );
}
