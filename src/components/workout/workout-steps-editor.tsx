"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    createDefaultStep,
    STEP_TYPES,
    StepType,
} from "@/components/workout/workout-utils";
import { ZwoStep, ZwoWorkout } from "@/lib/zwo/types";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

type WorkoutStepsEditorProps = {
    workout: ZwoWorkout;
    stepTypeToAdd: StepType;
    onStepTypeToAddChange: (value: StepType) => void;
    onWorkoutChange: (workout: ZwoWorkout) => void;
};

export function WorkoutStepsEditor({
    workout,
    stepTypeToAdd,
    onStepTypeToAddChange,
    onWorkoutChange,
}: WorkoutStepsEditorProps) {
    const updateStep = (index: number, updater: (step: ZwoStep) => ZwoStep) => {
        onWorkoutChange({
            ...workout,
            steps: workout.steps.map((step, stepIndex) =>
                stepIndex === index ? updater(step) : step,
            ),
        });
    };

    const moveStep = (index: number, direction: "up" | "down") => {
        const nextIndex = direction === "up" ? index - 1 : index + 1;
        if (nextIndex < 0 || nextIndex >= workout.steps.length) {
            return;
        }

        const nextSteps = [...workout.steps];
        const current = nextSteps[index];
        nextSteps[index] = nextSteps[nextIndex];
        nextSteps[nextIndex] = current;

        onWorkoutChange({ ...workout, steps: nextSteps });
    };

    const removeStep = (index: number) => {
        onWorkoutChange({
            ...workout,
            steps: workout.steps.filter((_, stepIndex) => stepIndex !== index),
        });
    };

    const addStep = () => {
        onWorkoutChange({
            ...workout,
            steps: [...workout.steps, createDefaultStep(stepTypeToAdd)],
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Moduły workoutu</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Select
                            value={stepTypeToAdd}
                            onValueChange={value => onStepTypeToAddChange(value as StepType)}
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
                                                                    Number(event.target.value) || 0,
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
                                                                    Number(event.target.value) || 0,
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
                                                                    Number(event.target.value) || 0,
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
                                                                    Number(event.target.value) || 0,
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
                                                                    Number(event.target.value) || 0,
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
                                                                    Number(event.target.value) || 0,
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
                                                                    Number(event.target.value) || 0,
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
                                                                    Number(event.target.value) || 0,
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
                                                                    Number(event.target.value) || 0,
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
                                                                    Number(event.target.value) || 0,
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
                                                                    Number(event.target.value) || 0,
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
    );
}
