import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { StoreHydrator } from "@/app/store-hydrator";
import { AuthHydrator } from "@/app/auth-hydrator";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gd-full-kit.vercel.app"),
  title: "FULL KIT",
  description: "Gestão de prontidão operacional de obras",
  openGraph: {
    title: "FULL KIT",
    description: "Gestão de prontidão operacional de obras",
    type: "website",
    locale: "pt_BR",
    siteName: "FULL KIT",
  },
  twitter: {
    card: "summary_large_image",
    title: "FULL KIT",
    description: "Gestão de prontidão operacional de obras",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthHydrator>
            <StoreHydrator>{children}</StoreHydrator>
          </AuthHydrator>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

