import { StravaLoginButton } from '@/components/StravaLoginButton';

export default function StravaAuthPage() {
    return (
        <main className='flex min-h-screen flex-col items-center justify-center p-24'>
            <div className='w-full max-w-md space-y-8'>
                <div className='text-center'>
                    <h2 className='text-3xl font-bold'>Connect with Strava</h2>
                    <p className='text-muted-foreground mt-2'>
                        Link your Strava account to access your cycling statistics
                    </p>
                </div>

                <div className='flex justify-center'>
                    <StravaLoginButton />
                </div>
            </div>
        </main>
    );
}
