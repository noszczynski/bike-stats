"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useGenerateLaps } from "@/hooks/use-laps-mutations";
import { useLaps } from "@/hooks/use-laps-queries";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LapsValidationStepProps {
    trainingId: string;
    onComplete: () => void;
}

function formatDistance(meters: number): string {
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
}

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function LapsValidationStep({ trainingId, onComplete }: LapsValidationStepProps) {
    const { data: lapsData, isLoading } = useLaps(trainingId);
    const generateLapsMutation = useGenerateLaps();
    const [distanceKm, setDistanceKm] = useState("5");
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasAccepted, setHasAccepted] = useState(false);

    const laps = lapsData?.laps || [];
    const hasLaps = laps.length > 0;

    const handleGenerate = async () => {
        const distance = parseFloat(distanceKm);
        if (isNaN(distance) || distance < 0.1 || distance > 50) {
            toast.error("Dystans musi być między 0.1 a 50 km");
            return;
        }

        setIsGenerating(true);
        try {
            await generateLapsMutation.mutateAsync({
                trainingId,
                distance_km: distance,
            });
            setHasAccepted(false);
        } catch (error) {
            console.error("Error generating laps:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAccept = () => {
        setHasAccepted(true);
        onComplete();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {!hasLaps ? (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="distance">Dystans odcinka (km)</Label>
                        <Input
                            id="distance"
                            type="number"
                            min="0.1"
                            max="50"
                            step="0.1"
                            value={distanceKm}
                            onChange={e => setDistanceKm(e.target.value)}
                            placeholder="5"
                        />
                        <p className="text-sm text-muted-foreground">
                            Odcinki będą generowane na podstawie tego dystansu
                        </p>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generowanie...
                            </>
                        ) : (
                            "Generuj odcinki"
                        )}
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Wygenerowane odcinki ({laps.length})
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Sprawdź odcinki i zaakceptuj lub wygeneruj ponownie
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {laps.map(lap => (
                            <Card key={lap.id} className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Odcinek {lap.lap_number}</Badge>
                                        <span className="text-sm font-medium">
                                            {formatDistance(lap.distance_m)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-muted-foreground">
                                            {formatTime(lap.moving_time_s)}
                                        </div>
                                        {lap.avg_speed_ms && (
                                            <div className="text-xs text-muted-foreground">
                                                {(lap.avg_speed_ms * 3.6).toFixed(1)} km/h
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                        <div className="space-y-2">
                            <Label htmlFor="regenerate-distance">Nowy dystans odcinka (km)</Label>
                            <Input
                                id="regenerate-distance"
                                type="number"
                                min="0.1"
                                max="50"
                                step="0.1"
                                value={distanceKm}
                                onChange={e => setDistanceKm(e.target.value)}
                                placeholder="5"
                                className="w-full sm:w-48"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                variant="outline"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generowanie...
                                    </>
                                ) : (
                                    "Generuj ponownie"
                                )}
                            </Button>
                            <Button onClick={handleAccept} disabled={hasAccepted}>
                                OK
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

