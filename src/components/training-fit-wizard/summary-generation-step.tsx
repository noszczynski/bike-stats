"use client";

import { Button } from "@/components/ui/button";
import { useGenerateDescription } from "@/hooks/use-training-mutations";
import { Training } from "@/types/training";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
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
    const router = useRouter();
    const hasTriggered = useRef(false);
    
    const { mutate: generateDescription, isPending } = useGenerateDescription({
        onSuccess: () => {
            toast.success("Podsumowanie zostało wygenerowane");
            
            // Wait a bit before redirecting to allow user to see success message
            setTimeout(() => {
                router.push(`/rides/${trainingId}`);
                router.refresh();
            }, 1500);
        },
        onError: (error) => {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Nie udało się wygenerować podsumowania",
            );
        },
    });

    useEffect(() => {
        // Auto-generate summary when component mounts (only once)
        if (!hasTriggered.current) {
            hasTriggered.current = true;
            generateDescription(trainingId);
        }
    }, [trainingId, generateDescription]);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Generowanie podsumowania AI</h3>
                <p className="text-sm text-muted-foreground">
                    Trwa generowanie podsumowania jazdy na podstawie zebranych danych. To może
                    zająć chwilę...
                </p>
            </div>

            {isPending ? (
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

            {!isPending && (
                <div className="flex justify-end">
                    <Button onClick={() => router.push(`/rides/${trainingId}`)}>
                        Przejdź do jazdy
                    </Button>
                </div>
            )}
        </div>
    );
}

