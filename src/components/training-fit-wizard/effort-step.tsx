"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUpdateTraining } from "@/hooks/use-training-mutations";
import { Training } from "@/types/training";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EffortStepProps {
    trainingId: string;
    training: Training;
    onComplete: () => void;
}

export function EffortStep({ trainingId, training, onComplete }: EffortStepProps) {
    const [selectedEffort, setSelectedEffort] = useState(training.effort ?? 1);
    const [isSaving, setIsSaving] = useState(false);
    const updateTrainingMutation = useUpdateTraining();

    const handleEffortChange = async (value: string) => {
        const effortValue = parseInt(value);
        setSelectedEffort(effortValue);
        setIsSaving(true);

        try {
            await updateTrainingMutation.mutateAsync({
                trainingId,
                data: { effort: effortValue },
            });
            toast.success("Poziom wysiłku został zapisany");
        } catch (error) {
            toast.error("Nie udało się zapisać poziomu wysiłku");
            console.error("Error updating effort:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <Label className="text-base font-semibold">Wybierz poziom wysiłku (1-10)</Label>
                <p className="text-sm text-muted-foreground">
                    1-3: Łatwy, 4-6: Średni, 7-8: Trudny, 9-10: Maksymalny
                </p>
                <RadioGroup
                    value={String(selectedEffort)}
                    onValueChange={handleEffortChange}
                    className="grid grid-cols-5 gap-3 md:grid-cols-10"
                >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(value => (
                        <div key={value} className="flex items-center justify-center">
                            <RadioGroupItem
                                value={String(value)}
                                id={`effort-${value}`}
                                className="peer sr-only"
                            />
                            <Label
                                htmlFor={`effort-${value}`}
                                className={cn(
                                    "hover:bg-accent peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 text-sm font-medium transition-all",
                                    {
                                        "bg-primary text-primary-foreground border-primary hover:bg-primary/80":
                                            value === selectedEffort,
                                    },
                                )}
                            >
                                {value}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
                {isSaving && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Zapisywanie...
                    </div>
                )}
            </div>
            <div className="flex justify-end">
                <Button onClick={onComplete} disabled={isSaving}>
                    Dalej
                </Button>
            </div>
        </div>
    );
}


