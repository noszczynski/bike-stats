import { UpdateTrainingsButton } from "@/components/update-trainings-button";
import { fetchTrainings } from "@/lib/api/trainings-client";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { RidesPageClient } from "./rides-page-client";

export default async function RidesPage() {
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
        queryKey: ["trainings"],
        queryFn: () => fetchTrainings(),
    });

    const dehydratedState = dehydrate(queryClient);

    return (
        <div className="w-full">
            <div className="flex flex-row gap-2">
                <h1 className="mb-6 text-3xl font-bold">Wszystkie jazdy</h1>
                <UpdateTrainingsButton />
            </div>
            <HydrationBoundary state={dehydratedState}>
                <RidesPageClient />
            </HydrationBoundary>
        </div>
    );
}
