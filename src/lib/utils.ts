import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function nomeDuplicado(nome: string, existentes: string[]): boolean {
  const alvo = nome.trim().toLowerCase();
  return existentes.some((e) => e.trim().toLowerCase() === alvo);
}

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatarDataHora(iso: string): string {
  return formatadorDataHora.format(new Date(iso));
}
