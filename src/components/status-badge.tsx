import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SituacaoEtapa } from "@/lib/planejamento";
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

// Situação da etapa (agregado dos serviços do subtree). É diferente do gate de
// planejamento: uma etapa sem predecessoras não está "Liberada" só por isso —
// ela só fica liberada quando os Full Kits dos serviços forem preenchidos.
const CONFIG_ETAPA: Record<SituacaoEtapa, { label: string; className: string }> = {
  nao_iniciada: {
    label: "Não Iniciada",
    className: "bg-surface-2 text-muted-foreground border-border",
  },
  em_andamento: {
    label: "Em Andamento",
    className: "bg-background text-primary-tint-foreground border-primary-tint-border",
  },
  nao_liberada: {
    label: "Não Liberada",
    className: "bg-destructive-tint text-destructive-tint-foreground border-destructive-tint-border",
  },
  liberada: {
    label: "Liberada",
    className: "bg-primary-tint text-primary-tint-foreground border-primary-tint-border",
  },
  concluida: {
    label: "Concluída",
    className: "bg-primary text-primary-foreground border-transparent",
  },
};

export function SituacaoEtapaBadge({
  situacao,
  className,
}: {
  situacao: SituacaoEtapa;
  className?: string;
}) {
  const config = CONFIG_ETAPA[situacao];
  return (
    <Badge variant="outline" className={cn(config.className, "font-medium", className)}>
      {situacao === "concluida" && <CheckCircle2 data-icon="inline-start" className="size-3" />}
      {config.label}
    </Badge>
  );
}
