'use client';

import { useQueryClient } from '@tanstack/react-query';
import { logout } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';

import { LogOut } from 'lucide-react';

export function LogoutButton() {
    const queryClient = useQueryClient();

    const handleLogout = async () => {
        try {
            await logout();
            
            // Invalidate the authentication query to update the UI
            queryClient.invalidateQueries({ queryKey: ['auth-status'] });
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
