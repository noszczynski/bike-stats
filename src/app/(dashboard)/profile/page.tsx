import ProfileClient from "@/components/profile-client";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

interface ProfilePageProps {
    searchParams: {
        error?: string;
    };
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
    const queryClient = new QueryClient();

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ProfileClient searchParams={searchParams} />
        </HydrationBoundary>
    );
}
