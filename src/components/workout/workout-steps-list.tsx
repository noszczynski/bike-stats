"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZwoStep } from "@/lib/zwo/types";

type WorkoutStepsListProps = {
    steps: ZwoStep[];
};

function describeStep(step: ZwoStep): string {
    switch (step.type) {
        case "Warmup":
        case "Cooldown":
        case "Ramp":
            return `${step.Duration}s • ${step.PowerLow.toFixed(2)} -> ${step.PowerHigh.toFixed(2)} FTP`;
        case "SteadyState":
            return `${step.Duration}s • ${step.Power.toFixed(2)} FTP`;
        case "IntervalsT":
            return `${step.Repeat}x (${step.OnDuration}s / ${step.OffDuration}s) • ${step.OnPower.toFixed(2)} / ${step.OffPower.toFixed(2)} FTP`;
        case "TextEvent":
            return `${step.timeoffset}s • ${step.message}`;
        default:
            return "";
    }
}

export function WorkoutStepsList({ steps }: WorkoutStepsListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Struktura treningu</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {steps.map((step, index) => (
                        <div
                            key={`${step.type}-${index}`}
                            className="flex flex-col gap-1 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                        >
                            <div>
                                <p className="font-medium">
                                    {index + 1}. {step.type}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    {describeStep(step)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
