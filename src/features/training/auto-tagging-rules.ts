import { ActivityType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface TagRule {
  tagName: string;
  description: string;
  color: string;
  icon: string;
  condition: (activityData: ActivityAnalysis) => boolean;
}

export interface ActivityAnalysis {
  id: string;
  type: ActivityType;
  distance_m?: number;
  elevation_gain_m?: number;
  moving_time_s?: number;
  avg_speed_ms?: number;
  max_speed_ms?: number;
  avg_heart_rate_bpm?: number;
  max_heart_rate_bpm?: number;
  trackpoints_count: number;
}

export const AUTO_TAGGING_RULES: TagRule[] = [
  {
    tagName: 'Long Distance',
    description: 'Activities longer than 80km',
    color: '#ef4444', // red
    icon: 'route',
    condition: (data) => (data.distance_m || 0) > 80_000,
  },
  {
    tagName: 'Climbing',
    description: 'Activities with significant average elevation gain (>6m/km)',
    color: '#8b5cf6', // purple
    icon: 'mountain',
    condition: (data) => {
      const elevation = data.elevation_gain_m || 0;
      const distance = data.distance_m || 0;
      if (distance === 0) return false;
      const metersPerKm = elevation / (distance / 1000);
      return metersPerKm > 6;
    },
  },
  {
    tagName: 'High Intensity',
    description: 'Activities with high average heart rate (>150 bpm)',
    color: '#f59e0b', // orange
    icon: 'heart',
    condition: (data) => (data.avg_heart_rate_bpm || 0) > 150,
  },
  {
    tagName: 'Low Intensity',
    description: 'Activities with low average heart rate (<135 bpm)',
    color: '#3b82f6', // blue
    icon: 'heart',
    condition: (data) => (data.avg_heart_rate_bpm || 0) < 135 && (data.avg_heart_rate_bpm || 0) > 0,
  },
  {
    tagName: 'Speed Demon',
    description: 'Activities with high average speed (>24 km/h)',
    color: '#dc2626', // dark red
    icon: 'gauge',
    condition: (data) => (data.avg_speed_ms || 0) * 3.6 > 24, // convert m/s to km/h
  },
  {
    tagName: 'Endurance',
    description: 'Activities longer than 3 hours',
    color: '#059669', // dark green
    icon: 'clock',
    condition: (data) => (data.moving_time_s || 0) > 10_800, // 3 hours = 10800 seconds
  },
  {
    tagName: 'Quick Ride',
    description: 'Activities shorter than 60 minutes',
    color: '#06b6d4', // cyan
    icon: 'timer',
    condition: (data) => (data.moving_time_s || 0) < 3_600 && (data.moving_time_s || 0) > 0, // 60 minutes = 3600 seconds
  },
  {
    tagName: 'Recovery',
    description: 'Low intensity, short duration activities',
    color: '#84cc16', // lime
    icon: 'leaf',
    condition: (data) => 
      (data.avg_heart_rate_bpm || 0) < 130 && 
      (data.avg_heart_rate_bpm || 0) > 0,
  }
];

export async function getActivityAnalysis(activityId: string): Promise<ActivityAnalysis | null> {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      strava_activity: true,
      trackpoints: {
        select: { id: true },
      },
      laps: {
        select: {
          distance_m: true,
          moving_time_s: true,
          avg_speed_ms: true,
          max_speed_ms: true,
          avg_heart_rate_bpm: true,
          max_heart_rate_bpm: true,
          total_elevation_gain_m: true,
        },
      },
    },
  });

  if (!activity) {
    return null;
  }

  // Calculate metrics from laps if available, otherwise use Strava data
  const totalDistance = activity.laps.reduce((sum: number, lap) => sum + lap.distance_m, 0);
  const totalMovingTime = activity.laps.reduce((sum: number, lap) => sum + lap.moving_time_s, 0);
  const totalElevationGain = activity.laps.reduce((sum: number, lap) => sum + (lap.total_elevation_gain_m || 0), 0);
  
  const avgSpeed = activity.laps.length > 0 
    ? activity.laps.reduce((sum: number, lap) => sum + (lap.avg_speed_ms || 0), 0) / activity.laps.length
    : undefined;
    
  const maxSpeed = activity.laps.length > 0
    ? Math.max(...activity.laps.map((lap) => lap.max_speed_ms || 0))
    : undefined;
    
  const avgHeartRate = activity.laps.length > 0
    ? activity.laps.filter((lap) => lap.avg_heart_rate_bpm).reduce((sum: number, lap) => sum + (lap.avg_heart_rate_bpm || 0), 0) / 
      activity.laps.filter((lap) => lap.avg_heart_rate_bpm).length
    : undefined;
    
  const maxHeartRate = activity.laps.length > 0
    ? Math.max(...activity.laps.map((lap) => lap.max_heart_rate_bpm || 0))
    : undefined;

  return {
    id: activity.id,
    type: activity.type,
    distance_m: totalDistance > 0 ? totalDistance : activity.strava_activity?.distance_m || undefined,
    elevation_gain_m: totalElevationGain > 0 ? totalElevationGain : activity.strava_activity?.elevation_gain_m || undefined,
    moving_time_s: totalMovingTime > 0 ? totalMovingTime : activity.strava_activity?.moving_time_s || undefined,
    avg_speed_ms: avgSpeed,
    max_speed_ms: maxSpeed,
    avg_heart_rate_bpm: avgHeartRate || activity.strava_activity?.avg_heart_rate_bpm || undefined,
    max_heart_rate_bpm: maxHeartRate || activity.strava_activity?.max_heart_rate_bpm || undefined,
    trackpoints_count: activity.trackpoints.length,
  };
}

export async function applyAutoTagging(activityId: string): Promise<void> {
  console.log(`Starting auto-tagging for activity: ${activityId}`);
  
  const analysis = await getActivityAnalysis(activityId);
  if (!analysis) {
    console.log(`No analysis data found for activity: ${activityId}`);
    return;
  }

  console.log(`Activity analysis:`, analysis);

  // Find applicable rules
  const applicableRules = AUTO_TAGGING_RULES.filter(rule => rule.condition(analysis));
  console.log(`Found ${applicableRules.length} applicable rules:`, applicableRules.map(r => r.tagName));

  for (const rule of applicableRules) {
    console.log(`Processing rule: ${rule.tagName}`);
    
    // Ensure tag exists in database
    let tag;
    try {
      tag = await prisma.tag.upsert({
        where: { name: rule.tagName },
        update: {
          description: rule.description,
          color: rule.color,
          icon: rule.icon,
        },
        create: {
          name: rule.tagName,
          description: rule.description,
          color: rule.color,
          icon: rule.icon,
        },
      });
      console.log(`Tag upserted successfully: ${tag.name} (id: ${tag.id})`);
    } catch (error) {
      console.error(`Error upserting tag ${rule.tagName}:`, error);
      continue;
    }

    // Create activity tag relationship if it doesn't exist
    console.log(`Attempting to upsert activity tag: activityId=${activityId}, tagId=${tag.id}`);
    
    try {
      await prisma.activityTag.upsert({
        where: {
          activity_id_tag_id: {
            activity_id: activityId,
            tag_id: tag.id,
          },
        },
        update: {
          is_auto_generated: true,
        },
        create: {
          activity_id: activityId,
          tag_id: tag.id,
          is_auto_generated: true,
        },
      });
      console.log(`Successfully upserted activity tag for rule: ${rule.tagName}`);
    } catch (error) {
      console.error(`Error upserting activity tag for rule ${rule.tagName}:`, error);
      throw error;
    }
  }
}

export async function removeAutoTags(activityId: string): Promise<void> {
  await prisma.activityTag.deleteMany({
    where: {
      activity_id: activityId,
      is_auto_generated: true,
    },
  });
}

export async function reapplyAutoTagging(activityId: string): Promise<void> {
  // Remove existing auto tags
  await removeAutoTags(activityId);
  
  // Apply new auto tags
  await applyAutoTagging(activityId);
} 