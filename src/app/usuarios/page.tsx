"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { ROLE_LABEL, type Role } from "@/lib/store-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";

function iniciaisDe(nome: string): string {
  return (
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("") || "?"
  );
}

interface Usuario {
  id: string;
  username: string;
  nome: string;
  role: Role;
}

type PapelCriavel = "administrador" | "apontador";

const PAPEIS_CRIAVEIS: { value: PapelCriavel; label: string }[] = [
  { value: "apontador", label: "Apontador" },
  { value: "administrador", label: "Administrador" },
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<PapelCriavel>("apontador");
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarUsuarios() {
    const res = await fetch("/api/usuarios");
    if (res.ok) {
      const { usuarios } = await res.json();
      setUsuarios(usuarios);
    }
    setCarregando(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial da lista, não sincronização de estado
    carregarUsuarios();
  }, []);

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCriando(true);
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome.trim(), username: username.trim(), senha, role: papel }),
    });
    const data = await res.json();
    setCriando(false);

    if (!res.ok) {
      setErro(data.error ?? "Não foi possível criar o usuário.");
      return;
    }

    toast.success("Usuário criado");
    setNome("");
    setUsername("");
    setSenha("");
    setPapel("apontador");
    setCarregando(true);
    carregarUsuarios();
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        eyebrow="Controle de acesso"
        title="Usuários"
        description="Crie acessos e consulte os perfis habilitados para operar o sistema."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <Card className="lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle className="text-base">Novo usuário</CardTitle>
          <CardDescription>Defina os dados de acesso e o nível de permissão.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCriar} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Usuário (login)</Label>
              <Input
                id="username"
                required
                autoCapitalize="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex.: joao.silva"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Papel</Label>
              <div className="inline-flex gap-1 rounded-lg bg-surface-2 p-1">
                {PAPEIS_CRIAVEIS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPapel(p.value)}
                    className={cn(
                      "h-7 rounded-md px-3 text-xs font-semibold transition-colors",
                      papel === p.value
                        ? "bg-card text-foreground shadow-card"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {erro && <p className="text-xs text-destructive">{erro}</p>}
            <Button type="submit" className="w-full" disabled={criando}>
              {criando ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <UserPlus data-icon="inline-start" />}
              Criar usuário
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipe cadastrada</CardTitle>
          <CardDescription>{usuarios.length} usuário{usuarios.length === 1 ? "" : "s"} cadastrado{usuarios.length === 1 ? "" : "s"}.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {carregando ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Papel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-tint text-[11px] font-bold text-primary-tint-foreground">
                          {iniciaisDe(u.nome)}
                        </span>
                        {u.nome}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.username}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ROLE_LABEL[u.role]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
