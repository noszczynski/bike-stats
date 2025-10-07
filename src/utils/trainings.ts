import { Training } from "@/types/training";
import dayjs from "dayjs";
import isNil from "lodash/isNil";

export function filterTrainingsByDateRange({
    startDate,
    endDate
}: {
    startDate: dayjs.Dayjs, 
    endDate: dayjs.Dayjs
}): ((training: Training) => boolean) {  
    return function (training: Training) {
        return dayjs(training.date).isAfter(startDate) && dayjs(training.date).isBefore(endDate);
    }
}

export function getTrainingsBetweenDates({
    trainings,
    startDate,
    endDate
}: {
    trainings: Training[], startDate: dayjs.Dayjs, endDate: dayjs.Dayjs
}) {
    return [...trainings.filter(filterTrainingsByDateRange({ startDate, endDate }))];
}

export function getOnlyPastTrainings({
    trainings,
    anchorDate = dayjs()
}: {
    trainings: Training[],
    anchorDate: dayjs.Dayjs
}) {
    return trainings.filter(filterTrainingsByDateRange({
        startDate: dayjs("1970-01-01", "YYYY-MM-DD"),
        endDate: anchorDate
    }));
}

export function filterTrainingsWithFITFile(): ((training: Training) => boolean) {
    return function (training: Training) {
        return !isNil(training.fit_processed);
    }
}

export function filterTrainingsWithHeartRateData(): ((training: Training) => boolean) {
    return function (training: Training) {
        return !isNil(training.avg_heart_rate_bpm);
    }
}

export function filterTrainingsWithSpeedData(): ((training: Training) => boolean) {
    return function (training: Training) {
        return !isNil(training.avg_speed_kmh);
    }
}

export function getOnlyTrainingsWithFITFile({
    trainings,
}: {
    trainings: Training[],
}) {
    return trainings.filter(filterTrainingsWithFITFile());
}
