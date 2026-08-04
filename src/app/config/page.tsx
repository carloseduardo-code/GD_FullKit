"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ObrasPage() {
  const obras = useFullKitStore((s) => s.obras);
  const addObra = useFullKitStore((s) => s.addObra);

  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");

  function handleCriar() {
    if (!nome.trim()) return;
    addObra(nome.trim(), endereco.trim());
    setNome("");
    setEndereco("");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Obras</h1>
        <p className="text-muted-foreground">Selecione uma obra para configurar ou cadastre uma nova.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {obras.map((obra) => (
          <Link key={obra.id} href={`/config/${obra.id}`}>
            <Card className="h-full transition-colors hover:border-primary hover:bg-accent/40 cursor-pointer">
              <CardHeader className="space-y-1.5">
                <Building2 className="size-5 text-primary" />
                <CardTitle>{obra.nome}</CardTitle>
                <CardDescription>{obra.endereco || "Sem endereço cadastrado"}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Nova obra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nome da obra" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input placeholder="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          <Button onClick={handleCriar} disabled={!nome.trim()}>
            <Plus data-icon="inline-start" />
            Cadastrar obra
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
