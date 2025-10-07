'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DualRangeSlider } from '@/components/ui/dual-range-slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Filter, RotateCcw, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { debounce } from 'lodash';

export interface RouteFiltersState {
    minDistance?: number;
    maxDistance?: number;
    minElevation?: number;
    maxElevation?: number;
    private?: boolean;
    public?: boolean;
    starred?: boolean;
    notStarred?: boolean;
    type?: number; // 1: ride, 2: run
    subType?: number; // 1: road, 2: mtb, 3: cx, 4: trail, 5: mixed
}

interface RouteFiltersProps {
    filters: RouteFiltersState;
    onFiltersChange: (filters: RouteFiltersState) => void;
    onReset: () => void;
}

export function RouteFilters({ filters, onFiltersChange, onReset }: RouteFiltersProps) {
    const [localFilters, setLocalFilters] = useState<RouteFiltersState>(filters);
    const [pendingFilters, setPendingFilters] = useState<RouteFiltersState>(filters);
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        ranges: false,
    });

    // Debounced function to update filters (for sliders)
    const debouncedUpdateFilters = useCallback(
        debounce((newFilters: RouteFiltersState) => {
            onFiltersChange(newFilters);
            setLocalFilters(newFilters);
        }, 800),
        [onFiltersChange]
    );

    // Sync local state with prop changes
    useEffect(() => {
        setLocalFilters(filters);
        setPendingFilters(filters);
    }, [filters]);

    // Immediate update for non-slider filters
    const updateFilterImmediate = (key: keyof RouteFiltersState, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        setPendingFilters(newFilters);
        onFiltersChange(newFilters);
    };

    // Update range filters (min/max pairs) together
    const updateRangeFilter = (
        minKey: keyof RouteFiltersState,
        maxKey: keyof RouteFiltersState,
        values: number[],
        minDefault: number,
        maxDefault: number
    ) => {
        const [min, max] = values;
        const newFilters = {
            ...pendingFilters,
            [minKey]: min > minDefault ? min : undefined,
            [maxKey]: max < maxDefault ? max : undefined
        };
        setPendingFilters(newFilters);
        debouncedUpdateFilters(newFilters);
    };

    const hasActiveFilters = Object.keys(localFilters).some(
        key => localFilters[key as keyof RouteFiltersState] !== undefined
    );

    const hasPendingChanges = JSON.stringify(localFilters) !== JSON.stringify(pendingFilters);

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const applyPendingFilters = () => {
        onFiltersChange(pendingFilters);
        setLocalFilters(pendingFilters);
    };

    return (
        <Card className='w-full'>
            <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-base'>
                    <Filter className='h-4 w-4' />
                    Filtry tras
                    <div className='ml-auto flex gap-2'>
                        {hasPendingChanges && (
                            <Button
                                variant='default'
                                size='sm'
                                onClick={applyPendingFilters}
                                className='h-7 px-3'
                            >
                                <Search className='h-3 w-3 mr-1' />
                                Zastosuj
                            </Button>
                        )}
                        {hasActiveFilters && (
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={onReset}
                                className='h-7 px-2'
                            >
                                <RotateCcw className='h-3 w-3 mr-1' />
                                Resetuj
                            </Button>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-0'>
                {/* Basic Filters */}
                <Collapsible open={expandedSections.basic} onOpenChange={() => toggleSection('basic')}>
                    <CollapsibleTrigger asChild>
                        <Button variant='ghost' className='w-full justify-between p-2 h-8'>
                            <span className='text-sm font-medium'>Podstawowe</span>
                            {expandedSections.basic ? (
                                <ChevronUp className='h-4 w-4' />
                            ) : (
                                <ChevronDown className='h-4 w-4' />
                            )}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className='space-y-3 pt-2'>
                        {/* Type */}
                        <div>
                            <Label className='text-xs text-muted-foreground'>Typ aktywności</Label>
                            <Select
                                value={localFilters.type?.toString() || 'all'}
                                onValueChange={(value) =>
                                    updateFilterImmediate('type', value === 'all' ? undefined : parseInt(value))
                                }
                            >
                                <SelectTrigger className='h-8'>
                                    <SelectValue placeholder='Wszystkie' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all'>Wszystkie</SelectItem>
                                    <SelectItem value='1'>Rower</SelectItem>
                                    <SelectItem value='2'>Bieganie</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sub Type */}
                        <div>
                            <Label className='text-xs text-muted-foreground'>Podtyp</Label>
                            <Select
                                value={localFilters.subType?.toString() || 'all'}
                                onValueChange={(value) =>
                                    updateFilterImmediate('subType', value === 'all' ? undefined : parseInt(value))
                                }
                            >
                                <SelectTrigger className='h-8'>
                                    <SelectValue placeholder='Wszystkie' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all'>Wszystkie</SelectItem>
                                    <SelectItem value='1'>Szosa</SelectItem>
                                    <SelectItem value='2'>MTB</SelectItem>
                                    <SelectItem value='3'>Cyclocross</SelectItem>
                                    <SelectItem value='4'>Szlak</SelectItem>
                                    <SelectItem value='5'>Mieszana</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Privacy */}
                        <div className='space-y-2'>
                            <Label className='text-xs font-medium'>Prywatność</Label>
                            <div className='flex items-center space-x-2'>
                                <Checkbox
                                    id='private'
                                    checked={localFilters.private === true}
                                    onCheckedChange={(checked) =>
                                        updateFilterImmediate('private', checked ? true : undefined)
                                    }
                                />
                                <Label htmlFor='private' className='text-sm'>
                                    Prywatne
                                </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                                <Checkbox
                                    id='public'
                                    checked={localFilters.public === true}
                                    onCheckedChange={(checked) =>
                                        updateFilterImmediate('public', checked ? true : undefined)
                                    }
                                />
                                <Label htmlFor='public' className='text-sm'>
                                    Publiczne
                                </Label>
                            </div>
                        </div>

                        <Separator />

                        {/* Starred */}
                        <div className='space-y-2'>
                            <Label className='text-xs font-medium'>Ulubione</Label>
                            <div className='flex items-center space-x-2'>
                                <Checkbox
                                    id='starred'
                                    checked={localFilters.starred === true}
                                    onCheckedChange={(checked) =>
                                        updateFilterImmediate('starred', checked ? true : undefined)
                                    }
                                />
                                <Label htmlFor='starred' className='text-sm'>
                                    Tylko ulubione
                                </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                                <Checkbox
                                    id='notStarred'
                                    checked={localFilters.notStarred === true}
                                    onCheckedChange={(checked) =>
                                        updateFilterImmediate('notStarred', checked ? true : undefined)
                                    }
                                />
                                <Label htmlFor='notStarred' className='text-sm'>
                                    Tylko nieulubione
                                </Label>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {/* Range Filters */}
                <Collapsible open={expandedSections.ranges} onOpenChange={() => toggleSection('ranges')}>
                    <CollapsibleTrigger asChild>
                        <Button variant='ghost' className='w-full justify-between p-2 h-8'>
                            <span className='text-sm font-medium'>Zakresy wartości</span>
                            {expandedSections.ranges ? (
                                <ChevronUp className='h-4 w-4' />
                            ) : (
                                <ChevronDown className='h-4 w-4' />
                            )}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className='space-y-4 pt-2'>
                        {/* Distance */}
                        <div className='space-y-2'>
                            <Label className='text-xs font-medium'>Dystans (km)</Label>
                            <DualRangeSlider
                                defaultValue={[0, 200]}
                                value={[pendingFilters.minDistance || 0, pendingFilters.maxDistance || 200]}
                                onValueChange={(values: number[]) =>
                                    updateRangeFilter('minDistance', 'maxDistance', values, 0, 200)
                                }
                                max={200}
                                step={5}
                                className='w-full'
                            />
                            <div className='flex justify-between text-xs text-muted-foreground'>
                                <span>{pendingFilters.minDistance || 0}</span>
                                <span>{pendingFilters.maxDistance || 200}</span>
                            </div>
                        </div>

                        {/* Elevation */}
                        <div className='space-y-2'>
                            <Label className='text-xs font-medium'>Przewyższenie (m)</Label>
                            <DualRangeSlider
                                defaultValue={[0, 3000]}
                                value={[pendingFilters.minElevation || 0, pendingFilters.maxElevation || 3000]}
                                onValueChange={(values: number[]) =>
                                    updateRangeFilter('minElevation', 'maxElevation', values, 0, 3000)
                                }
                                max={3000}
                                step={50}
                                className='w-full'
                            />
                            <div className='flex justify-between text-xs text-muted-foreground'>
                                <span>{pendingFilters.minElevation || 0}</span>
                                <span>{pendingFilters.maxElevation || 3000}</span>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardContent>
        </Card>
    );
}

