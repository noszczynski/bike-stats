/** Convert string like: "01:23:25" to { "hours": 1, "minutes": 23, "seconds": 25, label: "1h 23min 25s" } */
export function timeStringToObject(str: string): {
    hours: number;
    minutes: number;
    seconds: number;
    label: string;
} {
    const [hours, minutes, seconds] = str.split(":").map(Number);

    return {
        hours,
        minutes,
        seconds,
        label: `${hours}h ${minutes}min ${seconds}s`,
    };
}
