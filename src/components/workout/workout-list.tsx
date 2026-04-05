"use client";

import { HammerheadLoginButton } from "@/components/HammerheadLoginButton";
import { WorkoutPageHeader } from "@/components/workout/workout-page-header";
import { formatDateTime, formatDuration } from "@/components/workout/workout-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHammerheadAuth } from "@/hooks/use-hammerhead-auth";
import { ZwoWorkoutListItem, useZwoWorkouts } from "@/hooks/use-zwo-workouts";
import { getZoneForFactor } from "@/lib/zwo/power-zones";
import { getWorkoutDifficultyLabel } from "@/lib/zwo/workout-summary";
import { Bike, ChevronRight, FilePlus2, PencilLine } from "lucide-react";
import Link from "next/link";

const PROFILE_HEIGHT = 52;
const PROFILE_MAX_FACTOR = 1.5;
const PROFILE_WIDTH = 1000;

function zoneColorHex(colorClass: string): string {
    const map: Record<string, string> = {
        "bg-sky-500": "#0ea5e9",
        "bg-emerald-500": "#10b981",
        "bg-yellow-500": "#eab308",
        "bg-orange-500": "#f97316",
        "bg-rose-500": "#f43f5e",
    };

    return map[colorClass] ?? "#64748b";
}

function MiniWorkoutProfile({ workout }: { workout: ZwoWorkoutListItem }) {
    const totalDuration = workout.previewBlocks.reduce((sum, block) => sum + block.durationSec, 0);

    if (totalDuration <= 0 || workout.previewBlocks.length === 0) {
        return (
            <div className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                Brak danych do podglądu profilu.
            </div>
        );
    }

    let currentOffset = 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">Profil treningu</p>
                <p className="text-xs text-muted-foreground">
                    {formatDuration(workout.estimatedDurationSeconds)}
                </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-2">
                <svg
                    viewBox={`0 0 ${PROFILE_WIDTH} ${PROFILE_HEIGHT}`}
                    preserveAspectRatio="none"
                    className="block h-14 w-full"
                    aria-hidden="true"
                >
                    <defs>
                        {workout.previewBlocks.map((block, index) => {
                            if (block.startFactor === block.endFactor) {
                                return null;
                            }

                            const startColor = zoneColorHex(
                                getZoneForFactor(block.startFactor).colorClass,
                            );
                            const endColor = zoneColorHex(
                                getZoneForFactor(block.endFactor).colorClass,
                            );

                            return (
                                <linearGradient
                                    key={`${workout.id}-profile-gradient-${index}`}
                                    id={`${workout.id}-profile-gradient-${index}`}
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="0"
                                >
                                    <stop offset="0%" stopColor={startColor} />
                                    <stop offset="100%" stopColor={endColor} />
                                </linearGradient>
                            );
                        })}
                    </defs>
                    {workout.previewBlocks.map((block, index) => {
                        const startSec = currentOffset;
                        currentOffset += block.durationSec;

                        const x = (startSec / totalDuration) * PROFILE_WIDTH;
                        const width = (block.durationSec / totalDuration) * PROFILE_WIDTH;
                        const startHeight =
                            (Math.min(block.startFactor, PROFILE_MAX_FACTOR) / PROFILE_MAX_FACTOR) *
                            PROFILE_HEIGHT;
                        const endHeight =
                            (Math.min(block.endFactor, PROFILE_MAX_FACTOR) / PROFILE_MAX_FACTOR) *
                            PROFILE_HEIGHT;

                        const isRamp = block.startFactor !== block.endFactor;
                        const fill = isRamp
                            ? `url(#${workout.id}-profile-gradient-${index})`
                            : zoneColorHex(getZoneForFactor(block.startFactor).colorClass);

                        if (isRamp) {
                            const points = [
                                `${x},${PROFILE_HEIGHT}`,
                                `${x},${PROFILE_HEIGHT - startHeight}`,
                                `${x + width},${PROFILE_HEIGHT - endHeight}`,
                                `${x + width},${PROFILE_HEIGHT}`,
                            ].join(" ");

                            return (
                                <polygon
                                    key={`${workout.id}-profile-${index}`}
                                    points={points}
                                    fill={fill}
                                    opacity="0.85"
                                />
                            );
                        }

                        return (
                            <rect
                                key={`${workout.id}-profile-${index}`}
                                x={x}
                                y={PROFILE_HEIGHT - startHeight}
                                width={width}
                                height={startHeight}
                                fill={fill}
                                opacity="0.85"
                            />
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

function DifficultyScale({ difficulty }: { difficulty: number }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">Trudność</p>
                <p className="text-sm font-medium">
                    {difficulty.toFixed(1)}/5
                </p>
            </div>
            <div className="flex items-center gap-1.5" aria-label={`Trudność ${difficulty} z 5`}>
                {Array.from({ length: 5 }, (_, index) => {
                    const value = index + 1;
                    const fill = Math.max(0, Math.min(1, difficulty - index));

                    return (
                        <div key={value} className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-foreground"
                                style={{ width: `${fill * 100}%` }}
                            />
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-muted-foreground">{getWorkoutDifficultyLabel(difficulty)}</p>
        </div>
    );
}

export function WorkoutList() {
    const workoutsQuery = useZwoWorkouts();
    const hammerheadAuthQuery = useHammerheadAuth();

    return (
        <div className="space-y-6">
            <WorkoutPageHeader
                title="Treningi"
                description="Zarządzaj biblioteką zapisanych treningów"
                actions={
                    <Button asChild>
                        <Link href="/workouts/new">
                            <FilePlus2 />
                            Nowy trening
                        </Link>
                    </Button>
                }
                breadcrumbs={[{ label: "Treningi" }]}
            />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-3">
                    {workoutsQuery.isLoading ? (
                        <p className="text-muted-foreground text-sm">
                            Ładowanie zapisanych treningów...
                        </p>
                    ) : null}

                    {workoutsQuery.isError ? (
                        <p className="text-destructive text-sm">
                            {workoutsQuery.error instanceof Error
                                ? workoutsQuery.error.message
                                : "Nie udało się pobrać listy treningów."}
                        </p>
                    ) : null}

                    {!workoutsQuery.isLoading &&
                    !workoutsQuery.isError &&
                    (workoutsQuery.data?.length ?? 0) === 0 ? (
                        <div className="rounded-xl border border-dashed p-8 text-center">
                            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border">
                                <Bike />
                            </div>
                            <p className="font-medium">Nie masz jeszcze żadnych zapisanych treningów.</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Utwórz pierwszy workout, potem przejdź do szczegółów lub wysyłki.
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/workouts/new">
                                    <FilePlus2 />
                                    Utwórz pierwszy workout
                                </Link>
                            </Button>
                        </div>
                    ) : null}

                    {workoutsQuery.data?.map(workout => (
                        <div
                            key={workout.id}
                            className="rounded-xl border p-4 transition-colors hover:bg-muted/40"
                        >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0 flex-1 space-y-4">
                                    <div className="space-y-1">
                                        <p className="font-medium">{workout.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {workout.description}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                        <span>{workout.stepsCount} modułów</span>
                                        <span>Czas: {formatDuration(workout.estimatedDurationSeconds)}</span>
                                        <span>Autor: {workout.author}</span>
                                        <span>Aktualizacja: {formatDateTime(workout.updatedAt)}</span>
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                                        <MiniWorkoutProfile workout={workout} />
                                        <div className="rounded-lg border bg-muted/10 p-3">
                                            <DifficultyScale difficulty={workout.difficulty} />
                                        </div>
                                    </div>

                                    {workout.tags.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {workout.tags.map(tag => (
                                                <Badge key={tag} variant="secondary">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex flex-wrap gap-2 xl:min-w-64 xl:justify-end">
                                    <Button variant="outline" asChild>
                                        <Link href={`/workouts/${workout.id}/edit`}>
                                            <PencilLine />
                                            Edytuj
                                        </Link>
                                    </Button>
                                    <Button asChild>
                                        <Link href={`/workouts/${workout.id}`}>
                                            Szczegóły
                                            <ChevronRight />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Biblioteka</CardTitle>
                            <CardDescription>
                                Szybki podgląd na obecną kolekcję treningów.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <div className="rounded-lg border p-4">
                                <p className="text-muted-foreground text-sm">Zapisane workouty</p>
                                <p className="text-2xl font-semibold">
                                    {workoutsQuery.data?.length ?? 0}
                                </p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <p className="text-muted-foreground text-sm">Tryb pracy</p>
                                <p className="text-base font-medium">Lista, szczegóły i edycja</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Hammerhead</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm">
                                Status połączenia:{" "}
                                <span className="font-medium">
                                    {hammerheadAuthQuery.data?.isAuthenticated
                                        ? "połączono"
                                        : hammerheadAuthQuery.isLoading
                                          ? "sprawdzanie..."
                                          : "brak połączenia"}
                                </span>
                            </p>
                            {!hammerheadAuthQuery.data?.isAuthenticated ? (
                                <HammerheadLoginButton />
                            ) : (
                                <Button variant="outline" asChild>
                                    <Link href="/auth/hammerhead">Zarządzaj połączeniem</Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
