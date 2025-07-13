import type { ReactNode } from 'react';

import Link from 'next/link';

import { AuthGate } from '@/components/auth-gate';
import { StravaProfileClient } from '@/components/strava-profile-client';
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
                    </nav>
                    <div className='flex h-16 items-center gap-4'>
                        <StravaProfileClient />
                        <ThemeSwitch />
                    </div>
                </div>
                <div className='flex-1 space-y-4 p-8 pt-6'>{children}</div>
            </div>
        </AuthGate>
    );
};

export default Layout;
