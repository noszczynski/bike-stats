import { z } from 'zod';

/**
 * Server-side environment variables schema
 */
export const serverEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    STRAVA_CLIENT_ID: z.string().min(1),
    STRAVA_CLIENT_SECRET: z.string().min(1)
});

// For development debugging
if (process.env.NODE_ENV !== 'production') {
    console.log('Environment variables loaded:', {
        NODE_ENV: process.env.NODE_ENV,
        STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
        STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET
    });
}

/**
 * Server-side environment variables - all values that should be accessible only on the server
 */
export const serverEnv = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET
};

/**
 * Type-safe server environment variables
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validate that server-side environment variables are set
 * This function should be called when the server starts
 */
export function validateEnv() {
    try {
        const parsed = serverEnvSchema.safeParse(serverEnv);
        if (!parsed.success) {
            const errorMessages = parsed.error.issues
                .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                .join('\n');

            throw new Error(
                `❌ Invalid environment variables:\n${errorMessages}\n\nPlease check your .env file and make sure all required variables are set.`
            );
        }

        return parsed.data;
    } catch (error) {
        console.error('Environment validation error:', error);
        throw error;
    }
}
