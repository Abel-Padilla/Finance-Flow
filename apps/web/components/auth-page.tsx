"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { sileo } from "sileo";
import { DataForm, name } from "./form";
import { Brand } from "./shell";
import { send, setToken } from "../lib/api";
import { useSession } from "./providers";
import { ArrowUpRight, Check } from "lucide-react";
export function AuthPage({ register = false }: { register?: boolean }) {
  const router = useRouter(),
    { user, setUser, loading } = useSession();
  useEffect(() => {
    if (!loading && user)
      router.replace(user.onboarded ? "/dashboard" : "/onboarding");
  }, [user, loading, router]);
  const schema = z.object({
    ...(register ? { name } : {}),
    email: z.email("Ingresa un correo válido."),
    password: register
      ? z
          .string()
          .min(8, "Usa al menos 8 caracteres.")
          .max(128)
          .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Incluye mayúscula, minúscula y número.",
          )
      : z.string().min(1, "Ingresa tu contraseña."),
  });
  return (
    <div className="auth">
      <aside className="auth-aside">
        <div className="brand mb-20">
          <span className="brand-mark">
            <ArrowUpRight />
          </span>
          nexum.
        </div>
        <p className="uppercase tracking-[3px] text-white text-xs mb-5">
          MÁS CLARIDAD. MÁS TRANQUILIDAD.
        </p>
        <h1 className="!text-5xl !leading-tight mb-6">
          Tu dinero,
          <br />
          con dirección.
        </h1>
        <p className="text-white text-lg leading-8 max-w-sm">
          Entiende tu presente y construye el futuro que tienes en mente.
        </p>
        <div className="mt-10 space-y-4">
          {[
            "Todas tus cuentas, en un lugar",
            "Un presupuesto que se adapta a ti",
            "Metas que avanzan contigo",
          ].map((t) => (
            <p key={t} className="flex gap-3 text-sm">
              <Check size={18} className="text-white" />
              {t}
            </p>
          ))}
        </div>
      </aside>
      <main className="auth-form">
        <div>
          <div className="mb-12 lg:hidden">
            <Brand />
          </div>
          <p className="muted text-xs uppercase tracking-widest mb-3">
            TU NUEVO HÁBITO EMPIEZA AQUÍ
          </p>
          <h1>{register ? "Crea tu cuenta" : "Qué bueno verte de nuevo"}</h1>
          <p className="muted mt-3 mb-8">
            {register
              ? "Dale claridad a tus finanzas, paso a paso."
              : "Inicia sesión para ver cómo va tu dinero."}
          </p>
          <DataForm
            schema={schema}
            initial={{ name: "", email: "", password: "" }}
            fields={[
              ...(register
                ? [{ name: "name", label: "Nombre", full: true }]
                : []),
              {
                name: "email",
                label: "Correo electrónico",
                type: "email",
                full: true,
              },
              {
                name: "password",
                label: "Contraseña",
                type: "password",
                full: true,
                hint: register
                  ? "8 caracteres, mayúscula, minúscula y número."
                  : undefined,
              },
            ]}
            submit={register ? "Crear cuenta" : "Iniciar sesión"}
            onSubmit={async (v) => {
              try {
                const result = await send(
                  register ? "/auth/register" : "/auth/login",
                  { ...v, ...(register ? { currency: "MXN" } : {}) },
                );
                setToken(result.accessToken);
                setUser(result.user);
                router.replace(
                  result.user.onboarded ? "/dashboard" : "/onboarding",
                );
              } catch (e) {
                sileo.error({
                  title: "No se pudo iniciar",
                  description: (e as Error).message,
                });
              }
            }}
          />
          <p className="muted mt-8 text-center text-sm">
            {register ? "¿Ya tienes cuenta?" : "¿Es tu primera vez?"}{" "}
            <Link
              className="!text-[var(--accent-text)] font-semibold"
              href={register ? "/login" : "/register"}
            >
              {register ? "Inicia sesión" : "Crea una cuenta"}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
