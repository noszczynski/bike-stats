import { z } from "zod";

const powerSchema = z.number().min(0).max(3);
const durationSchema = z
    .number()
    .int()
    .min(1)
    .max(24 * 60 * 60);

const warmupStepSchema = z.object({
    type: z.literal("Warmup"),
    Duration: durationSchema,
    PowerLow: powerSchema,
    PowerHigh: powerSchema,
});

const cooldownStepSchema = z.object({
    type: z.literal("Cooldown"),
    Duration: durationSchema,
    PowerLow: powerSchema,
    PowerHigh: powerSchema,
});

const steadyStateStepSchema = z.object({
    type: z.literal("SteadyState"),
    Duration: durationSchema,
    Power: powerSchema,
});

const rampStepSchema = z.object({
    type: z.literal("Ramp"),
    Duration: durationSchema,
    PowerLow: powerSchema,
    PowerHigh: powerSchema,
});

const intervalsTStepSchema = z.object({
    type: z.literal("IntervalsT"),
    Repeat: z.number().int().min(1).max(100),
    OnDuration: durationSchema,
    OffDuration: durationSchema,
    OnPower: powerSchema,
    OffPower: powerSchema,
});

const textEventStepSchema = z.object({
    type: z.literal("TextEvent"),
    timeoffset: z
        .number()
        .int()
        .min(0)
        .max(24 * 60 * 60),
    message: z.string().trim().min(1).max(160),
});

export const zwoStepSchema = z.discriminatedUnion("type", [
    warmupStepSchema,
    cooldownStepSchema,
    steadyStateStepSchema,
    rampStepSchema,
    intervalsTStepSchema,
    textEventStepSchema,
]);

export const zwoWorkoutSchema = z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(2000),
    author: z.string().trim().min(1).max(120),
    sportType: z.enum(["bike"]).default("bike"),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    steps: z.array(zwoStepSchema).min(1).max(300),
});

export const zwoGenerateRequestSchema = z.object({
    instruction: z.string().trim().min(10).max(4000),
    currentWorkout: zwoWorkoutSchema.partial().optional(),
});

export type ZwoStep = z.infer<typeof zwoStepSchema>;
export type ZwoWorkout = z.infer<typeof zwoWorkoutSchema>;
export type ZwoGenerateRequest = z.infer<typeof zwoGenerateRequestSchema>;
