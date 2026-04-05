"use client";

import { useCallback, useState } from "react";

export function useChatAI() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState("");

    const sendMessage = useCallback(async (message: string, conversationId: string | null) => {
        setIsStreaming(true);
        setStreamingText("");

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                message,
                ...(conversationId ? { conversationId } : {}),
            }),
        });

        const resolvedConversationId = response.headers.get("X-Conversation-Id");

        if (!response.ok) {
            setIsStreaming(false);
            setStreamingText("");
            const errText =
                response.status === 401
                    ? "Sesja wygasła. Zaloguj się ponownie."
                    : "Nie udało się uzyskać odpowiedzi. Spróbuj ponownie.";
            throw new Error(errText);
        }

        if (!resolvedConversationId) {
            setIsStreaming(false);
            setStreamingText("");
            throw new Error("Brak identyfikatora konwersacji w odpowiedzi serwera.");
        }

        const reader = response.body?.getReader();
        if (!reader) {
            setIsStreaming(false);
            setStreamingText("");
            throw new Error("Brak treści odpowiedzi.");
        }

        const decoder = new TextDecoder();
        let fullText = "";

        try {
            let streamDone = false;
            while (!streamDone) {
                const chunk = await reader.read();
                streamDone = chunk.done;
                if (chunk.value) {
                    fullText += decoder.decode(chunk.value, { stream: true });
                    setStreamingText(fullText);
                }
            }
        } finally {
            setIsStreaming(false);
            setStreamingText("");
        }

        return { text: fullText, conversationId: resolvedConversationId };
    }, []);

    return {
        sendMessage,
        isStreaming,
        streamingText,
    };
}
