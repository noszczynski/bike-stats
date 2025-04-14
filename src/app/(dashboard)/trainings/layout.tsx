import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Treningi | Bike Stats',
    description: 'Szczegółowe informacje o treningach rowerowych'
};

export default function TrainingsLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <div className='container mx-auto py-8'>{children}</div>;
}
