"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { useAuthStore, ROLE_LABEL } from "@/lib/store-auth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ContaPage() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const atualizarNome = useAuthStore((s) => s.atualizarNome);
  const sair = useAuthStore((s) => s.sair);

  const [nome, setNome] = useState("");
  const [nomeSincronizado, setNomeSincronizado] = useState<string | null>(null);
  const [salvandoNome, setSalvandoNome] = useState(false);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  if (profile && profile.nome !== nomeSincronizado) {
    setNomeSincronizado(profile.nome);
    setNome(profile.nome);
  }

  async function handleSalvarNome(e: FormEvent) {
    e.preventDefault();
    const trimmed = nome.trim();
    if (!trimmed) return;
    setSalvandoNome(true);
    try {
      await atualizarNome(trimmed);
      toast.success("Nome atualizado");
    } catch {
      toast.error("Não foi possível atualizar o nome.");
    } finally {
      setSalvandoNome(false);
    }
  }

  async function handleTrocarSenha(e: FormEvent) {
    e.preventDefault();
    if (novaSenha.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não conferem.");
      return;
    }
    setSalvandoSenha(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setSalvandoSenha(false);
    if (error) {
      toast.error("Não foi possível trocar a senha.");
      return;
    }
    setNovaSenha("");
    setConfirmarSenha("");
    toast.success("Senha atualizada");
  }

  async function handleSair() {
    await sair();
    router.replace("/login");
    router.refresh();
  }

  const iniciais =
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div className="flex flex-col gap-5.5">
      <div className="flex items-center gap-4">
        <span className="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-primary text-[22px] font-bold text-primary-foreground">
          {iniciais}
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">{profile?.nome ?? "Minha conta"}</h1>
          {profile && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-tint px-2.5 py-0.5 text-[11.5px] font-semibold text-primary-tint-foreground">
              {ROLE_LABEL[profile.role]} · {profile.username}
            </span>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="border-b border-border px-5.5 py-4.5">
          <span className="text-[15px] font-bold text-foreground">Perfil</span>
        </div>
        <form onSubmit={handleSalvarNome} className="flex flex-col gap-4 p-5.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome" className="text-[12.5px] font-semibold text-foreground/70">
              Nome
            </Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <Button
            type="submit"
            className="w-fit"
            disabled={salvandoNome || !nome.trim() || nome.trim() === profile?.nome}
          >
            Salvar alterações
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="flex flex-col gap-0.5 border-b border-border px-5.5 py-4.5">
          <span className="text-[15px] font-bold text-foreground">Segurança</span>
          <span className="text-[12.5px] text-muted-foreground">Use pelo menos 6 caracteres.</span>
        </div>
        <form onSubmit={handleTrocarSenha} className="grid gap-3.5 p-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="novaSenha" className="text-[12.5px] font-semibold text-foreground/70">
              Nova senha
            </Label>
            <Input
              id="novaSenha"
              type="password"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmarSenhaConta" className="text-[12.5px] font-semibold text-foreground/70">
              Confirmar nova senha
            </Label>
            <Input
              id="confirmarSenhaConta"
              type="password"
              autoComplete="new-password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" className="w-fit sm:col-span-2" disabled={salvandoSenha || !novaSenha}>
            Atualizar senha
          </Button>
        </form>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-[14px] border border-destructive-tint-border bg-destructive-tint px-5.5 py-4.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13.5px] font-bold text-destructive-tint-foreground">Encerrar sessão</span>
          <span className="text-[12.5px] text-destructive-tint-foreground/80">
            Você precisará entrar novamente com usuário e senha.
          </span>
        </div>
        <Button variant="destructive" onClick={handleSair} className="shrink-0">
          <LogOut data-icon="inline-start" />
          Sair da conta
        </Button>
      </div>
    </div>
  );
}
