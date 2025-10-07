import type { ReactNode } from 'react';

import { AuthGate } from '@/components/auth-gate';
import { AppSidebar } from '@/components/app-sidebar';
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => {
    return (
        <AuthGate>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
                        <SidebarTrigger className='-ml-1' />
                        <Separator orientation='vertical' className='mr-2 h-4' />
                    </header>
                    <div className='flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6'>
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </AuthGate>
    );
};

export default Layout;
