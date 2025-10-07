"use client";

import { TrainingCards } from "@/components/training-card";
import { useGetTrainings } from "@/hooks/use-get-trainings";

import { Skeleton } from "./ui/skeleton";

export function TrainingCardsContainer() {
    const { data } = useGetTrainings();

    if (!data?.trainings) {
        return (
            <Container>
                {Array.from({ length: 9 }).map((_, index) => (
                    <div
                        key={index}
                        className="bg-card text-card-foreground hover:bg-muted/50 relative flex h-[228px] flex-col gap-6 overflow-hidden rounded-xl border py-6 shadow-sm transition-all"
                    >
                        {/* Card Header */}
                        <div className="relative z-10 grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pb-2">
                            <div className="flex items-center justify-between leading-none font-semibold">
                                <Skeleton className="h-5 w-32" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-5 rounded" />
                                    <Skeleton className="h-5 w-5 rounded" />
                                    <Skeleton className="h-5 w-5 rounded" />
                                </div>
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="relative z-10 px-6">
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
            </Container>
        );
    }

    return (
        <Container>
            <TrainingCards trainings={data.trainings} />
        </Container>
    );
}

function Container({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{children}</div>
    );
}
