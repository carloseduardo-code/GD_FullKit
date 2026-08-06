"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, LogOut } from "lucide-react";
import { useAuthStore, ROLE_LABEL } from "@/lib/store-auth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
    <div className="max-w-lg space-y-6">
      <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" />
        Voltar
      </Link>

      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
          {iniciais}
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Minha conta</h1>
          {profile && <Badge variant="secondary">{ROLE_LABEL[profile.role]}</Badge>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil</CardTitle>
          <CardDescription>Usuário: {profile?.username}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSalvarNome} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <Button type="submit" size="sm" disabled={salvandoNome || !nome.trim() || nome.trim() === profile?.nome}>
              Salvar nome
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trocar senha</CardTitle>
          <CardDescription>Use pelo menos 6 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrocarSenha} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <Input
                id="novaSenha"
                type="password"
                autoComplete="new-password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmarSenhaConta">Confirmar nova senha</Label>
              <Input
                id="confirmarSenhaConta"
                type="password"
                autoComplete="new-password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" variant="outline" disabled={salvandoSenha || !novaSenha}>
              Atualizar senha
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Button variant="destructive" onClick={handleSair}>
        <LogOut data-icon="inline-start" />
        Sair da conta
      </Button>
    </div>
  );
}
