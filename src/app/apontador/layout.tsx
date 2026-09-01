import { AppShell } from "@/components/app-shell";

export default function ApontadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell section="Apontamentos" contentClassName="max-w-3xl">
      {children}
    </AppShell>
  );
}
