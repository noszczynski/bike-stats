import {
    trainerMemoryKindSchema,
    updateTrainerMemory,
} from "@/lib/ai/trainer-memory";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { z } from "zod";

const inputSchema = z.object({
    memory_id: z.string().uuid().describe("ID wpisu pamięci do edycji."),
    content: z
        .string()
        .trim()
        .min(1)
        .max(220)
        .describe("Nowa treść trwałego wpisu pamięci."),
    kind: trainerMemoryKindSchema
        .optional()
        .describe("Opcjonalna zmiana typu pamięci na preference albo goal_constraint."),
    confirm: z
        .boolean()
        .describe(
            "Ustaw false, aby przygotować podgląd zmiany i poprosić użytkownika o potwierdzenie. Ustaw true dopiero po jego wyraźnym potwierdzeniu.",
        ),
});

export function createEditTrainerMemoryTool(userId: string, latestUserMessage: string) {
    return createLoggedTool({
        name: "edit_trainer_memory",
        description:
            "Edytuje istniejący wpis trwałej pamięci użytkownika. Ta akcja wymaga wyraźnego potwierdzenia użytkownika, więc najpierw pokaż plan zmiany i poproś o potwierdzenie.",
        inputSchema,
        execute: async input =>
            updateTrainerMemory({
                userId,
                latestUserMessage,
                memoryId: input.memory_id,
                content: input.content,
                kind: input.kind,
                confirm: input.confirm,
            }),
    });
}
