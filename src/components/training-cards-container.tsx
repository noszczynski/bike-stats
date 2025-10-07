'use client';

import { TrainingCards } from '@/components/training-card';
import { useGetTrainings } from '@/hooks/use-get-trainings';
import { Skeleton } from './ui/skeleton';

export function TrainingCardsContainer() {
    // The data is now hydrated from the server through HydrationBoundary
    const { data } = useGetTrainings();

    if (!data?.trainings) {
        return (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {Array.from({ length: 9 }).map((_, index) => (
                    <div
                        key={index}
                        className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm hover:bg-muted/50 relative overflow-hidden transition-all h-[228px]"
                    >
                        {/* Card Header */}
                        <div className="grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 relative z-10 pb-2">
                            <div className="leading-none font-semibold flex items-center justify-between">
                                <Skeleton className="h-5 w-32" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-5 rounded" />
                                    <Skeleton className="h-5 w-5 rounded" />
                                    <Skeleton className="h-5 w-5 rounded" />
                                </div>
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="px-6 relative z-10">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-12" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-14" />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-18" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return <TrainingCards trainings={data.trainings} />;
}
