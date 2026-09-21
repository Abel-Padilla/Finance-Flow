"use client";
import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Plus } from "lucide-react";
import { sileo } from "sileo";
import { useData } from "../lib/use-data";
import { api } from "../lib/api";
import { money, dateLabel } from "../lib/utils";
import { Button } from "./ui/button";
import { ConfirmDeleteDialog } from "./ui/confirm-delete-dialog";
import { TransactionEditor } from "./transaction-editor";
import { Skeleton } from "./shell";
export function Transactions() {
  const [filters, setFilters] = useState({
      type: "",
      search: "",
      from: "",
      to: "",
      accountId: "",
      categoryId: "",
    }),
    [page, setPage] = useState(1),
    [edit, setEdit] = useState<any>(null),
    [deleting, setDeleting] = useState<string | null>(null);
  const query = new URLSearchParams({
    page: String(page),
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
  });
  const { data, loading, error, reload } = useData("/transactions?" + query),
    { data: accounts } = useData<any[]>("/accounts"),
    { data: categories } = useData<any[]>("/categories");
  const change = (key: string, value: string) => {
    setPage(1);
    setFilters((v) => ({ ...v, [key]: value }));
  };
  return (
    <div className="space-y-6">
      <div className="section-head">
        <div>
          <h1>Movimientos</h1>
          <p className="muted mt-2">
            La historia de tu dinero, con todos sus detalles.
          </p>
        </div>
        <Button asChild>
          <Link href="/transactions/new">
            <Plus size={17} />
            Nuevo movimiento
          </Link>
        </Button>
      </div>
      {edit && (
        <>
          <div className="section-head">
            <h2>Editar movimiento</h2>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Cerrar
            </Button>
          </div>
          <TransactionEditor
            key={edit.id}
            editing={edit}
            onSaved={() => {
              setEdit(null);
              void reload();
            }}
          />
        </>
      )}
      <section className="card">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          <label className="field">
            Buscar
            <input
              placeholder="Descripción…"
              value={filters.search}
              onChange={(e) => change("search", e.target.value)}
            />
          </label>
          <label className="field">
            Tipo
            <select
              value={filters.type}
              onChange={(e) => change("type", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="INCOME">Ingresos</option>
              <option value="EXPENSE">Gastos</option>
              <option value="SAVING">Ahorros</option>
            </select>
          </label>
          <label className="field">
            Cuenta
            <select
              value={filters.accountId}
              onChange={(e) => change("accountId", e.target.value)}
            >
              <option value="">Todas</option>
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Categoría
            <select
              value={filters.categoryId}
              onChange={(e) => change("categoryId", e.target.value)}
            >
              <option value="">Todas</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.type === "INCOME" ? "Ingreso" : "Gasto"}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Desde
            <input
              type="date"
              value={filters.from}
              onChange={(e) => change("from", e.target.value)}
            />
          </label>
          <label className="field">
            Hasta
            <input
              type="date"
              value={filters.to}
              onChange={(e) => change("to", e.target.value)}
            />
          </label>
        </div>
        {loading ? (
          <Skeleton />
        ) : error ? (
          <p role="alert">{error}</p>
        ) : data?.items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Fecha</th>
                  <th>Cuenta / categoría</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((t: any) => (
                  <tr key={t.id}>
                    <td className="font-medium">
                      {t.description || "Sin descripción"}
                    </td>
                    <td>{dateLabel(t.transactionDate)}</td>
                    <td>
                      {accounts?.find((a) => a.id === t.accountId)?.name}
                      <p className="muted text-xs mt-1">
                        {categories?.find((c) => c.id === t.categoryId)?.name ||
                          "Ahorro reservado"}
                      </p>
                    </td>
                    <td>
                      <span className="pill">
                        {t.type === "INCOME"
                          ? "Ingreso"
                          : t.type === "EXPENSE"
                            ? "Gasto"
                            : "Ahorro"}
                      </span>
                    </td>
                    <td
                      className={
                        "font-semibold " +
                        (t.type === "INCOME" ? "text-emerald-600" : "")
                      }
                    >
                      {t.type === "INCOME" ? "+" : "−"}
                      {money(t.amount)}
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        aria-label="Editar movimiento"
                        onClick={() => setEdit(t)}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label="Eliminar movimiento"
                        onClick={() => setDeleting(t.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No hay movimientos con estos filtros.</div>
        )}
        <div className="flex items-center justify-between mt-5">
          <p className="muted text-xs">
            {data?.total || 0} movimientos · Página {page}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={page * 20 >= (data?.total || 0)}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </section>
      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        onConfirm={async () => {
          try {
            await api("/transactions/" + deleting, { method: "DELETE" });
            sileo.success({ title: "Movimiento eliminado" });
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
