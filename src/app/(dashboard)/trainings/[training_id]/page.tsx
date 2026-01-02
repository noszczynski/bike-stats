import { TrainingFitWizardWrapper } from "@/components/training-fit-wizard-wrapper";
import { getAllTrainings, getTrainingById } from "@/lib/api/trainings";
import date from "@/lib/date";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

type CompareToType = "all" | "earlier" | "other";

interface TrainingPageProps {
    params: {
        training_id: string;
    };
    searchParams: {
        compareTo?: string;
    };
}

export async function generateMetadata({ params }: TrainingPageProps): Promise<Metadata> {
    const training = await getTrainingById(params.training_id);

    if (!training) {
        return {
            title: "Trening nie znaleziony | Bike Stats",
        };
    }

    const formattedDate = date(training.date).format("LL");

    return {
        title: `${training.name} - ${formattedDate} | Bike Stats`,
    };
}

export default async function TrainingPage({ params, searchParams }: TrainingPageProps) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("strava_access_token")?.value;
    const refreshToken = cookieStore.get("strava_refresh_token")?.value;

    if (!accessToken || !refreshToken) {
        return <div>No access token or refresh token found</div>;
    }

    const allTrainings = await getAllTrainings();

    // Find the training with the given ID
    const training = await getTrainingById(params.training_id);

    // If no training found, return 404
    if (!training) {
        notFound();
    }

    // Get compareTo from searchParams or default to 'other'
    // Ensure it's one of the valid values
    const validCompareToValues: CompareToType[] = ["all", "earlier", "other"];

    const compareTo = validCompareToValues.includes(searchParams.compareTo as CompareToType)
        ? (searchParams.compareTo as CompareToType)
        : "other";

    if (!validCompareToValues.includes(compareTo)) {
        return null;
    }

    return (
        <div className="container py-8">
            <TrainingFitWizardWrapper
                training={training}
                compareTo={compareTo}
                allTrainings={allTrainings.trainings}
            />
        </div>
    );
}
