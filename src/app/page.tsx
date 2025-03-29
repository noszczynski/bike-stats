import Image from 'next/image';

import { DashboardOverviewTabContent } from '@/components/dashboard-overview-tab-content';
import { StatsCard } from '@/components/stats-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSwitch } from '@/components/ui/theme-switch';
import trainings from '@/data/trainings.json';
import { calculateAverageHeartRate } from '@/features/training/calculate-average-heart-rate';
import { calculateAverageSpeed } from '@/features/training/calculate-average-speed';
import { calculateHighestAverageSpeed } from '@/features/training/calculate-highest-average-speed';
import { calculateMaxSpeed } from '@/features/training/calculate-max-speed';

import dayjs from 'dayjs';
import pl from 'dayjs/locale/pl';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { TrendingUpIcon } from 'lucide-react';

declare module 'dayjs' {
    interface Dayjs {
        format(format: string): string;
        tz(timezone: string): Dayjs;
    }
}

dayjs.locale(pl);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.tz.setDefault('Europe/Warsaw');

/**
 * The main page component that renders the HomePage component.
 *
 * @returns {JSX.Element} The rendered HomePage component.
 */
const Page = () => {
    return (
        <div className='flex flex-col'>
            <div className='border-b'>
                <div className='flex h-16 items-center px-4'>
                    <ThemeSwitch />
                </div>
            </div>
            <div className='flex-1 space-y-4 p-8 pt-6'>
                <div className='flex items-center justify-between space-y-2'>
                    <h2 className='text-3xl font-bold tracking-tight'>Dashboard</h2>
                    <div className='flex items-center space-x-2'>
                        <Button>Download</Button>
                    </div>
                </div>
                <Tabs defaultValue='overview' className='space-y-4'>
                    <TabsList>
                        <TabsTrigger value='overview'>Overview</TabsTrigger>
                        <TabsTrigger value='analytics' disabled>
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value='reports' disabled>
                            Reports
                        </TabsTrigger>
                        <TabsTrigger value='notifications' disabled>
                            Notifications
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value='overview'>
                        <DashboardOverviewTabContent />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Page;
