import { AverageSpeedPerKilometrChart } from '@/components/charts/average-speed-per-kilometr-chart';
import { getAllTrainings } from '@/lib/api/trainings';
import { cookies } from 'next/headers';

export async function AverageSpeedChartContainer() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;
    const refreshToken = cookieStore.get('strava_refresh_token')?.value;

    if (!accessToken || !refreshToken) {
        return <div>No access token or refresh token found</div>;
    }

    const allTrainings = await getAllTrainings(accessToken, refreshToken);

    // Pass the trainings to the client component
    return <AverageSpeedPerKilometrChart trainings={allTrainings} />;
}
