import { z } from 'zod';

export const TimeSchema = z
    .string()
    .regex(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/, 'Time must be in hh:mm:ss format');

export const TrainingSchema = z.object({
    date: z.string(),
    distance_km: z.number(),
    elevation_gain_m: z.number(),
    moving_time: TimeSchema,
    avg_speed_kmh: z.number(),
    max_speed_kmh: z.number(),
    avg_heart_rate_bpm: z.number().nullish(),
    heart_rate_zones: z
        .object({
            zone_1: TimeSchema,
            zone_2: TimeSchema,
            zone_3: TimeSchema,
            zone_4: TimeSchema,
            zone_5: TimeSchema
        })
        .nullish(),
    summary: z.string().nullish()
});

export type Training = z.infer<typeof TrainingSchema>;
