"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import date from "@/lib/date";
import type { StravaRoute } from "@/types/strava";
import { Clock, ExternalLink, Lock, Mountain, Star } from "lucide-react";
import Link from "next/link";

import { RouteBackground } from "./route-background";

interface RouteCardsProps {
    routes: StravaRoute[];
}

interface RouteCardProps {
    route: StravaRoute;
}

const SUB_TYPE_LABELS: Record<number, string> = {
    1: "Szosa",
    2: "MTB",
    3: "Cyclocross",
    4: "Szlak",
    5: "Mieszana",
};

const TYPE_LABELS: Record<number, string> = {
    1: "Rower",
    2: "Bieganie",
};

function RouteCard({ route }: RouteCardProps) {
    const distanceKm = (route.distance / 1000).toFixed(2);
    const elevationGain = Math.round(route.elevation_gain);
    const estimatedTimeMinutes = Math.round(route.estimated_moving_time / 60);
    const estimatedTimeHours = (estimatedTimeMinutes / 60).toFixed(1);

    return (
        <Card className="hover:bg-muted/50 relative h-full overflow-hidden transition-all">
            {route.map?.summary_polyline && (
                <RouteBackground summaryPolyline={route.map.summary_polyline} />
            )}
            <CardHeader className="relative z-10 pb-2">
                <CardTitle className="flex items-center justify-between">
                    <span className="line-clamp-1 text-ellipsis">{route.name}</span>
                    <div className="flex items-center gap-2">
                        {route.starred && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Ulubiona trasa</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {route.private && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Lock className="text-muted-foreground h-5 w-5" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Trasa prywatna</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="space-y-2">
                    {route.description && (
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                            {route.description}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{TYPE_LABELS[route.type] || "Nieznany"}</Badge>
                        <Badge variant="outline">
                            {SUB_TYPE_LABELS[route.sub_type] || "Nieznany"}
                        </Badge>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Dystans:</span>
                        <span className="font-medium">{distanceKm} km</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <Mountain className="h-4 w-4" />
                            Przewyższenie:
                        </span>
                        <span className="font-medium">{elevationGain} m</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Szacowany czas:
                        </span>
                        <span className="font-medium">
                            {estimatedTimeMinutes < 60
                                ? `${estimatedTimeMinutes} min`
                                : `${estimatedTimeHours} h`}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Utworzono:</span>
                        <span className="font-medium">{date(route.created_at).format("LL")}</span>
                    </div>
                    <Link
                        href={`https://www.strava.com/routes/${route.id_str}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary mt-2 flex items-center gap-1 text-sm hover:underline"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Zobacz na Stravie
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export function RouteCards({ routes }: RouteCardsProps) {
    console.log(routes);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {routes.map(route => (
                <RouteCard key={route.id} route={route} />
            ))}
        </div>
    );
}
