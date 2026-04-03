"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_FTP_WATTS, getZoneForWatts, POWER_ZONES, PowerZone } from "@/lib/zwo/power-zones";
import { ZwoStep } from "@/lib/zwo/types";

type ChartBlock = {
    id: string;
    label: string;
    startSec: number;
    durationSec: number;
    startFactor: number;
    endFactor: number;
    startWatts: number;
    endWatts: number;
    avgWatts: number;
    zone: PowerZone;
    isRamp: boolean;
};

type WorkoutTimelineProps = {
    steps: ZwoStep[];
    ftpWatts?: number;
};

const CHART_HEIGHT = 200;
const MAX_POWER_FACTOR = 1.5;

function toMinutes(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m}:00` : `${m}:${String(s).padStart(2, "0")}`;
}

function expandBlocks(steps: ZwoStep[], ftpWatts: number): ChartBlock[] {
    let currentOffset = 0;
    const blocks: ChartBlock[] = [];

    const pushBlock = (
        id: string,
        label: string,
        durationSec: number,
        startFactor: number,
        endFactor: number,
        isRamp: boolean,
    ) => {
        if (durationSec <= 0) return;

        const startWatts = Math.round(startFactor * ftpWatts);
        const endWatts = Math.round(endFactor * ftpWatts);
        const avgWatts = Math.round(((startFactor + endFactor) / 2) * ftpWatts);

        blocks.push({
            id,
            label,
            startSec: currentOffset,
            durationSec,
            startFactor,
            endFactor,
            startWatts,
            endWatts,
            avgWatts,
            zone: getZoneForWatts(avgWatts, ftpWatts),
            isRamp,
        });

        currentOffset += durationSec;
    };

    steps.forEach((step, stepIndex) => {
        if (step.type === "Warmup" || step.type === "Cooldown" || step.type === "Ramp") {
            pushBlock(
                `${step.type}-${stepIndex}`,
                step.type,
                step.Duration,
                step.PowerLow,
                step.PowerHigh,
                true,
            );
            return;
        }

        if (step.type === "SteadyState") {
            pushBlock(
                `${step.type}-${stepIndex}`,
                step.type,
                step.Duration,
                step.Power,
                step.Power,
                false,
            );
            return;
        }

        if (step.type === "IntervalsT") {
            for (let repeat = 0; repeat < step.Repeat; repeat++) {
                const i = repeat + 1;
                pushBlock(
                    `IntervalsT-${stepIndex}-on-${i}`,
                    `Interwał ${i} ON`,
                    step.OnDuration,
                    step.OnPower,
                    step.OnPower,
                    false,
                );
                pushBlock(
                    `IntervalsT-${stepIndex}-off-${i}`,
                    `Interwał ${i} OFF`,
                    step.OffDuration,
                    step.OffPower,
                    step.OffPower,
                    false,
                );
            }
        }
    });

    return blocks;
}

function zoneColorHex(colorClass: string): string {
    const map: Record<string, string> = {
        "bg-sky-500": "#0ea5e9",
        "bg-emerald-500": "#10b981",
        "bg-yellow-500": "#eab308",
        "bg-orange-500": "#f97316",
        "bg-rose-500": "#f43f5e",
    };
    return map[colorClass] ?? "#94a3b8";
}

type TooltipState = {
    x: number;
    y: number;
    block: ChartBlock;
} | null;

export function WorkoutTimeline({ steps, ftpWatts = DEFAULT_FTP_WATTS }: WorkoutTimelineProps) {
    const blocks = expandBlocks(steps, ftpWatts);
    const totalDuration = blocks.reduce((sum, b) => sum + b.durationSec, 0);
    const [tooltip, setTooltip] = useState<TooltipState>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    if (blocks.length === 0 || totalDuration <= 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Wizualizacja mocy w czasie</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">
                        Dodaj moduły z czasem i mocą, aby zobaczyć wykres.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const totalMinutes = Math.round(totalDuration / 60);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Wizualizacja mocy w czasie</CardTitle>
                <CardDescription>
                    FTP: {ftpWatts} W · Czas łączny: {totalMinutes} min
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {POWER_ZONES.map(zone => (
                            <div
                                key={zone.id}
                                className="flex items-center gap-1.5 rounded-md border px-2 py-1"
                            >
                                <div
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: zoneColorHex(zone.colorClass) }}
                                />
                                <span className="text-xs">{zone.name}</span>
                            </div>
                        ))}
                    </div>

                    <div
                        ref={containerRef}
                        className="relative w-full overflow-x-auto"
                        onMouseLeave={() => setTooltip(null)}
                    >
                        <svg
                            viewBox={`0 0 1000 ${CHART_HEIGHT}`}
                            preserveAspectRatio="none"
                            className="w-full"
                            style={{ height: CHART_HEIGHT, display: "block" }}
                        >
                            <defs>
                                {blocks
                                    .filter(b => b.isRamp)
                                    .map(block => {
                                        const startColor = zoneColorHex(
                                            getZoneForWatts(block.startWatts, ftpWatts).colorClass,
                                        );
                                        const endColor = zoneColorHex(
                                            getZoneForWatts(block.endWatts, ftpWatts).colorClass,
                                        );
                                        return (
                                            <linearGradient
                                                key={`grad-${block.id}`}
                                                id={`grad-${block.id}`}
                                                x1="0"
                                                y1="0"
                                                x2="1"
                                                y2="0"
                                            >
                                                <stop offset="0%" stopColor={startColor} />
                                                <stop offset="100%" stopColor={endColor} />
                                            </linearGradient>
                                        );
                                    })}
                            </defs>

                            {blocks.map(block => {
                                const xFraction = block.startSec / totalDuration;
                                const widthFraction = block.durationSec / totalDuration;
                                const x = xFraction * 1000;
                                const w = widthFraction * 1000;

                                const startH =
                                    (Math.min(block.startFactor, MAX_POWER_FACTOR) /
                                        MAX_POWER_FACTOR) *
                                    CHART_HEIGHT;
                                const endH =
                                    (Math.min(block.endFactor, MAX_POWER_FACTOR) /
                                        MAX_POWER_FACTOR) *
                                    CHART_HEIGHT;

                                const fill = block.isRamp
                                    ? `url(#grad-${block.id})`
                                    : zoneColorHex(block.zone.colorClass);

                                if (block.isRamp) {
                                    const points = [
                                        `${x},${CHART_HEIGHT}`,
                                        `${x},${CHART_HEIGHT - startH}`,
                                        `${x + w},${CHART_HEIGHT - endH}`,
                                        `${x + w},${CHART_HEIGHT}`,
                                    ].join(" ");

                                    return (
                                        <polygon
                                            key={block.id}
                                            points={points}
                                            fill={fill}
                                            opacity={0.9}
                                            onMouseMove={e => {
                                                const rect =
                                                    containerRef.current?.getBoundingClientRect();
                                                if (!rect) return;
                                                setTooltip({
                                                    x: e.clientX - rect.left,
                                                    y: e.clientY - rect.top,
                                                    block,
                                                });
                                            }}
                                            onMouseLeave={() => setTooltip(null)}
                                            className="cursor-pointer"
                                        />
                                    );
                                }

                                const barH = startH;
                                const y = CHART_HEIGHT - barH;

                                return (
                                    <rect
                                        key={block.id}
                                        x={x}
                                        y={y}
                                        width={w}
                                        height={barH}
                                        fill={fill}
                                        opacity={0.9}
                                        onMouseMove={e => {
                                            const rect =
                                                containerRef.current?.getBoundingClientRect();
                                            if (!rect) return;
                                            setTooltip({
                                                x: e.clientX - rect.left,
                                                y: e.clientY - rect.top,
                                                block,
                                            });
                                        }}
                                        onMouseLeave={() => setTooltip(null)}
                                        className="cursor-pointer"
                                    />
                                );
                            })}
                        </svg>

                        {tooltip && (
                            <div
                                className="bg-popover text-popover-foreground pointer-events-none absolute z-10 rounded-md border px-3 py-2 text-xs shadow-md"
                                style={{
                                    left: tooltip.x + 12,
                                    top: tooltip.y - 10,
                                    transform:
                                        tooltip.x > (containerRef.current?.clientWidth ?? 0) / 2
                                            ? "translateX(-110%)"
                                            : undefined,
                                }}
                            >
                                <p className="font-semibold">{tooltip.block.label}</p>
                                <p className="text-muted-foreground">
                                    {toMinutes(tooltip.block.startSec)} →{" "}
                                    {toMinutes(tooltip.block.startSec + tooltip.block.durationSec)}
                                </p>
                                <p>
                                    {tooltip.block.isRamp
                                        ? `${tooltip.block.startWatts} → ${tooltip.block.endWatts} W`
                                        : `${tooltip.block.avgWatts} W`}
                                </p>
                                <p className="text-muted-foreground">{tooltip.block.zone.name}</p>
                            </div>
                        )}
                    </div>

                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>0:00</span>
                        <span>{toMinutes(Math.round(totalDuration / 2))}</span>
                        <span>{toMinutes(totalDuration)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
