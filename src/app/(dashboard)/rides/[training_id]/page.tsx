import { TrainingFitWizardWrapper } from "@/components/training-fit-wizard-wrapper";
import { getAllTrainings, getTrainingById } from "@/lib/api/trainings";
import date from "@/lib/date";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

type CompareToType = "all" | "earlier" | "other";

interface RidePageProps {
    params: Promise<{
        training_id: string;
    }>;
    searchParams: Promise<{
        compareTo?: string;
    }>;
}

export async function generateMetadata({ params }: RidePageProps): Promise<Metadata> {
    const { training_id } = await params;
    const training = await getTrainingById(training_id);

    if (!training) {
        return {
            title: "Jazda nie znaleziona | Bike Stats",
        };
    }

    const formattedDate = date(training.date).format("LL");

    return {
        title: `${training.name} - ${formattedDate} | Bike Stats`,
    };
}

export default async function RidePage({ params, searchParams }: RidePageProps) {
    const { training_id } = await params;
    const resolvedSearchParams = await searchParams;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("strava_access_token")?.value;
    const refreshToken = cookieStore.get("strava_refresh_token")?.value;

    if (!accessToken || !refreshToken) {
        return <div>No access token or refresh token found</div>;
    }

    const allTrainings = await getAllTrainings();
    const training = await getTrainingById(training_id);

    if (!training) {
        notFound();
    }

    const validCompareToValues: CompareToType[] = ["all", "earlier", "other"];

    const compareTo = validCompareToValues.includes(resolvedSearchParams.compareTo as CompareToType)
        ? (resolvedSearchParams.compareTo as CompareToType)
        : "other";

    if (!validCompareToValues.includes(compareTo)) {
        return null;
    }

    return (
        <div className="container pb-8">
            <TrainingFitWizardWrapper
                training={training}
                compareTo={compareTo}
                allTrainings={allTrainings.trainings}
            />
        </div>
    );
}
