'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DualRangeSlider } from '@/components/ui/dual-range-slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { X, Filter, RotateCcw, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { TrainingFilters } from '@/lib/api/trainings';
import { useGetAllTags } from '@/hooks/use-tags-queries';
import { debounce } from 'lodash';

interface TrainingFiltersProps {
  filters: TrainingFilters;
  onFiltersChange: (filters: TrainingFilters) => void;
  onReset: () => void;
}

export function TrainingFiltersComponent({ filters, onFiltersChange, onReset }: TrainingFiltersProps) {
  const { data: allTags = [] } = useGetAllTags();
  const [localFilters, setLocalFilters] = useState<TrainingFilters>(filters);
  const [pendingFilters, setPendingFilters] = useState<TrainingFilters>(filters);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    ranges: false,
    data: false,
  });

  // Debounced function to update filters (for sliders and inputs)
  const debouncedUpdateFilters = useCallback(
    debounce((newFilters: TrainingFilters) => {
      onFiltersChange(newFilters);
      setLocalFilters(newFilters);
    }, 800), // 800ms delay
    [onFiltersChange]
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

  // Debounced update for slider filters
  const updateFilterDebounced = (key: keyof TrainingFilters, value: any) => {
    const newFilters = { ...pendingFilters, [key]: value };
    setPendingFilters(newFilters);
    debouncedUpdateFilters(newFilters);
  };

  // Update range filters (min/max pairs) together
  const updateRangeFilter = (minKey: keyof TrainingFilters, maxKey: keyof TrainingFilters, values: number[], minDefault: number, maxDefault: number) => {
    const [min, max] = values;
    const newFilters = { 
      ...pendingFilters, 
      [minKey]: min > minDefault ? min : undefined,
      [maxKey]: max < maxDefault ? max : undefined
    };
    setPendingFilters(newFilters);
    debouncedUpdateFilters(newFilters);
  };

  const removeTag = (tagIdToRemove: string) => {
    const currentTags = localFilters.tagIds || [];
    const newTags = currentTags.filter(id => id !== tagIdToRemove);
    updateFilterImmediate('tagIds', newTags.length > 0 ? newTags : undefined);
  };

  const addTag = (tagId: string) => {
    const currentTags = localFilters.tagIds || [];
    if (!currentTags.includes(tagId)) {
      updateFilterImmediate('tagIds', [...currentTags, tagId]);
    }
  };

  const selectedTags = allTags.filter(tag => localFilters.tagIds?.includes(tag.id));
  const availableTags = allTags.filter(tag => !localFilters.tagIds?.includes(tag.id));

  const hasActiveFilters = Object.keys(localFilters).some(key => 
    localFilters[key as keyof TrainingFilters] !== undefined
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
    <Card className="w-full">
             <CardHeader className="pb-3">
         <CardTitle className="flex items-center gap-2 text-base">
           <Filter className="h-4 w-4" />
           Filtry treningów
           <div className="ml-auto flex gap-2">
             {hasPendingChanges && (
               <Button
                 variant="default"
                 size="sm"
                 onClick={applyPendingFilters}
                 className="h-7 px-3"
               >
                 <Search className="h-3 w-3 mr-1" />
                 Zastosuj
               </Button>
             )}
             {hasActiveFilters && (
               <Button
                 variant="outline"
                 size="sm"
                 onClick={onReset}
                 className="h-7 px-2"
               >
                 <RotateCcw className="h-3 w-3 mr-1" />
                 Resetuj
               </Button>
             )}
           </div>
         </CardTitle>
       </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Basic Filters */}
        <Collapsible open={expandedSections.basic} onOpenChange={() => toggleSection('basic')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-8">
              <span className="text-sm font-medium">Podstawowe</span>
              {expandedSections.basic ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Od</Label>
                                 <Input
                   type="date"
                   value={localFilters.startDate || ''}
                   onChange={(e) => updateFilterImmediate('startDate', e.target.value || undefined)}
                   className="h-8"
                 />
               </div>
               <div>
                 <Label className="text-xs text-muted-foreground">Do</Label>
                 <Input
                   type="date"
                   value={localFilters.endDate || ''}
                   onChange={(e) => updateFilterImmediate('endDate', e.target.value || undefined)}
                   className="h-8"
                 />
              </div>
            </div>

            {/* Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="flex items-center gap-1 text-white text-xs h-6"
                    style={{ backgroundColor: tag.color }}
                  >
                    <span className="text-xs">{tag.icon}</span>
                    {tag.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 ml-1 hover:bg-white/20"
                      onClick={() => removeTag(tag.id)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {availableTags.length > 0 && (
              <Select onValueChange={addTag}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Dodaj tag..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-xs">{tag.icon}</span>
                        <span className="text-sm">{tag.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Range Filters */}
        <Collapsible open={expandedSections.ranges} onOpenChange={() => toggleSection('ranges')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-8">
              <span className="text-sm font-medium">Zakresy wartości</span>
              {expandedSections.ranges ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              {/* Distance */}
                             <div className="space-y-2">
                 <Label className="text-xs font-medium">Dystans (km)</Label>
                 <DualRangeSlider
                   defaultValue={[0, 200]}
                   value={[pendingFilters.minDistance || 0, pendingFilters.maxDistance || 200]}
                   onValueChange={(values: number[]) => updateRangeFilter('minDistance', 'maxDistance', values, 0, 200)}
                   max={200}
                   step={5}
                   className="w-full"
                 />
                 <div className="flex justify-between text-xs text-muted-foreground">
                   <span>{pendingFilters.minDistance || 0}</span>
                   <span>{pendingFilters.maxDistance || 200}</span>
                 </div>
               </div>

               {/* Heart Rate */}
               <div className="space-y-2">
                 <Label className="text-xs font-medium">Tętno (bpm)</Label>
                 <DualRangeSlider
                   defaultValue={[80, 200]}
                   value={[pendingFilters.minHeartRate || 80, pendingFilters.maxHeartRate || 200]}
                   onValueChange={(values: number[]) => updateRangeFilter('minHeartRate', 'maxHeartRate', values, 80, 200)}
                   min={80}
                   max={200}
                   step={5}
                   className="w-full"
                 />
                 <div className="flex justify-between text-xs text-muted-foreground">
                   <span>{pendingFilters.minHeartRate || 80}</span>
                   <span>{pendingFilters.maxHeartRate || 200}</span>
                 </div>
               </div>

               {/* Speed */}
               <div className="space-y-2">
                 <Label className="text-xs font-medium">Prędkość (km/h)</Label>
                 <DualRangeSlider
                   defaultValue={[10, 50]}
                   value={[pendingFilters.minSpeed || 10, pendingFilters.maxSpeed || 50]}
                   onValueChange={(values: number[]) => updateRangeFilter('minSpeed', 'maxSpeed', values, 10, 50)}
                   min={10}
                   max={50}
                   step={1}
                   className="w-full"
                 />
                 <div className="flex justify-between text-xs text-muted-foreground">
                   <span>{pendingFilters.minSpeed || 10}</span>
                   <span>{pendingFilters.maxSpeed || 50}</span>
                 </div>
               </div>

               {/* Elevation */}
               <div className="space-y-2">
                 <Label className="text-xs font-medium">Przewyższenie (m)</Label>
                 <DualRangeSlider
                   defaultValue={[0, 2000]}
                   value={[pendingFilters.minElevation || 0, pendingFilters.maxElevation || 2000]}
                   onValueChange={(values: number[]) => updateRangeFilter('minElevation', 'maxElevation', values, 0, 2000)}
                   max={2000}
                   step={50}
                   className="w-full"
                 />
                 <div className="flex justify-between text-xs text-muted-foreground">
                   <span>{pendingFilters.minElevation || 0}</span>
                   <span>{pendingFilters.maxElevation || 2000}</span>
                 </div>
               </div>
             </div>

             {/* Time - full width */}
             <div className="space-y-2">
               <Label className="text-xs font-medium">Czas jazdy (minuty)</Label>
               <DualRangeSlider
                 defaultValue={[0, 300]}
                 value={[pendingFilters.minTime || 0, pendingFilters.maxTime || 300]}
                 onValueChange={(values: number[]) => updateRangeFilter('minTime', 'maxTime', values, 0, 300)}
                 max={300}
                 step={15}
                 className="w-full"
               />
               <div className="flex justify-between text-xs text-muted-foreground">
                 <span>{pendingFilters.minTime || 0} min</span>
                 <span>{pendingFilters.maxTime || 300} min</span>
               </div>
             </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Data Availability */}
        <Collapsible open={expandedSections.data} onOpenChange={() => toggleSection('data')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-8">
              <span className="text-sm font-medium">Dostępność danych</span>
              {expandedSections.data ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
             <div className="flex items-center space-x-2">
               <Checkbox
                 id="hasFitData"
                 checked={localFilters.hasFitData === true}
                 onCheckedChange={(checked) => 
                   updateFilterImmediate('hasFitData', checked ? true : undefined)
                 }
               />
               <Label htmlFor="hasFitData" className="text-sm">
                 Tylko z przetworzonym plikiem FIT
               </Label>
             </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
} 