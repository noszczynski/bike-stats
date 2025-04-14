import { cookies } from 'next/headers';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAllTrainings } from '@/lib/api/trainings';
import date from '@/lib/date';

export async function TrainingHistoryTable() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;
    const refreshToken = cookieStore.get('strava_refresh_token')?.value;

    if (!accessToken || !refreshToken) {
        return <div>No access token or refresh token found</div>;
    }

    const trainings = await getAllTrainings(accessToken, refreshToken);

    return (
        <Card className='col-span-7'>
            <CardHeader>
                <CardTitle>
                    Historia Twoich treningów <span className='text-sm text-gray-400'>({trainings.length})</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>Lista ostatnich treningów.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Dystans (km)</TableHead>
                            <TableHead>Przyrost wysokości (m)</TableHead>
                            <TableHead>Czas ruchu (h)</TableHead>
                            <TableHead>Średnia prędkość (km/h)</TableHead>
                            <TableHead>Maksymalna prędkość (km/h)</TableHead>
                            <TableHead>Średnie tętno (bpm)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...trainings]
                            .sort((a, b) => date(b.date).valueOf() - date(a.date).valueOf())
                            .map((training, index) => (
                                <TableRow key={index}>
                                    <TableCell>{date(training.date).format('LL')}</TableCell>
                                    <TableCell>{training.distance_km.toFixed(2)}</TableCell>
                                    <TableCell>{training.elevation_gain_m}</TableCell>
                                    <TableCell>{training.moving_time}</TableCell>
                                    <TableCell>{(training.avg_speed_kmh).toFixed(1)}</TableCell>
                                    <TableCell>{training.max_speed_kmh.toFixed(1)}</TableCell>
                                    <TableCell>{training.avg_heart_rate_bpm || '-'}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
