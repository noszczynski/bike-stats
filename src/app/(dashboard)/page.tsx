import { AuthSuccessHandler } from "@/components/auth-success-handler";
import { DashboardMetricsTabContent } from "@/components/dashboard-metrics-tab-content";
import { DashboardOverviewTabContent } from "@/components/dashboard-overview-tab-content";
import { Separator } from "@/components/ui/separator";

/**
 * The main page component that renders the HomePage component.
 *
 * @returns {JSX.Element} The rendered HomePage component.
 */
const Page = () => {
    return (
        <>
            <AuthSuccessHandler />

            <DashboardOverviewTabContent />

            <Separator className="my-6" />

            <DashboardMetricsTabContent />
        </>
    );
};

export default Page;
