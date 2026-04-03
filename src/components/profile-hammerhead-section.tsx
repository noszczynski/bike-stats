"use client";

import { HammerheadLoginButton } from "@/components/HammerheadLoginButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHammerheadAuth } from "@/hooks/use-hammerhead-auth";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ProfileHammerheadSection() {
    const queryClient = useQueryClient();
    const { data, isLoading, error, refetch } = useHammerheadAuth();
    const [isDisconnecting, setIsDisconnecting] = useState(false);

    async function handleDisconnect() {
        setIsDisconnecting(true);
        try {
            const res = await fetch("/api/auth/hammerhead/logout", { method: "POST" });
            if (!res.ok) {
                throw new Error("Nie udało się odłączyć konta");
            }
            await queryClient.invalidateQueries({ queryKey: ["hammerhead-auth-status"] });
            toast.success("Konto Hammerhead zostało odłączone.");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Błąd odłączania");
        } finally {
            setIsDisconnecting(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Hammerhead</CardTitle>
                <CardDescription>
                    Połącz konto Hammerhead (Karoo), aby na stronach treningów importować lub
                    powiązywać pliki .fit z chmury.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading && <Skeleton className="h-10 max-w-md" />}
                {error && (
                    <p className="text-destructive text-sm">
                        Nie udało się sprawdzić statusu połączenia. Spróbuj ponownie później.
                    </p>
                )}
                {!isLoading && !error && (
                    <>
                        <p className="text-sm">
                            {data?.isAuthenticated ? (
                                <span className="font-medium text-green-700 dark:text-green-500">
                                    Status: połączono
                                </span>
                            ) : (
                                <span className="text-muted-foreground">Status: nie połączono</span>
                            )}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {!data?.isAuthenticated ? (
                                <HammerheadLoginButton />
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isDisconnecting}
                                    onClick={() => void handleDisconnect()}
                                >
                                    <LogOut />
                                    {isDisconnecting ? "Odłączanie…" : "Odłącz konto Hammerhead"}
                                </Button>
                            )}
                            {!isLoading && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => void refetch()}
                                >
                                    Odśwież status
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
