"use client";

import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Activity, Bike, Calendar, LayoutDashboard, Map, MessageSquare, User } from "lucide-react";
import Link from "next/link";

const data = {
    navMain: [
        {
            title: "Panel",
            url: "/",
            icon: LayoutDashboard,
        },
        {
            title: "Profil",
            url: "/profile",
            icon: User,
        },
        {
            title: "Treningi",
            url: "/trainings",
            icon: Activity,
        },
        {
            title: "Kalendarz",
            url: "/calendar",
            icon: Calendar,
        },
        {
            title: "Moje trasy",
            url: "/routes",
            icon: Map,
        },
        {
            title: "Chat",
            url: "/chat",
            icon: MessageSquare,
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            size="lg"
                            className="data-[slot=sidebar-menu-button]:!p-2"
                        >
                            <Link href="/">
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Bike className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Bike Stats</span>
                                    <span className="truncate text-xs">Training Analytics</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <div className="mt-auto">
                    <SidebarSeparator />
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <div className="flex items-center justify-center px-2 py-1.5">
                                <ThemeSwitch />
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </div>
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
