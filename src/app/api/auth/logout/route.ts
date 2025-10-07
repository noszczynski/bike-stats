import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // Create response and clear the authentication token
        const response = NextResponse.json({ success: true }, { status: 200 });
        
        // Clear the JWT token cookie
        response.cookies.delete('token');
        
        return response;
    } catch (error) {
        console.error('Logout error:', error);
        
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 