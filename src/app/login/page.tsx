"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { usernameParaEmail } from "@/lib/auth-domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameParaEmail(username),
      password: senha,
    });
    setCarregando(false);
    if (error) {
      setErro("Usuário ou senha inválidos.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-accent/50 via-background to-background p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-3 text-center">
          <Image
            src="/logo.png"
            alt="Gonçalves & Dias Engenharia"
            width={856}
            height={385}
            className="mx-auto h-12 w-auto"
            priority
          />
          <div>
            <p className="text-lg font-semibold tracking-tight">FULL KIT</p>
            <p className="text-sm text-muted-foreground">Gestão da prontidão operacional da obra</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse com seu usuário e senha cadastrados.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  autoCapitalize="off"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              {erro && <p className="text-xs text-destructive">{erro}</p>}
              <Button type="submit" className="w-full justify-center" disabled={carregando}>
                {carregando && <Loader2 data-icon="inline-start" className="animate-spin" />}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Não tem acesso? Peça para o administrador do sistema criar seu usuário.
        </p>
      </div>
    </main>
  );
}
