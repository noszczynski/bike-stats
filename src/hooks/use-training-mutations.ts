'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface ImportTrainingData {
    name: string;
    distance: number;
    elevation_gain: number;
    moving_time: number;
    elapsed_time: number;
    average_speed: number;
    max_speed: number;
    date: string;
    average_heartrate?: number;
    max_heartrate?: number;
    suffer_score?: number;
}

interface UpdateTrainingData {
    name?: string;
    notes?: string;
    heart_rate_zone_1?: number;
    heart_rate_zone_2?: number;
    heart_rate_zone_3?: number;
    heart_rate_zone_4?: number;
    heart_rate_zone_5?: number;
    heart_rate_zones?: {
        zone_1?: string;
        zone_2?: string;
        zone_3?: string;
        zone_4?: string;
        zone_5?: string;
    };
    device?: string;
    battery_percent_usage?: number;
    effort?: number;
}

interface FitUploadData {
    file: File;
}

interface GenerateDescriptionResponse {
    description: string;
}

async function importTraining(data: ImportTrainingData): Promise<{ message: string }> {
    const response = await fetch('/api/trainings/import', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import training');
    }

    return response.json();
}

async function updateTraining(trainingId: string, data: UpdateTrainingData): Promise<{ message: string }> {
    const response = await fetch(`/api/trainings/${trainingId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update training');
    }

    return response.json();
}

async function uploadFitFile(trainingId: string, data: FitUploadData): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('file', data.file);

    const response = await fetch(`/api/trainings/${trainingId}/fit-upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload FIT file');
    }

    return response.json();
}

async function checkFitFileExists(trainingId: string): Promise<{ exists: boolean }> {
    const response = await fetch(`/api/trainings/${trainingId}/fit-upload`);
    
    if (!response.ok) {
        throw new Error('Failed to check FIT file existence');
    }
    
    return response.json();
}

async function generateDescription(trainingId: string): Promise<GenerateDescriptionResponse> {
    const response = await fetch(`/api/trainings/${trainingId}/description/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate description');
    }

    return response.json();
}

async function removeFitData(trainingId: string): Promise<{ message: string; deleted: { trackpoints: number; laps: number } }> {
    const response = await fetch(`/api/trainings/${trainingId}/fit-upload`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove FIT data');
    }

    return response.json();
}

export function useImportTraining() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: importTraining,
        onSuccess: () => {
            // Invalidate trainings to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['trainings'] });
        }
    });
}

export function useUpdateTraining() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ trainingId, data }: { trainingId: string; data: UpdateTrainingData }) => 
            updateTraining(trainingId, data),
        onSuccess: (_, { trainingId }) => {
            // Invalidate specific training and trainings list
            queryClient.invalidateQueries({ queryKey: ['training', trainingId] });
            queryClient.invalidateQueries({ queryKey: ['trainings'] });
        }
    });
}

export function useUploadFitFile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ trainingId, data }: { trainingId: string; data: FitUploadData }) => 
            uploadFitFile(trainingId, data),
        onSuccess: (_, { trainingId }) => {
            // Invalidate training-related queries
            queryClient.invalidateQueries({ queryKey: ['training', trainingId] });
            queryClient.invalidateQueries({ queryKey: ['trackpoints', trainingId] });
            queryClient.invalidateQueries({ queryKey: ['heart-rate-zones-suggestion', trainingId] });
            queryClient.invalidateQueries({ queryKey: ['fit-file-exists', trainingId] });
        }
    });
}

export function useCheckFitFileExists(trainingId: string) {
    return useQuery({
        queryKey: ['fit-file-exists', trainingId],
        queryFn: () => checkFitFileExists(trainingId),
        enabled: !!trainingId,
        staleTime: 30 * 1000, // 30 seconds
        retry: false
    });
}

export function useGenerateDescription() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: generateDescription,
        onSuccess: (_, trainingId) => {
            // Invalidate training to trigger refetch with new description
            queryClient.invalidateQueries({ queryKey: ['training', trainingId] });
            queryClient.invalidateQueries({ queryKey: ['trainings'] });
        }
    });
} 

export function useRemoveFitData() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: removeFitData,
        onSuccess: (_, trainingId) => {
            // Invalidate training-related queries
            queryClient.invalidateQueries({ queryKey: ['training', trainingId] });
            queryClient.invalidateQueries({ queryKey: ['trackpoints', trainingId] });
            queryClient.invalidateQueries({ queryKey: ['heart-rate-zones-suggestion', trainingId] });
            queryClient.invalidateQueries({ queryKey: ['fit-file-exists', trainingId] });
            queryClient.invalidateQueries({ queryKey: ['trainings'] });
        }
    });
} 