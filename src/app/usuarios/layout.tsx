import { AppShell } from "@/components/app-shell";

export default function UsuariosLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell section="usuarios">
      <div className="mx-auto w-full max-w-[1180px]">{children}</div>
    </AppShell>
  );
}
