import { AppShell } from "@/components/app-shell";

export default function UsuariosLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell section="Usuários" contentClassName="max-w-6xl">
      {children}
    </AppShell>
  );
}
