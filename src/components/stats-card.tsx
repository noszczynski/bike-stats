import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { LucideIcon, TrendingUpIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: number | string;
    unit?: string;
    trend?: string;
    trendIcon?: LucideIcon;
    trendMessage?: string;
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
    description,
    infoText,
    formatValue = (val) => (typeof val === 'number' ? val.toFixed(1) : val.toString()),
    className = ''
}: StatsCardProps) {
    const formattedValue = typeof value === 'number' ? formatValue(value) : value;

    return (
        <Card className={`@container/card ${className}`}>
            <CardHeader className='relative'>
                <CardDescription>{title}</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                    {formattedValue} {unit}
                </CardTitle>
                {trend && (
                    <div className='absolute top-4 right-4'>
                        <Badge variant='outline' className='flex gap-1 rounded-lg text-xs'>
                            <TrendIcon className='size-3' />
                            {trend}
                        </Badge>
                    </div>
                )}
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1 text-sm'>
                {trendMessage && (
                    <div className='line-clamp-1 flex gap-2 font-medium'>
                        {trendMessage} <TrendIcon className='size-4' />
                    </div>
                )}
                {infoText && <div className='text-muted-foreground'>{infoText}</div>}
            </CardFooter>
        </Card>
    );
}
