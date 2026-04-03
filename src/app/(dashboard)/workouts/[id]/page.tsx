import { WorkoutDetails } from "@/components/workout/workout-details";

type WorkoutDetailsPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function WorkoutDetailsPage({ params }: WorkoutDetailsPageProps) {
    const { id } = await params;

    return <WorkoutDetails workoutId={id} />;
}
