"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrainingFilters } from "@/lib/api/trainings";
import { debounce } from "lodash";
import { Filter } from "lucide-react";

interface TrainingFiltersProps {
    filters: TrainingFilters;
    onFiltersChange: (filters: TrainingFilters) => void;
}

export function TrainingFiltersComponent({ filters, onFiltersChange }: TrainingFiltersProps) {
    const [localFilters, setLocalFilters] = useState<TrainingFilters>({ ...filters });
    const [pendingFilters, setPendingFilters] = useState<TrainingFilters>({ ...filters });

    // Debounced function to update filters (for sliders and inputs)
    const debouncedUpdateFilters = useCallback(
        debounce((newFilters: TrainingFilters) => {
            onFiltersChange(newFilters);
            setLocalFilters(newFilters);
        }, 800), // 800ms delay
        [onFiltersChange],
    );

    // Sync local state with prop changes
    useEffect(() => {
        setLocalFilters(filters);
        setPendingFilters(filters);
    }, [filters]);

    // Immediate update for non-slider filters (dates, tags, checkboxes)
    const updateFilterImmediate = (key: keyof TrainingFilters, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        setPendingFilters(newFilters);
        onFiltersChange(newFilters);
    };

    // Update range filters (min/max pairs) together
    const updateRangeFilter = (
        minKey: keyof TrainingFilters,
        maxKey: keyof TrainingFilters,
        values: number[],
        minDefault: number,
        maxDefault: number,
    ) => {
        const [min, max] = values;
        const newFilters = {
            ...pendingFilters,
            [minKey]: min > minDefault ? min : undefined,
            [maxKey]: max < maxDefault ? max : undefined,
        };
        setPendingFilters(newFilters);
        debouncedUpdateFilters(newFilters);
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Filter className="h-4 w-4" />
                    Filtry treningów
                </CardTitle>
            </CardHeader>

            <CardContent className="flex w-full flex-row flex-wrap gap-4 space-y-4">
                <div>
                    <Label className="text-muted-foreground text-xs">Od</Label>
                    <Input
                        type="date"
                        value={localFilters.startDate || ""}
                        onChange={e => {
                            console.log("e.target.value", e.target.value);
                            updateFilterImmediate("startDate", e.target.value || undefined);
                        }}
                        className="h-8"
                    />
                </div>

                <div>
                    <Label className="text-muted-foreground text-xs">Do</Label>
                    <Input
                        type="date"
                        value={localFilters.endDate || ""}
                        onChange={e => {
                            updateFilterImmediate("endDate", e.target.value || undefined);
                        }}
                        className="h-8"
                    />
                </div>

                {/* Distance */}
                <div className="w-32 space-y-2">
                    <Label className="text-xs font-medium">Dystans (km)</Label>
                    <DualRangeSlider
                        defaultValue={[0, 200]}
                        value={[pendingFilters.minDistance || 0, pendingFilters.maxDistance || 200]}
                        onValueChange={(values: number[]) =>
                            updateRangeFilter("minDistance", "maxDistance", values, 0, 200)
                        }
                        max={200}
                        step={5}
                        className="w-full"
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{pendingFilters.minDistance || 0}</span>
                        <span>{pendingFilters.maxDistance || 200}</span>
                    </div>
                </div>

                {/* Heart Rate */}
                <div className="w-32 space-y-2">
                    <Label className="text-xs font-medium">Tętno (bpm)</Label>
                    <DualRangeSlider
                        defaultValue={[80, 200]}
                        value={[
                            pendingFilters.minHeartRate || 80,
                            pendingFilters.maxHeartRate || 200,
                        ]}
                        onValueChange={(values: number[]) =>
                            updateRangeFilter("minHeartRate", "maxHeartRate", values, 80, 200)
                        }
                        min={80}
                        max={200}
                        step={5}
                        className="w-full"
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{pendingFilters.minHeartRate || 80}</span>
                        <span>{pendingFilters.maxHeartRate || 200}</span>
                    </div>
                </div>

                {/* Speed */}
                <div className="w-32 space-y-2">
                    <Label className="text-xs font-medium">Prędkość (km/h)</Label>
                    <DualRangeSlider
                        defaultValue={[10, 50]}
                        value={[pendingFilters.minSpeed || 10, pendingFilters.maxSpeed || 50]}
                        onValueChange={(values: number[]) =>
                            updateRangeFilter("minSpeed", "maxSpeed", values, 10, 50)
                        }
                        min={10}
                        max={50}
                        step={1}
                        className="w-full"
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{pendingFilters.minSpeed || 10}</span>
                        <span>{pendingFilters.maxSpeed || 50}</span>
                    </div>
                </div>

                {/* Elevation */}
                <div className="w-32 space-y-2">
                    <Label className="text-xs font-medium">Przewyższenie (m)</Label>
                    <DualRangeSlider
                        defaultValue={[0, 2000]}
                        value={[
                            pendingFilters.minElevation || 0,
                            pendingFilters.maxElevation || 2000,
                        ]}
                        onValueChange={(values: number[]) =>
                            updateRangeFilter("minElevation", "maxElevation", values, 0, 2000)
                        }
                        max={2000}
                        step={50}
                        className="w-full"
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{pendingFilters.minElevation || 0}</span>
                        <span>{pendingFilters.maxElevation || 2000}</span>
                    </div>
                </div>

                {/* Time - full width */}
                <div className="w-32 space-y-2">
                    <Label className="text-xs font-medium">Czas jazdy (minuty)</Label>
                    <DualRangeSlider
                        defaultValue={[0, 300]}
                        value={[pendingFilters.minTime || 0, pendingFilters.maxTime || 300]}
                        onValueChange={(values: number[]) =>
                            updateRangeFilter("minTime", "maxTime", values, 0, 300)
                        }
                        max={300}
                        step={15}
                        className="w-full"
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{pendingFilters.minTime || 0} min</span>
                        <span>{pendingFilters.maxTime || 300} min</span>
                    </div>
                </div>

                <div className="flex w-64 items-center space-x-2">
                    <Checkbox
                        id="hasFitData"
                        checked={localFilters.hasFitData === true}
                        onCheckedChange={checked =>
                            updateFilterImmediate("hasFitData", checked ? true : undefined)
                        }
                    />
                    <Label htmlFor="hasFitData" className="text-sm">
                        Tylko z przetworzonym plikiem FIT
                    </Label>
                </div>
            </CardContent>
        </Card>
    );
}
