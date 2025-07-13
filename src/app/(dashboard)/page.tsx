import { DashboardGlobalStatsTabContent } from '@/components/dashboard-global-stats-tab-content';
import { DashboardMetricsTabContent } from '@/components/dashboard-metrics-tab-content';
import { DashboardOverviewTabContent } from '@/components/dashboard-overview-tab-content';
import { AuthSuccessHandler } from '@/components/auth-success-handler';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * The main page component that renders the HomePage component.
 *
 * @returns {JSX.Element} The rendered HomePage component.
 */
const Page = () => {
    return (
        <>
            <AuthSuccessHandler />
            <Tabs defaultValue='overview' className='space-y-4'>
                <TabsList>
                    <TabsTrigger value='overview'>Przegląd</TabsTrigger>
                    <TabsTrigger value='metrics'>Metryki</TabsTrigger>
                    <TabsTrigger value='global-stats'>Statystyki globalne</TabsTrigger>
                </TabsList>
                <TabsContent value='overview'>
                    <DashboardOverviewTabContent />
                </TabsContent>
                <TabsContent value='metrics'>
                    <DashboardMetricsTabContent />
                </TabsContent>
                <TabsContent value='global-stats'>
                    <DashboardGlobalStatsTabContent />
                </TabsContent>
            </Tabs>
        </>
    );
};

export default Page;
