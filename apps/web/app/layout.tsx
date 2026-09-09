import type { ReactNode } from "react";

export const metadata = {
  title: "Campanhas Mkt",
  description: "Plataforma de campanhas multicanal — v1.0 WhatsApp",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
