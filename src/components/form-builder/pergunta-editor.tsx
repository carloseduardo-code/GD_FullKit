"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Pergunta, TipoPergunta } from "@/lib/types";

const TIPOS: { value: TipoPergunta; label: string }[] = [
  { value: "boolean", label: "Sim/Não" },
  { value: "texto", label: "Texto" },
  { value: "numero", label: "Número" },
  { value: "foto", label: "Foto" },
];

interface PerguntaEditorProps {
  pergunta: Pergunta;
  onUpdate: (patch: Partial<Pick<Pergunta, "texto" | "tipo" | "obrigatoria">>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function PerguntaEditor({
  pergunta,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: PerguntaEditorProps) {
  return (
    <div className="flex items-start gap-2 rounded-md border p-3">
      <div className="flex flex-col gap-0.5 pt-1">
        <Button variant="ghost" size="icon" className="size-6" disabled={isFirst} onClick={onMoveUp}>
          <ChevronUp className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-6" disabled={isLast} onClick={onMoveDown}>
          <ChevronDown className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 space-y-2">
        <Input
          value={pergunta.texto}
          onChange={(e) => onUpdate({ texto: e.target.value })}
          placeholder="Texto da pergunta"
        />
        <div className="flex flex-wrap items-center gap-4">
          <Select value={pergunta.tipo} onValueChange={(v) => onUpdate({ tipo: v as TipoPergunta })}>
            <SelectTrigger className="w-40">
              <SelectValue>{(v: TipoPergunta) => TIPOS.find((t) => t.value === v)?.label ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TIPOS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch
              checked={pergunta.obrigatoria}
              onCheckedChange={(checked) => onUpdate({ obrigatoria: checked })}
            />
            Obrigatória
          </label>
        </div>
      </div>

      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600" onClick={onRemove}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
