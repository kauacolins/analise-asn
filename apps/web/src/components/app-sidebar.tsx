"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Radar, Shield } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/eventos", label: "Eventos", icon: Radar },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="border-0 bg-transparent"
    >
      <SidebarHeader className="gap-3 px-3 pb-2 pt-3">
        <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary px-3 py-3 text-primary-foreground shadow-sm">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/15">
            <Shield className="size-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
              Analise ASN
            </p>
            <p className="truncate text-sm font-semibold">Network Watch</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-3">
        <SidebarGroup className="px-0 py-2">
          <SidebarGroupLabel className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Monitoramento
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                      className={
                        isActive
                          ? "h-10 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          : "h-10 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    >
                      <span
                        className={
                          isActive
                            ? "flex size-8 items-center justify-center rounded-lg border border-sidebar-accent-foreground/15 bg-background text-sidebar-accent-foreground"
                            : "flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground"
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
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
