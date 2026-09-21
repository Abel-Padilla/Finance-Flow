import type { Metadata } from "next";
import "./globals.css";
import "sileo/styles.css";
import { Providers } from "../components/providers";
export const metadata: Metadata = {
  title: "FinanceFlow · Tu dinero, con dirección",
  description: "Tus cuentas, gastos y metas en un solo lugar.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-MX" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
