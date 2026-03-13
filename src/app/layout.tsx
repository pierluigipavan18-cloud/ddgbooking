import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ddgBooking — Prenota il tuo appuntamento",
  description:
    "Sistema di prenotazione appuntamenti per DDG Solutions. Soluzioni di valore per l'energia.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
