import type { ReactNode } from 'react';

import Link from 'next/link';

import { AuthGate } from '@/components/auth-gate';
import { StravaProfileHeader } from '@/components/strava-profile-header';
import { ThemeSwitch } from '@/components/ui/theme-switch';

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => {
    return (
        <AuthGate>
            <div className='flex w-full flex-col'>
                <div className='flex w-full items-center justify-between gap-8 border-b px-8'>
                    <nav className='flex items-center gap-4'>
                        <Link href='/'>Panel</Link> 
                        <Link href='/profile'>Profil</Link>
                        <Link href='/trainings'>Treningi</Link>
                        <Link href='/trainings/calendar'>Kalendarz</Link>
                        <Link href='/routes'>Moje trasy</Link>
                        <Link href='/chat'>Chat</Link>
                    </nav>
                    <div className='flex h-16 items-center gap-4'>
                        <StravaProfileHeader />
                        <ThemeSwitch />
                    </div>
                </div>
                <div className='flex-1 space-y-4 p-8 pt-6'>{children}</div>
            </div>
        </AuthGate>
    );
};

export default Layout;
