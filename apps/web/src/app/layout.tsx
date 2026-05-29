import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search } from "lucide-react";

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
    <html lang="pt-BR">
      <body
        className={`${inter.variable} ${geistMono.variable} app-shell`}
      >
        <TooltipProvider>
          <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset className="app-inset">
              <div className="workspace-shell">
                <header className="topbar-shell">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger className="rounded-[0.85rem] border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900" />
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Analise ASN
                      </p>
                      <p className="text-lg font-semibold text-slate-900">Dashboard</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden items-center gap-2 rounded-[0.95rem] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400 lg:flex">
                      <Search className="size-4" />
                      Search
                    </div>
                    <button className="flex size-10 items-center justify-center rounded-[0.95rem] border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900">
                      <Bell className="size-4" />
                    </button>
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
