import { z } from "zod";

/**
 * Client-side environment variables schema
 */
export const clientEnvSchema = z.object({
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_API_URL: z.string().url(),
});

/**
 * Client-side environment variables - all values that should be exposed to the client
 */
export const clientEnv = clientEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

/**
 * Type-safe client environment variables
 */
export type ClientEnv = z.infer<typeof clientEnvSchema>;
