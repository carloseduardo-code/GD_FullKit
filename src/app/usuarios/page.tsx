"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Search, UserPlus } from "lucide-react";
import { ROLE_LABEL, type Role } from "@/lib/store-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatarRelativo } from "@/lib/utils";

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
  ultimoAcesso: string | null;
}

type PapelCriavel = "administrador" | "apontador";

const PAPEIS_CRIAVEIS: { value: PapelCriavel; label: string }[] = [
  { value: "apontador", label: "Apontador" },
  { value: "administrador", label: "Administrador" },
];

const FILTROS_PAPEL: { value: Role | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "administrador", label: "Administrador" },
  { value: "apontador", label: "Apontador" },
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroPapel, setFiltroPapel] = useState<Role | "todos">("todos");

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

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      const bateBusca = !termo || u.nome.toLowerCase().includes(termo) || u.username.toLowerCase().includes(termo);
      const batePapel = filtroPapel === "todos" || u.role === filtroPapel;
      return bateBusca && batePapel;
    });
  }, [usuarios, busca, filtroPapel]);

  return (
    <div className="flex flex-col gap-5.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground">Acessos de Administrador e Apontador da equipe.</p>
        </div>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Novo usuário</CardTitle>
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
            <Button type="submit" disabled={criando}>
              {criando ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <UserPlus data-icon="inline-start" />}
              Criar usuário
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="flex h-8 w-[280px] items-center gap-2 rounded-lg border border-border px-3 text-[12.5px] text-muted-foreground">
            <Search className="size-3.5 shrink-0" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou login"
              className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="inline-flex gap-0.5 rounded-lg bg-[oklch(0.96_0.004_155)] p-0.5">
            {FILTROS_PAPEL.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFiltroPapel(f.value)}
                className={cn(
                  "h-[26px] rounded-md px-3 text-xs font-semibold transition-colors",
                  filtroPapel === f.value
                    ? "bg-card text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[12.5px] text-muted-foreground">
            {usuariosFiltrados.length} usuário{usuariosFiltrados.length === 1 ? "" : "s"}
          </span>
        </div>
        <div>
          {carregando ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Último acesso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuariosFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {usuariosFiltrados.map((u) => (
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
                    <TableCell className="text-muted-foreground">
                      {u.ultimoAcesso ? formatarRelativo(u.ultimoAcesso) : "nunca acessou"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
