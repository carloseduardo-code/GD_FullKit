import { AppShell } from "@/components/app-shell";

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell section="config">
      <div className="mx-auto w-full max-w-[1180px]">{children}</div>
    </AppShell>
  );
}
