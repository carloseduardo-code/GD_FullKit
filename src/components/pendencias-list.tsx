import { XCircle } from "lucide-react";
import type { Pendencia } from "@/lib/types";

export function PendenciasList({ pendencias }: { pendencias: Pendencia[] }) {
  if (pendencias.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Pendências:</p>
      <ul className="space-y-1.5">
        {pendencias.map((p) => (
          <li key={p.perguntaId} className="flex items-start gap-2 text-sm text-destructive">
            <XCircle className="size-4 mt-0.5 shrink-0" />
            <span>{p.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
