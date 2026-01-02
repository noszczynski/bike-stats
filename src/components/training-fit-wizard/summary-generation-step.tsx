"use client";

import { Button } from "@/components/ui/button";
import { useGenerateDescription } from "@/hooks/use-training-mutations";
import { Training } from "@/types/training";
import { Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SummaryGenerationStepProps {
    trainingId: string;
    training: Training;
}

export function SummaryGenerationStep({
    trainingId,
    training,
}: SummaryGenerationStepProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const generateDescriptionMutation = useGenerateDescription();
    const router = useRouter();

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        try {
            await generateDescriptionMutation.mutateAsync(trainingId);
            toast.success("Podsumowanie zostało wygenerowane");
            
            // Wait a bit before redirecting to allow user to see success message
            setTimeout(() => {
                router.push(`/trainings/${trainingId}`);
                router.refresh();
            }, 1500);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Nie udało się wygenerować podsumowania",
            );
            setIsGenerating(false);
        }
    }, [trainingId, generateDescriptionMutation, router]);

    useEffect(() => {
        // Auto-generate summary when component mounts
        handleGenerate();
    }, [handleGenerate]);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Generowanie podsumowania AI</h3>
                <p className="text-sm text-muted-foreground">
                    Trwa generowanie podsumowania treningu na podstawie zebranych danych. To może
                    zająć chwilę...
                </p>
            </div>

            {isGenerating ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Generowanie podsumowania...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <Sparkles className="h-12 w-12 text-primary" />
                    <p className="text-sm text-muted-foreground">
                        Podsumowanie zostało wygenerowane. Przekierowywanie...
                    </p>
                </div>
            )}

            {!isGenerating && (
                <div className="flex justify-end">
                    <Button onClick={() => router.push(`/trainings/${trainingId}`)}>
                        Przejdź do treningu
                    </Button>
                </div>
            )}
        </div>
    );
}

