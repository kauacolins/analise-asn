"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DatabaseZap, LayoutDashboard, ShieldCheck } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coletas", label: "Coletas", icon: DatabaseZap },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="sidebar-shell px-3 py-4">
      <SidebarHeader className="px-3 py-4">
        <div className="flex flex-row items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-foreground">
              Analise ASN
            </p>
            <p className="text-xs text-muted-foreground">Network Monitor</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-4">
        <SidebarGroup className="px-0">
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
                      <Icon className="size-4" />
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
