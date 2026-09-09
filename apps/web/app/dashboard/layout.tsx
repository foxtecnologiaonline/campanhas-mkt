import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/org";
import { signOut } from "./actions";

const NAV = [
  { href: "/dashboard", label: "Visão geral" },
  { href: "/dashboard/contacts", label: "Contatos" },
  { href: "/dashboard/channels", label: "Canais" },
  { href: "/dashboard/templates", label: "Templates" },
  { href: "/dashboard/campaigns", label: "Campanhas" },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const org = await getCurrentOrg();
  if (!org) redirect("/login");

  return (
    <div>
      <header>
        <strong>{org.organizationName}</strong>
        <span> · {org.userEmail} · {org.role}</span>
        <form action={signOut} style={{ display: "inline" }}>
          <button type="submit">Sair</button>
        </form>
      </header>
      <nav>
        {NAV.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <main>{children}</main>
    </div>
  );
}
