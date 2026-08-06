import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { StoreHydrator } from "@/app/store-hydrator";
import { AuthHydrator } from "@/app/auth-hydrator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FULL KIT",
  description: "Gestão de prontidão operacional de obras",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthHydrator>
          <StoreHydrator>{children}</StoreHydrator>
        </AuthHydrator>
        <Toaster />
      </body>
    </html>
  );
}
