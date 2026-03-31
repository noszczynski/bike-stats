"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ZwiftWorkoutTimeline } from "@/components/zwift-workout/zwift-workout-timeline";
import { useZwoGenerate } from "@/hooks/use-zwo-generate";
import {
    useCreateZwoWorkout,
    useDeleteZwoWorkout,
    useLoadZwoWorkout,
    useUpdateZwoWorkout,
    useZwoWorkouts,
} from "@/hooks/use-zwo-workouts";
import { toZwoXml } from "@/lib/zwo/to-zwo-xml";
import { ZwoStep, ZwoWorkout, zwoWorkoutSchema } from "@/lib/zwo/types";
import {
    ArrowDown,
    ArrowUp,
    Download,
    Loader2,
    Plus,
    RefreshCcw,
    Save,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import { toast } from "sonner";

type StepType = ZwoStep["type"];

const STEP_TYPES: StepType[] = [
    "Warmup",
    "Cooldown",
    "SteadyState",
    "Ramp",
    "IntervalsT",
    "TextEvent",
];

const DEFAULT_WORKOUT: ZwoWorkout = {
    name: "Nowy trening Zwift",
    description: "Wygenerowany w Bike Stats",
    author: "Bike Stats",
    sportType: "bike" as const,
    tags: [] as string[],
    steps: [{ type: "SteadyState", Duration: 900, Power: 0.7 } satisfies ZwoStep],
};

function createDefaultStep(type: StepType): ZwoStep {
    switch (type) {
        case "Warmup":
            return { type, Duration: 600, PowerLow: 0.5, PowerHigh: 0.75 };
        case "Cooldown":
            return { type, Duration: 600, PowerLow: 0.6, PowerHigh: 0.45 };
        case "SteadyState":
            return { type, Duration: 900, Power: 0.75 };
        case "Ramp":
            return { type, Duration: 600, PowerLow: 0.6, PowerHigh: 0.95 };
        case "IntervalsT":
            return {
                type,
                Repeat: 5,
                OnDuration: 120,
                OffDuration: 120,
                OnPower: 1.1,
                OffPower: 0.6,
            };
        case "TextEvent":
            return { type, timeoffset: 30, message: "Trzymaj tempo!" };
        default:
            return { type: "SteadyState", Duration: 900, Power: 0.75 };
    }
}

export function ZwiftWorkoutBuilder() {
    const [workout, setWorkout] = useState<ZwoWorkout>(DEFAULT_WORKOUT);
    const [instruction, setInstruction] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [stepTypeToAdd, setStepTypeToAdd] = useState<StepType>("SteadyState");
    const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const generateMutation = useZwoGenerate();
    const workoutsQuery = useZwoWorkouts();
    const createWorkoutMutation = useCreateZwoWorkout();
    const updateWorkoutMutation = useUpdateZwoWorkout();
    const deleteWorkoutMutation = useDeleteZwoWorkout();
    const loadWorkoutMutation = useLoadZwoWorkout();

    const canGenerate = instruction.trim().length >= 10;
    const validationResult = useMemo(() => zwoWorkoutSchema.safeParse(workout), [workout]);

    const updateStep = (index: number, updater: (step: ZwoStep) => ZwoStep) => {
        setWorkout(prev => ({
            ...prev,
            steps: prev.steps.map((step, i) => (i === index ? updater(step) : step)),
        }));
    };

    const moveStep = (index: number, direction: "up" | "down") => {
        setWorkout(prev => {
            const nextIndex = direction === "up" ? index - 1 : index + 1;
            if (nextIndex < 0 || nextIndex >= prev.steps.length) {
                return prev;
            }

            const nextSteps = [...prev.steps];
            const current = nextSteps[index];
            nextSteps[index] = nextSteps[nextIndex];
            nextSteps[nextIndex] = current;

            return { ...prev, steps: nextSteps };
        });
    };

    const removeStep = (index: number) => {
        setWorkout(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index),
        }));
    };

    const addStep = () => {
        setWorkout(prev => ({
            ...prev,
            steps: [...prev.steps, createDefaultStep(stepTypeToAdd)],
        }));
    };

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

    const handleGenerate = async () => {
        if (!canGenerate) {
            setErrorMessage("Instrukcja musi mieć co najmniej 10 znaków.");
            return;
        }

        setErrorMessage(null);
        setStatusMessage(null);

        try {
            const response = await generateMutation.mutateAsync({
                instruction,
                currentWorkout: workout,
            });
            setWorkout(response.workout);
            setStatusMessage("Trening został wygenerowany przez AI.");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Nie udało się wygenerować treningu.";
            setErrorMessage(message);
        }
    };

    const handleDownload = () => {
        setErrorMessage(null);
        setStatusMessage(null);

        const parsed = zwoWorkoutSchema.safeParse(workout);
        if (!parsed.success) {
            setErrorMessage("Trening zawiera błędy. Uzupełnij pola przed pobraniem pliku.");
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

        const fileLabel = `${safeName || "training"}.zwo`;
        toast.success("Plik został pobrany", { description: fileLabel });
    };

    const handleSaveWorkout = async () => {
        const parsed = zwoWorkoutSchema.safeParse(workout);
        if (!parsed.success) {
            setErrorMessage("Trening zawiera błędy. Popraw konfigurację przed zapisem.");
            return;
        }

        setErrorMessage(null);
        setStatusMessage(null);

        try {
            const result = await createWorkoutMutation.mutateAsync(parsed.data);
            setSelectedWorkoutId(result.workoutId);
            setStatusMessage("Konfiguracja treningu została zapisana.");
            toast.success("Zapisano trening");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Nie udało się zapisać treningu.";
            setErrorMessage(message);
        }
    };

    const handleOverwriteWorkout = async () => {
        if (!selectedWorkoutId) {
            setErrorMessage("Najpierw wybierz zapisany trening do nadpisania.");
            return;
        }

        const parsed = zwoWorkoutSchema.safeParse(workout);
        if (!parsed.success) {
            setErrorMessage("Trening zawiera błędy. Popraw konfigurację przed nadpisaniem.");
            return;
        }

        setErrorMessage(null);
        setStatusMessage(null);

        try {
            await updateWorkoutMutation.mutateAsync({
                workoutId: selectedWorkoutId,
                workout: parsed.data,
            });
            setStatusMessage("Konfiguracja została nadpisana.");
            toast.success("Nadpisano trening");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Nie udało się nadpisać treningu.";
            setErrorMessage(message);
        }
    };

    const handleLoadWorkout = async (workoutId: string) => {
        setErrorMessage(null);
        setStatusMessage(null);

        try {
            const payload = await loadWorkoutMutation.mutateAsync(workoutId);
            setSelectedWorkoutId(workoutId);
            setWorkout(payload.workout);
            setStatusMessage("Konfiguracja została wczytana do edytora.");
            toast.success("Wczytano trening");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Nie udało się wczytać treningu.";
            setErrorMessage(message);
        }
    };

    const handleDeleteWorkout = async (workoutId: string) => {
        setErrorMessage(null);
        setStatusMessage(null);

        try {
            await deleteWorkoutMutation.mutateAsync(workoutId);
            if (selectedWorkoutId === workoutId) {
                setSelectedWorkoutId(null);
            }
            setStatusMessage("Konfiguracja treningu została usunięta.");
            toast.success("Usunięto trening");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Nie udało się usunąć treningu.";
            setErrorMessage(message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Trwałe konfiguracje</CardTitle>
                        <CardDescription>
                            Zapisuj treningi w bazie, wczytuj je do edytora i nadpisuj zmiany.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    onClick={handleSaveWorkout}
                                    disabled={createWorkoutMutation.isPending}
                                >
                                    {createWorkoutMutation.isPending ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <Save />
                                    )}
                                    Zapisz konfigurację
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleOverwriteWorkout}
                                    disabled={!selectedWorkoutId || updateWorkoutMutation.isPending}
                                >
                                    {updateWorkoutMutation.isPending ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <RefreshCcw />
                                    )}
                                    Nadpisz
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {workoutsQuery.isLoading && (
                                    <p className="text-muted-foreground text-sm">
                                        Ładowanie zapisanych treningów...
                                    </p>
                                )}
                                {workoutsQuery.isError && (
                                    <p className="text-destructive text-sm">
                                        {workoutsQuery.error instanceof Error
                                            ? workoutsQuery.error.message
                                            : "Nie udało się pobrać listy treningów."}
                                    </p>
                                )}
                                {(workoutsQuery.data?.length ?? 0) === 0 &&
                                    !workoutsQuery.isLoading && (
                                        <p className="text-muted-foreground text-sm">
                                            Nie masz jeszcze zapisanych konfiguracji.
                                        </p>
                                    )}

                                <div className="space-y-2">
                                    {workoutsQuery.data?.map(savedWorkout => (
                                        <div
                                            key={savedWorkout.id}
                                            className="space-y-3 rounded-md border p-3"
                                        >
                                            <div>
                                                <p className="font-medium">{savedWorkout.name}</p>
                                                <p className="text-muted-foreground text-sm">
                                                    {savedWorkout.stepsCount} kroków •{" "}
                                                    {savedWorkout.author}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant={
                                                        selectedWorkoutId === savedWorkout.id
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    onClick={() =>
                                                        handleLoadWorkout(savedWorkout.id)
                                                    }
                                                    disabled={loadWorkoutMutation.isPending}
                                                >
                                                    Wczytaj do edytora
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleDeleteWorkout(savedWorkout.id)
                                                    }
                                                    disabled={deleteWorkoutMutation.isPending}
                                                >
                                                    <Trash2 />
                                                    Usuń
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Metadane treningu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="workout-name">Nazwa</Label>
                                <Input
                                    id="workout-name"
                                    value={workout.name}
                                    onChange={event =>
                                        setWorkout(prev => ({ ...prev, name: event.target.value }))
                                    }
                                    placeholder="Np. Sweet Spot 4x8"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="workout-description">Opis</Label>
                                <Textarea
                                    id="workout-description"
                                    value={workout.description}
                                    onChange={event =>
                                        setWorkout(prev => ({
                                            ...prev,
                                            description: event.target.value,
                                        }))
                                    }
                                    placeholder="Opis celu treningu"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="workout-author">Autor</Label>
                                <Input
                                    id="workout-author"
                                    value={workout.author}
                                    onChange={event =>
                                        setWorkout(prev => ({
                                            ...prev,
                                            author: event.target.value,
                                        }))
                                    }
                                    placeholder="Np. Adam"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="workout-tag-input">Tagi</Label>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Input
                                        id="workout-tag-input"
                                        value={tagInput}
                                        onChange={event => setTagInput(event.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder="Dodaj tag i naciśnij Enter"
                                    />
                                    <Button type="button" onClick={addTag}>
                                        <Plus />
                                        Dodaj tag
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {workout.tags.map(tag => (
                                        <Badge key={tag} variant="secondary">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                aria-label={`Usuń tag ${tag}`}
                                            >
                                                <X />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Generacja przez AI</CardTitle>
                        <CardDescription>
                            Opisz cel i strukturę, a model zbuduje gotowy trening.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="workout-instruction">Instrukcja dla modelu</Label>
                                <Textarea
                                    id="workout-instruction"
                                    value={instruction}
                                    onChange={event => setInstruction(event.target.value)}
                                    placeholder="Np. Trening 60 min: rozgrzewka, 5x 3 min VO2max i schłodzenie."
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={handleGenerate}
                                disabled={!canGenerate || generateMutation.isPending}
                            >
                                {generateMutation.isPending ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <Sparkles />
                                )}
                                Generuj z AI
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pobieranie pliku</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button type="button" onClick={handleDownload}>
                            <Download />
                            Pobierz .zwo
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <ZwiftWorkoutTimeline steps={workout.steps} ftpWatts={160} />

            <Card>
                <CardHeader>
                    <CardTitle>Edytor modułów treningowych</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Select
                                value={stepTypeToAdd}
                                onValueChange={value => setStepTypeToAdd(value as StepType)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Wybierz moduł" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STEP_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button type="button" onClick={addStep}>
                                <Plus />
                                Dodaj moduł
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {workout.steps.map((step, index) => (
                                <Card key={`${step.type}-${index}`}>
                                    <CardHeader>
                                        <CardTitle>
                                            {index + 1}. {step.type}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {(step.type === "Warmup" ||
                                                step.type === "Cooldown" ||
                                                step.type === "Ramp") && (
                                                <div className="grid gap-4 md:grid-cols-3">
                                                    <div className="space-y-2">
                                                        <Label>Czas (s)</Label>
                                                        <Input
                                                            type="number"
                                                            value={step.Duration}
                                                            onChange={event =>
                                                                updateStep(index, current => ({
                                                                    ...current,
                                                                    Duration:
                                                                        Number(
                                                                            event.target.value,
                                                                        ) || 0,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Moc start (FTP)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={step.PowerLow}
                                                            onChange={event =>
                                                                updateStep(index, current => ({
                                                                    ...current,
                                                                    PowerLow:
                                                                        Number(
                                                                            event.target.value,
                                                                        ) || 0,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Moc koniec (FTP)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={step.PowerHigh}
                                                            onChange={event =>
                                                                updateStep(index, current => ({
                                                                    ...current,
                                                                    PowerHigh:
                                                                        Number(
                                                                            event.target.value,
                                                                        ) || 0,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {step.type === "SteadyState" && (
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label>Czas (s)</Label>
                                                        <Input
                                                            type="number"
                                                            value={step.Duration}
                                                            onChange={event =>
                                                                updateStep(index, current => ({
                                                                    ...current,
                                                                    Duration:
                                                                        Number(
                                                                            event.target.value,
                                                                        ) || 0,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Moc (FTP)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={step.Power}
                                                            onChange={event =>
                                                                updateStep(index, current => ({
                                                                    ...current,
                                                                    Power:
                                                                        Number(
                                                                            event.target.value,
                                                                        ) || 0,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {step.type === "IntervalsT" && (
                                                <div className="grid gap-4 md:grid-cols-3">
                                                    <div className="space-y-2">
                                                        <Label>Powtórzenia</Label>
                                                        <Input
                                                            type="number"
                                                            value={step.Repeat}
                                                            onChange={event =>
                                                                updateStep(index, current => ({
                                                                    ...current,
                                                                    Repeat:
                                                                        Number(
                                                                            event.target.value,
                                                                        ) || 0,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Czas wysiłku (s)</Label>
                                                        <Input
                                                            type="number"
                                                            value={step.OnDuration}
                                                            onChange={event =>
                                                                updateStep(index, current => ({
                                                                    ...current,
                                                                    OnDuration:
                                                                        Number(
                                                                            event.target.value,
                                                                        ) || 0,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Czas odpoczynku (s)</Label>
                                                        <Input
                                                            type="number"
                                                            value={step.OffDuration}
                                                            onChange={event =>
                                                                updateStep(index, current => ({
                                                                    ...current,
                                                                    OffDuration:
                                                                        Number(
                                                                            event.target.value,
                                                                        ) || 0,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Moc wysiłku (FTP)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={step.OnPower}
                                                            onChange={event =>
                                                                updateStep(index, current => ({
                                                                    ...current,
                                                                    OnPower:
                                                                        Number(
                                                                            event.target.value,
                                                                        ) || 0,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Moc odpoczynku (FTP)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={step.OffPower}
                                                            onChange={event =>
                                                                updateStep(index, current => ({
                                                                    ...current,
                                                                    OffPower:
                                                                        Number(
                                                                            event.target.value,
                                                                        ) || 0,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {step.type === "TextEvent" && (
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label>Offset (s)</Label>
                                                        <Input
                                                            type="number"
                                                            value={step.timeoffset}
                                                            onChange={event =>
                                                                updateStep(index, current => ({
                                                                    ...current,
                                                                    timeoffset:
                                                                        Number(
                                                                            event.target.value,
                                                                        ) || 0,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Komunikat</Label>
                                                        <Input
                                                            value={step.message}
                                                            onChange={event =>
                                                                updateStep(index, current => ({
                                                                    ...current,
                                                                    message: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => moveStep(index, "up")}
                                                    disabled={index === 0}
                                                >
                                                    <ArrowUp />W górę
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => moveStep(index, "down")}
                                                    disabled={index === workout.steps.length - 1}
                                                >
                                                    <ArrowDown />W dół
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={() => removeStep(index)}
                                                >
                                                    <Trash2 />
                                                    Usuń
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
