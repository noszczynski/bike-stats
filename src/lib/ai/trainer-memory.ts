import { client } from "@/lib/api/openai";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TRAINER_MEMORY_KINDS = ["preference", "goal_constraint"] as const;
const EMBEDDING_MODEL = "text-embedding-3-small";
const EXTRACTION_MODEL = "gpt-5.4-nano";
const RECONCILIATION_MODEL = "gpt-5.4-nano";
const EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_SEARCH_LIMIT = 3;
const INTERNAL_SEARCH_LIMIT = 6;
const DEFAULT_MAX_CHARACTERS = 500;
const MEMORY_CONTENT_MAX_LENGTH = 500;
const EXTRACTED_MEMORY_MAX_ITEMS = 3;
const REPLACEMENT_SIMILARITY_THRESHOLD = 0.78;

export const trainerMemoryKindSchema = z.enum(TRAINER_MEMORY_KINDS);
export type TrainerMemoryKind = z.infer<typeof trainerMemoryKindSchema>;

const searchTrainerMemorySchema = z.object({
    query: z.string().trim().min(1).max(240),
    kinds: z.array(trainerMemoryKindSchema).min(1).max(2).optional(),
    limit: z.number().int().min(1).max(3).optional(),
    maxCharacters: z.number().int().min(120).max(900).optional(),
});

const extractedMemorySchema = z.object({
    memories: z
        .array(
            z.object({
                content: z.string().trim().min(1).max(220),
                kind: trainerMemoryKindSchema,
            }),
        )
        .max(EXTRACTED_MEMORY_MAX_ITEMS),
});

const reconciliationSchema = z.object({
    action: z.enum(["insert", "skip", "replace"]),
    replaceMemoryId: z.string().uuid().nullable(),
    reason: z.string().trim().min(1).max(240),
});

type TrainerMemorySearchRow = {
    id: string;
    content: string;
    kind: TrainerMemoryKind;
    source: "auto";
    similarity: number;
    created_at: Date;
    updated_at: Date;
    last_used_at: Date | null;
};

type MemoryExchangeInput = {
    userId: string;
    userMessage: string;
    assistantReply: string;
};

type SaveTrainerMemoryInput = {
    userId: string;
    content: string;
    kind: TrainerMemoryKind;
};

type UpdateTrainerMemoryInput = {
    userId: string;
    memoryId: string;
    content: string;
    kind?: TrainerMemoryKind;
    confirm: boolean;
    latestUserMessage: string;
};

type DeleteTrainerMemoryInput = {
    userId: string;
    memoryId: string;
    confirm: boolean;
    latestUserMessage: string;
};

let infrastructureReadyPromise: Promise<void> | null = null;

function normalizeMemoryContent(content: string) {
    return content.replace(/\s+/g, " ").trim().slice(0, MEMORY_CONTENT_MAX_LENGTH);
}

function normalizeMemoryKey(content: string) {
    return normalizeMemoryContent(content).toLowerCase();
}

function normalizeConfirmationMessage(content: string) {
    return content
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function toVectorLiteral(embedding: number[]) {
    return `[${embedding.join(",")}]`;
}

function safeJsonParse(value: string) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function hasExplicitMemoryConfirmation(message: string, action: "edit" | "delete") {
    const normalized = normalizeConfirmationMessage(message);
    if (!normalized) return false;

    const genericConfirmationPhrases = ["potwierdzam", "zatwierdzam", "confirm"];
    if (genericConfirmationPhrases.some(phrase => normalized.includes(phrase))) {
        return true;
    }

    const actionPhrases =
        action === "edit"
            ? ["zmien", "edytuj", "popraw", "update"]
            : ["usun", "skasuj", "delete"];

    return actionPhrases.some(phrase => normalized.includes(phrase));
}

async function getActiveTrainerMemory(userId: string, memoryId: string) {
    return prisma.trainerMemory.findFirst({
        where: {
            id: memoryId,
            user_id: userId,
            is_active: true,
        },
        select: {
            id: true,
            content: true,
            kind: true,
            source: true,
            created_at: true,
            updated_at: true,
            last_used_at: true,
        },
    });
}

async function findExactActiveTrainerMemory(
    userId: string,
    kind: TrainerMemoryKind,
    content: string,
) {
    const normalizedCandidateKey = normalizeMemoryKey(content);
    const memories = await prisma.trainerMemory.findMany({
        where: {
            user_id: userId,
            kind,
            is_active: true,
        },
        select: {
            id: true,
            content: true,
            kind: true,
            source: true,
            created_at: true,
            updated_at: true,
        },
    });

    return (
        memories.find(memory => normalizeMemoryKey(memory.content) === normalizedCandidateKey) ?? null
    );
}

function formatKindList(kinds?: TrainerMemoryKind[]) {
    if (!kinds?.length) return "";

    const safeKinds = kinds.map(kind => `'${kind}'`).join(", ");
    return ` AND "kind" IN (${safeKinds})`;
}

async function ensureTrainerMemoryInfrastructure() {
    if (!infrastructureReadyPromise) {
        infrastructureReadyPromise = (async () => {
            await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
            await prisma.$executeRawUnsafe(
                `CREATE INDEX IF NOT EXISTS "trainer_memories_embedding_idx"
                 ON "trainer_memories"
                 USING ivfflat ("embedding" vector_cosine_ops)
                 WITH (lists = 100)`,
            );
        })().catch(error => {
            infrastructureReadyPromise = null;
            throw error;
        });
    }

    return infrastructureReadyPromise;
}

async function createEmbedding(input: string) {
    const normalizedInput = normalizeMemoryContent(input);
    const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: normalizedInput,
        dimensions: EMBEDDING_DIMENSIONS,
    });

    return response.data[0]?.embedding ?? [];
}

async function searchTrainerMemoriesByEmbedding({
    userId,
    embedding,
    kinds,
    limit = DEFAULT_SEARCH_LIMIT,
    maxCharacters = DEFAULT_MAX_CHARACTERS,
    touch = true,
}: {
    userId: string;
    embedding: number[];
    kinds?: TrainerMemoryKind[];
    limit?: number;
    maxCharacters?: number;
    touch?: boolean;
}) {
    if (!embedding.length) {
        return {
            count: 0,
            totalCharacters: 0,
            memories: [],
        };
    }

    await ensureTrainerMemoryInfrastructure();

    const query = `SELECT
            "id",
            "content",
            "kind"::text AS "kind",
            "source"::text AS "source",
            1 - ("embedding" <=> $1::vector) AS "similarity",
            "created_at",
            "updated_at",
            "last_used_at"
        FROM "trainer_memories"
        WHERE "user_id" = $2
          AND "is_active" = true
          AND "embedding" IS NOT NULL${formatKindList(kinds)}
        ORDER BY "embedding" <=> $1::vector ASC
        LIMIT ${Math.max(limit * 2, INTERNAL_SEARCH_LIMIT)}`;

    const rows = await prisma.$queryRawUnsafe<TrainerMemorySearchRow[]>(
        query,
        toVectorLiteral(embedding),
        userId,
    );

    const selected: Array<{
        id: string;
        content: string;
        kind: TrainerMemoryKind;
        source: "auto";
        similarity: number;
        createdAt: string;
        updatedAt: string;
        lastUsedAt: string | null;
    }> = [];
    let totalCharacters = 0;

    for (const row of rows) {
        const nextTotal = totalCharacters + row.content.length;
        if (selected.length > 0 && nextTotal > maxCharacters) {
            continue;
        }

        selected.push({
            id: row.id,
            content: row.content,
            kind: row.kind,
            source: row.source,
            similarity: Number(row.similarity.toFixed(4)),
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
            lastUsedAt: row.last_used_at?.toISOString() ?? null,
        });
        totalCharacters = nextTotal;

        if (selected.length >= limit) {
            break;
        }
    }

    if (touch && selected.length > 0) {
        await prisma.trainerMemory.updateMany({
            where: {
                id: {
                    in: selected.map(memory => memory.id),
                },
            },
            data: {
                last_used_at: new Date(),
            },
        });
    }

    return {
        count: selected.length,
        totalCharacters,
        memories: selected,
    };
}

async function extractTrainerMemoriesFromExchange({
    userMessage,
    assistantReply,
}: Omit<MemoryExchangeInput, "userId">) {
    const normalizedUserMessage = userMessage.trim();
    if (!normalizedUserMessage) {
        return [];
    }

    const response = await client.chat.completions.create({
        model: EXTRACTION_MODEL,
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: `Wyciągasz trwałą pamięć o zawodniku do czatu z trenerem rowerowym.
Zwracaj tylko trwałe fakty, które będą przydatne także w kolejnych rozmowach.
Źródłem faktów jest wyłącznie najnowsza wiadomość użytkownika. Odpowiedź asystenta służy tylko jako kontekst i nie wolno z niej wyciągać nowych faktów do pamięci.
Dozwolone typy:
- preference: preferencje stylu współpracy, sposobu planowania lub formy odpowiedzi
- goal_constraint: cele treningowe, ograniczenia, stałe założenia lub przeciwwskazania

Pomiń:
- jednorazowe prośby "na dziś"
- pytania bez deklaracji trwałej preferencji
- ogólniki bez wartości praktycznej
- fakty, których nie da się uznać za dość trwałe

Każdy wpis ma być:
- krótki i atomowy
- po polsku
- maksymalnie jedno zdanie
- zapisany w trzeciej osobie lub neutralnie, bez cytatów

Zwróć JSON o kształcie {"memories":[{"content":"...","kind":"preference|goal_constraint"}]}.`,
            },
            {
                role: "user",
                content: `Wiadomość użytkownika:
${normalizedUserMessage}

Odpowiedź asystenta:
${assistantReply.trim() || "(brak)"}`,
            },
        ],
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = extractedMemorySchema.safeParse(safeJsonParse(raw));

    if (!parsed.success) {
        console.error("Trainer memory extraction validation error:", parsed.error.flatten());
        return [];
    }

    const seen = new Set<string>();

    return parsed.data.memories
        .map(memory => ({
            ...memory,
            content: normalizeMemoryContent(memory.content),
        }))
        .filter(memory => {
            const key = `${memory.kind}:${memory.content.toLowerCase()}`;
            if (seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
}

async function reconcileTrainerMemory({
    candidate,
    relatedMemories,
}: {
    candidate: { content: string; kind: TrainerMemoryKind };
    relatedMemories: Array<{
        id: string;
        content: string;
        kind: TrainerMemoryKind;
        similarity: number;
    }>;
}) {
    const normalizedCandidate = candidate.content.toLowerCase();
    const exactMatch = relatedMemories.find(
        memory => memory.content.toLowerCase() === normalizedCandidate,
    );

    if (exactMatch) {
        return {
            action: "skip" as const,
            replaceMemoryId: null,
            reason: "duplicate",
        };
    }

    const closeMatches = relatedMemories.filter(
        memory => memory.similarity >= REPLACEMENT_SIMILARITY_THRESHOLD,
    );

    if (closeMatches.length === 0) {
        return {
            action: "insert" as const,
            replaceMemoryId: null,
            reason: "no relevant memory found",
        };
    }

    const response = await client.chat.completions.create({
        model: RECONCILIATION_MODEL,
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: `Porównujesz nowy wpis pamięci z istniejącymi wpisami.
Wybierz:
- insert: nowy wpis jest odrębny i warto go dodać
- skip: nowy wpis duplikuje istniejący wpis
- replace: nowy wpis zastępuje starszy, bo opisuje ten sam obszar, ale nowszą lub bardziej precyzyjną regułę

Zwróć JSON o kształcie {"action":"insert|skip|replace","replaceMemoryId":"uuid|null","reason":"krótki powód"}.
Jeśli wybierzesz replace, pole "replaceMemoryId" musi wskazywać dokładnie jeden wpis z listy.
Jeśli wybierzesz insert albo skip, pole "replaceMemoryId" ma być null.`,
            },
            {
                role: "user",
                content: JSON.stringify({
                    candidate,
                    relatedMemories: closeMatches,
                }),
            },
        ],
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = reconciliationSchema.safeParse(safeJsonParse(raw));

    if (!parsed.success) {
        console.error("Trainer memory reconciliation validation error:", parsed.error.flatten());
        return {
            action: "insert" as const,
            replaceMemoryId: null,
            reason: "fallback on invalid reconciliation payload",
        };
    }

    if (
        parsed.data.action === "replace" &&
        !closeMatches.some(memory => memory.id === parsed.data.replaceMemoryId)
    ) {
        return {
            action: "insert" as const,
            replaceMemoryId: null,
            reason: "replacement target not found in related memories",
        };
    }

    return parsed.data;
}

export async function searchTrainerMemories(input: {
    userId: string;
    query: string;
    kinds?: TrainerMemoryKind[];
    limit?: number;
    maxCharacters?: number;
}) {
    try {
        const parsed = searchTrainerMemorySchema.parse({
            query: input.query,
            kinds: input.kinds,
            limit: input.limit,
            maxCharacters: input.maxCharacters,
        });
        const embedding = await createEmbedding(parsed.query);

        return searchTrainerMemoriesByEmbedding({
            userId: input.userId,
            embedding,
            kinds: parsed.kinds,
            limit: parsed.limit,
            maxCharacters: parsed.maxCharacters,
            touch: true,
        });
    } catch (error) {
        console.error("Trainer memory search error:", error);
        return {
            count: 0,
            totalCharacters: 0,
            memories: [],
        };
    }
}

export async function saveTrainerMemory(input: SaveTrainerMemoryInput) {
    try {
        const candidate = {
            content: normalizeMemoryContent(input.content),
            kind: trainerMemoryKindSchema.parse(input.kind),
        };

        if (!candidate.content) {
            return {
                saved: false,
                action: "skip" as const,
                reason: "empty content",
                memory: null,
            };
        }

        await ensureTrainerMemoryInfrastructure();

        const exactMatch = await findExactActiveTrainerMemory(
            input.userId,
            candidate.kind,
            candidate.content,
        );
        if (exactMatch) {
            return {
                saved: false,
                action: "skip" as const,
                reason: "duplicate",
                memory: {
                    id: exactMatch.id,
                    content: exactMatch.content,
                    kind: exactMatch.kind,
                    source: exactMatch.source,
                    createdAt: exactMatch.created_at.toISOString(),
                },
            };
        }

        const embedding = await createEmbedding(candidate.content);
        if (!embedding.length) {
            return {
                saved: false,
                action: "skip" as const,
                reason: "embedding generation failed",
                memory: null,
            };
        }

        const related = await searchTrainerMemoriesByEmbedding({
            userId: input.userId,
            embedding,
            kinds: [candidate.kind],
            limit: 3,
            maxCharacters: 1200,
            touch: false,
        });

        const decision = await reconcileTrainerMemory({
            candidate,
            relatedMemories: related.memories.map(memory => ({
                id: memory.id,
                content: memory.content,
                kind: memory.kind,
                similarity: memory.similarity,
            })),
        });

        if (decision.action === "skip") {
            return {
                saved: false,
                action: "skip" as const,
                reason: decision.reason,
                memory: null,
            };
        }

        const createdMemory = await prisma.$transaction(async tx => {
            if (decision.action === "replace" && decision.replaceMemoryId) {
                await tx.trainerMemory.update({
                    where: { id: decision.replaceMemoryId },
                    data: { is_active: false },
                });
            }

            const created = await tx.trainerMemory.create({
                data: {
                    user_id: input.userId,
                    kind: candidate.kind,
                    source: "auto",
                    content: candidate.content,
                },
            });

            await tx.$executeRawUnsafe(
                `UPDATE "trainer_memories"
                 SET "embedding" = $1::vector
                 WHERE "id" = $2`,
                toVectorLiteral(embedding),
                created.id,
            );

            return created;
        });

        return {
            saved: true,
            action: decision.action,
            reason: decision.reason,
            memory: {
                id: createdMemory.id,
                content: createdMemory.content,
                kind: createdMemory.kind,
                source: createdMemory.source,
                createdAt: createdMemory.created_at.toISOString(),
            },
        };
    } catch (error) {
        console.error("Trainer memory save error:", error);

        return {
            saved: false,
            action: "skip" as const,
            reason: "save failed",
            memory: null,
        };
    }
}

export async function updateTrainerMemory(input: UpdateTrainerMemoryInput) {
    try {
        const currentMemory = await getActiveTrainerMemory(input.userId, input.memoryId);
        if (!currentMemory) {
            return {
                updated: false,
                requiresConfirmation: false,
                reason: "memory not found",
                currentMemory: null,
                updatedMemory: null,
            };
        }

        const nextContent = normalizeMemoryContent(input.content);
        const nextKind = input.kind ?? currentMemory.kind;

        if (!input.confirm) {
            return {
                updated: false,
                requiresConfirmation: true,
                reason: "explicit user confirmation required",
                currentMemory: {
                    id: currentMemory.id,
                    content: currentMemory.content,
                    kind: currentMemory.kind,
                },
                proposedMemory: {
                    content: nextContent,
                    kind: nextKind,
                },
                updatedMemory: null,
            };
        }

        if (!hasExplicitMemoryConfirmation(input.latestUserMessage, "edit")) {
            return {
                updated: false,
                requiresConfirmation: true,
                reason: "latest user message does not contain explicit confirmation",
                currentMemory: {
                    id: currentMemory.id,
                    content: currentMemory.content,
                    kind: currentMemory.kind,
                },
                proposedMemory: {
                    content: nextContent,
                    kind: nextKind,
                },
                updatedMemory: null,
            };
        }

        if (!nextContent) {
            return {
                updated: false,
                requiresConfirmation: false,
                reason: "empty content",
                currentMemory: {
                    id: currentMemory.id,
                    content: currentMemory.content,
                    kind: currentMemory.kind,
                },
                updatedMemory: null,
            };
        }

        if (nextContent === currentMemory.content && nextKind === currentMemory.kind) {
            return {
                updated: false,
                requiresConfirmation: false,
                reason: "no changes detected",
                currentMemory: {
                    id: currentMemory.id,
                    content: currentMemory.content,
                    kind: currentMemory.kind,
                },
                updatedMemory: {
                    id: currentMemory.id,
                    content: currentMemory.content,
                    kind: currentMemory.kind,
                    source: currentMemory.source,
                    updatedAt: currentMemory.updated_at.toISOString(),
                },
            };
        }

        await ensureTrainerMemoryInfrastructure();

        const embedding = await createEmbedding(nextContent);
        if (!embedding.length) {
            return {
                updated: false,
                requiresConfirmation: false,
                reason: "embedding generation failed",
                currentMemory: {
                    id: currentMemory.id,
                    content: currentMemory.content,
                    kind: currentMemory.kind,
                },
                updatedMemory: null,
            };
        }

        const updatedMemory = await prisma.$transaction(async tx => {
            const updated = await tx.trainerMemory.update({
                where: { id: currentMemory.id },
                data: {
                    content: nextContent,
                    kind: nextKind,
                },
            });

            await tx.$executeRawUnsafe(
                `UPDATE "trainer_memories"
                 SET "embedding" = $1::vector
                 WHERE "id" = $2`,
                toVectorLiteral(embedding),
                updated.id,
            );

            return updated;
        });

        return {
            updated: true,
            requiresConfirmation: false,
            reason: "memory updated",
            currentMemory: {
                id: currentMemory.id,
                content: currentMemory.content,
                kind: currentMemory.kind,
            },
            updatedMemory: {
                id: updatedMemory.id,
                content: updatedMemory.content,
                kind: updatedMemory.kind,
                source: updatedMemory.source,
                updatedAt: updatedMemory.updated_at.toISOString(),
            },
        };
    } catch (error) {
        console.error("Trainer memory update error:", error);
        return {
            updated: false,
            requiresConfirmation: false,
            reason: "update failed",
            currentMemory: null,
            updatedMemory: null,
        };
    }
}

export async function deleteTrainerMemory(input: DeleteTrainerMemoryInput) {
    try {
        const currentMemory = await getActiveTrainerMemory(input.userId, input.memoryId);
        if (!currentMemory) {
            return {
                deleted: false,
                requiresConfirmation: false,
                reason: "memory not found",
                memory: null,
            };
        }

        if (!input.confirm) {
            return {
                deleted: false,
                requiresConfirmation: true,
                reason: "explicit user confirmation required",
                memory: {
                    id: currentMemory.id,
                    content: currentMemory.content,
                    kind: currentMemory.kind,
                },
            };
        }

        if (!hasExplicitMemoryConfirmation(input.latestUserMessage, "delete")) {
            return {
                deleted: false,
                requiresConfirmation: true,
                reason: "latest user message does not contain explicit confirmation",
                memory: {
                    id: currentMemory.id,
                    content: currentMemory.content,
                    kind: currentMemory.kind,
                },
            };
        }

        await prisma.trainerMemory.delete({
            where: { id: currentMemory.id },
        });

        return {
            deleted: true,
            requiresConfirmation: false,
            reason: "memory deleted",
            memory: {
                id: currentMemory.id,
                content: currentMemory.content,
                kind: currentMemory.kind,
            },
        };
    } catch (error) {
        console.error("Trainer memory delete error:", error);
        return {
            deleted: false,
            requiresConfirmation: false,
            reason: "delete failed",
            memory: null,
        };
    }
}

export async function storeTrainerMemoryFromExchange(input: MemoryExchangeInput) {
    try {
        const candidates = await extractTrainerMemoriesFromExchange(input);
        if (candidates.length === 0) {
            return {
                extracted: 0,
                stored: 0,
                skipped: 0,
                replaced: 0,
            };
        }

        let stored = 0;
        let skipped = 0;
        let replaced = 0;

        for (const candidate of candidates) {
            const result = await saveTrainerMemory({
                userId: input.userId,
                content: candidate.content,
                kind: candidate.kind,
            });

            if (!result.saved) {
                skipped += 1;
                continue;
            }

            stored += 1;
            if (result.action === "replace") {
                replaced += 1;
            }
        }

        return {
            extracted: candidates.length,
            stored,
            skipped,
            replaced,
        };
    } catch (error) {
        console.error("Trainer memory storage error:", error);

        return {
            extracted: 0,
            stored: 0,
            skipped: 0,
            replaced: 0,
        };
    }
}
