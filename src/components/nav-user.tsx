"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@/hooks/use-auth-mutations";
import { useQuery } from "@tanstack/react-query";
import { LogOut, MoreVertical, User } from "lucide-react";

interface StravaAthlete {
    id: number;
    username: string | null;
    firstname: string;
    lastname: string;
    profile: string;
    profile_medium: string;
    city: string;
    country: string;
    premium: boolean;
    summit: boolean;
    bio?: string;
}

async function fetchStravaAthlete(): Promise<StravaAthlete> {
    const response = await fetch("/api/auth/strava/athlete");

    if (!response.ok) {
        throw new Error("Failed to fetch athlete data");
    }

    return response.json();
}

export function NavUser() {
    const { isMobile } = useSidebar();
    const { data: authData, isLoading: isAuthLoading } = useAuth();
    const logoutMutation = useLogout();

    const {
        data: athlete,
        isLoading: isAthleteLoading,
        error,
    } = useQuery({
        queryKey: ["strava-athlete"],
        queryFn: fetchStravaAthlete,
        enabled: authData?.isAuthenticated === true && authData?.user?.hasStravaConnection === true,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
    });

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const handleConnectStrava = () => {
        window.location.href = "/api/auth/strava";
    };

    const handleDisconnectStrava = () => {
        window.location.href = "/api/auth/strava/disconnect";
    };

    if (isAuthLoading || !authData?.isAuthenticated || !authData?.user) {
        return null;
    }

    const hasStravaError =
        error || (authData.user.hasStravaConnection && !athlete && !isAthleteLoading);

    const user = {
        name: athlete ? `${athlete.firstname} ${athlete.lastname}` : authData.user.email,
        email: authData.user.email,
        avatar: athlete?.profile || "",
        hasStravaConnection: authData.user.hasStravaConnection,
        hasStravaError,
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="rounded-lg">
                                    <User className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user.name}</span>
                                <span className="text-muted-foreground truncate text-xs">
                                    {user.email}
                                </span>
                            </div>
                            <MoreVertical className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="rounded-lg">
                                        <User className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user.name}</span>
                                    <span className="text-muted-foreground truncate text-xs">
                                        {user.email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {!user.hasStravaConnection ? (
                                <DropdownMenuItem onClick={handleConnectStrava}>
                                    <span className="font-medium text-[#FC4C02]">
                                        Połącz Strava
                                    </span>
                                </DropdownMenuItem>
                            ) : user.hasStravaError ? (
                                <DropdownMenuItem onClick={handleConnectStrava}>
                                    <span className="font-medium text-orange-600 dark:text-orange-400">
                                        Ponów połączenie Strava
                                    </span>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={handleDisconnectStrava}>
                                    <span className="font-medium text-[#FC4C02]">
                                        Rozłącz Strava
                                    </span>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuGroup>
                        {(!user.hasStravaConnection || user.hasStravaError) && (
                            <DropdownMenuSeparator />
                        )}
                        <DropdownMenuItem
                            onClick={handleLogout}
                            disabled={logoutMutation.isPending}
                        >
                            <LogOut />
                            Wyloguj się
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
