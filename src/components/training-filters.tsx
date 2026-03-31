"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TrainingFilters } from "@/lib/api/trainings";
import { debounce } from "lodash";
import { Filter } from "lucide-react";

interface TrainingFiltersProps {
    filters: TrainingFilters;
    onFiltersChange: (filters: TrainingFilters) => void;
}

export function TrainingFiltersComponent({ filters, onFiltersChange }: TrainingFiltersProps) {
    const [draftFilters, setDraftFilters] = useState<TrainingFilters>({ ...filters });
    const [isDateDirty, setIsDateDirty] = useState(false);

    // Debounced function to update filters (for sliders and inputs)
    const debouncedUpdateFilters = useCallback(
        debounce((newFilters: TrainingFilters) => {
            onFiltersChange(newFilters);
        }, 600), // 600ms delay
        [onFiltersChange],
    );

    // Sync local state with prop changes
    useEffect(() => {
        setDraftFilters(filters);
        setIsDateDirty(false);
    }, [filters]);

    useEffect(() => {
        return () => {
            debouncedUpdateFilters.cancel();
        };
    }, [debouncedUpdateFilters]);

    const normalizeDateRange = useCallback((nextFilters: TrainingFilters) => {
        if (nextFilters.startDate && nextFilters.endDate) {
            const start = dayjs(nextFilters.startDate);
            const end = dayjs(nextFilters.endDate);
            if (start.isAfter(end)) {
                return {
                    ...nextFilters,
                    startDate: nextFilters.endDate,
                    endDate: nextFilters.startDate,
                };
            }
        }
        return nextFilters;
    }, []);

    // Immediate update for non-slider filters (selects, checkboxes)
    const updateFilterImmediate = (key: keyof TrainingFilters, value: any) => {
        const newFilters = normalizeDateRange({ ...draftFilters, [key]: value });
        setDraftFilters(newFilters);
        setIsDateDirty(false);
        onFiltersChange(newFilters);
    };

    const updateDraftFilter = (key: keyof TrainingFilters, value: any) => {
        const newFilters = { ...draftFilters, [key]: value };
        setDraftFilters(newFilters);
        setIsDateDirty(true);
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
            ...draftFilters,
            [minKey]: min > minDefault ? min : undefined,
            [maxKey]: max < maxDefault ? max : undefined,
        };
        setDraftFilters(newFilters);
        debouncedUpdateFilters(newFilters);
    };

    const applyDateFilters = () => {
        const normalized = normalizeDateRange(draftFilters);
        setDraftFilters(normalized);
        setIsDateDirty(false);
        onFiltersChange(normalized);
    };

    const clearDateFilters = () => {
        const newFilters = { ...draftFilters, startDate: undefined, endDate: undefined };
        setDraftFilters(newFilters);
        setIsDateDirty(false);
        onFiltersChange(newFilters);
    };

    const datePresets = useMemo(
        () => [
            {
                id: "7d",
                label: "Ostatnie 7 dni",
                range: () => ({
                    startDate: dayjs().subtract(6, "day").format("YYYY-MM-DD"),
                    endDate: dayjs().format("YYYY-MM-DD"),
                }),
            },
            {
                id: "30d",
                label: "Ostatnie 30 dni",
                range: () => ({
                    startDate: dayjs().subtract(29, "day").format("YYYY-MM-DD"),
                    endDate: dayjs().format("YYYY-MM-DD"),
                }),
            },
            {
                id: "90d",
                label: "Ostatnie 90 dni",
                range: () => ({
                    startDate: dayjs().subtract(89, "day").format("YYYY-MM-DD"),
                    endDate: dayjs().format("YYYY-MM-DD"),
                }),
            },
            {
                id: "ytd",
                label: "Od początku roku",
                range: () => ({
                    startDate: dayjs().startOf("year").format("YYYY-MM-DD"),
                    endDate: dayjs().format("YYYY-MM-DD"),
                }),
            },
            {
                id: "12m",
                label: "Ostatnie 12 mies.",
                range: () => ({
                    startDate: dayjs().subtract(12, "month").format("YYYY-MM-DD"),
                    endDate: dayjs().format("YYYY-MM-DD"),
                }),
            },
        ],
        [],
    );

    const applyDatePreset = (startDate?: string, endDate?: string) => {
        const newFilters = normalizeDateRange({ ...draftFilters, startDate, endDate });
        setDraftFilters(newFilters);
        setIsDateDirty(false);
        onFiltersChange(newFilters);
    };

    return (
        <Card className="w-full">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="filters" className="border-b-0">
                    <CardHeader className="pb-3">
                        <AccordionTrigger className="py-0 hover:no-underline">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Filter className="h-4 w-4" />
                                Filtry jazd
                            </CardTitle>
                        </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                        <CardContent className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* Activity Type */}
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Typ aktywności</Label>
                    <Select
                        value={draftFilters.type || "all"}
                        onValueChange={value =>
                            updateFilterImmediate("type", value === "all" ? undefined : value)
                        }
                    >
                        <SelectTrigger className="h-8 w-[180px]">
                            <SelectValue placeholder="Wszystkie typy" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Wszystkie typy</SelectItem>
                            <SelectItem value="ride">Jazda</SelectItem>
                            <SelectItem value="virtual_ride">Jazda wirtualna</SelectItem>
                            <SelectItem value="gravel_ride">Gravel</SelectItem>
                            <SelectItem value="mountain_bike_ride">MTB</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-full space-y-3">
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <Label className="text-muted-foreground text-xs">Od</Label>
                            <Input
                                type="date"
                                value={draftFilters.startDate || ""}
                                onChange={e =>
                                    updateDraftFilter("startDate", e.target.value || undefined)
                                }
                                onKeyDown={e => {
                                    if (e.key === "Enter") {
                                        applyDateFilters();
                                    }
                                }}
                                className="h-9 min-w-[160px]"
                            />
                        </div>

                        <div>
                            <Label className="text-muted-foreground text-xs">Do</Label>
                            <Input
                                type="date"
                                value={draftFilters.endDate || ""}
                                onChange={e => updateDraftFilter("endDate", e.target.value || undefined)}
                                onKeyDown={e => {
                                    if (e.key === "Enter") {
                                        applyDateFilters();
                                    }
                                }}
                                className="h-9 min-w-[160px]"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={applyDateFilters}
                                disabled={!isDateDirty}
                            >
                                Zastosuj daty
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={clearDateFilters}
                            >
                                Wyczyść daty
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground text-xs">Presety:</span>
                        {datePresets.map(preset => (
                            <Button
                                key={preset.id}
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const range = preset.range();
                                    applyDatePreset(range.startDate, range.endDate);
                                }}
                            >
                                {preset.label}
                            </Button>
                        ))}
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => applyDatePreset(undefined, undefined)}
                        >
                            Wszystko
                        </Button>
                    </div>
                </div>

                {/* Distance */}
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Dystans (km)</Label>
                    <DualRangeSlider
                        defaultValue={[0, 200]}
                        value={[draftFilters.minDistance || 0, draftFilters.maxDistance || 200]}
                        onValueChange={(values: number[]) =>
                            updateRangeFilter("minDistance", "maxDistance", values, 0, 200)
                        }
                        max={200}
                        step={5}
                        className="w-full"
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{draftFilters.minDistance || 0}</span>
                        <span>{draftFilters.maxDistance || 200}</span>
                    </div>
                </div>

                {/* Heart Rate */}
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Tętno (bpm)</Label>
                    <DualRangeSlider
                        defaultValue={[80, 200]}
                        value={[
                            draftFilters.minHeartRate || 80,
                            draftFilters.maxHeartRate || 200,
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
                        <span>{draftFilters.minHeartRate || 80}</span>
                        <span>{draftFilters.maxHeartRate || 200}</span>
                    </div>
                </div>

                {/* Speed */}
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Prędkość (km/h)</Label>
                    <DualRangeSlider
                        defaultValue={[10, 50]}
                        value={[draftFilters.minSpeed || 10, draftFilters.maxSpeed || 50]}
                        onValueChange={(values: number[]) =>
                            updateRangeFilter("minSpeed", "maxSpeed", values, 10, 50)
                        }
                        min={10}
                        max={50}
                        step={1}
                        className="w-full"
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{draftFilters.minSpeed || 10}</span>
                        <span>{draftFilters.maxSpeed || 50}</span>
                    </div>
                </div>

                {/* Elevation */}
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Przewyższenie (m)</Label>
                    <DualRangeSlider
                        defaultValue={[0, 2000]}
                        value={[
                            draftFilters.minElevation || 0,
                            draftFilters.maxElevation || 2000,
                        ]}
                        onValueChange={(values: number[]) =>
                            updateRangeFilter("minElevation", "maxElevation", values, 0, 2000)
                        }
                        max={2000}
                        step={50}
                        className="w-full"
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{draftFilters.minElevation || 0}</span>
                        <span>{draftFilters.maxElevation || 2000}</span>
                    </div>
                </div>

                {/* Time - full width */}
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Czas jazdy (minuty)</Label>
                    <DualRangeSlider
                        defaultValue={[0, 300]}
                        value={[draftFilters.minTime || 0, draftFilters.maxTime || 300]}
                        onValueChange={(values: number[]) =>
                            updateRangeFilter("minTime", "maxTime", values, 0, 300)
                        }
                        max={300}
                        step={15}
                        className="w-full"
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{draftFilters.minTime || 0} min</span>
                        <span>{draftFilters.maxTime || 300} min</span>
                    </div>
                </div>

                            <div className="flex w-64 items-center space-x-2">
                                <Checkbox
                                    id="hasFitData"
                                    checked={draftFilters.hasFitData === true}
                                    onCheckedChange={checked =>
                                        updateFilterImmediate("hasFitData", checked ? true : undefined)
                                    }
                                />
                                <Label htmlFor="hasFitData" className="text-sm">
                                    Tylko z przetworzonym plikiem FIT
                                </Label>
                            </div>
                        </CardContent>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}
