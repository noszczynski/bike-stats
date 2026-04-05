import { WorkoutEditor } from "@/components/workout/workout-editor";

type EditWorkoutPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditWorkoutPage({ params }: EditWorkoutPageProps) {
    const { id } = await params;

    return <WorkoutEditor workoutId={id} />;
}
