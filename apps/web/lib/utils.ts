import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...v: ClassValue[]) => twMerge(clsx(v));
export const money = (v: string | number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(v),
  );
export const dateLabel = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
