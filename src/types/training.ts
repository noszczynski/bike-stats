import { z } from 'zod';

export const TrainingSchema = z.object({
    date: z.string(),
    distance_km: z.number(),
    elevation_gain_m: z.number(),
    moving_time: z.string(),
    avg_speed_kmh: z.number(),
    max_speed_kmh: z.number(),
    avg_heart_rate_bpm: z.number()
});

export type Training = z.infer<typeof TrainingSchema>;
