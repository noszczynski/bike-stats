import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = loginSchema.parse(body);

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Verify password
        const isValidPassword = await compare(password, user.password);

        if (!isValidPassword) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create JWT token
        const token = sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

        // Set HTTP-only cookie
        const response = NextResponse.json({ success: true }, { status: 200 });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
