"use client";

import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, Pencil, Plus } from "lucide-react";
import { useFullKitStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PerguntaEditor } from "@/components/form-builder/pergunta-editor";
import { FullKitForm } from "@/components/full-kit-form";

export default function FormBuilderPage() {
  const { obraId, servicoId } = useParams<{ obraId: string; servicoId: string }>();
  const obra = useFullKitStore((s) => s.obras.find((o) => o.id === obraId));
  const servico = useFullKitStore((s) => s.servicos.find((sv) => sv.id === servicoId));
  const perguntas = useFullKitStore(useShallow((s) => s.perguntas.filter((p) => p.servicoId === servicoId)));
  const addPergunta = useFullKitStore((s) => s.addPergunta);
  const updatePergunta = useFullKitStore((s) => s.updatePergunta);
  const removePergunta = useFullKitStore((s) => s.removePergunta);
  const reorderPergunta = useFullKitStore((s) => s.reorderPergunta);

  const [texto, setTexto] = useState("");

  if (!obra || !servico) return notFound();

  const perguntasOrdenadas = [...perguntas].sort((a, b) => a.ordem - b.ordem);

  function handleCriar() {
    if (!texto.trim()) return;
    addPergunta(servicoId, texto.trim(), "boolean", true);
    setTexto("");
    toast.success("Pergunta adicionada");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">FULL KIT — {servico.nome}</h1>
        <p className="text-muted-foreground">
          {obra.nome} · Monte o checklist que o apontador deverá responder em campo antes de liberar este serviço.
        </p>
      </div>

      <Tabs defaultValue="editar">
        <TabsList>
          <TabsTrigger value="editar">
            <Pencil data-icon="inline-start" className="size-3.5" />
            Editar
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye data-icon="inline-start" className="size-3.5" />
            Pré-visualizar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Perguntas do checklist</CardTitle>
              <CardDescription>
                Marque como obrigatória toda pergunta que deve impedir a liberação do serviço quando não atendida.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {perguntasOrdenadas.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">Nenhuma pergunta configurada ainda.</p>
              )}
              {perguntasOrdenadas.map((pergunta, i) => (
                <PerguntaEditor
                  key={pergunta.id}
                  pergunta={pergunta}
                  onUpdate={(patch) => updatePergunta(pergunta.id, patch)}
                  onRemove={() => removePergunta(pergunta.id)}
                  onMoveUp={() => reorderPergunta(pergunta.id, "subir")}
                  onMoveDown={() => reorderPergunta(pergunta.id, "descer")}
                  isFirst={i === 0}
                  isLast={i === perguntasOrdenadas.length - 1}
                />
              ))}

              <div className="flex gap-2 pt-2">
                <Input
                  placeholder="Texto da nova pergunta (ex: Frente liberada?)"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCriar()}
                />
                <Button onClick={handleCriar} disabled={!texto.trim()}>
                  <Plus data-icon="inline-start" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Como o apontador vai ver</CardTitle>
            </CardHeader>
            <CardContent>
              <FullKitForm perguntas={perguntasOrdenadas} mode="preview" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
