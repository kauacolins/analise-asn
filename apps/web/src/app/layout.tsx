import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const inter = Inter({
  variable: "--font-inter",
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
    <html lang="pt-BR" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="app-shell">
        <TooltipProvider>
          <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset className="app-inset">
              <div className="workspace-shell">
                <header className="topbar-shell">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground" />
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Analise ASN
                      </p>
                      <p className="text-base font-semibold text-foreground">Dashboard</p>
                    </div>
                  </div>

                  <div className="text-sm font-medium text-muted-foreground">
                    Observabilidade BGP
                  </div>
                </header>
                <main className="content-shell">{children}</main>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
