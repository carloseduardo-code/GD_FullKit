"use client";

import { useEffect, useState } from "react";
import { Camera, ImageIcon, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Pergunta, RespostaBooleana, TipoPergunta } from "@/lib/types";

const TIPO_LABEL: Record<TipoPergunta, string> = {
  boolean: "Sim/Não",
  texto: "Texto",
  numero: "Número",
  foto: "Foto",
};

interface FullKitFormProps {
  perguntas: Pergunta[];
  mode: "preview" | "responder" | "consulta";
  respostas?: Record<string, RespostaBooleana | string | number | null>;
  onChangeResposta?: (perguntaId: string, valor: RespostaBooleana | string | number | null) => void;
  fotos?: string[];
  onFotosChange?: (fotos: string[]) => void;
}

export function FullKitForm({
  perguntas,
  mode,
  respostas = {},
  onChangeResposta,
  fotos = [],
  onFotosChange,
}: FullKitFormProps) {
  const ordenadas = [...perguntas].sort((a, b) => a.ordem - b.ordem);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (ordenadas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Nenhuma pergunta configurada para este FULL KIT ainda.
      </p>
    );
  }

  if (mode === "preview") {
    return (
      <ol className="space-y-3">
        {ordenadas.map((p, i) => (
          <li key={p.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground shrink-0">{i + 1}.</span>
              <span className="text-sm">{p.texto}</span>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {p.obrigatoria && (
                <Badge variant="outline" className="text-xs">
                  obrigatória
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {TIPO_LABEL[p.tipo]}
              </Badge>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  if (mode === "consulta") {
    return (
      <div className="space-y-2">
        {ordenadas.map((p) => {
          const valor = respostas[p.id];
          return (
            <div key={p.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
              <span className="text-sm">{p.texto}</span>
              <div className="shrink-0">
                {p.tipo === "boolean" && (
                  <Badge
                    variant={
                      valor === "sim"
                        ? "default"
                        : valor === "nao"
                          ? "destructive"
                          : valor === "nao_aplica"
                            ? "outline"
                            : "secondary"
                    }
                  >
                    {valor === "sim"
                      ? "Sim"
                      : valor === "nao"
                        ? "Não"
                        : valor === "nao_aplica"
                          ? "Não se aplica"
                          : "Não respondida"}
                  </Badge>
                )}
                {(p.tipo === "texto" || p.tipo === "numero") && (
                  <span className="text-sm text-muted-foreground">
                    {valor !== null && valor !== undefined && valor !== "" ? String(valor) : "—"}
                  </span>
                )}
                {p.tipo === "foto" && (
                  <span className="text-sm text-muted-foreground">
                    {fotos.length} foto{fotos.length === 1 ? "" : "s"} anexada{fotos.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function handleAdicionarFotos(fileList: FileList | null) {
    if (!fileList || !onFotosChange) return;
    const arquivos = Array.from(fileList);
    const novasUrls: Record<string, string> = {};
    arquivos.forEach((f) => {
      novasUrls[f.name] = URL.createObjectURL(f);
    });
    setPreviewUrls((prev) => ({ ...prev, ...novasUrls }));
    onFotosChange([...fotos, ...arquivos.map((f) => f.name)]);
  }

  function handleRemoverFoto(nome: string) {
    if (!onFotosChange) return;
    setPreviewUrls((prev) => {
      if (prev[nome]) URL.revokeObjectURL(prev[nome]);
      const resto = { ...prev };
      delete resto[nome];
      return resto;
    });
    onFotosChange(fotos.filter((f) => f !== nome));
  }

  return (
    <div className="space-y-5">
      {ordenadas.map((p) => (
        <div key={p.id} className="space-y-2">
          <Label className="text-sm font-normal leading-snug">
            {p.texto}
            {p.obrigatoria && <span className="text-destructive ml-1">*</span>}
          </Label>

          {p.tipo === "boolean" && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={respostas[p.id] === "sim" ? "default" : "outline"}
                onClick={() => onChangeResposta?.(p.id, "sim")}
              >
                Sim
              </Button>
              <Button
                type="button"
                size="sm"
                variant={respostas[p.id] === "nao" ? "destructive" : "outline"}
                onClick={() => onChangeResposta?.(p.id, "nao")}
              >
                Não
              </Button>
              <Button
                type="button"
                size="sm"
                variant={respostas[p.id] === "nao_aplica" ? "secondary" : "outline"}
                onClick={() => onChangeResposta?.(p.id, "nao_aplica")}
              >
                Não se aplica
              </Button>
              {respostas[p.id] === undefined && p.obrigatoria && (
                <span className="text-xs text-muted-foreground italic">Ainda não respondida</span>
              )}
            </div>
          )}

          {p.tipo === "texto" && (
            <Input
              value={(respostas[p.id] as string) ?? ""}
              onChange={(e) => onChangeResposta?.(p.id, e.target.value)}
              placeholder="Resposta"
            />
          )}

          {p.tipo === "numero" && (
            <Input
              type="number"
              value={(respostas[p.id] as number) ?? ""}
              onChange={(e) => onChangeResposta?.(p.id, e.target.value === "" ? null : Number(e.target.value))}
              placeholder="0"
            />
          )}

          {p.tipo === "foto" && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground cursor-pointer hover:bg-accent">
                <Camera className="size-4" />
                Adicionar fotos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleAdicionarFotos(e.target.files)}
                />
              </label>
              {fotos.length > 0 && (
                <ul className="space-y-1.5">
                  {fotos.map((f) => (
                    <li key={f} className="flex items-center gap-2 rounded bg-muted px-2 py-1.5 text-xs">
                      {previewUrls[f] ? (
                        // eslint-disable-next-line @next/next/no-img-element -- session blob: URL, not optimizable by next/image
                        <img
                          src={previewUrls[f]}
                          alt={f}
                          className="size-8 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded bg-background text-muted-foreground"
                          )}
                        >
                          <ImageIcon className="size-4" />
                        </div>
                      )}
                      <span className="flex-1 truncate">{f}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoverFoto(f)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
