import { cookies } from 'next/headers';

import { getAthlete } from '@/app/api/_lib/strava';
import { LogoutButton } from '@/components/LogoutButton';

export async function StravaProfile() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('strava_access_token')?.value;
    const refreshToken = cookieStore.get('strava_refresh_token')?.value;

    if (!accessToken) {
        return null;
    }

    try {
        const athlete = await getAthlete(accessToken, refreshToken);

        return (
            <div className='flex items-center gap-3'>
                <img
                    src={athlete.profile}
                    alt={`${athlete.firstname} ${athlete.lastname}`}
                    className='h-8 w-8 rounded-full'
                />
                <span className='text-sm font-medium'>
                    {athlete.firstname} {athlete.lastname}
                </span>
                <LogoutButton />
            </div>
        );
    } catch (error) {
        return null;
    }
}
