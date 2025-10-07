import { NextRequest, NextResponse } from 'next/server';

import { PaginationOptions, TrainingFilters, getAllTrainings } from '@/lib/api/trainings';

export async function GET(request: NextRequest) {
    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);

        // Parse filter params
        const filters: TrainingFilters = {};
        if (searchParams.has('startDate')) filters.startDate = searchParams.get('startDate') as string;
        if (searchParams.has('endDate')) filters.endDate = searchParams.get('endDate') as string;
        if (searchParams.has('type')) filters.type = searchParams.get('type') as string;
        if (searchParams.has('minDistance')) filters.minDistance = Number(searchParams.get('minDistance'));
        if (searchParams.has('maxDistance')) filters.maxDistance = Number(searchParams.get('maxDistance'));
        if (searchParams.has('minHeartRate')) filters.minHeartRate = Number(searchParams.get('minHeartRate'));
        if (searchParams.has('maxHeartRate')) filters.maxHeartRate = Number(searchParams.get('maxHeartRate'));
        if (searchParams.has('minSpeed')) filters.minSpeed = Number(searchParams.get('minSpeed'));
        if (searchParams.has('maxSpeed')) filters.maxSpeed = Number(searchParams.get('maxSpeed'));
        if (searchParams.has('minElevation')) filters.minElevation = Number(searchParams.get('minElevation'));
        if (searchParams.has('maxElevation')) filters.maxElevation = Number(searchParams.get('maxElevation'));
        if (searchParams.has('minTime')) filters.minTime = Number(searchParams.get('minTime'));
        if (searchParams.has('maxTime')) filters.maxTime = Number(searchParams.get('maxTime'));
        if (searchParams.has('hasHeartRateData')) filters.hasHeartRateData = searchParams.get('hasHeartRateData') === 'true';
        if (searchParams.has('hasFitData')) filters.hasFitData = searchParams.get('hasFitData') === 'true';
        
        // Handle tagIds array
        const tagIds = searchParams.getAll('tagIds');
        if (tagIds.length > 0) {
            filters.tagIds = tagIds;
        }

        // Parse pagination params
        const pagination: PaginationOptions = {
            page: searchParams.has('page') ? Number(searchParams.get('page')) : 1,
            pageSize: searchParams.has('pageSize') ? Number(searchParams.get('pageSize')) : 10
        };

        // Get trainings from database
        const trainingsData = await getAllTrainings(filters, pagination);

        return NextResponse.json(trainingsData);
    } catch (error: any) {
        console.error('Error fetching trainings:', error);

        return NextResponse.json({ error: error.message || 'Failed to fetch trainings' }, { status: 500 });
    }
}
