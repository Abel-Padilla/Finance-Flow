import type { Metadata } from "next";
import { Geist } from "next/font/google";
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});
import "./globals.css";
import "sileo/styles.css";
import { Providers } from "../components/providers";
export const metadata: Metadata = {
  title: "Nexum · Tu dinero, con dirección",
  description: "Tus cuentas, gastos y metas en un solo lugar.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-MX" suppressHydrationWarning>
      <body className={geist.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
