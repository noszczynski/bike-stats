import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { calculateAverageHeartRate } from '@/features/training/calculate-average-heart-rate';
import { calculateAverageSpeed } from '@/features/training/calculate-average-speed';
import { calculateAverageTimePerKm } from '@/features/training/calculate-average-time-per-km';
import { calculateElevationGainPerKm } from '@/features/training/calculate-elevation-gain-per-km';
import { calculateHighestAverageHeartRate } from '@/features/training/calculate-highest-average-heart-rate';
import { calculateHighestAverageSpeed } from '@/features/training/calculate-highest-average-speed';
import { calculateHighestDistance } from '@/features/training/calculate-highest-distance';
import { calculateMaxSpeed } from '@/features/training/calculate-max-speed';
import { calculateShortestTimePerKm } from '@/features/training/calculate-shortest-time-per-km';
import { calculateTotalDistance } from '@/features/training/calculate-total-distance';
import { calculateTotalElevationGain } from '@/features/training/calculate-total-elevation-gain';
import { completion } from '@/lib/api/openai';
import { getActivity } from '@/lib/api/strava';
import { getAllTrainings, getTrainingById, updateTraining } from '@/lib/api/trainings';

export async function POST(request: Request, { params }: { params: { training_id: string } }) {
    try {
        const training = await getTrainingById(params.training_id);

        if (!training) {
            return NextResponse.json({ error: 'Training not found' }, { status: 404 });
        }

        const cookieStore = await cookies();

        const accessToken = cookieStore.get('strava_access_token')?.value;
        const refreshToken = cookieStore.get('strava_refresh_token')?.value;

        if (!accessToken || !refreshToken) {
            return NextResponse.json({ error: 'No access token or refresh token found' }, { status: 401 });
        }

        const allTrainings = await getAllTrainings();
        const stravaActivity = await getActivity(training.strava_activity_id, accessToken, refreshToken);

        const averageSpeed = calculateAverageSpeed(allTrainings);
        const highestAverageSpeed = calculateHighestAverageSpeed(allTrainings);
        const maxSpeed = calculateMaxSpeed(allTrainings);
        const averageHeartRate = calculateAverageHeartRate(allTrainings);
        const highestAverageHeartRate = calculateHighestAverageHeartRate(allTrainings);
        const totalDistance = calculateTotalDistance(allTrainings);
        const highestDistance = calculateHighestDistance(allTrainings);
        const elevationGainPerKm = calculateElevationGainPerKm(allTrainings);
        const totalElevationGain = calculateTotalElevationGain(allTrainings);
        const averageTimePerKm = calculateAverageTimePerKm(allTrainings);
        const shortestTimePerKm = calculateShortestTimePerKm(allTrainings);

        const currentElevationPerKm = training.elevation_gain_m / training.distance_km;

        const prompt = `Generate a concise training summary based on the following data.

Training Data:

\`\`\`training_data
Date: ${training.date}
Distance: ${training.distance_km || 'N/A'} km
Moving Time: ${training.moving_time || 'N/A'}
Average Speed: ${training.avg_speed_kmh || 'N/A'} km/h
Max Speed: ${training.max_speed_kmh || 'N/A'} km/h
Elevation Gain: ${training.elevation_gain_m || 'N/A'} m
Elevation per km: ${currentElevationPerKm.toFixed(1) || 'N/A'} m/km
Average Heart Rate: ${training.avg_heart_rate_bpm || 'N/A'} bpm
Max Heart Rate: ${training.max_heart_rate_bpm || 'N/A'} bpm
Heart Rate Zones: ${JSON.stringify(training.heart_rate_zones || {})}
Effort Level: ${training.effort || 'N/A'}/10
\`\`\`

Strava source data for this training:

\`\`\`strava_activity_data
Name: ${stravaActivity.name}
Type: ${stravaActivity.type}
Description: ${stravaActivity.description || 'N/A'}
Achievement Count: ${stravaActivity.achievement_count || 0}
Athlete Count: ${stravaActivity.athlete_count || 1}
Workout Type: ${stravaActivity.workout_type || 'N/A'}
Calories: ${stravaActivity.calories || 'N/A'}
Gear ID: ${stravaActivity.gear_id || 'N/A'}
Device Name: ${stravaActivity.device_name || 'N/A'}
Weather Conditions: ${stravaActivity.weather_report ? JSON.stringify(stravaActivity.weather_report) : 'N/A'}
\`\`\`

Historical Metrics:

\`\`\`historical_metrics
Your Average Speed: ${averageSpeed.toFixed(1)} km/h
Your Highest Average Speed Ever: ${highestAverageSpeed.toFixed(1)} km/h
Your Highest Recorded Speed Ever: ${maxSpeed.toFixed(1)} km/h
Your Average Heart Rate: ${averageHeartRate.toFixed(0)} bpm
Your Highest Average Heart Rate: ${highestAverageHeartRate} bpm
Your Total Distance Cycled: ${totalDistance.toFixed(0)} km
Your Longest Ride Distance: ${highestDistance.toFixed(1)} km
Your Average Elevation Gain per km: ${elevationGainPerKm.toFixed(1)} m/km
Your Total Elevation Climbed: ${totalElevationGain.toFixed(0)} m
Your Average Pace: ${averageTimePerKm}
Your Fastest Pace: ${shortestTimePerKm}
\`\`\`

Example Response in Markdown Format:

\`\`\`example_response_markdown
## Trening: "Popołudniowa jazda" - 15 maja 2023

Twój dzisiejszy 28-kilometrowy trening trwający 1 godzinę i 15 minut był solidną sesją o średniej prędkości 22.4 km/h, co przewyższa Twoją przeciętną (21.2 km/h). Pokonałeś 380 m przewyższenia (13.6 m/km), co stanowi wyzwanie powyżej Twojej średniej (11.2 m/km).

### Najważniejsze osiągnięcia:
- Osiągnąłeś maksymalną prędkość 42 km/h, zbliżając się do swojego rekordu (45 km/h)
- Utrzymałeś stabilne tętno w strefie 3 przez większość treningu
- Znacząco poprawiłeś tempo na odcinkach pod górę w porównaniu do poprzednich treningów

### Twoje mocne strony:
- Doskonała kontrola wysiłku na podjazdach (widoczna w stabilnym tętnie)
- Konsekwentne tempo na płaskich odcinkach
- Umiejętność osiągania wysokich prędkości na zjazdach przy zachowaniu bezpieczeństwa

### Obszary do poprawy:
- Możesz zwiększyć czas spędzony w strefie 4 dla lepszego rozwoju progów tlenowych
- Warto spróbować utrzymać wyższe tempo na ostatnich kilometrach, gdzie nastąpił lekki spadek

### Rekomendacje dotyczące regeneracji:
- Zalecany lekki stretching, skupiając się na mięśniach czworogłowych i łydkach
- Nawodnij się z elektrolitami (około 500ml) w ciągu najbliższej godziny
- Rozważ lekką 15-minutową jazdę regeneracyjną jutro, aby przyspieszyć usuwanie kwasu mlekowego
- Pełna regeneracja powinna nastąpić w ciągu 24 godzin przy odpowiednim odżywianiu

Twój postęp jest imponujący! Z każdym treningiem zwiększasz swoją wytrzymałość i efektywność. Przy utrzymaniu takiej konsekwencji, wkrótce pobijesz swoje rekordy średniej prędkości i dystansu. Kontynuuj świetną pracę!
\`\`\`

The summary should be professional and motivational. Return the summary in Polish using Markdown formatting with:
1. Level 2 heading (##) for the training title and date
2. Level 3 headings (###) for each section 
3. Bullet points for lists
4. Basic formatting like **bold** or *italic* when appropriate for emphasis

Include the following sections:
1. Name and date of the training as the main heading
2. A brief overview paragraph of how this training compares to the rider's averages and personal bests
3. Notable achievements or patterns in this particular ride
4. Areas of strength shown in this training 
5. Any potential areas for improvement based on the metrics
6. Recovery suggestions based on the intensity and duration of the workout
7. End with an encouraging note about progress`;

        const summary = await completion(prompt);

        const updatedTraining = await updateTraining(params.training_id, { summary });

        return NextResponse.json({ training: updatedTraining });
    } catch (error) {
        console.error('Generate summary error:', error);

        if (error instanceof Error) {
            return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
