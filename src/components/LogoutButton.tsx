'use client';

import { useLogout } from '@/hooks/use-auth-mutations';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
    const logoutMutation = useLogout();

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
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
            disabled={logoutMutation.isPending}
            className='text-muted-foreground hover:text-foreground'>
            <LogOut className='h-4 w-4' />
        </Button>
    );
}
