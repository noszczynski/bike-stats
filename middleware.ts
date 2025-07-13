import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    
    // Define protected routes
    const protectedRoutes = [
        '/profile',
        '/trainings',
        '/'
    ];
    
    // Check if the current path is protected
    const isProtectedRoute = protectedRoutes.some(route => 
        request.nextUrl.pathname === route || 
        request.nextUrl.pathname.startsWith(`${route}/`)
    );
    
    // If it's a protected route and no token exists, redirect to login
    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // If token exists, verify it
    if (token) {
        try {
            verify(token, process.env.JWT_SECRET || 'your-secret-key');
        } catch (error) {
            // Token is invalid, clear it and redirect to login for protected routes
            if (isProtectedRoute) {
                const response = NextResponse.redirect(new URL('/login', request.url));
                response.cookies.delete('token');
                
                return response;
            }
        }
    }
    
    // Allow access to auth routes when not authenticated
    const authRoutes = ['/login', '/register'];
    if (authRoutes.includes(request.nextUrl.pathname) && token) {
        try {
            verify(token, process.env.JWT_SECRET || 'your-secret-key');
            // User is authenticated, redirect to dashboard
            return NextResponse.redirect(new URL('/', request.url));
        } catch (error) {
            // Token is invalid, clear it and allow access to auth routes
            const response = NextResponse.next();
            response.cookies.delete('token');
            
            return response;
        }
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}; 