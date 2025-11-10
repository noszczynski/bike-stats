import { Training } from "@/types/training";

/**
 * Calculates the average power from all trainings that have power data
 * @param trainings - Array of training objects
 * @returns Average power in watts, or 0 if no trainings have power data
 */
export function calculateAveragePower(trainings: Training[]): number {
    // Note: Power data comes from laps, not from Training type directly
    // This function returns 0 as a placeholder
    // Actual power data should be calculated from laps in the component
    return 0;
}

