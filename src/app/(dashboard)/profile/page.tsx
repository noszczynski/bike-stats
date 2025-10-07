import StravaProfileClient from "@/components/strava-profile-client";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

interface StravaProfilePageProps {
    searchParams: {
        error?: string;
    };
}

export default async function StravaProfilePage({ searchParams }: StravaProfilePageProps) {
    const queryClient = new QueryClient();

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <StravaProfileClient searchParams={searchParams} />
        </HydrationBoundary>
    );
}
