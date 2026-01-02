"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateTrainingNotes } from "@/hooks/use-training-mutations";
import { Training } from "@/types/training";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface NotesStepProps {
    trainingId: string;
    training: Training;
    onComplete: () => void;
}

const DEBOUNCE_DELAY = 1000; // 1 second

export function NotesStep({ trainingId, training, onComplete }: NotesStepProps) {
    const [notes, setNotes] = useState(training.notes || "");
    const [isSaving, setIsSaving] = useState(false);
    const updateNotesMutation = useUpdateTrainingNotes();

    useEffect(() => {
        // Auto-save with debounce
        if (notes === training.notes) {
            return; // Don't save if unchanged
        }

        const timeoutId = setTimeout(async () => {
            setIsSaving(true);
            try {
                await updateNotesMutation.mutateAsync({
                    trainingId,
                    notes,
                });
                // Don't show toast on every auto-save to avoid spam
            } catch (error) {
                toast.error("Nie udało się zapisać notatek");
                console.error("Error updating notes:", error);
            } finally {
                setIsSaving(false);
            }
        }, DEBOUNCE_DELAY);

        return () => clearTimeout(timeoutId);
    }, [notes, trainingId, training.notes, updateNotesMutation]);

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="notes">Notatki osobiste</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Dodaj swoje notatki o tym treningu..."
                    className="min-h-32 w-full"
                    maxLength={2048}
                />
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {notes.length}/2048 znaków
                    </p>
                    {isSaving && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Zapisywanie...
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-end">
                <Button onClick={onComplete}>Dalej</Button>
            </div>
        </div>
    );
}

