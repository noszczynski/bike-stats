'use client';

import { Button } from '@/components/ui/button';
import { useUpdateTrainings } from '@/hooks/use-update-trainings';

import { Loader } from 'lucide-react';

export function UpdateTrainingsButton() {
    const { mutate, isPending } = useUpdateTrainings();

    const handleUpdate = () => {
        // Call the mutation without tokens - the API will get them from cookies
        mutate();
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
