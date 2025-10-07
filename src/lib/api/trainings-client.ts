import { PaginationOptions, TrainingFilters, TrainingsResponse } from './trainings';

/**
 * Fetch trainings from the API with filters and pagination
 */
export async function fetchTrainings(
    filters: TrainingFilters = {},
    pagination: PaginationOptions = { page: 1, pageSize: 10 }
): Promise<TrainingsResponse> {
    // Construct the query string
    const params = new URLSearchParams();

    // Add filter parameters
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.type) params.append('type', filters.type);
    if (filters.minDistance !== undefined) params.append('minDistance', filters.minDistance.toString());
    if (filters.maxDistance !== undefined) params.append('maxDistance', filters.maxDistance.toString());
    if (filters.minHeartRate !== undefined) params.append('minHeartRate', filters.minHeartRate.toString());
    if (filters.maxHeartRate !== undefined) params.append('maxHeartRate', filters.maxHeartRate.toString());
    if (filters.minSpeed !== undefined) params.append('minSpeed', filters.minSpeed.toString());
    if (filters.maxSpeed !== undefined) params.append('maxSpeed', filters.maxSpeed.toString());
    if (filters.minElevation !== undefined) params.append('minElevation', filters.minElevation.toString());
    if (filters.maxElevation !== undefined) params.append('maxElevation', filters.maxElevation.toString());
    if (filters.minTime !== undefined) params.append('minTime', filters.minTime.toString());
    if (filters.maxTime !== undefined) params.append('maxTime', filters.maxTime.toString());
    if (filters.hasHeartRateData !== undefined) params.append('hasHeartRateData', filters.hasHeartRateData.toString());
    if (filters.hasFitData !== undefined) params.append('hasFitData', filters.hasFitData.toString());
    if (filters.tagIds && filters.tagIds.length > 0) {
        filters.tagIds.forEach(tagId => params.append('tagIds', tagId));
    }

    // Add pagination parameters
    if (pagination.page) params.append('page', pagination.page.toString());
    if (pagination.pageSize) params.append('pageSize', pagination.pageSize.toString());

    // Make the request
    const response = await fetch(`/api/trainings?${params.toString()}`);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch trainings');
    }

    return response.json();
}
