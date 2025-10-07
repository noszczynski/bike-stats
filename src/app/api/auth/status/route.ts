import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        // If no token exists, user is not authenticated
        if (!token) {
            return NextResponse.json({ isAuthenticated: false });
        }

        // Verify JWT token
        try {
            const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
            
            // Check if user still exists in database
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    strava_user_id: true,
                    created_at: true
                }
            });

            if (!user) {
                // User doesn't exist anymore, clear cookie
                const response = NextResponse.json({ isAuthenticated: false });
                response.cookies.delete('token');
                
return response;
            }

            return NextResponse.json({ 
                isAuthenticated: true,
                user: {
                    id: user.id,
                    email: user.email,
                    hasStravaConnection: !!user.strava_user_id
                }
            });
        } catch (error) {
            // Token validation failed (expired or invalid)
            console.error('Token validation failed:', error);
            
            // Clear invalid cookie
            const response = NextResponse.json({ isAuthenticated: false });
            response.cookies.delete('token');
            
            return response;
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        
        return NextResponse.json({ isAuthenticated: false }, { status: 500 });
    }
} 