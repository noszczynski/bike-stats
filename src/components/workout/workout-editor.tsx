"use client";

import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { WorkoutMetadataForm } from "@/components/workout/workout-metadata-form";
import { WorkoutPageHeader } from "@/components/workout/workout-page-header";
import { WorkoutStepsEditor } from "@/components/workout/workout-steps-editor";
import { WorkoutTimeline } from "@/components/workout/workout-timeline";
import {
    DEFAULT_WORKOUT,
    formatDuration,
    getWorkoutDurationSeconds,
    StepType,
} from "@/components/workout/workout-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateZwoWorkout, useUpdateZwoWorkout, useZwoWorkout } from "@/hooks/use-zwo-workouts";
import { ZwoWorkout, zwoWorkoutSchema } from "@/lib/zwo/types";
import { MessageSquare, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type WorkoutEditorProps = {
    workoutId?: string;
};

export function WorkoutEditor({ workoutId }: WorkoutEditorProps) {
    const router = useRouter();
    const isEditing = Boolean(workoutId);
    const workoutQuery = useZwoWorkout(workoutId ?? null);
    const createWorkoutMutation = useCreateZwoWorkout();
    const updateWorkoutMutation = useUpdateZwoWorkout();

    const [workout, setWorkout] = useState<ZwoWorkout>(DEFAULT_WORKOUT);
    const [tagInput, setTagInput] = useState("");
    const [stepTypeToAdd, setStepTypeToAdd] = useState<StepType>("SteadyState");
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [hydratedWorkoutId, setHydratedWorkoutId] = useState<string | null>(null);

    useEffect(() => {
        if (!workoutId || !workoutQuery.data || hydratedWorkoutId === workoutId) {
            return;
        }

        setWorkout(workoutQuery.data.workout);
        setHydratedWorkoutId(workoutId);
    }, [hydratedWorkoutId, workoutId, workoutQuery.data]);

    const validationResult = useMemo(() => zwoWorkoutSchema.safeParse(workout), [workout]);

    const addTag = () => {
        const value = tagInput.trim();
        if (!value) {
            return;
        }

        if (workout.tags.includes(value)) {
            setErrorMessage("Ten tag już istnieje.");
            return;
        }

        setErrorMessage(null);
        setWorkout(prev => ({ ...prev, tags: [...prev.tags, value] }));
        setTagInput("");
    };

    const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addTag();
        }
    };

    const removeTag = (tagToRemove: string) => {
        setWorkout(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove),
        }));
    };

    const handleSaveWorkout = async () => {
        const parsed = zwoWorkoutSchema.safeParse(workout);
        if (!parsed.success) {
            setErrorMessage("Workout zawiera błędy. Popraw konfigurację przed zapisem.");
            setStatusMessage(null);
            return;
        }

        setErrorMessage(null);
        setStatusMessage(null);

        try {
            if (workoutId) {
                await updateWorkoutMutation.mutateAsync({
                    workoutId,
                    workout: parsed.data,
                });
                setStatusMessage("Zmiany zostały zapisane.");
                toast.success("Zapisano zmiany workoutu.");
                return;
            }

            const result = await createWorkoutMutation.mutateAsync(parsed.data);
            toast.success("Zapisano nowy workout.");
            router.push(`/workouts/${result.workoutId}`);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Nie udało się zapisać workoutu.";
            setErrorMessage(message);
        }
    };

    if (isEditing && workoutQuery.isLoading) {
        return <p className="text-muted-foreground text-sm">Ładowanie workoutu do edycji...</p>;
    }

    if (isEditing && (workoutQuery.isError || !workoutQuery.data)) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    {workoutQuery.error instanceof Error
                        ? workoutQuery.error.message
                        : "Nie udało się pobrać workoutu do edycji."}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <WorkoutPageHeader
                title={isEditing ? "Edycja workoutu" : "Nowy workout"}
                description={
                    isEditing
                        ? "Zmieniaj metadane i układ modułów na osobnym ekranie edycji."
                        : "Zbuduj nowy workout i zapisz go w bibliotece Bike Stats."
                }
                actions={
                    <>
                        {workoutId ? (
                            <Button variant="outline" asChild>
                                <Link href={`/workouts/${workoutId}`}>Zobacz szczegóły</Link>
                            </Button>
                        ) : null}
                        <SubmitButton
                            onClick={handleSaveWorkout}
                            isLoading={
                                createWorkoutMutation.isPending || updateWorkoutMutation.isPending
                            }
                            loadingText="Zapisywanie..."
                        >
                            <Save />
                            {isEditing ? "Zapisz zmiany" : "Zapisz workout"}
                        </SubmitButton>
                    </>
                }
                breadcrumbs={
                    [
                        { href: "/workouts", label: "Workouty" },
                        workoutId
                            ? {
                                  href: `/workouts/${workoutId}`,
                                  label: workout.name || "Szczegóły",
                              }
                            : null,
                        { label: isEditing ? "Edycja" : "Nowy workout" },
                    ].filter(Boolean) as Array<{ href?: string; label: string }>
                }
            />

            {statusMessage ? (
                <Alert>
                    <AlertDescription>{statusMessage}</AlertDescription>
                </Alert>
            ) : null}

            {errorMessage ? (
                <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            ) : null}

            {!validationResult.success ? (
                <Alert variant="destructive">
                    <AlertDescription>
                        Workout wymaga poprawek. Sprawdź metadane i konfigurację modułów.
                    </AlertDescription>
                </Alert>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                    <WorkoutMetadataForm
                        workout={workout}
                        tagInput={tagInput}
                        onWorkoutChange={setWorkout}
                        onTagInputChange={setTagInput}
                        onAddTag={addTag}
                        onRemoveTag={removeTag}
                        onTagKeyDown={handleTagKeyDown}
                    />
                    <WorkoutTimeline steps={workout.steps} ftpWatts={160} />
                    <WorkoutStepsEditor
                        workout={workout}
                        stepTypeToAdd={stepTypeToAdd}
                        onStepTypeToAddChange={setStepTypeToAdd}
                        onWorkoutChange={setWorkout}
                    />
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Podgląd</CardTitle>
                            <CardDescription>
                                Szybki skrót aktualnie edytowanego workoutu.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Moduły</span>
                                <span className="font-medium">{workout.steps.length}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Czas trwania</span>
                                <span className="font-medium">
                                    {formatDuration(getWorkoutDurationSeconds(workout))}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Tagi</span>
                                <span className="font-medium">{workout.tags.length}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tworzenie przez chat</CardTitle>
                            <CardDescription>
                                Generator AI został usunięty z edytora. Jego rolę przejął moduł
                                rozmowy z trenerem.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" asChild>
                                <Link href="/chat">
                                    <MessageSquare />
                                    Otwórz chat
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
