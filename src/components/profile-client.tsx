"use client";

import { ProfileHammerheadSection } from "@/components/profile-hammerhead-section";
import { ProfileStravaSection } from "@/components/profile-strava-section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProfileClientProps {
    searchParams: {
        error?: string;
    };
}

export default function ProfileClient({ searchParams }: ProfileClientProps) {
    return (
        <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 md:p-24">
            <div className="w-full max-w-4xl space-y-8">
                {searchParams.error === "failed_to_fetch_athlete" && (
                    <Alert variant="destructive">
                        <AlertTitle>Błąd</AlertTitle>
                        <AlertDescription>
                            Nie udało się pobrać danych zawodnika ze Stravy. Spróbuj ponownie
                            później lub połącz konto Strava od nowa.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-3xl font-bold">Profil</h1>
                    <Link href="/">
                        <Button variant="outline">Wróć do strony głównej</Button>
                    </Link>
                </div>
                <div className="space-y-8">
                    <ProfileStravaSection />
                    <ProfileHammerheadSection />
                </div>
            </div>
        </main>
    );
}
