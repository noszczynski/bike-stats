'use client';

import { useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CompareToType = 'all' | 'earlier' | 'other';

interface CompareToSelectProps {
    trainingDate: string;
}

export function CompareToSelect({ trainingDate }: CompareToSelectProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get initial value from URL or default to 'other'
    const initialCompareTo = (searchParams.get('compareTo') as CompareToType) || 'other';
    const [compareTo, setCompareTo] = useState<CompareToType>(initialCompareTo);

    // Update URL with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('compareTo', compareTo);
            router.push(`/trainings/${trainingDate}?${params.toString()}`);
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [compareTo, router, searchParams, trainingDate]);

    return (
        <div>
            <label htmlFor='compare-to' className='mb-2 block text-sm font-medium'>
                Porównaj z:
            </label>
            <Select value={compareTo} onValueChange={(value: CompareToType) => setCompareTo(value)}>
                <SelectTrigger id='compare-to'>
                    <SelectValue placeholder='Wybierz porównanie' />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value='other'>Inne treningi</SelectItem>
                    <SelectItem value='earlier'>Wcześniejsze treningi</SelectItem>
                    <SelectItem value='all'>Wszystkie treningi</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
