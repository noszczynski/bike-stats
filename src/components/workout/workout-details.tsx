"use client";

import { useState } from "react";
import { HammerheadLoginButton } from "@/components/HammerheadLoginButton";
import { SubmitButton } from "@/components/submit-button";
import { WorkoutPageHeader } from "@/components/workout/workout-page-header";
import { WorkoutStepsList } from "@/components/workout/workout-steps-list";
import { WorkoutTimeline } from "@/components/workout/workout-timeline";
import {
    duplicateWorkoutName,
    formatDateTime,
    formatDuration,
    getWorkoutDurationSeconds,
} from "@/components/workout/workout-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHammerheadAuth } from "@/hooks/use-hammerhead-auth";
import {
    useCreateZwoWorkout,
    useDeleteZwoWorkout,
    useUploadZwoWorkoutToHammerhead,
    useZwoWorkout,
} from "@/hooks/use-zwo-workouts";
import { toZwoXml } from "@/lib/zwo/to-zwo-xml";
import { zwoWorkoutSchema } from "@/lib/zwo/types";
import { Copy, Download, PencilLine, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type WorkoutDetailsProps = {
    workoutId: string;
};

export function WorkoutDetails({ workoutId }: WorkoutDetailsProps) {
    const router = useRouter();
    const workoutQuery = useZwoWorkout(workoutId);
    const createWorkoutMutation = useCreateZwoWorkout();
    const deleteWorkoutMutation = useDeleteZwoWorkout();
    const uploadWorkoutMutation = useUploadZwoWorkoutToHammerhead();
    const hammerheadAuthQuery = useHammerheadAuth();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const workout = workoutQuery.data?.workout;
    const meta = workoutQuery.data?.meta;

    const handleDownload = () => {
        if (!workout) {
            return;
        }

        const parsed = zwoWorkoutSchema.safeParse(workout);
        if (!parsed.success) {
            toast.error("Workout zawiera błędy i nie może zostać pobrany.");
            return;
        }

        const xml = toZwoXml(parsed.data);
        const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeName = parsed.data.name
            .toLowerCase()
            .trim()
            .replaceAll(/\s+/g, "-")
            .replaceAll(/[^a-z0-9-_]/g, "");

        link.href = url;
        link.download = `${safeName || "training"}.zwo`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        toast.success("Plik został pobrany.");
    };

    const handleDuplicate = async () => {
        if (!workout) {
            return;
        }

        try {
            const result = await createWorkoutMutation.mutateAsync({
                ...workout,
                name: duplicateWorkoutName(workout.name),
            });
            toast.success("Utworzono kopię workoutu.");
            router.push(`/workouts/${result.workoutId}`);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Nie udało się skopiować workoutu.",
            );
        }
    };

    const handleUploadToHammerhead = async () => {
        if (!workout) {
            return;
        }

        const parsed = zwoWorkoutSchema.safeParse(workout);
        if (!parsed.success) {
            toast.error("Workout zawiera błędy. Popraw go przed wysyłką.");
            return;
        }

        try {
            const result = await uploadWorkoutMutation.mutateAsync(parsed.data);
            toast.success("Wysłano do Hammerhead", {
                description: result.name,
            });
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Nie udało się wysłać workoutu do Hammerhead.",
            );
        }
    };

    const handleDelete = async () => {
        try {
            await deleteWorkoutMutation.mutateAsync(workoutId);
            toast.success("Usunięto workout.");
            router.push("/workouts");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Nie udało się usunąć workoutu.");
        }
    };

    if (workoutQuery.isLoading) {
        return <p className="text-muted-foreground text-sm">Ładowanie workoutu...</p>;
    }

    if (workoutQuery.isError || !workout || !meta) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    {workoutQuery.error instanceof Error
                        ? workoutQuery.error.message
                        : "Nie udało się pobrać workoutu."}
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <WorkoutPageHeader
                    title={workout.name}
                    description={workout.description}
                    actions={
                        <>
                            <Button variant="outline" asChild>
                                <Link href={`/workouts/${workoutId}/edit`}>
                                    <PencilLine />
                                    Edytuj
                                </Link>
                            </Button>
                            <SubmitButton
                                variant="outline"
                                onClick={handleDuplicate}
                                isLoading={createWorkoutMutation.isPending}
                                loadingText="Duplikowanie..."
                            >
                                <Copy />
                                Duplikuj
                            </SubmitButton>
                            <Button variant="outline" onClick={handleDownload}>
                                <Download />
                                Pobierz .zwo
                            </Button>
                            {hammerheadAuthQuery.data?.isAuthenticated ? (
                                <SubmitButton
                                    onClick={handleUploadToHammerhead}
                                    isLoading={uploadWorkoutMutation.isPending}
                                    loadingText="Wysyłanie..."
                                >
                                    <Upload />
                                    Wyślij do Hammerhead
                                </SubmitButton>
                            ) : null}
                            <Button
                                variant="destructive"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 />
                                Usuń
                            </Button>
                        </>
                    }
                    breadcrumbs={[
                        { href: "/workouts", label: "Workouty" },
                        { label: workout.name },
                    ]}
                />

                {!hammerheadAuthQuery.data?.isAuthenticated ? (
                    <Alert>
                        <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                Aby wysłać workout do Hammerhead, połącz konto. Zdalna biblioteka
                                pozostaje poza tym widokiem.
                            </span>
                            <HammerheadLoginButton />
                        </AlertDescription>
                    </Alert>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Podsumowanie</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Czas trwania</span>
                                <span className="font-medium">
                                    {formatDuration(getWorkoutDurationSeconds(workout))}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Liczba modułów</span>
                                <span className="font-medium">{workout.steps.length}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Autor</span>
                                <span className="font-medium">{workout.author}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Utworzono</span>
                                <span className="font-medium">
                                    {formatDateTime(meta.createdAt)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground">Aktualizacja</span>
                                <span className="font-medium">
                                    {formatDateTime(meta.updatedAt)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Tagi i opis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground text-sm">{workout.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {workout.tags.length > 0 ? (
                                    workout.tags.map(tag => (
                                        <Badge key={tag} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground text-sm">
                                        Brak przypisanych tagów.
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <WorkoutTimeline steps={workout.steps} ftpWatts={160} />
                <WorkoutStepsList steps={workout.steps} />
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usunąć workout?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ta operacja usuwa workout z Bike Stats. Jeśli był już wysłany do
                            Hammerhead, trzeba go usunąć osobno po stronie urządzenia lub usługi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={event => {
                                event.preventDefault();
                                void handleDelete();
                            }}
                        >
                            Usuń workout
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
