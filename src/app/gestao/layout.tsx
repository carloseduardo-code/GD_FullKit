import { AppShell } from "@/components/app-shell";

export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell section="Gestão" contentClassName="max-w-6xl">
      {children}
    </AppShell>
  );
}
