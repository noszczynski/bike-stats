import { deleteTrainerMemory } from "@/lib/ai/trainer-memory";
import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import { z } from "zod";

const inputSchema = z.object({
    memory_id: z.string().uuid().describe("ID wpisu pamięci do usunięcia."),
    confirm: z
        .boolean()
        .describe(
            "Ustaw false, aby przygotować podgląd usunięcia i poprosić użytkownika o potwierdzenie. Ustaw true dopiero po jego wyraźnym potwierdzeniu.",
        ),
});

export function createDeleteTrainerMemoryTool(userId: string, latestUserMessage: string) {
    return createLoggedTool({
        name: "delete_trainer_memory",
        description:
            "Usuwa aktywny wpis trwałej pamięci użytkownika. Ta akcja wymaga wyraźnego potwierdzenia użytkownika, więc najpierw pokaż, co zostanie usunięte, i dopiero po potwierdzeniu wykonaj operację.",
        inputSchema,
        execute: async input =>
            deleteTrainerMemory({
                userId,
                latestUserMessage,
                memoryId: input.memory_id,
                confirm: input.confirm,
            }),
    });
}
