import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { LucideIcon, TrendingUpIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: number | string;
    unit?: string;
    trend?: string;
    trendIcon?: LucideIcon;
    trendMessage?: string;
    trendProgress?: 'progress' | 'regress' | 'neutral';
    description?: string;
    infoText?: string;
    formatValue?: (value: number) => string;
    className?: string;
}

export function StatsCard({
    title,
    value,
    unit = '',
    trend = '+0.0%',
    trendIcon: TrendIcon = TrendingUpIcon,
    trendMessage = 'Stabilny przyrost',
    trendProgress = 'neutral',
    description,
    infoText,
    formatValue = (val: number) => val.toFixed(1),
    className = ''
}: StatsCardProps) {
    const formattedValue = typeof value === 'number' ? formatValue(value) : String(value);

    const getTrendColorClass = () => {
        switch (trendProgress) {
            case 'progress':
                return 'text-green-700';
            case 'regress':
                return 'text-red-700';
            default:
                return 'text-black';
        }
    };

    const trendColorClass = getTrendColorClass();

    return (
        <Card className={`@container/card ${className}`}>
            <CardHeader className='relative'>
                <CardDescription>{title}</CardDescription>
                <CardTitle
                    className={cn('text-2xl font-semibold tabular-nums @[250px]/card:text-3xl', trendColorClass)}>
                    {formattedValue} {unit}
                </CardTitle>
                {trend && (
                    <div className='absolute top-4 right-4'>
                        <Badge variant='outline' className={`flex gap-1 rounded-lg text-xs ${trendColorClass}`}>
                            <TrendIcon className='size-3' />
                            {trend}
                        </Badge>
                    </div>
                )}
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1 text-sm'>
                {trendMessage && (
                    <div className={`line-clamp-1 flex gap-2 font-medium ${trendColorClass}`}>
                        {trendMessage} <TrendIcon className='size-4' />
                    </div>
                )}
                {infoText && <div className='text-muted-foreground'>{infoText}</div>}
            </CardFooter>
        </Card>
    );
}
