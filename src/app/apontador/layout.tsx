import { AppHeader } from "@/components/app-header";

export default function ApontadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-muted/30">
      <AppHeader compact />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">{children}</main>
    </div>
  );
}
