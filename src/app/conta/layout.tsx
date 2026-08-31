import { AppShell } from "@/components/app-shell";

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell section="conta">
      <div className="mx-auto w-full max-w-[720px]">{children}</div>
    </AppShell>
  );
}
