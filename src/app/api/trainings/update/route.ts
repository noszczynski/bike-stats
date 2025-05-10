import { NextResponse } from 'next/server';

import { updateTrainings as updateTrainingsDb } from '@/lib/api/trainings';

export async function POST(request: Request) {
    try {
        const { accessToken, refreshToken } = await request.json();

        if (!accessToken || !refreshToken) {
            return NextResponse.json({ error: 'Access token and refresh token are required' }, { status: 400 });
        }

        const result = await updateTrainingsDb(accessToken, refreshToken);

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Error updating trainings:', error);

        return NextResponse.json({ error: 'Failed to update trainings' }, { status: 500 });
    }
}
