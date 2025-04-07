'use client';

import { Button } from '@/components/ui/button';
import { STRAVA_AUTH_URL } from '@/lib/strava-client';

export function StravaLoginButton() {
    return (
        <Button
            onClick={() => {
                window.location.href = STRAVA_AUTH_URL;
            }}
            className='bg-[#FC4C02] text-white hover:bg-[#FC4C02]/90'>
            Connect with Strava
        </Button>
    );
}
