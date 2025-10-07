"use client";

import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";

type Message = {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
};

type DataAccessRequest = {
    id: string;
    description: string;
    dataTypes: string[];
    pending: boolean;
};

type UseChatAIProps = {
    onMessage: (message: Message) => void;
    onDataAccessRequest: (request: DataAccessRequest) => void;
};

export function useChatAI({ onMessage, onDataAccessRequest }: UseChatAIProps) {
    const conversationIdRef = useRef<string>(Date.now().toString());

    const chatMutation = useMutation({
        mutationFn: async (message: string) => {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message,
                    conversationId: conversationIdRef.current,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }

            return response.json();
        },
        onSuccess: data => {
            // Handle successful response
            if (data.dataAccessRequested) {
                // Simulate data access request (in real app this would come via socket)
                setTimeout(() => {
                    onDataAccessRequest({
                        id: Date.now().toString(),
                        description: "AI chce przeanalizować Twoje podstawowe dane treningowe",
                        dataTypes: ["basic"],
                        pending: true,
                    });
                }, 500);
            }

            // Add AI message
            const aiMessage: Message = {
                id: Date.now().toString(),
                content: data.message,
                role: "assistant",
                timestamp: new Date(),
            };
            onMessage(aiMessage);
        },
        onError: error => {
            console.error("Chat error:", error);
            const errorMessage: Message = {
                id: Date.now().toString(),
                content: "Przepraszam, wystąpił błąd podczas przetwarzania Twojej wiadomości.",
                role: "assistant",
                timestamp: new Date(),
            };
            onMessage(errorMessage);
        },
    });

    const sendMessage = async (message: string) => {
        await chatMutation.mutateAsync(message);
    };

    const respondToDataAccessRequest = async (
        requestId: string,
        granted: boolean,
        dataTypes?: string[],
    ) => {
        try {
            await fetch("/api/chat", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    conversationId: conversationIdRef.current,
                    dataTypes: granted ? dataTypes : [],
                    granted,
                }),
            });

            // If access was granted, show success message
            if (granted) {
                const successMessage: Message = {
                    id: Date.now().toString(),
                    content:
                        "Dziękuję! Dostęp do danych został przyznany. Teraz mogę przeanalizować Twoje treningi.",
                    role: "assistant",
                    timestamp: new Date(),
                };
                onMessage(successMessage);
            }
        } catch (error) {
            console.error("Error responding to data access request:", error);
        }
    };

    return {
        sendMessage,
        respondToDataAccessRequest,
        isLoading: chatMutation.isPending,
        error: chatMutation.error,
        isConnected: true, // Simplified for now
    };
}
