"use client";

import { SubmitButton } from "@/components/submit-button";
import { useLogout } from "@/hooks/use-auth-mutations";
import { LogOut } from "lucide-react";

export function LogoutButton() {
    const logoutMutation = useLogout();

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <SubmitButton
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
            isLoading={logoutMutation.isPending}
            loadingText=""
            className="text-muted-foreground hover:text-foreground"
        >
            <LogOut className="h-4 w-4" />
        </SubmitButton>
    );
}
