"use client";

import { HammerheadLoginButton } from "@/components/HammerheadLoginButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { useHammerheadAuth } from "@/hooks/use-hammerhead-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function HammerheadAuthPage() {
    const { data, isLoading, error } = useHammerheadAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryError = searchParams.get("error");
    const connected = searchParams.get("connected");

    useEffect(() => {
        if (data?.isAuthenticated) {
            router.push("/");
        }
    }, [data?.isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <div className="flex w-full items-center justify-end gap-4 border-b px-8 py-4">
                    <ThemeSwitch />
                </div>

                <div className="flex flex-1 flex-col items-center justify-center p-24">
                    <div className="w-full max-w-md space-y-8">
                        <div className="text-center">
                            <Skeleton className="mx-auto mb-4 h-8 w-48" />
                            <Skeleton className="mx-auto h-4 w-64" />
                        </div>
                        <div className="flex justify-center">
                            <Skeleton className="h-12 w-48" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (data?.isAuthenticated) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-24">
                <div className="text-center">
                    <h2 className="mb-4 text-2xl font-semibold">Przekierowanie do panelu…</h2>
                    <div className="animate-pulse">
                        <Skeleton className="mx-auto h-4 w-32" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <div className="flex w-full items-center justify-end gap-4 border-b px-8 py-4">
                <ThemeSwitch />
            </div>

            <div className="flex flex-1 flex-col items-center justify-center p-24">
                <div className="w-full max-w-md space-y-8">
                    {(queryError || error) && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>
                                {queryError === "invalid_state"
                                    ? "Błąd weryfikacji CSRF. Spróbuj połączyć konto ponownie."
                                    : queryError === "token_exchange_failed"
                                      ? "Nie udało się wymienić kodu na token. Sprawdź konfigurację API."
                                      : "Nie udało się zweryfikować sesji. Spróbuj ponownie."}
                            </AlertDescription>
                        </Alert>
                    )}

                    {connected === "1" && (
                        <Alert className="mb-4">
                            <AlertDescription>
                                Konto Hammerhead zostało połączone. Możesz zamknąć tę stronę lub wrócić
                                do aplikacji.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="text-center">
                        <h1 className="mb-2 text-4xl font-bold">Bike Stats</h1>
                        <h2 className="mb-4 text-2xl font-semibold">Hammerhead</h2>
                        <p className="text-muted-foreground">
                            Połącz konto Hammerhead, aby pobierać pliki .fit z urządzenia i przypisywać
                            je do aktywności w aplikacji.
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <HammerheadLoginButton />
                    </div>

                    <div className="text-muted-foreground text-center text-sm">
                        <p>
                            W panelu Hammerhead Developer ustaw adres przekierowania zgodny ze
                            zmienną HAMMERHEAD_AUTH_CALLBACK_URI (np.&nbsp;…/api/hammerhead/callback).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
