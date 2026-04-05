import { ZwoStep } from "@/lib/zwo/types";
import { WorkoutStep } from "@prisma/client";

export type WorkoutPreviewBlock = {
    durationSec: number;
    startFactor: number;
    endFactor: number;
};

export type WorkoutSummary = {
    estimatedDurationSeconds: number;
    difficulty: number;
    previewBlocks: WorkoutPreviewBlock[];
};

type DbStepLike = Pick<
    WorkoutStep,
    | "type"
    | "duration"
    | "power"
    | "power_low"
    | "power_high"
    | "repeat"
    | "on_duration"
    | "off_duration"
    | "on_power"
    | "off_power"
>;

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function roundToHalf(value: number): number {
    return Math.round(value * 2) / 2;
}

function summarizeBlocks(blocks: WorkoutPreviewBlock[]): WorkoutSummary {
    const estimatedDurationSeconds = blocks.reduce((sum, block) => sum + block.durationSec, 0);

    if (estimatedDurationSeconds <= 0) {
        return {
            estimatedDurationSeconds: 0,
            difficulty: 1,
            previewBlocks: [],
        };
    }

    const weightedFactor = Math.sqrt(
        blocks.reduce((sum, block) => {
            const avgFactor = (block.startFactor + block.endFactor) / 2;
            return sum + block.durationSec * avgFactor * avgFactor;
        }, 0) / estimatedDurationSeconds,
    );

    const peakFactor = blocks.reduce(
        (peak, block) => Math.max(peak, block.startFactor, block.endFactor),
        0,
    );

    const highIntensityShare =
        blocks.reduce((sum, block) => {
            const avgFactor = (block.startFactor + block.endFactor) / 2;
            return avgFactor >= 1 ? sum + block.durationSec : sum;
        }, 0) / estimatedDurationSeconds;

    const durationBonus =
        estimatedDurationSeconds >= 90 * 60
            ? 0.5
            : estimatedDurationSeconds >= 60 * 60
              ? 0.25
              : 0;

    const peakBonus = peakFactor >= 1.2 ? 0.5 : peakFactor >= 1 ? 0.25 : 0;
    const intensityBonus = highIntensityShare >= 0.18 ? 0.5 : highIntensityShare >= 0.08 ? 0.25 : 0;

    const difficulty = clamp(
        roundToHalf(1 + (weightedFactor - 0.45) / 0.15 + durationBonus + peakBonus + intensityBonus),
        1,
        5,
    );

    return {
        estimatedDurationSeconds,
        difficulty,
        previewBlocks: blocks,
    };
}

export function summarizeZwoWorkoutSteps(steps: ZwoStep[]): WorkoutSummary {
    const blocks: WorkoutPreviewBlock[] = [];

    steps.forEach(step => {
        switch (step.type) {
            case "Warmup":
            case "Cooldown":
            case "Ramp":
                blocks.push({
                    durationSec: step.Duration,
                    startFactor: step.PowerLow,
                    endFactor: step.PowerHigh,
                });
                break;
            case "SteadyState":
                blocks.push({
                    durationSec: step.Duration,
                    startFactor: step.Power,
                    endFactor: step.Power,
                });
                break;
            case "IntervalsT":
                for (let repeat = 0; repeat < step.Repeat; repeat++) {
                    blocks.push({
                        durationSec: step.OnDuration,
                        startFactor: step.OnPower,
                        endFactor: step.OnPower,
                    });
                    blocks.push({
                        durationSec: step.OffDuration,
                        startFactor: step.OffPower,
                        endFactor: step.OffPower,
                    });
                }
                break;
            case "TextEvent":
                break;
            default:
                break;
        }
    });

    return summarizeBlocks(blocks);
}

export function summarizeDbWorkoutSteps(steps: DbStepLike[]): WorkoutSummary {
    const blocks: WorkoutPreviewBlock[] = [];

    steps.forEach(step => {
        switch (step.type) {
            case "Warmup":
            case "Cooldown":
            case "Ramp":
                blocks.push({
                    durationSec: step.duration ?? 0,
                    startFactor: step.power_low ?? 0,
                    endFactor: step.power_high ?? 0,
                });
                break;
            case "SteadyState":
                blocks.push({
                    durationSec: step.duration ?? 0,
                    startFactor: step.power ?? 0,
                    endFactor: step.power ?? 0,
                });
                break;
            case "IntervalsT":
                for (let repeat = 0; repeat < (step.repeat ?? 0); repeat++) {
                    blocks.push({
                        durationSec: step.on_duration ?? 0,
                        startFactor: step.on_power ?? 0,
                        endFactor: step.on_power ?? 0,
                    });
                    blocks.push({
                        durationSec: step.off_duration ?? 0,
                        startFactor: step.off_power ?? 0,
                        endFactor: step.off_power ?? 0,
                    });
                }
                break;
            case "TextEvent":
                break;
            default:
                break;
        }
    });

    return summarizeBlocks(blocks);
}

export function getWorkoutDifficultyLabel(difficulty: number): string {
    if (difficulty <= 1.5) {
        return "Lekki";
    }

    if (difficulty <= 2.5) {
        return "Umiarkowany";
    }

    if (difficulty <= 3.5) {
        return "Średni";
    }

    if (difficulty <= 4.5) {
        return "Ciężki";
    }

    return "Bardzo ciężki";
}
