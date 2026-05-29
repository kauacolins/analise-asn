"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivitySquare,
  Boxes,
  ChevronLeft,
  LayoutDashboard,
  Radar,
  Shield,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const sections = [
  {
    label: "Monitoramento",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/eventos", label: "Eventos", icon: Radar },
    ],
  },
  {
    label: "Operacao",
    items: [
      { href: "/cadastros", label: "Cadastros", icon: Boxes },
      { href: "/coletas", label: "Coletas", icon: ActivitySquare },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="border-0 bg-transparent"
    >
      <SidebarHeader className="gap-4 px-3 pb-2 pt-3">
        <div className="flex items-center gap-3 rounded-lg bg-[#1f7dd8] px-3 py-3 text-white shadow-[0_14px_24px_rgba(31,125,216,0.18)]">
          <div className="flex size-9 items-center justify-center rounded-md bg-white/18">
            <Shield className="size-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/70">
              Analise ASN
            </p>
            <p className="truncate text-base font-semibold">Network Watch</p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-9 items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="group-data-[collapsible=icon]:hidden">Recolher</span>
          <ChevronLeft className="size-4 transition-transform group-data-[collapsible=icon]:rotate-180" />
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-3">
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="px-0 py-2">
            <SidebarGroupLabel className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={
                          <Link href={item.href} />
                        }
                        isActive={isActive}
                        tooltip={item.label}
                        className={
                          isActive
                            ? "h-10 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700"
                            : "h-10 rounded-md text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }
                      >
                        <span
                          className={
                            isActive
                              ? "flex size-8 items-center justify-center rounded-md border border-emerald-100 bg-white text-emerald-600"
                              : "flex size-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400"
                          }
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="font-medium">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3 pt-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 group-data-[collapsible=icon]:px-2">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-slate-900 text-white">
              <Shield className="size-4" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold text-slate-900">SOC workspace</p>
              <p className="text-sm text-slate-500">Observabilidade BGP</p>
            </div>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
