"use client";

import { FitUpload } from "@/components/fit-upload";
import { useFitStatus } from "@/hooks/use-laps-queries";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

interface FitUploadStepProps {
    trainingId: string;
    onComplete: () => void;
}

export function FitUploadStep({ trainingId, onComplete }: FitUploadStepProps) {
    const { data: fitStatus, refetch } = useFitStatus(trainingId);

    useEffect(() => {
        // Auto-advance to next step when FIT is processed
        if (fitStatus?.fit_processed) {
            onComplete();
        }
    }, [fitStatus?.fit_processed, onComplete]);

    return (
        <div className="space-y-4">
            <FitUpload
                trainingId={trainingId}
                onUploadSuccess={async () => {
                    // Refetch fit status immediately after upload to get updated data
                    await refetch();
                    // onComplete will be called by useEffect when fit_processed becomes true
                }}
            />
            {fitStatus?.fit_processed && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                        <p className="font-medium text-green-900">Plik FIT został przetworzony</p>
                        <p className="text-sm text-green-700">
                            Punkty GPS: {fitStatus.trackpoints_count.toLocaleString()}, Odcinki:{" "}
                            {fitStatus.laps_count}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

