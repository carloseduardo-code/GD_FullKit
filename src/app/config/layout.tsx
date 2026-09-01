import { AppShell } from "@/components/app-shell";

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell section="Configuração" contentClassName="max-w-6xl">
      {children}
    </AppShell>
  );
}
