'use client';

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import { useTrackpoints } from '@/hooks/use-training-queries';
import date from '../../lib/date';

interface FitHeartRateChartProps {
  trainingId: string;
}

const chartConfig = {
  heart_rate: {
    label: 'Tętno',
    color: '#FFC107',
  },
} satisfies ChartConfig;

export function FitHeartRateChart({ trainingId }: FitHeartRateChartProps) {
  const { data, isLoading, error } = useTrackpoints(trainingId);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Tętno w czasie (FIT)
          </CardTitle>
          <CardDescription>Szczegółowy wykres tętna z danych .FIT</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Tętno w czasie (FIT)
          </CardTitle>
          <CardDescription>Szczegółowy wykres tętna z danych .FIT</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Błąd: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const trackpoints = data?.trackpoints || [];

  const heartRateData = trackpoints
  .filter(tp => tp.heart_rate_bpm)
    .map((tp, index) => ({
      index,
      timestamp: tp.timestamp ? date(tp.timestamp).toISOString() : null,
      heart_rate: tp.heart_rate_bpm ?? null,
      distance: tp.distance ? (tp.distance / 1000).toFixed(1) : null,
      timeFormatted: tp.timestamp ? date(tp.timestamp).format('HH:mm') : null
    }))

  if (heartRateData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Tętno w czasie (FIT)
          </CardTitle>
          <CardDescription>Szczegółowy wykres tętna z danych .FIT</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Brak danych tętna w pliku .FIT
          </div>
        </CardContent>
      </Card>
    );
  }

  const avgHeartRate = heartRateData.reduce((sum, data) => sum + (data.heart_rate || 0), 0) / heartRateData.length;
  const maxHeartRate = Math.max(...heartRateData.map(data => data.heart_rate || 0));
  const minHeartRate = Math.min(...heartRateData.map(data => data.heart_rate || 0));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Tętno w czasie (FIT)
        </CardTitle>
        <CardDescription>
          Szczegółowy wykres tętna z danych .FIT • Punkty danych: {heartRateData.length.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{avgHeartRate.toFixed(0)}</div>
            <div className="text-muted-foreground">Średnie</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-700">{maxHeartRate}</div>
            <div className="text-muted-foreground">Maksymalne</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{minHeartRate}</div>
            <div className="text-muted-foreground">Minimalne</div>
          </div>
        </div>
        
        <ChartContainer config={chartConfig} className='h-32 w-full'>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={heartRateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timeFormatted"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']}
                tick={{ fontSize: 12 }}
                label={{ value: 'Tętno (bpm)', angle: -90, position: 'insideLeft' }}
                ticks={[80, 100, 120, 140, 160, 180, 200]}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                labelFormatter={(value) => `Czas: ${value}`}
                formatter={(value: number, name: string) => [
                  `${value} bpm`,
                  name === 'heart_rate' ? 'Tętno' : name
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="heart_rate" 
                stroke="var(--color-heart_rate)" 
                strokeWidth={2}
                dot={false}
                name="Tętno"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
} 