"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Eye, Pencil, Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useFullKitStore } from "@/lib/store";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerguntaEditor } from "@/components/form-builder/pergunta-editor";
import { FullKitForm } from "@/components/full-kit-form";

export default function FullKitDoCatalogoPage() {
  const { kitId } = useParams<{ kitId: string }>();
  const fullKit = useFullKitStore((s) => s.fullKits.find((fk) => fk.id === kitId));
  const perguntas = useFullKitStore(useShallow((s) => s.perguntasModelo.filter((p) => p.fullKitId === kitId)));
  const servicosQueUsam = useFullKitStore((s) => s.servicos.filter((sv) => sv.fullKitId === kitId).length);
  const addPerguntaModelo = useFullKitStore((s) => s.addPerguntaModelo);
  const updatePerguntaModelo = useFullKitStore((s) => s.updatePerguntaModelo);
  const removePerguntaModelo = useFullKitStore((s) => s.removePerguntaModelo);
  const reorderPerguntaModelo = useFullKitStore((s) => s.reorderPerguntaModelo);

  const [texto, setTexto] = useState("");

  if (!fullKit) return notFound();

  const ordenadas = [...perguntas].sort((a, b) => a.ordem - b.ordem);

  async function handleCriar() {
    if (!texto.trim()) return;
    try {
      await addPerguntaModelo(kitId, texto.trim(), "boolean", true);
      setTexto("");
      toast.success("Pergunta adicionada");
    } catch {
      // erro já mostrado pelo store
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link href="/config/full-kits" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" })}>
          <ChevronLeft data-icon="inline-start" />
          Catálogo
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">FULL KIT — {fullKit.nome}</h1>
          <p className="text-muted-foreground">
            Modelo do catálogo · {fullKit.descricao || "Sem descrição"}
          </p>
        </div>
      </div>

      {servicosQueUsam > 0 && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {servicosQueUsam} serviço{servicosQueUsam === 1 ? " já foi criado" : "s já foram criados"} a
          partir deste modelo. As alterações feitas aqui valem para os próximos — os que já estão nas
          obras não mudam.
        </p>
      )}

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
                Marque como obrigatória toda pergunta que deve impedir a liberação do serviço quando
                não atendida.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ordenadas.length === 0 && (
                <p className="py-2 text-sm text-muted-foreground">Nenhuma pergunta configurada ainda.</p>
              )}
              {ordenadas.map((pergunta, i) => (
                <PerguntaEditor
                  key={pergunta.id}
                  pergunta={pergunta}
                  onUpdate={(patch) => updatePerguntaModelo(pergunta.id, patch)}
                  onRemove={() => removePerguntaModelo(pergunta.id)}
                  onMoveUp={() => reorderPerguntaModelo(pergunta.id, "subir")}
                  onMoveDown={() => reorderPerguntaModelo(pergunta.id, "descer")}
                  isFirst={i === 0}
                  isLast={i === ordenadas.length - 1}
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
              <FullKitForm perguntas={ordenadas} mode="preview" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
