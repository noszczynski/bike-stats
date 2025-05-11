import type { ReactNode } from 'react';

import Link from 'next/link';

import { StravaLoginButton } from '@/components/StravaLoginButton';
import { StravaProfile } from '@/components/StravaProfile';
import { ThemeSwitch } from '@/components/ui/theme-switch';

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => {
    return (
        <div className='flex w-full flex-col'>
            <div className='flex w-full items-center justify-between gap-8 border-b px-8'>
                <nav className='flex items-center gap-4'>
                    <Link href='/'>Panel</Link>
                    <Link href='/profile'>Profil</Link>
                    <Link href='/trainings'>Treningi</Link>
                    <Link href='/trainings/calendar'>Kalendarz</Link>
                </nav>
                <div className='flex h-16 items-center gap-4'>
                    <StravaLoginButton />
                    <StravaProfile />
                    <ThemeSwitch />
                </div>
            </div>
            <div className='flex-1 space-y-4 p-8 pt-6'>{children}</div>
        </div>
    );
};

export default Layout;
