import { serverEnv } from "@/env/env-server";
import { createOpenAI } from "@ai-sdk/openai";
import { OpenAI } from "openai";

export const client = new OpenAI({
    apiKey: serverEnv.OPENAI_API_KEY,
});

/** Dostawca modeli dla Vercel AI SDK (`streamText`, narzędzia itd.). */
export const openai = createOpenAI({
    apiKey: serverEnv.OPENAI_API_KEY ?? "",
});

export async function completion(prompt: string): Promise<string> {
    const response = await client.responses.create({
        model: "gpt-5.4-mini",
        input: prompt,
    });

    return response.output_text;
}

export async function completionJsonObject(
    systemPrompt: string,
    userPrompt: string,
): Promise<string> {
    const response = await client.chat.completions.create({
        model: "gpt-5.4-mini",
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: userPrompt,
            },
        ],
    });

    return response.choices[0]?.message?.content || "{}";
}
