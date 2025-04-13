'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImportTrainingDialogProps {
    trainingId: number;
    onImportSuccess?: () => void;
}

export function ImportTrainingDialog({ trainingId, onImportSuccess }: ImportTrainingDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // const { toast } = useToast();
    const router = useRouter();

    const [formData, setFormData] = useState({
        heart_rate_zones: {
            zone_1: '',
            zone_2: '',
            zone_3: '',
            zone_4: '',
            zone_5: ''
        },
        summary: '',
        device: '',
        battery_percent_usage: '',
        effort: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/trainings/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    strava_activity_id: trainingId,
                    ...formData,
                    battery_percent_usage: formData.battery_percent_usage
                        ? parseInt(formData.battery_percent_usage)
                        : undefined,
                    effort: formData.effort ? parseInt(formData.effort) : undefined
                })
            });

            if (!response.ok) {
                throw new Error('Failed to import training');
            }

            // toast({
            //     title: 'Success',
            //     description: 'Training imported successfully'
            // });

            setOpen(false);
            onImportSuccess?.();
            router.refresh();
        } catch (error) {
            // toast({
            //     title: 'Error',
            //     description: 'Failed to import training',
            //     variant: 'destructive'
            // });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant='outline' size='sm' className='ml-2'>
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                    <DialogTitle>Import Training Data</DialogTitle>
                    <DialogDescription>Add additional data for this training session.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className='grid gap-4 py-4'>
                        <div className='grid gap-2'>
                            <Label>Heart Rate Zones (hh:mm:ss)</Label>
                            {Object.keys(formData.heart_rate_zones).map((zone, index) => (
                                <div key={zone} className='grid grid-cols-2 items-center gap-4'>
                                    <Label htmlFor={zone}>Zone {index + 1}</Label>
                                    <Input
                                        id={zone}
                                        placeholder='00:00:00'
                                        pattern='^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$'
                                        value={
                                            formData.heart_rate_zones[zone as keyof typeof formData.heart_rate_zones]
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                heart_rate_zones: {
                                                    ...formData.heart_rate_zones,
                                                    [zone]: e.target.value
                                                }
                                            })
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                        <div className='grid gap-2'>
                            <Label htmlFor='summary'>Summary</Label>
                            <Input
                                id='summary'
                                value={formData.summary}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            />
                        </div>
                        <div className='grid gap-2'>
                            <Label htmlFor='device'>Device</Label>
                            <Input
                                id='device'
                                value={formData.device}
                                onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                            />
                        </div>
                        <div className='grid gap-2'>
                            <Label htmlFor='battery'>Battery Usage (%)</Label>
                            <Input
                                id='battery'
                                type='number'
                                min='0'
                                max='100'
                                value={formData.battery_percent_usage}
                                onChange={(e) => setFormData({ ...formData, battery_percent_usage: e.target.value })}
                            />
                        </div>
                        <div className='grid gap-2'>
                            <Label htmlFor='effort'>Effort (1-10)</Label>
                            <Input
                                id='effort'
                                type='number'
                                min='1'
                                max='10'
                                value={formData.effort}
                                onChange={(e) => setFormData({ ...formData, effort: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type='submit' disabled={isLoading}>
                            {isLoading ? 'Importing...' : 'Import'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
