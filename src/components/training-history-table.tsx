import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAllTrainings } from '@/lib/api/trainings';
import date from '@/lib/date';

export async function TrainingHistoryTable() {
    const { trainings } = await getAllTrainings();

    return (
        <Card className='col-span-7'>
            <CardHeader>
                <CardTitle>
                    Historia Twoich treningów <span className='text-sm text-gray-400'>({trainings.length})</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>Lista Twoich ostatnich treningów</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Nazwa</TableHead>
                            <TableHead>Dystans</TableHead>
                            <TableHead>Czas</TableHead>
                            <TableHead>Średnia prędkość</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {trainings.slice(0, 10).map((training) => (
                            <TableRow key={training.id}>
                                <TableCell>{date(training.date).format('DD/MM/YYYY')}</TableCell>
                                <TableCell>{training.name}</TableCell>
                                <TableCell>{training.distance_km.toFixed(1)} km</TableCell>
                                <TableCell>{training.moving_time}</TableCell>
                                <TableCell>{training.avg_speed_kmh.toFixed(1)} km/h</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
