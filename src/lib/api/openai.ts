import { serverEnv } from '@/env/env-server';

import { OpenAI } from 'openai';

export const client = new OpenAI({
    apiKey: serverEnv.OPENAI_API_KEY
});

export async function completion(prompt: string): Promise<string> {
    const response = await client.responses.create({
        model: 'gpt-4.1',
        input: prompt
    });

    return response.output_text;
}
