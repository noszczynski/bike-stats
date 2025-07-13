'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface LoginData {
    email: string;
    password: string;
}

interface RegisterData {
    email: string;
    password: string;
    confirmPassword: string;
}

interface AuthResponse {
    message: string;
    user?: {
        id: string;
        email: string;
        hasStravaConnection: boolean;
    };
}

async function loginUser(data: LoginData): Promise<AuthResponse> {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
    }

    return response.json();
}

async function registerUser(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
    }

    return response.json();
}

async function logoutUser(): Promise<void> {
    const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to logout');
    }
}

export function useLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: loginUser,
        onSuccess: () => {
            // Invalidate auth status to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['auth-status'] });
        }
    });
}

export function useRegister() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            // Invalidate auth status to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['auth-status'] });
        }
    });
}

export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: logoutUser,
        onSuccess: () => {
            // Clear all queries and redirect
            queryClient.clear();
            window.location.href = '/login';
        }
    });
} 