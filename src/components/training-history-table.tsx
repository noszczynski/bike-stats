import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import trainings from '@/data/trainings.json';
import date from '@/lib/date';

export const TrainingHistoryTable = () => {
    return (
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
                                    <TableCell>{training.avg_speed_kmh.toFixed(1)}</TableCell>
                                    <TableCell>{training.max_speed_kmh.toFixed(1)}</TableCell>
                                    <TableCell>{training.avg_heart_rate_bpm || '-'}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
