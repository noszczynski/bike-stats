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

const RESULT_PREVIEW_MAX_ITEMS = 3;
const RESULT_PREVIEW_MAX_KEYS = 3;
const RESULT_PREVIEW_STRING_MAX = 80;

function shallowPreviewForLog(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value === "string") {
        return value.length > RESULT_PREVIEW_STRING_MAX
            ? `${value.slice(0, RESULT_PREVIEW_STRING_MAX)}…`
            : value;
    }
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value === "bigint") return value.toString();
    if (Array.isArray(value)) {
        return value.length === 0 ? "[]" : `[${value.length} elementów]`;
    }
    if (typeof value === "object") return "[object]";
    return String(value);
}

function pickObjectPreview(obj: Record<string, unknown>): {
    preview: Record<string, unknown>;
    extraKeys: number;
} {
    const keys = Object.keys(obj);
    const pickedKeys = keys.slice(0, RESULT_PREVIEW_MAX_KEYS);
    const preview: Record<string, unknown> = {};
    for (const k of pickedKeys) {
        preview[k] = shallowPreviewForLog(obj[k]);
    }
    return { preview, extraKeys: Math.max(0, keys.length - pickedKeys.length) };
}

function serializeToolResultPreview(result: unknown): string {
    try {
        if (result === undefined) return "undefined";
        if (result === null) return "null";

        if (Array.isArray(result)) {
            const slice = result.slice(0, RESULT_PREVIEW_MAX_ITEMS);
            const parts: string[] = [];
            for (const item of slice) {
                if (item !== null && typeof item === "object" && !Array.isArray(item)) {
                    const { preview, extraKeys } = pickObjectPreview(item as Record<string, unknown>);
                    let s = JSON.stringify(preview);
                    if (extraKeys > 0) s += ` (+${extraKeys} pól)`;
                    parts.push(s);
                } else {
                    parts.push(JSON.stringify(shallowPreviewForLog(item)));
                }
            }
            const base = `[${parts.join(", ")}]`;
            const rest = result.length - slice.length;
            return rest > 0 ? `${base} (+${rest} więcej)` : base;
        }

        if (typeof result === "object") {
            const { preview, extraKeys } = pickObjectPreview(result as Record<string, unknown>);
            let s = JSON.stringify(preview);
            if (extraKeys > 0) s += ` (+${extraKeys} pól)`;
            return s;
        }

        return JSON.stringify(shallowPreviewForLog(result));
    } catch {
        return "[nie można podsumować wyniku]";
    }
}

function logToolStart(name: string, input: unknown) {
    console.info(
        `${TOOL_COLORS.cyan}[AI tool]${TOOL_COLORS.reset} ${TOOL_COLORS.yellow}${name}${TOOL_COLORS.reset} ${TOOL_COLORS.dim}input:${TOOL_COLORS.reset} ${serializeToolInput(input)}`,
    );
}

function logToolSuccess(name: string, result: unknown) {
    console.info(
        `${TOOL_COLORS.cyan}[AI tool]${TOOL_COLORS.reset} ${TOOL_COLORS.green}${name}${TOOL_COLORS.reset} dane zostaly pobrane. ${TOOL_COLORS.dim}wynik:${TOOL_COLORS.reset} ${serializeToolResultPreview(result)}`,
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
                logToolSuccess(name, result);
                return result;
            } catch (error) {
                logToolFailure(name, error);
                throw error;
            }
        }) as never,
    });
}
