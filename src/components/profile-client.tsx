"use client";

import { ProfileHammerheadSection } from "@/components/profile-hammerhead-section";
import {
    StravaProfileCard,
    StravaProfileCardSkeleton,
} from "@/components/profile-strava-profile-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStravaAthlete } from "@/hooks/use-strava-queries";
import Link from "next/link";

interface ProfileClientProps {
    searchParams: {
        error?: string;
    };
}

export default function ProfileClient({ searchParams }: ProfileClientProps) {
    const { data: athlete, isLoading: isAthleteLoading, error: athleteError } = useStravaAthlete();

    if (isAthleteLoading) {
        return (
            <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 md:p-24">
                <div className="w-full max-w-4xl space-y-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <div className="space-y-8">
                        <StravaProfileCardSkeleton />
                        <ProfileHammerheadSection />
                    </div>
                </div>
            </main>
        );
    }

    if (athleteError) {
        return (
            <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 md:p-24">
                <div className="w-full max-w-4xl space-y-8">
                    <Alert variant="destructive">
                        <AlertTitle>Błąd</AlertTitle>
                        <AlertDescription>
                            Nie udało się wczytać danych Stravy. Spróbuj ponownie później lub
                            połącz konto Strava od nowa.
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-8">
                        <ProfileHammerheadSection />
                    </div>
                    <div className="flex items-center justify-center">
                        <Link href="/">
                            <Button variant="outline">Wróć do strony głównej</Button>
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (!athlete) {
        return null;
    }

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
                    <StravaProfileCard athlete={athlete} />
                    <ProfileHammerheadSection />
                </div>
            </div>
        </main>
    );
}
