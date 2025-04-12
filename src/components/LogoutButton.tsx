'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { LogOut } from 'lucide-react';

export function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/strava/logout', { method: 'POST' });
            router.refresh();
            router.push('/auth/strava');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <Button
            variant='ghost'
            size='icon'
            onClick={handleLogout}
            title='Logout'
            className='text-muted-foreground hover:text-foreground'>
            <LogOut className='h-4 w-4' />
        </Button>
    );
}
