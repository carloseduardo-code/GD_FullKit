"use client";

import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TipoElemento } from "@/lib/types";

const TIPOS: TipoElemento[] = ["Bloco", "Sapata", "Pedestal", "Piso", "Outro"];

export default function ElementosPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const elementos = useFullKitStore(useShallow((s) => s.elementos.filter((e) => e.obraId === obraId)));
  const addElemento = useFullKitStore((s) => s.addElemento);
  const updateElemento = useFullKitStore((s) => s.updateElemento);
  const removeElemento = useFullKitStore((s) => s.removeElemento);

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoElemento>("Bloco");

  if (!obra) return notFound();

  function handleCriar() {
    if (!nome.trim()) return;
    addElemento(obraId, nome.trim(), tipo);
    setNome("");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Elementos — {obra.nome}</h1>
        <p className="text-muted-foreground">
          Cadastre os elementos construtivos da obra (blocos, sapatas, pedestais, pisos...).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Elementos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {elementos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Nenhum elemento cadastrado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {elementos.map((elemento) => (
                  <TableRow key={elemento.id}>
                    <TableCell>
                      <Input
                        className="max-w-48"
                        value={elemento.nome}
                        onChange={(e) => updateElemento(elemento.id, { nome: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={elemento.tipo}
                        onValueChange={(v) => updateElemento(elemento.id, { tipo: v as TipoElemento })}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-red-600"
                        onClick={() => removeElemento(elemento.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Input
              placeholder="Nome (ex: B102)"
              className="max-w-48"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCriar()}
            />
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoElemento)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCriar} disabled={!nome.trim()}>
              <Plus data-icon="inline-start" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
