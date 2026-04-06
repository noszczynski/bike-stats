import {
    searchTrainerMemories,
    trainerMemoryKindSchema,
} from "@/lib/ai/trainer-memory";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { z } from "zod";

const inputSchema = z.object({
    query: z
        .string()
        .trim()
        .min(1)
        .max(240)
        .describe("Czego szukasz w trwałej pamięci użytkownika, np. preferencje, cele lub ograniczenia."),
    kinds: z
        .array(trainerMemoryKindSchema)
        .min(1)
        .max(2)
        .optional()
        .describe("Opcjonalne zawężenie do preference lub goal_constraint."),
    limit: z.number().int().min(1).max(3).optional().describe("Domyślnie 3, maksymalnie 3."),
});

export function createSearchTrainerMemoryTool(userId: string) {
    return createLoggedTool({
        name: "search_trainer_memory",
        description:
            "Wyszukuje w trwałej pamięci użytkownika zapisane preferencje, cele i ograniczenia. Użyj tylko wtedy, gdy pytanie dotyczy wcześniejszych ustaleń, preferowanego stylu współpracy albo długoterminowych celów i ograniczeń.",
        inputSchema,
        execute: async input => {
            const result = await searchTrainerMemories({
                userId,
                query: input.query,
                kinds: input.kinds,
                limit: input.limit,
            });

            return {
                ...result,
                usage:
                    "Uwzględnij tylko wpisy realnie pasujące do pytania. Jeśli pamięć jest słabo dopasowana, potraktuj ją ostrożnie albo ją zignoruj.",
            };
        },
    });
}
