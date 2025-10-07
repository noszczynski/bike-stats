import { TrainingCardsContainer } from "@/components/training-cards-container";
import { UpdateTrainingsButton } from "@/components/update-trainings-button";
import { fetchTrainings } from "@/lib/api/trainings-client";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export default async function TrainingsPage() {
    // Create a new QueryClient for the server
    const queryClient = new QueryClient();

    // Prefetch data on the server and put it in the query cache
    await queryClient.prefetchQuery({
        queryKey: ["trainings"],
        queryFn: () => fetchTrainings(),
    });

    // Dehydrate the query cache to send it to the client
    const dehydratedState = dehydrate(queryClient);

    return (
        <div className="w-full">
            <div className="flex flex-row gap-2">
                <h1 className="mb-6 text-3xl font-bold">Wszystkie treningi</h1>
                <UpdateTrainingsButton />
            </div>
            <HydrationBoundary state={dehydratedState}>
                <TrainingCardsContainer />
            </HydrationBoundary>
        </div>
    );
}
