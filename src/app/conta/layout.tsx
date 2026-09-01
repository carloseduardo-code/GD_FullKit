import { AppShell } from "@/components/app-shell";

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell section="Minha conta" contentClassName="max-w-4xl">
      {children}
    </AppShell>
  );
}
