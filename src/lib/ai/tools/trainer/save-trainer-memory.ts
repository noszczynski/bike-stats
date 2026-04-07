import {
    saveTrainerMemory,
    trainerMemoryKindSchema,
} from "@/lib/ai/trainer-memory";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { z } from "zod";

const inputSchema = z.object({
    content: z
        .string()
        .trim()
        .min(1)
        .max(220)
        .describe("Krótki, trwały fakt do zapamiętania o użytkowniku."),
    kind: trainerMemoryKindSchema.describe(
        "Typ pamięci: preference dla preferencji lub goal_constraint dla celu albo ograniczenia.",
    ),
});

export function createSaveTrainerMemoryTool(userId: string) {
    return createLoggedTool({
        name: "save_trainer_memory",
        description:
            "Zapisuje trwałą pamięć użytkownika, gdy użytkownik jasno komunikuje preferencję, cel albo ograniczenie, które powinno być pamiętane w kolejnych rozmowach. Nie używaj do jednorazowych próśb na dziś.",
        inputSchema,
        execute: async input => saveTrainerMemory({ userId, ...input }),
    });
}
