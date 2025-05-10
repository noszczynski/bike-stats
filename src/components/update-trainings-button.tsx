'use client';

import { Button } from '@/components/ui/button';
import { useUpdateTrainings } from '@/hooks/use-update-trainings';

import { Loader } from 'lucide-react';

interface UpdateTrainingsButtonProps {
    accessToken: string;
    refreshToken: string;
}

export function UpdateTrainingsButton({ accessToken, refreshToken }: UpdateTrainingsButtonProps) {
    const { mutate, isPending } = useUpdateTrainings();

    const handleUpdate = () => {
        mutate({ accessToken, refreshToken });
    };

    return (
        <Button variant='link' onClick={handleUpdate} disabled={isPending}>
            {isPending ? (
                <>
                    <Loader className='mr-2 h-4 w-4 animate-spin' />
                    Aktualizowanie...
                </>
            ) : (
                'Aktualizuj'
            )}
        </Button>
    );
}
