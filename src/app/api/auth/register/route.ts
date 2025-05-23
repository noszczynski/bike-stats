import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import { hash } from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = registerSchema.parse(body);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            }
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
    } catch (error) {
        console.error('Registration error:', error);

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
