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
