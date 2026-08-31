"use client";

import { useEffect, useState } from "react";
import { Camera, ImageIcon, X, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PerguntaBase, RespostaBooleana, TipoPergunta } from "@/lib/types";

const TIPO_LABEL: Record<TipoPergunta, string> = {
  boolean: "Sim/Não",
  texto: "Texto",
  numero: "Número",
  foto: "Foto",
};

interface FullKitFormProps {
  perguntas: PerguntaBase[];
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
    <div className="flex flex-col gap-3">
      {ordenadas.map((p, i) => {
        const ehPendencia = p.obrigatoria && p.tipo === "boolean" && respostas[p.id] === "nao";
        const naoRespondida =
          p.obrigatoria && (respostas[p.id] === undefined || respostas[p.id] === null || respostas[p.id] === "");
        return (
          <div
            key={p.id}
            className={cn(
              "flex flex-col gap-3 rounded-[14px] border bg-card p-4",
              ehPendencia ? "border-destructive-tint-border" : "border-border"
            )}
          >
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md text-[10.5px] font-semibold",
                  ehPendencia
                    ? "bg-destructive-tint text-destructive-tint-foreground"
                    : "bg-[oklch(0.96_0.004_155)] text-foreground/60"
                )}
              >
                {i + 1}
              </span>
              <p className="flex-1 text-[14.5px] leading-snug font-semibold text-foreground">
                {p.texto}
                {p.obrigatoria && <span className="ml-1 text-destructive">*</span>}
              </p>
            </div>

            {p.tipo === "boolean" && (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeResposta?.(p.id, "sim")}
                    className={cn(
                      "flex h-12 flex-1 items-center justify-center rounded-[13px] text-[14.5px] font-bold",
                      respostas[p.id] === "sim"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-foreground/80"
                    )}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeResposta?.(p.id, "nao")}
                    className={cn(
                      "flex h-12 flex-1 items-center justify-center rounded-[13px] text-[14.5px] font-bold",
                      respostas[p.id] === "nao"
                        ? "bg-destructive text-white"
                        : "border border-border bg-card text-foreground/80"
                    )}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeResposta?.(p.id, "nao_aplica")}
                    className={cn(
                      "flex h-12 flex-1 items-center justify-center rounded-[13px] text-[13px] font-semibold",
                      respostas[p.id] === "nao_aplica"
                        ? "bg-secondary text-secondary-foreground"
                        : "border border-border bg-card text-foreground/80"
                    )}
                  >
                    N/A
                  </button>
                </div>
                {ehPendencia && (
                  <div className="flex items-center gap-1.5 rounded-[10px] bg-destructive-tint px-2.5 py-2 text-[12.5px] font-semibold text-destructive-tint-foreground">
                    <XCircle className="size-3.5 shrink-0" />
                    Pendência registrada — serviço não liberado
                  </div>
                )}
                {naoRespondida && (
                  <span className="text-xs text-muted-foreground italic">Ainda não respondida</span>
                )}
              </>
            )}

            {p.tipo === "texto" && (
              <Input
                value={(respostas[p.id] as string) ?? ""}
                onChange={(e) => onChangeResposta?.(p.id, e.target.value)}
                placeholder="Resposta"
                className="h-11"
              />
            )}

            {p.tipo === "numero" && (
              <Input
                type="number"
                value={(respostas[p.id] as number) ?? ""}
                onChange={(e) => onChangeResposta?.(p.id, e.target.value === "" ? null : Number(e.target.value))}
                placeholder="0"
                className="h-11"
              />
            )}

            {p.tipo === "foto" && (
              <div className="flex gap-2">
                <label className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[13px] border border-dashed border-border bg-[oklch(0.985_0.003_155)] text-[13.5px] font-semibold text-foreground/70 hover:bg-muted">
                  <Camera className="size-[18px]" />
                  Tirar foto
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleAdicionarFotos(e.target.files)}
                  />
                </label>
                <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-[13px] bg-muted text-muted-foreground">
                  <ImageIcon className="size-[17px]" />
                </span>
              </div>
            )}

            {p.tipo === "foto" && fotos.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {fotos.map((f) => (
                  <li key={f} className="flex items-center gap-2 rounded-lg bg-muted px-2 py-1.5 text-xs">
                    {previewUrls[f] ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URL blob de sessão, não otimizável por next/image
                      <img src={previewUrls[f]} alt={f} className="size-8 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded bg-background text-muted-foreground">
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
        );
      })}
    </div>
  );
}
