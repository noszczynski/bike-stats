import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function getAuthenticatedUser<T extends Prisma.UserSelect>(
    select?: T
): Promise<Prisma.UserGetPayload<{ select: T }> | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return null;
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
        } catch (error) {
            return null;
        }

        // Fetch user from database
        const user = await prisma.user.findUnique({
            where: { 
                id: decoded.userId
            },
            select: select || { id: true, email: true } as T
        });

        return user;
    } catch (error) {
        console.error('Error in getAuthenticatedUser:', error);
        return null;
    }
}

export async function getAuthenticatedUserId(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return null;
        }

        // Verify JWT token
        try {
            const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
            return decoded.userId;
        } catch (error) {
            return null;
        }
    } catch (error) {
        console.error('Error in getAuthenticatedUserId:', error);
        return null;
    }
} 