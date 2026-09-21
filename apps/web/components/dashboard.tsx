"use client";
import { useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Wallet,
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useSession } from "./providers";
import { useData } from "../lib/use-data";
import { money, dateLabel } from "../lib/utils";
import { Button } from "./ui/button";
import { Skeleton } from "./shell";
const colors = [
  "#0e9b79",
  "#69c8ad",
  "#9cdcd5",
  "#eeae67",
  "#858ac7",
  "#acbdce",
];
const labels: Record<string, string> = {
  needs: "Necesidades",
  wants: "Deseos",
  savings: "Ahorro",
  INCOME: "Ingreso",
  EXPENSE: "Gasto",
  SAVING: "Ahorro",
};
export function GoalCard({ goal: g }: { goal: any }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="icon-tile">
          <Target size={18} />
        </span>
        <div className="flex-1">
          <p className="font-semibold">{g.name}</p>
          <p className="muted text-xs mt-1">
            {Number(g.progress) >= 100
              ? "¡Meta alcanzada!"
              : g.targetDate
                ? "Para el " + dateLabel(g.targetDate)
                : "A tu ritmo"}
          </p>
        </div>
        <span className="text-emerald-600 font-bold text-sm">
          {Number(g.progress).toFixed(0)}%
        </span>
      </div>
      <div className="progress">
        <span style={{ width: Math.min(100, Number(g.progress)) + "%" }} />
      </div>
      <div className="flex justify-between text-xs mt-3">
        <strong>{money(g.saved)}</strong>
        <span className="muted">de {money(g.targetAmount)}</span>
      </div>
      <p className="muted text-xs mt-2">Te faltan {money(g.remaining)}</p>
    </div>
  );
}
export function RecentTable({ items }: { items: any[] }) {
  return items.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Movimiento</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th className="!text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td>
                <div className="flex gap-3 items-center">
                  <span className="icon-tile">
                    {t.type === "INCOME" ? (
                      <ArrowDownLeft size={17} />
                    ) : t.type === "SAVING" ? (
                      <Target size={17} />
                    ) : (
                      <ArrowUpRight size={17} />
                    )}
                  </span>
                  <span className="font-medium">
                    {t.description || labels[t.type]}
                  </span>
                </div>
              </td>
              <td className="muted">{dateLabel(t.transactionDate)}</td>
              <td>
                <span className="pill">{labels[t.type]}</span>
              </td>
              <td
                className={
                  "!text-right font-semibold " +
                  (t.type === "INCOME" ? "text-emerald-600" : "")
                }
              >
                {t.type === "INCOME" ? "+" : "−"}
                {money(t.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="empty">
      Tu historia financiera empieza con tu primer movimiento.
      <br />
      <Link
        href="/transactions/new"
        className="!text-emerald-600 inline-block mt-4"
      >
        Registrar un movimiento →
      </Link>
    </div>
  );
}
export function Dashboard() {
  const { user } = useSession();
  const [month, setMonth] = useState(
    new Date()
      .toLocaleDateString("en-CA", {
        timeZone: "America/Mexico_City",
        year: "numeric",
        month: "2-digit",
      })
      .slice(0, 7),
  );
  const {
    data: d,
    loading,
    error,
    reload,
  } = useData("/dashboard/summary?month=" + month);
  if (loading) return <Skeleton />;
  if (error)
    return (
      <div className="card">
        {error}
        <Button onClick={reload}>Reintentar</Button>
      </div>
    );
  if (!d) return null;
  return (
    <div className="space-y-7">
      <div className="section-head">
        <div>
          <p className="muted text-xs mb-2">UN VISTAZO A TU TRANQUILIDAD</p>
          <h1>
            Hola, {user?.name.split(" ")[0]}{" "}
            <span className="text-emerald-600">✦</span>
          </h1>
          <p className="muted mt-2">
            Cada decisión de hoy acerca tus planes de mañana.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            className="filter !w-auto"
            aria-label="Mes del resumen"
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
          <Button asChild>
            <Link href="/transactions/new">
              <Plus size={17} />
              Nuevo movimiento
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid-kpi">
        <div className="card !bg-[#074f40] !text-white !border-0 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <p className="text-emerald-100/75 text-xs">Saldo disponible</p>
            <Wallet size={19} className="text-emerald-200" />
          </div>
          <p className="kpi-value mt-5">{money(d.available)}</p>
          <p className="text-emerald-100/65 text-[11px] mt-4">
            {money(d.totalSaved)} reservados por separado
          </p>
        </div>
        {[
          {
            label: "Ingresos del mes",
            value: d.income,
            icon: ArrowDownLeft,
            color: "text-emerald-600",
            note: "Dinero que recibiste",
          },
          {
            label: "Gastos del mes",
            value: d.expenses,
            icon: ArrowUpRight,
            color: "text-orange-500",
            note: "Sin incluir tu ahorro",
          },
          {
            label: "Ahorro del mes",
            value: d.saved,
            icon: Target,
            color: "text-blue-500",
            note: `${d.savingsRate}% de tus ingresos`,
          },
        ].map((c) => (
          <div key={c.label} className="card">
            <div className="flex justify-between items-center">
              <p className="muted text-xs">{c.label}</p>
              <c.icon size={19} className={c.color} />
            </div>
            <p className="kpi-value mt-5">{money(c.value)}</p>
            <p className="muted text-[11px] mt-4">{c.note}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {[
          ["INCOME", "Registrar ingreso"],
          ["EXPENSE", "Registrar gasto"],
          ["SAVING", "Registrar ahorro"],
        ].map(([t, l]) => (
          <Button key={t} asChild variant="outline">
            <Link href={"/transactions/new?type=" + t}>
              <Plus size={15} />
              {l}
            </Link>
          </Button>
        ))}
      </div>
      <div className="two-col">
        <section className="card">
          <div className="section-head">
            <div>
              <h2>Flujo de efectivo</h2>
              <p className="muted text-xs mt-1">
                Ingresos y gastos · últimos 6 meses
              </p>
            </div>
            <span className="pill">
              <TrendingUp size={13} />
              {money(d.cashFlow)} este mes
            </span>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={d.cashFlowSeries.map((r: any) => ({
                  ...r,
                  income: Number(r.income),
                  expenses: Number(r.expenses),
                }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="income-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0e9b79" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#0e9b79" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--line)"
                  strokeDasharray="3 4"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(s) =>
                    new Date(s + "-02").toLocaleDateString("es-MX", {
                      month: "short",
                    })
                  }
                />
                <YAxis
                  width={52}
                  tick={{ fontSize: 11, fill: "var(--muted)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => "$" + (v >= 1000 ? v / 1000 + "k" : v)}
                />
                <Tooltip
                  formatter={(v) => money(Number(v))}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Ingresos"
                  stroke="#0e9b79"
                  fill="url(#income-fill)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Gastos"
                  stroke="#eca26a"
                  fill="transparent"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-5 text-xs muted">
            <span>🟢 Ingresos</span>
            <span>🟠 Gastos</span>
          </div>
        </section>
        <section className="card">
          <div className="section-head">
            <div>
              <h2>Tu distribución del dinero</h2>
              <p className="muted text-xs mt-1">
                Planificado vs. reservado o utilizado
              </p>
            </div>
            <Link href="/budget" className="text-emerald-600">
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="space-y-6 mt-7">
            {d.allocations.map((a: any, i: number) => (
              <div key={a.bucket}>
                <div className="flex justify-between mb-3 text-sm">
                  <span className="font-semibold">
                    {labels[a.bucket]}{" "}
                    <span className="muted font-normal ml-2">
                      {a.percentage}%
                    </span>
                  </span>
                  <span className="text-xs">
                    {money(a.actual)}{" "}
                    <span className="muted">/ {money(a.planned)}</span>
                  </span>
                </div>
                <div className="progress">
                  <span
                    style={{
                      width:
                        Math.min(
                          100,
                          Number(a.planned) > 0
                            ? (Number(a.actual) / Number(a.planned)) * 100
                            : 0,
                        ) + "%",
                      background: ["#0e9b79", "#eca26a", "#7c87c7"][i],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="muted text-[11px] mt-7">
            Base: {money(d.budgetBase)} · ingresos del mes o estimación si aún
            no hay ingresos.
          </p>
        </section>
      </div>
      <div className="two-col">
        <section className="card">
          <div className="section-head">
            <h2>Movimientos recientes</h2>
            <Link
              className="text-emerald-600 text-xs flex items-center gap-1"
              href="/transactions"
            >
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <RecentTable items={d.recent} />
        </section>
        <section className="card">
          <div className="section-head">
            <h2>Gastos por categoría</h2>
            <span className="muted text-xs">Este mes</span>
          </div>
          {d.categorySpending.length ? (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={d.categorySpending.map((c: any) => ({
                        ...c,
                        value: Number(c.amount),
                      }))}
                      dataKey="value"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {d.categorySpending.map((c: any, i: number) => (
                        <Cell key={c.name} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => money(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-3">
                {d.categorySpending.map((c: any, i: number) => (
                  <div key={c.name} className="flex justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: colors[i % colors.length] }}
                      />
                      {c.name}
                    </span>
                    <strong>{money(c.amount)}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty">
              Todavía no hay gastos este mes.
              <p className="text-xs mt-2">
                Aquí podrás ver a dónde va tu dinero.
              </p>
            </div>
          )}
        </section>
      </div>
      <section className="card">
        <div className="section-head">
          <div>
            <h2>Tus metas, cada vez más cerca</h2>
            <p className="muted text-xs mt-1">
              Pequeños pasos, grandes posibilidades.
            </p>
          </div>
          <Link href="/savings" className="text-emerald-600 text-xs">
            Administrar metas →
          </Link>
        </div>
        {d.goals.length ? (
          <div className="three-col mt-6">
            {d.goals.slice(0, 3).map((g: any) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        ) : (
          <div className="empty">
            Ponle nombre a tu próximo logro.{" "}
            <Link href="/savings" className="!text-emerald-600">
              Crea una meta →
            </Link>
          </div>
        )}
      </section>
      <section className="card !bg-[var(--soft)] !shadow-none">
        <div className="flex gap-3">
          <Sparkles className="text-emerald-600 shrink-0" size={20} />
          <div>
            <h2>Tu resumen financiero</h2>
            <ul className="mt-3 space-y-2 muted text-sm">
              {d.insights.map((t: string) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <p className="text-center muted text-[11px] pb-2">
        FinanceFlow · Más claridad para lo que viene.
      </p>
    </div>
  );
}
