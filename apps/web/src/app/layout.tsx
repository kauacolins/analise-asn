import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppNavigation } from "@/components/app-navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Analise ASN",
  description: "Dashboard de monitoramento e análise de eventos BGP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} app-shell`}
      >
        <div className="dashboard-shell">
          <AppNavigation />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
