'use client';

import { Button } from '@/components/ui/button';

export function StravaLoginButton() {
    return (
        <Button
            onClick={() => {
                window.location.href = '/api/auth/strava';
            }}
            className='bg-[#FC4C02] text-white hover:bg-[#FC4C02]/90'>
            Connect with Strava
        </Button>
    );
}
