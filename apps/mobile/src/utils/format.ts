export const money = (value: string | number, currency = "MXN") =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(
    Number(value),
  );
export const dateLabel = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const typeLabels = {
  INCOME: "Ingreso",
  EXPENSE: "Gasto",
  SAVING: "Ahorro",
};
export const bucketLabels = {
  needs: "Necesidades",
  wants: "Deseos",
  savings: "Ahorro",
};
