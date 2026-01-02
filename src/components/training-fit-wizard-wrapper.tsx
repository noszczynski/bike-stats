"use client";

import { TrainingFitWizard } from "@/components/training-fit-wizard";
import { TrainingOverview } from "@/components/training-overview";
import { Training } from "@/types/training";
import { useEffect, useState } from "react";

interface TrainingFitWizardWrapperProps {
    training: Training;
    compareTo: "all" | "earlier" | "other";
    allTrainings: Training[];
}

const WIZARD_SKIPPED_KEY = (trainingId: string) => `wizard-skipped-${trainingId}`;

export function TrainingFitWizardWrapper({
    training,
    compareTo,
    allTrainings,
}: TrainingFitWizardWrapperProps) {
    const [showWizard, setShowWizard] = useState(true);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        // Check if wizard was skipped in this session
        if (typeof window !== "undefined") {
            const skipped = sessionStorage.getItem(WIZARD_SKIPPED_KEY(training.id));
            if (skipped === "true") {
                setShowWizard(false);
            }
        }
    }, [training.id]);

    const handleSkipWizard = () => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem(WIZARD_SKIPPED_KEY(training.id), "true");
            setShowWizard(false);
        }
    };

    // Wait for client-side hydration
    if (!isClient) {
        return null;
    }

    // If FIT is processed, always show overview
    if (training.fit_processed) {
        return (
            <TrainingOverview
                training={training}
                compareTo={compareTo}
                allTrainings={allTrainings}
            />
        );
    }

    // If wizard was skipped in this session, show overview
    if (!showWizard) {
        return (
            <TrainingOverview
                training={training}
                compareTo={compareTo}
                allTrainings={allTrainings}
            />
        );
    }

    // Show wizard
    return (
        <TrainingFitWizard
            trainingId={training.id}
            training={training}
            onSkip={handleSkipWizard}
        />
    );
}

