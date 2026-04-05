import { tool } from "ai";
import { z } from "zod";

const TOOL_COLORS = {
    reset: "\x1b[0m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    dim: "\x1b[2m",
} as const;

function serializeToolInput(input: unknown): string {
    try {
        return JSON.stringify(input ?? {}, null, 2);
    } catch {
        return '"[unserializable input]"';
    }
}

function logToolStart(name: string, input: unknown) {
    console.info(
        `${TOOL_COLORS.cyan}[AI tool]${TOOL_COLORS.reset} ${TOOL_COLORS.yellow}${name}${TOOL_COLORS.reset} ${TOOL_COLORS.dim}input:${TOOL_COLORS.reset} ${serializeToolInput(input)}`,
    );
}

function logToolSuccess(name: string) {
    console.info(
        `${TOOL_COLORS.cyan}[AI tool]${TOOL_COLORS.reset} ${TOOL_COLORS.green}${name}${TOOL_COLORS.reset} dane zostaly pobrane.`,
    );
}

function logToolFailure(name: string, error: unknown) {
    console.error(
        `${TOOL_COLORS.cyan}[AI tool]${TOOL_COLORS.reset} ${TOOL_COLORS.red}${name}${TOOL_COLORS.reset} blad podczas pobierania danych.`,
        error,
    );
}

export function createLoggedTool<TInputSchema extends z.ZodTypeAny, TResult>({
    name,
    description,
    inputSchema,
    execute,
}: {
    name: string;
    description: string;
    inputSchema: TInputSchema;
    execute: (input: z.infer<TInputSchema>) => Promise<TResult>;
}) {
    return tool({
        description,
        inputSchema: inputSchema as never,
        execute: (async (input: unknown) => {
            logToolStart(name, input);

            try {
                const result = await execute(input as z.infer<TInputSchema>);
                logToolSuccess(name);
                return result;
            } catch (error) {
                logToolFailure(name, error);
                throw error;
            }
        }) as never,
    });
}
