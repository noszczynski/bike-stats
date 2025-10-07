"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useImportTraining } from "@/hooks/use-training-mutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

// Define the schema
const formSchema = z.object({
    heart_rate_zones_zone_1: z.string().min(0),
    heart_rate_zones_zone_2: z.string().min(0),
    heart_rate_zones_zone_3: z.string().min(0),
    heart_rate_zones_zone_4: z.string().min(0),
    heart_rate_zones_zone_5: z.string().min(0),
    summary: z.string().min(0),
    device: z.string().min(0),
    battery_percent_usage: z.string().min(0),
    effort: z.string().refine(val => !val || (parseInt(val) >= 1 && parseInt(val) <= 10), {
        message: "Effort must be between 1 and 10",
    }),
});

type FormData = z.infer<typeof formSchema>;

interface ImportTrainingDialogProps {
    trainingId: number;
    onImportSuccess?: () => void;
}

export function ImportTrainingDialog({ trainingId, onImportSuccess }: ImportTrainingDialogProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const importTrainingMutation = useImportTraining();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            heart_rate_zones_zone_1: "",
            heart_rate_zones_zone_2: "",
            heart_rate_zones_zone_3: "",
            heart_rate_zones_zone_4: "",
            heart_rate_zones_zone_5: "",
            summary: "",
            device: "",
            battery_percent_usage: "",
            effort: "",
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            // Transform the data to match the API expectations
            const transformedData = {
                strava_activity_id: trainingId,
                heart_rate_zones: {
                    zone_1: data.heart_rate_zones_zone_1 || undefined,
                    zone_2: data.heart_rate_zones_zone_2 || undefined,
                    zone_3: data.heart_rate_zones_zone_3 || undefined,
                    zone_4: data.heart_rate_zones_zone_4 || undefined,
                    zone_5: data.heart_rate_zones_zone_5 || undefined,
                },
                summary: data.summary || undefined,
                device: data.device || undefined,
                battery_percent_usage: data.battery_percent_usage
                    ? parseInt(data.battery_percent_usage)
                    : undefined,
                effort: data.effort ? parseInt(data.effort) : undefined,
            };

            await importTrainingMutation.mutateAsync(transformedData);

            setOpen(false);
            onImportSuccess?.();
            router.refresh();
        } catch (error) {
            // Handle error
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="link" size="sm" className="text-primary ml-2 !h-fit !p-0">
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Training Data</DialogTitle>
                    <DialogDescription>
                        Add additional data for this training session.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Heart Rate Zones (hh:mm:ss)</Label>
                                {[1, 2, 3, 4, 5].map(zoneNumber => {
                                    const fieldName = `heart_rate_zones_zone_${zoneNumber}` as
                                        | "heart_rate_zones_zone_1"
                                        | "heart_rate_zones_zone_2"
                                        | "heart_rate_zones_zone_3"
                                        | "heart_rate_zones_zone_4"
                                        | "heart_rate_zones_zone_5";

                                    return (
                                        <div
                                            key={`zone_${zoneNumber}`}
                                            className="grid grid-cols-2 items-center gap-4"
                                        >
                                            <Label htmlFor={`zone_${zoneNumber}`}>
                                                Zone {zoneNumber}
                                            </Label>
                                            <Controller
                                                name={fieldName}
                                                control={form.control}
                                                render={({ field, fieldState }) => (
                                                    <div>
                                                        <Input
                                                            id={`zone_${zoneNumber}`}
                                                            placeholder="00:00:00"
                                                            pattern="^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$"
                                                            {...field}
                                                        />
                                                        {fieldState.error && (
                                                            <p className="mt-1 text-sm text-red-500">
                                                                {fieldState.error.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="summary">Summary</Label>
                                <Controller
                                    name="summary"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <div>
                                            <Input id="summary" {...field} />
                                            {fieldState.error && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {fieldState.error.message}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="device">Device</Label>
                                <Controller
                                    name="device"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <div>
                                            <Input id="device" {...field} />
                                            {fieldState.error && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {fieldState.error.message}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="battery">Battery Usage (%)</Label>
                                <Controller
                                    name="battery_percent_usage"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <div>
                                            <Input
                                                id="battery"
                                                type="number"
                                                min="0"
                                                max="100"
                                                {...field}
                                            />
                                            {fieldState.error && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {fieldState.error.message}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="effort">Effort (1-10)</Label>
                                <Controller
                                    name="effort"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <div>
                                            <Input
                                                id="effort"
                                                type="number"
                                                min="1"
                                                max="10"
                                                {...field}
                                            />
                                            {fieldState.error && (
                                                <p className="mt-1 text-sm text-red-500">
                                                    {fieldState.error.message}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={importTrainingMutation.isPending}>
                                {importTrainingMutation.isPending ? "Importing..." : "Import"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
