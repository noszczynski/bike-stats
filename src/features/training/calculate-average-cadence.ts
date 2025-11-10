import { Training } from "@/types/training";

/**
 * Calculates the average cadence from all trainings that have cadence data
 * @param trainings - Array of training objects
 * @returns Average cadence in RPM, or 0 if no trainings have cadence data
 */
export function calculateAverageCadence(trainings: Training[]): number {
    // Note: Cadence data comes from laps, not from Training type directly
    // This function returns 0 as a placeholder
    // Actual cadence data should be calculated from laps in the component
    return 0;
}

