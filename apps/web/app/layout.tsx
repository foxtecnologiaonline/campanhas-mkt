import type { ReactNode } from "react";
import { Archivo, IBM_Plex_Sans } from "next/font/google";

const archivo = Archivo({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });

export const metadata = {
  title: "Campanhas Mkt",
  description: "Plataforma de campanhas multicanal — v1.0 WhatsApp",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${plexSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
