import type { ReactNode } from 'react';

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => {
    return <div className='flex-1 space-y-4 p-8 pt-6'>{children}</div>;
};

export default Layout;
