export const timeStringToMinutes = (timeStr: string): number => {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);

    return hours * 60 + minutes + seconds / 60;
};

export const minutesToTimeString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    const seconds = Math.round((minutes % 1) * 60);

    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
