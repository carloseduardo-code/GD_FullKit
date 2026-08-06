"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Users } from "lucide-react";
import { useAuthStore, ROLE_LABEL } from "@/lib/store-auth";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const profile = useAuthStore((s) => s.profile);
  const sair = useAuthStore((s) => s.sair);

  async function handleSair() {
    await sair();
    router.replace("/login");
    router.refresh();
  }

  if (!userId) {
    return (
      <div className="ml-auto">
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/login" />}>
          <LogIn data-icon="inline-start" />
          Entrar
        </Button>
      </div>
    );
  }

  const iniciais =
    profile?.nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div className="ml-auto flex items-center gap-1">
      {profile?.role === "god" && (
        <Button variant="ghost" size="icon-sm" title="Usuários" nativeButton={false} render={<Link href="/usuarios" />}>
          <Users className="size-4" />
        </Button>
      )}
      <Link
        href="/conta"
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {iniciais}
        </span>
        <span className="hidden flex-col text-left leading-tight sm:flex">
          <span className="text-sm font-medium">{profile?.nome ?? "Minha conta"}</span>
          <span className="text-[11px] text-muted-foreground">{profile ? ROLE_LABEL[profile.role] : ""}</span>
        </span>
      </Link>
      <Button variant="ghost" size="icon-sm" onClick={handleSair} title="Sair">
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
