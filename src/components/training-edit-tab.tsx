"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useGenerateLaps } from "@/hooks/use-laps-mutations";
import { useFitStatus, useLaps } from "@/hooks/use-laps-queries";
import { useUpdateTraining } from "@/hooks/use-training-mutations";
import { cn } from "@/lib/utils";
import { Training } from "@/types/training";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, Clock, Heart, MapPin, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const editFormSchema = z.object({
    heart_rate_zones: z.object({
        zone_1_h: z.string().optional(),
        zone_1_m: z.string().optional(),
        zone_1_s: z.string().optional(),
        zone_2_h: z.string().optional(),
        zone_2_m: z.string().optional(),
        zone_2_s: z.string().optional(),
        zone_3_h: z.string().optional(),
        zone_3_m: z.string().optional(),
        zone_3_s: z.string().optional(),
        zone_4_h: z.string().optional(),
        zone_4_m: z.string().optional(),
        zone_4_s: z.string().optional(),
        zone_5_h: z.string().optional(),
        zone_5_m: z.string().optional(),
        zone_5_s: z.string().optional(),
    }),
    summary: z.string().optional(),
    device: z.string().optional(),
    battery_percent_usage: z.string().optional(),
    effort: z.string().optional(),
});

type EditFormData = z.infer<typeof editFormSchema>;

// Lap interface is imported from the queries hook

interface TrainingEditTabProps {
    training: Training;
}

// Helper function to combine hours, minutes, seconds into a time string
function combineTimeComponents(
    hours: string,
    minutes: string,
    seconds: string,
): string | undefined {
    const h = !hours || hours === "0" ? "00" : hours.padStart(2, "0");
    const m = !minutes || minutes === "0" ? "00" : minutes.padStart(2, "0");
    const s = !seconds || seconds === "0" ? "00" : seconds.padStart(2, "0");
    return `${h}:${m}:${s}`;
}

// Helper function to format seconds to mm:ss
function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Helper function to format distance in meters to km
function formatDistance(meters: number): string {
    return (meters / 1000).toFixed(2);
}

// Helper function to format speed from m/s to km/h
function formatSpeed(speedMs: number | null): string {
    if (speedMs === null) return "N/A";
    return (speedMs * 3.6).toFixed(1);
}

export function TrainingEditTab({ training }: TrainingEditTabProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const updateTrainingMutation = useUpdateTraining();
    const generateLapsMutation = useGenerateLaps();

    // Use TanStack Query hooks for laps data
    const { data: lapsData, isLoading: lapsLoading } = useLaps(training.id);
    const { data: fitStatusData } = useFitStatus(training.id);

    const laps = lapsData?.laps || [];
    const hasTrackpoints = (fitStatusData?.trackpoints_count || 0) > 0;

    const { register, handleSubmit } = useForm<EditFormData>({
        resolver: zodResolver(editFormSchema),
        defaultValues: {
            heart_rate_zones: {
                zone_1_h: training.heart_rate_zones?.zone_1
                    ? training.heart_rate_zones.zone_1.split(":")[0]
                    : "",
                zone_1_m: training.heart_rate_zones?.zone_1
                    ? training.heart_rate_zones.zone_1.split(":")[1]
                    : "",
                zone_1_s: training.heart_rate_zones?.zone_1
                    ? training.heart_rate_zones.zone_1.split(":")[2]
                    : "",
                zone_2_h: training.heart_rate_zones?.zone_2
                    ? training.heart_rate_zones.zone_2.split(":")[0]
                    : "",
                zone_2_m: training.heart_rate_zones?.zone_2
                    ? training.heart_rate_zones.zone_2.split(":")[1]
                    : "",
                zone_2_s: training.heart_rate_zones?.zone_2
                    ? training.heart_rate_zones.zone_2.split(":")[2]
                    : "",
                zone_3_h: training.heart_rate_zones?.zone_3
                    ? training.heart_rate_zones.zone_3.split(":")[0]
                    : "",
                zone_3_m: training.heart_rate_zones?.zone_3
                    ? training.heart_rate_zones.zone_3.split(":")[1]
                    : "",
                zone_3_s: training.heart_rate_zones?.zone_3
                    ? training.heart_rate_zones.zone_3.split(":")[2]
                    : "",
                zone_4_h: training.heart_rate_zones?.zone_4
                    ? training.heart_rate_zones.zone_4.split(":")[0]
                    : "",
                zone_4_m: training.heart_rate_zones?.zone_4
                    ? training.heart_rate_zones.zone_4.split(":")[1]
                    : "",
                zone_4_s: training.heart_rate_zones?.zone_4
                    ? training.heart_rate_zones.zone_4.split(":")[2]
                    : "",
                zone_5_h: training.heart_rate_zones?.zone_5
                    ? training.heart_rate_zones.zone_5.split(":")[0]
                    : "",
                zone_5_m: training.heart_rate_zones?.zone_5
                    ? training.heart_rate_zones.zone_5.split(":")[1]
                    : "",
                zone_5_s: training.heart_rate_zones?.zone_5
                    ? training.heart_rate_zones.zone_5.split(":")[2]
                    : "",
            },
            device: training.device ?? "",
            battery_percent_usage: training.battery_percent_usage?.toString() ?? "",
            effort: training.effort?.toString() ?? "",
        },
    });

    const onSubmit = async (data: EditFormData) => {
        setIsSubmitting(true);
        try {
            const updateData = {
                heart_rate_zones: {
                    zone_1: combineTimeComponents(
                        data.heart_rate_zones.zone_1_h || "",
                        data.heart_rate_zones.zone_1_m || "",
                        data.heart_rate_zones.zone_1_s || "",
                    ),
                    zone_2: combineTimeComponents(
                        data.heart_rate_zones.zone_2_h || "",
                        data.heart_rate_zones.zone_2_m || "",
                        data.heart_rate_zones.zone_2_s || "",
                    ),
                    zone_3: combineTimeComponents(
                        data.heart_rate_zones.zone_3_h || "",
                        data.heart_rate_zones.zone_3_m || "",
                        data.heart_rate_zones.zone_3_s || "",
                    ),
                    zone_4: combineTimeComponents(
                        data.heart_rate_zones.zone_4_h || "",
                        data.heart_rate_zones.zone_4_m || "",
                        data.heart_rate_zones.zone_4_s || "",
                    ),
                    zone_5: combineTimeComponents(
                        data.heart_rate_zones.zone_5_h || "",
                        data.heart_rate_zones.zone_5_m || "",
                        data.heart_rate_zones.zone_5_s || "",
                    ),
                },
                device: data.device || undefined,
                battery_percent_usage: data.battery_percent_usage
                    ? parseInt(data.battery_percent_usage)
                    : undefined,
                effort: data.effort ? parseInt(data.effort) : undefined,
            };

            await updateTrainingMutation.mutateAsync({
                trainingId: training.id,
                data: updateData,
            });

            router.refresh();
            toast.success("Zmiany zostały zapisane");
        } catch (error) {
            console.error("Error updating training:", error);
            toast.error("Nie udało się zapisać zmian");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateLaps = () => {
        if (!hasTrackpoints) {
            toast.error("Brak danych trackpoints do wygenerowania odcinków");
            return;
        }

        generateLapsMutation.mutate({
            trainingId: training.id,
            distance_km: 5,
        });
    };

    return (
        <div className="space-y-8">
            <div className="space-y-6">
                <h3 className="text-xl font-medium">Edytuj szczegóły treningu</h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Heart Rate Zones Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Heart className="h-5 w-5" />
                                    Strefy tętna
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2">
                                    <div className="mb-1 grid grid-cols-12 gap-1">
                                        <div className="col-span-2"></div>
                                        <div className="text-muted-foreground col-span-3 text-center text-xs">
                                            Godz
                                        </div>
                                        <div className="text-muted-foreground col-span-3 text-center text-xs">
                                            Min
                                        </div>
                                        <div className="text-muted-foreground col-span-3 text-center text-xs">
                                            Sek
                                        </div>
                                    </div>
                                    {(["1", "2", "3", "4", "5"] as const).map(zoneNumber => {
                                        const timeValue =
                                            training.heart_rate_zones?.[
                                                `zone_${zoneNumber}` as keyof typeof training.heart_rate_zones
                                            ] ?? "";

                                        let hours = "",
                                            minutes = "",
                                            seconds = "";
                                        if (timeValue) {
                                            const parts = timeValue.split(":");
                                            hours = parts[0] || "";
                                            minutes = parts[1] || "";
                                            seconds = parts[2] || "";
                                        }

                                        return (
                                            <div
                                                key={`zone_${zoneNumber}`}
                                                className="grid grid-cols-10 items-center gap-1"
                                            >
                                                <Label
                                                    htmlFor={`zone_${zoneNumber}_h`}
                                                    className="col-span-2 text-sm font-medium"
                                                >
                                                    Strefa {zoneNumber}
                                                </Label>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        id={`zone_${zoneNumber}_h`}
                                                        className="border-input w-full rounded-md border bg-transparent px-2 py-1 text-center text-sm"
                                                        defaultValue={hours}
                                                        placeholder="00"
                                                        min="0"
                                                        max="23"
                                                        {...register(
                                                            `heart_rate_zones.zone_${zoneNumber}_h`,
                                                        )}
                                                    />
                                                </div>
                                                <div className="col-span-1 text-center">:</div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        id={`zone_${zoneNumber}_m`}
                                                        className="border-input w-full rounded-md border bg-transparent px-2 py-1 text-center text-sm"
                                                        defaultValue={minutes}
                                                        placeholder="00"
                                                        min="0"
                                                        max="59"
                                                        {...register(
                                                            `heart_rate_zones.zone_${zoneNumber}_m`,
                                                        )}
                                                    />
                                                </div>
                                                <div className="col-span-1 text-center">:</div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="number"
                                                        id={`zone_${zoneNumber}_s`}
                                                        className="border-input w-full rounded-md border bg-transparent px-2 py-1 text-center text-sm"
                                                        defaultValue={seconds}
                                                        placeholder="00"
                                                        min="0"
                                                        max="59"
                                                        {...register(
                                                            `heart_rate_zones.zone_${zoneNumber}_s`,
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Effort Level Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5" />
                                    Wysiłek
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <RadioGroup
                                        {...register("effort")}
                                        defaultValue={String(training.effort ?? 1)}
                                        className="grid grid-cols-5 gap-3 md:grid-cols-10"
                                        onValueChange={async value => {
                                            const effortValue = parseInt(value);
                                            try {
                                                await updateTrainingMutation.mutateAsync({
                                                    trainingId: training.id,
                                                    data: { effort: effortValue },
                                                });
                                                router.refresh();
                                                toast.success(
                                                    "Poziom wysiłku został zaktualizowany",
                                                );
                                            } catch (error) {
                                                console.error("Error updating effort:", error);
                                                toast.error(
                                                    "Nie udało się zaktualizować poziomu wysiłku",
                                                );
                                            }
                                        }}
                                    >
                                        {Array.from({ length: 10 }, (_, i) => i + 1).map(value => (
                                            <div
                                                key={value}
                                                className="flex items-center justify-center"
                                            >
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
                                                                value === (training.effort ?? 1),
                                                        },
                                                    )}
                                                >
                                                    {value}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>

                                    <div className="flex items-center justify-between">
                                        <div className="text-muted-foreground flex w-full justify-between px-1 text-xs">
                                            <span>Łatwy</span>
                                            <span>Umiarkowany</span>
                                            <span>Trudny</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
                            </Button>
                        </div>
                    </form>

                    {/* Laps Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Odcinki
                            </CardTitle>
                            <CardDescription>
                                Wyświetlaj i zarządzaj odcinkami treningu
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Generate Laps Button */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Button
                                            onClick={handleGenerateLaps}
                                            disabled={
                                                !hasTrackpoints || generateLapsMutation.isPending
                                            }
                                            variant="outline"
                                        >
                                            {generateLapsMutation.isPending
                                                ? "Generowanie..."
                                                : "Generuj odcinki"}
                                        </Button>
                                        {!hasTrackpoints && (
                                            <Alert>
                                                <AlertDescription>
                                                    Brak danych trackpoints. Wgraj plik FIT, aby
                                                    wygenerować odcinki.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                    <div className="text-muted-foreground text-sm">
                                        Odcinki będą generowane co 5km. Ostatni odcinek będzie
                                        zawierał pozostałą odległość (bez względu na długość).
                                    </div>
                                </div>

                                <Separator />

                                {/* Laps Display */}
                                {lapsLoading ? (
                                    <div className="py-8 text-center">
                                        <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
                                        <p className="text-muted-foreground mt-2 text-sm">
                                            Ładowanie odcinków...
                                        </p>
                                    </div>
                                ) : laps.length > 0 ? (
                                    <div className="space-y-4">
                                        <h4 className="font-medium">
                                            Odcinki treningu ({laps.length})
                                        </h4>
                                        <div className="grid gap-4">
                                            {laps.map(lap => {
                                                return (
                                                    <Card key={lap.id} className="p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary">
                                                                    Odcinek {lap.lap_number}
                                                                </Badge>
                                                                <span className="text-sm font-medium">
                                                                    {formatDistance(lap.distance_m)}{" "}
                                                                    km
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-muted-foreground text-sm">
                                                                    {formatTime(lap.moving_time_s)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                                                            <div className="flex items-center gap-1">
                                                                <Activity className="text-muted-foreground h-4 w-4" />
                                                                <span>
                                                                    Śr. prędkość:{" "}
                                                                    {formatSpeed(lap.avg_speed_ms)}{" "}
                                                                    km/h
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Zap className="text-muted-foreground h-4 w-4" />
                                                                <span>
                                                                    Maks. prędkość:{" "}
                                                                    {formatSpeed(lap.max_speed_ms)}{" "}
                                                                    km/h
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Heart className="text-muted-foreground h-4 w-4" />
                                                                <span>
                                                                    Śr. HR:{" "}
                                                                    {lap.avg_heart_rate_bpm ||
                                                                        "N/A"}{" "}
                                                                    bpm
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="text-muted-foreground h-4 w-4" />
                                                                <span>
                                                                    Maks. HR:{" "}
                                                                    {lap.max_heart_rate_bpm ||
                                                                        "N/A"}{" "}
                                                                    bpm
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground py-8 text-center">
                                        <MapPin className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                        <p>Brak odcinków do wyświetlenia</p>
                                        <p className="mt-1 text-sm">
                                            Wgraj plik FIT lub wygeneruj odcinki, aby zobaczyć
                                            szczegóły
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
