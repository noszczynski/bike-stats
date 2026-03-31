"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import date from "@/lib/date";
import type { Training } from "@/types/training";
import { Clipboard, FileIcon, HeartPulseIcon, ZapIcon } from "lucide-react";
import Link from "next/link";

import { RouteBackground } from "./route-background";

const activityTypeLabels: Record<Training["type"], string> = {
    ride: "Jazda",
    virtual_ride: "Jazda wirtualna",
    gravel_ride: "Gravel",
    mountain_bike_ride: "MTB",
};

function getEffortColor(effort: number): string {
    if (effort <= 3) return "bg-green-500";
    if (effort <= 6) return "bg-yellow-500";
    if (effort <= 8) return "bg-orange-500";
    return "bg-red-500";
}

function getEffortLabel(effort: number): string {
    if (effort <= 3) return "Easy";
    if (effort <= 6) return "Medium";
    if (effort <= 8) return "Hard";
    return "All Out";
}

interface TrainingCardsProps {
    trainings: Training[];
}

interface TrainingCardProps {
    training: Training;
}

function TrainingCard({ training }: TrainingCardProps) {
    return (
        <div>
            <Link href={`/rides/${training.id}`}>
                <Card className="hover:bg-muted/50 relative h-full overflow-hidden transition-all">
                    {training.map?.summary_polyline && (
                        <RouteBackground summaryPolyline={training.map.summary_polyline} />
                    )}
                    <CardHeader className="relative z-10 pb-2">
                        <div className="mb-2">
                            <Badge variant="outline" className="text-xs">
                                {activityTypeLabels[training.type]}
                            </Badge>
                        </div>
                        <CardTitle className="flex items-center justify-between">
                            <span className="line-clamp-1 text-ellipsis">{training.name}</span>
                            <div className="flex items-center gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <HeartPulseIcon
                                                className={`h-5 w-5 ${training.heart_rate_zones ? "text-green-500" : "text-red-500"}`}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Strefy tętna:{" "}
                                                {training.heart_rate_zones ? "Uzupełnione" : "Brak"}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Clipboard
                                                className={`h-5 w-5 ${training.summary ? "text-green-500" : "text-red-500"}`}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Podsumowanie:{" "}
                                                {training.summary ? "Uzupełnione" : "Brak"}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <ZapIcon
                                                className={`h-5 w-5 ${training.effort ? "text-green-500" : "text-red-500"}`}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Effort: {training.effort ? "Uzupełniony" : "Brak"}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <FileIcon
                                                className={`h-5 w-5 ${training.fit_processed ? "text-green-500" : "text-red-500"}`}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                Plik FIT:{" "}
                                                {training.fit_processed ? "Przetworzony" : "Brak"}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Data:</span>
                                <span className="font-medium">
                                    {date(training.date).format("LL")}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Dystans:</span>
                                <span className="font-medium">
                                    {training.distance_km.toFixed(2)} km
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Czas jazdy:</span>
                                <span className="font-medium">{training.moving_time}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Średnia prędkość:</span>
                                <span className="font-medium">
                                    {training.avg_speed_kmh.toFixed(1)} km/h
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Przewyższenie:</span>
                                <span className="font-medium">
                                    {training.elevation_gain_m.toFixed(0)} m
                                </span>
                            </div>
                            {training.effort && (
                                <div className="space-y-1 pt-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground text-xs">Effort:</span>
                                        <span className="text-xs font-medium">
                                            {training.effort}/10 {getEffortLabel(training.effort)}
                                        </span>
                                    </div>
                                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
                                        <div
                                            className={`h-full flex-1 transition-all ${getEffortColor(training.effort)}`}
                                            style={{
                                                width: `${(training.effort / 10) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
    );
}

export function TrainingCards({ trainings }: TrainingCardsProps) {
    return (
        <>
            {trainings.map(training => (
                <TrainingCard key={training.id} training={training} />
            ))}
        </>
    );
}
