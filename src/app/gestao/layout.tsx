import { AppShell } from "@/components/app-shell";

export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell section="gestao">
      <div className="mx-auto w-full max-w-[1180px]">{children}</div>
    </AppShell>
  );
}
