import Image from 'next/image';

import { StatsCard } from '@/components/stats-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSwitch } from '@/components/ui/theme-switch';
import trainings from '@/data/trainings.json';
import { calculateAverageHeartRate } from '@/features/training/calculate-average-heart-rate';
import { calculateAverageSpeed } from '@/features/training/calculate-average-speed';
import { calculateHighestAverageSpeed } from '@/features/training/calculate-highest-average-speed';
import { calculateMaxSpeed } from '@/features/training/calculate-max-speed';

import dayjs from 'dayjs';
import pl from 'dayjs/locale/pl';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { TrendingUpIcon } from 'lucide-react';

declare module 'dayjs' {
    interface Dayjs {
        format(format: string): string;
        tz(timezone: string): Dayjs;
    }
}

dayjs.locale(pl);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.tz.setDefault('Europe/Warsaw');

/**
 * The main page component that renders the HomePage component.
 *
 * @returns {JSX.Element} The rendered HomePage component.
 */
const Page = () => {
    const avgSpeed = calculateAverageSpeed(trainings);
    const maxSpeed = calculateMaxSpeed(trainings);
    const avgHeartRate = calculateAverageHeartRate(trainings);
    const highestAvgSpeed = calculateHighestAverageSpeed(trainings);

    return (
        <div className='hidden flex-col md:flex'>
            <div className='border-b'>
                <div className='flex h-16 items-center px-4'>
                    <ThemeSwitch />
                </div>
            </div>
            <div className='flex-1 space-y-4 p-8 pt-6'>
                <div className='flex items-center justify-between space-y-2'>
                    <h2 className='text-3xl font-bold tracking-tight'>Dashboard</h2>
                    <div className='flex items-center space-x-2'>
                        <Button>Download</Button>
                    </div>
                </div>
                <Tabs defaultValue='overview' className='space-y-4'>
                    <TabsList>
                        <TabsTrigger value='overview'>Overview</TabsTrigger>
                        <TabsTrigger value='analytics' disabled>
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value='reports' disabled>
                            Reports
                        </TabsTrigger>
                        <TabsTrigger value='notifications' disabled>
                            Notifications
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value='overview' className='space-y-4'>
                        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-6'>
                            <StatsCard
                                title='Średnia prędkość'
                                value={avgSpeed}
                                unit='km/h'
                                trend='+2.1%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Stabilny przyrost'
                                infoText={`Na podstawie ${trainings.length} treningów`}
                            />

                            <StatsCard
                                title='Maksymalna prędkość'
                                value={maxSpeed}
                                unit='km/h'
                                trend='+5.2%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Stabilny przyrost'
                                infoText={`Na podstawie ${trainings.length} treningów`}
                            />

                            <StatsCard
                                title='Średni Heart Rate na trening'
                                value={avgHeartRate}
                                unit='bpm'
                                trend='+3.8%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Stabilny przyrost'
                                infoText={`Na podstawie ${trainings.length} treningów`}
                                formatValue={(val) => val.toFixed(0)}
                            />

                            <StatsCard
                                title='Najwyższa średnia prędkość'
                                value={highestAvgSpeed}
                                unit='km/h'
                                trend='+1.5%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Stabilny przyrost'
                                infoText={`Na podstawie ${trainings.length} treningów`}
                            />

                            <StatsCard
                                title='Łączny dystans'
                                value={trainings.reduce((acc, training) => acc + training.distance_km, 0)}
                                unit='km'
                                trend='+12.3%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Wzrost dystansu'
                                infoText={`Na podstawie ${trainings.length} treningów`}
                                formatValue={(val) => val.toFixed(0)}
                            />

                            <StatsCard
                                title='Łączny dystans w 2025 roku'
                                value={trainings.reduce((acc, training) => {
                                    const trainingDate = dayjs(training.date);

                                    return trainingDate.isAfter(dayjs('2025-01-01')) ? acc + training.distance_km : acc;
                                }, 0)}
                                unit='km'
                                trend='+12.3%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Wzrost dystansu'
                                infoText={`Na podstawie ${trainings.length} treningów`}
                                formatValue={(val) => val.toFixed(0)}
                            />

                            <StatsCard
                                title='Średnie przewyższenie na trening'
                                value={
                                    trainings.reduce((acc, training) => acc + training.elevation_gain_m, 0) /
                                    trainings.length
                                }
                                unit='m'
                                trend='+8.7%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Wzrost przewyższeń'
                                infoText={`Na podstawie ${trainings.length} treningów`}
                                formatValue={(val) => val.toFixed(0)}
                            />

                            <StatsCard
                                title='Łączne przewyższenie'
                                value={trainings.reduce((acc, training) => acc + training.elevation_gain_m, 0)}
                                unit='m'
                                trend='+15.2%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Wzrost przewyższeń'
                                infoText={`Na podstawie ${trainings.length} treningów`}
                                formatValue={(val) => val.toFixed(0)}
                            />

                            <StatsCard
                                title='Średni czas jazdy na trening'
                                value={
                                    trainings.reduce((acc, training) => {
                                        const [hours, minutes] = training.moving_time.split(':').map(Number);

                                        return acc + hours + minutes / 60;
                                    }, 0) / trainings.length
                                }
                                unit='h'
                                trend='+5.4%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Wzrost czasu jazdy'
                                infoText={`Na podstawie ${trainings.length} treningów`}
                                formatValue={(val) => val.toFixed(1)}
                            />

                            <StatsCard
                                title='Liczba treningów'
                                value={trainings.length}
                                unit=''
                                trend='+18.2%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Wzrost częstotliwości'
                                infoText='Wszystkie zarejestrowane treningi'
                                formatValue={(val) => val.toFixed(0)}
                            />

                            <StatsCard
                                title='Najwyższy dystans'
                                value={Math.max(...trainings.map((training) => training.distance_km))}
                                unit='km'
                                trend='+5.2%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Nowy rekord'
                                infoText='Najdłuższy pojedynczy trening'
                                formatValue={(val) => val.toFixed(1)}
                            />

                            <StatsCard
                                title='Najwyższy średni HR'
                                value={Math.max(...trainings.map((training) => training.avg_heart_rate_bpm))}
                                unit='bpm'
                                trend='+3.1%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Nowy rekord'
                                infoText='Najwyższe średnie tętno na treningu'
                                formatValue={(val) => val.toFixed(0)}
                            />

                            <StatsCard
                                title='Najszybszy kilometr'
                                value={Math.min(
                                    ...trainings.map((training) => {
                                        const [hours, minutes] = training.moving_time.split(':').map(Number);
                                        const totalHours = hours + minutes / 60;

                                        return totalHours / training.distance_km;
                                    })
                                )}
                                unit='min/km'
                                trend='-2.3%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Nowy rekord'
                                infoText='Najszybszy średni czas na kilometr'
                                formatValue={(val) => (val * 60).toFixed(1)}
                            />

                            <StatsCard
                                title='Średni czas na km'
                                value={
                                    trainings.reduce((acc, training) => {
                                        const [hours, minutes] = training.moving_time.split(':').map(Number);
                                        const totalHours = hours + minutes / 60;

                                        return acc + totalHours / training.distance_km;
                                    }, 0) / trainings.length
                                }
                                unit='min/km'
                                trend='-1.8%'
                                trendIcon={TrendingUpIcon}
                                trendMessage='Poprawa tempa'
                                infoText='Średni czas na kilometr we wszystkich treningach'
                                formatValue={(val) => (val * 60).toFixed(1)}
                            />
                        </div>
                        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
                            <Card className='col-span-7'>
                                <CardHeader>
                                    <CardTitle>Historia treningów</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableCaption>Lista ostatnich treningów.</TableCaption>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Data</TableHead>
                                                <TableHead>Dystans (km)</TableHead>
                                                <TableHead>Wysokość (m)</TableHead>
                                                <TableHead>Czas podróży (h)</TableHead>
                                                <TableHead>Średnia prędkość (km/h)</TableHead>
                                                <TableHead>Maksymalna prędkość (km/h)</TableHead>
                                                <TableHead>Średnie tętno (bpm)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {trainings.map((training, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{dayjs(training.date).format('LL')}</TableCell>
                                                    <TableCell>{training.distance_km.toFixed(2)}</TableCell>
                                                    <TableCell>{training.elevation_gain_m}</TableCell>
                                                    <TableCell>{training.moving_time}</TableCell>
                                                    <TableCell>{training.avg_speed_kmh.toFixed(1)}</TableCell>
                                                    <TableCell>{training.max_speed_kmh.toFixed(1)}</TableCell>
                                                    <TableCell>{training.avg_heart_rate_bpm || '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Page;
