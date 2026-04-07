import { createComparePeriodSummariesTool } from "@/lib/ai/tools/trainer/compare-period-summaries";
import { createCreateWorkoutTool } from "@/lib/ai/tools/trainer/create-workout";
import { createDeleteTrainerMemoryTool } from "@/lib/ai/tools/trainer/delete-trainer-memory";
import { createDeleteWorkoutTool } from "@/lib/ai/tools/trainer/delete-workout";
import { createEditTrainerMemoryTool } from "@/lib/ai/tools/trainer/edit-trainer-memory";
import { createGetActivityDetailsTool } from "@/lib/ai/tools/trainer/get-activity-details";
import { createGetActivityFitSummaryTool } from "@/lib/ai/tools/trainer/get-activity-fit-summary";
import { createGetActivityLapsTool } from "@/lib/ai/tools/trainer/get-activity-laps";
import { createGetActivityOverviewTool } from "@/lib/ai/tools/trainer/get-activity-overview";
import { createGetActivitySensorSummaryTool } from "@/lib/ai/tools/trainer/get-activity-sensor-summary";
import { createGetActivityTagsTool } from "@/lib/ai/tools/trainer/get-activity-tags";
import { createGetWorkoutTool } from "@/lib/ai/tools/trainer/get-workout";
import { createGetActivityZoneBreakdownTool } from "@/lib/ai/tools/trainer/get-activity-zone-breakdown";
import { createGetAppLinksTool } from "@/lib/ai/tools/trainer/get-app-links";
import { createGetPerformanceTrendsTool } from "@/lib/ai/tools/trainer/get-performance-trends";
import { createGetPeriodSummaryTool } from "@/lib/ai/tools/trainer/get-period-summary";
import { createGetRecentActivitiesTool } from "@/lib/ai/tools/trainer/get-recent-activities";
import { createGetUserProfileTool } from "@/lib/ai/tools/trainer/get-user-profile";
import { createListWorkoutsTool } from "@/lib/ai/tools/trainer/list-workouts";
import { createSaveTrainerMemoryTool } from "@/lib/ai/tools/trainer/save-trainer-memory";
import { createSearchTrainerMemoryTool } from "@/lib/ai/tools/trainer/search-trainer-memory";
import { createUpdateWorkoutTool } from "@/lib/ai/tools/trainer/update-workout";

export function createTrainerTools(userId: string, latestUserMessage: string) {
    return {
        get_app_links: createGetAppLinksTool(),
        get_recent_activities: createGetRecentActivitiesTool(userId),
        get_activity_overview: createGetActivityOverviewTool(userId),
        get_activity_fit_summary: createGetActivityFitSummaryTool(userId),
        get_activity_laps: createGetActivityLapsTool(userId),
        get_activity_tags: createGetActivityTagsTool(userId),
        get_activity_zone_breakdown: createGetActivityZoneBreakdownTool(userId),
        get_activity_sensor_summary: createGetActivitySensorSummaryTool(userId),
        get_activity_details: createGetActivityDetailsTool(userId),
        get_user_profile: createGetUserProfileTool(userId),
        save_trainer_memory: createSaveTrainerMemoryTool(userId),
        search_trainer_memory: createSearchTrainerMemoryTool(userId),
        edit_trainer_memory: createEditTrainerMemoryTool(userId, latestUserMessage),
        delete_trainer_memory: createDeleteTrainerMemoryTool(userId, latestUserMessage),
        get_period_summary: createGetPeriodSummaryTool(userId),
        compare_period_summaries: createComparePeriodSummariesTool(userId),
        get_performance_trends: createGetPerformanceTrendsTool(userId),
        list_workouts: createListWorkoutsTool(userId),
        get_workout: createGetWorkoutTool(userId),
        create_workout: createCreateWorkoutTool(userId),
        update_workout: createUpdateWorkoutTool(userId),
        delete_workout: createDeleteWorkoutTool(userId),
    };
}
