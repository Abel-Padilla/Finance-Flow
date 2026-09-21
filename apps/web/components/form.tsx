"use client";
import { useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "./ui/button";
export type Field = {
  name: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  hint?: string;
  full?: boolean;
};
export function DataForm({
  fields,
  schema,
  initial,
  onSubmit,
  submit = "Guardar cambios",
}: {
  fields: Field[];
  schema: z.ZodType<any>;
  initial: Record<string, any>;
  onSubmit: (v: any) => Promise<void>;
  submit?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema as any),
    defaultValues: initial as DefaultValues<any>,
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="fields">
        {fields.map((f) => (
          <label
            key={f.name}
            className={"field " + (f.full ? "full" : "")}
            htmlFor={f.name}
          >
            {f.label}
            {f.options ? (
              <select
                id={f.name}
                {...register(f.name)}
                aria-invalid={!!errors[f.name]}
                aria-describedby={
                  errors[f.name] ? f.name + "-error" : undefined
                }
              >
                {f.options.map((o) => (
                  <option value={o.value} key={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={f.name}
                type={f.type || "text"}
                step={f.type === "number" ? "0.01" : undefined}
                {...register(f.name)}
                aria-invalid={!!errors[f.name]}
                aria-describedby={
                  errors[f.name] ? f.name + "-error" : undefined
                }
              />
            )}
            {f.hint && (
              <span className="muted text-xs font-normal">{f.hint}</span>
            )}
            {errors[f.name] && (
              <span className="error" id={f.name + "-error"} role="alert">
                {String(errors[f.name]?.message)}
              </span>
            )}
          </label>
        ))}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando…" : submit}
      </Button>
    </form>
  );
}
export const amount = z
  .string()
  .regex(
    /^\d{1,12}(\.\d{1,2})?$/,
    "Ingresa un monto válido, con hasta 2 decimales.",
  );
export const positive = amount.refine(
  (v) => Number(v) > 0,
  "El monto debe ser mayor que cero.",
);
export const name = z
  .string()
  .trim()
  .min(1, "Este campo es obligatorio.")
  .max(80, "Máximo 80 caracteres.");
