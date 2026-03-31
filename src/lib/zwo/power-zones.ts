export const DEFAULT_FTP_WATTS = 160;

export type PowerZone = {
    id: number;
    name: string;
    minFactor: number;
    maxFactor: number;
    colorClass: string;
};

export const POWER_ZONES: PowerZone[] = [
    {
        id: 1,
        name: "Z1 Regeneracja",
        minFactor: 0,
        maxFactor: 0.55,
        colorClass: "bg-sky-500",
    },
    {
        id: 2,
        name: "Z2 Wytrzymałość",
        minFactor: 0.55,
        maxFactor: 0.75,
        colorClass: "bg-emerald-500",
    },
    {
        id: 3,
        name: "Z3 Tempo",
        minFactor: 0.75,
        maxFactor: 0.9,
        colorClass: "bg-yellow-500",
    },
    {
        id: 4,
        name: "Z4 Próg",
        minFactor: 0.9,
        maxFactor: 1.05,
        colorClass: "bg-orange-500",
    },
    {
        id: 5,
        name: "Z5 VO2max+",
        minFactor: 1.05,
        maxFactor: 3,
        colorClass: "bg-rose-500",
    },
];

export function getZoneForFactor(factor: number): PowerZone {
    return (
        POWER_ZONES.find(zone => factor > zone.minFactor && factor <= zone.maxFactor) ||
        POWER_ZONES[POWER_ZONES.length - 1]
    );
}

export function getZoneForWatts(watts: number, ftpWatts: number): PowerZone {
    if (ftpWatts <= 0) {
        return POWER_ZONES[0];
    }

    return getZoneForFactor(watts / ftpWatts);
}
