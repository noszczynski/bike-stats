import { z } from 'zod';

export const TimeSchema = z
    .string()
    .regex(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/, 'Time must be in hh:mm:ss format');

export const HeartRateZonesSchema = z.object({
    zone_1: TimeSchema,
    zone_2: TimeSchema,
    zone_3: TimeSchema,
    zone_4: TimeSchema,
    zone_5: TimeSchema
});

export const TrainingSchema = z.object({
    /** Date of the training */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    /** Distance of the training in km */
    distance_km: z.number(),
    /** Elevation gain of the training in m */
    elevation_gain_m: z.number(),
    /** Moving time of the training */
    moving_time: TimeSchema,
    /** Average speed of the training in km/h */
    avg_speed_kmh: z.number(),
    /** Maximum speed of the training in km/h */
    max_speed_kmh: z.number(),
    /** Average heart rate of the training in bpm */
    avg_heart_rate_bpm: z.number().nullish(),
    /** Maximum heart rate of the training in bpm */
    max_heart_rate_bpm: z.number().nullish(),
    /** Heart rate zones of the training */
    heart_rate_zones: HeartRateZonesSchema.nullish(),
    /** Summary of the training */
    summary: z.string().nullish(),
    /** Battery percent usage of the training */
    battery_percent_usage: z.number().nullish(),
    /**
     * Effort of the training (e.g.: Apple Training Effort).
     * 1-3 is Easy, 4-6 is Medium, 7-8 is Hard, 9-10 is All Out
     */
    effort: z
        .number()
        .int()
        .nullish()
        .refine((value) => !value || (value >= 1 && value <= 10), {
            message: 'Effort must be between 1 and 10'
        })
});

export type Training = z.infer<typeof TrainingSchema>;

export type HeartRateZones = z.infer<typeof HeartRateZonesSchema>;
