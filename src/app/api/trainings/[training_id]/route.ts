import { updateTraining } from "@/lib/api/trainings";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
    heart_rate_zones: z
        .object({
            zone_1: z
                .string()
                .regex(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)
                .optional(),
            zone_2: z
                .string()
                .regex(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)
                .optional(),
            zone_3: z
                .string()
                .regex(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)
                .optional(),
            zone_4: z
                .string()
                .regex(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)
                .optional(),
            zone_5: z
                .string()
                .regex(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)
                .optional(),
        })
        .optional(),
    summary: z.string().optional(),
    device: z.string().optional(),
    battery_percent_usage: z.number().min(0).max(100).optional(),
    effort: z.number().min(1).max(10).optional(),
});

export async function PUT(request: Request, { params }: { params: { training_id: string } }) {
    try {
        const body = await request.json();
        const data = updateSchema.parse(body);

        const activity = await updateTraining(params.training_id, {
            heart_rate_zones: data.heart_rate_zones || {},
            summary: data.summary,
            device: data.device,
            battery_percent_usage: data.battery_percent_usage,
            effort: data.effort,
        });

        return NextResponse.json({ activity });
    } catch (error) {
        console.error("Update error:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid request data", details: error.errors },
                { status: 400 },
            );
        }

        if (error instanceof Error) {
            return NextResponse.json(
                { error: "Internal server error", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
