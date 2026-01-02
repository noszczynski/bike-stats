"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Training } from "@/types/training";
import { CheckCircle2, Circle, X } from "lucide-react";

import { EffortStep } from "./training-fit-wizard/effort-step";
import { FitUploadStep } from "./training-fit-wizard/fit-upload-step";
import { LapsValidationStep } from "./training-fit-wizard/laps-validation-step";
import { NotesStep } from "./training-fit-wizard/notes-step";
import { SummaryGenerationStep } from "./training-fit-wizard/summary-generation-step";

interface TrainingFitWizardProps {
    trainingId: string;
    training: Training;
    onSkip?: () => void;
}

const STEPS = [
    { id: 1, title: "Import pliku FIT", description: "Prześlij plik .FIT" },
    { id: 2, title: "Poziom wysiłku", description: "Określ effort (1-10)" },
    { id: 3, title: "Walidacja odcinków", description: "Sprawdź i zaakceptuj odcinki" },
    { id: 4, title: "Notatka osobista", description: "Dodaj swoje notatki" },
    { id: 5, title: "Podsumowanie AI", description: "Generowanie podsumowania" },
] as const;

export function TrainingFitWizard({ trainingId, training, onSkip }: TrainingFitWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

    const handleStepComplete = (step: number) => {
        setCompletedSteps(prev => new Set(prev).add(step));
        if (step < STEPS.length) {
            setCurrentStep(step + 1);
        }
    };

    const handleStepChange = (step: number) => {
        // Allow going back only to completed steps
        if (completedSteps.has(step) || step < currentStep) {
            setCurrentStep(step);
        }
    };

    const progress = (currentStep / STEPS.length) * 100;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Import i konfiguracja treningu</h1>
                    <p className="text-muted-foreground">
                        {training.name} - {new Date(training.date).toLocaleDateString("pl-PL")}
                    </p>
                </div>
                {onSkip && (
                    <Button variant="ghost" size="sm" onClick={onSkip} className="gap-2">
                        <X className="h-4 w-4" />
                        Pomiń formularz
                    </Button>
                )}
            </div>

            {/* Stepper */}
            <Card>
                <CardHeader>
                    <CardTitle>Postęp</CardTitle>
                    <CardDescription>
                        Krok {currentStep} z {STEPS.length}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Progress value={progress} className="w-full" />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        {STEPS.map((step, index) => {
                            const isCompleted = completedSteps.has(step.id);
                            const isCurrent = currentStep === step.id;
                            const isAccessible = isCompleted || step.id <= currentStep;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => handleStepChange(step.id)}
                                    disabled={!isAccessible}
                                    className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all ${
                                        isCurrent
                                            ? "border-primary bg-primary/5"
                                            : isCompleted
                                              ? "border-green-500 bg-green-50"
                                              : isAccessible
                                                ? "border-border hover:bg-accent"
                                                : "border-border cursor-not-allowed opacity-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {isCompleted ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <Circle
                                                className={`h-5 w-5 ${
                                                    isCurrent
                                                        ? "text-primary"
                                                        : "text-muted-foreground"
                                                }`}
                                            />
                                        )}
                                        <span
                                            className={`text-sm font-medium ${
                                                isCurrent ? "text-primary" : "text-muted-foreground"
                                            }`}
                                        >
                                            Krok {step.id}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold">{step.title}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {step.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Step Content */}
            <Card>
                <CardHeader>
                    <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                    <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
                </CardHeader>
                <CardContent>
                    {currentStep === 1 && (
                        <FitUploadStep
                            trainingId={trainingId}
                            onComplete={() => handleStepComplete(1)}
                        />
                    )}
                    {currentStep === 2 && (
                        <EffortStep
                            trainingId={trainingId}
                            training={training}
                            onComplete={() => handleStepComplete(2)}
                        />
                    )}
                    {currentStep === 3 && (
                        <LapsValidationStep
                            trainingId={trainingId}
                            onComplete={() => handleStepComplete(3)}
                        />
                    )}
                    {currentStep === 4 && (
                        <NotesStep
                            trainingId={trainingId}
                            training={training}
                            onComplete={() => handleStepComplete(4)}
                        />
                    )}
                    {currentStep === 5 && (
                        <SummaryGenerationStep trainingId={trainingId} training={training} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
