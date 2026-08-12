import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatusServico } from "@/lib/types";

const CONFIG: Record<StatusServico, { label: string; className: string }> = {
  liberado: {
    label: "Liberado",
    className: "bg-primary-tint text-primary-tint-foreground border-primary-tint-border",
  },
  nao_liberado: {
    label: "Não Liberado",
    className: "bg-destructive-tint text-destructive-tint-foreground border-destructive-tint-border",
  },
  nao_iniciado: {
    label: "Não Iniciado",
    className: "bg-surface-2 text-muted-foreground border-border",
  },
};

export function StatusBadge({ status, className }: { status: StatusServico; className?: string }) {
  const config = CONFIG[status];
  return (
    <Badge variant="outline" className={cn(config.className, "font-medium", className)}>
      {config.label}
    </Badge>
  );
}

// Conclusão não é um dos três status do Full Kit — é um evento à parte (o serviço foi
// executado). Por isso tem um badge próprio, mostrado ao lado do StatusBadge.
export function ConcluidaBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("bg-primary text-primary-foreground border-transparent font-medium", className)}
    >
      <CheckCircle2 data-icon="inline-start" className="size-3" />
      Concluída
    </Badge>
  );
}
