"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatAI } from "@/hooks/use-chat-ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, MessageSquarePlus, Send, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
};

type ConversationRow = {
    id: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
};

const markdownChatComponents = {
    h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="mb-3 text-lg font-bold">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="mb-2 text-base font-semibold">{children}</h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
        <p className="mb-2 leading-relaxed">{children}</p>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="mb-2 space-y-1 pl-4">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="mb-2 list-decimal space-y-1 pl-4">{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
        <li className="ml-1 list-disc">{children}</li>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
    code: ({ children }: { children?: React.ReactNode }) => (
        <code className="bg-accent rounded px-1 py-0.5 font-mono text-xs">{children}</code>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="border-accent my-2 border-l-2 pl-3 italic">{children}</blockquote>
    ),
};

export default function ChatPage() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    /** Prawda tylko po wyborze rozmowy z listy — unika race z zapisem asystenta przy pierwszej wiadomości. */
    const [loadFromServer, setLoadFromServer] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const { sendMessage, isStreaming, streamingText } = useChatAI();

    const { data: conversationsPayload } = useQuery({
        queryKey: ["conversations"],
        queryFn: async () => {
            const response = await fetch("/api/conversations", { credentials: "include" });
            if (!response.ok) {
                throw new Error("Nie udało się pobrać listy rozmów.");
            }
            return response.json() as Promise<{ conversations: ConversationRow[] }>;
        },
    });

    const conversations = useMemo(
        () => conversationsPayload?.conversations ?? [],
        [conversationsPayload],
    );

    const loadMessages = useCallback(async (conversationId: string) => {
        const response = await fetch(`/api/conversations/${conversationId}`, {
            credentials: "include",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
            messages: Array<{
                id: string;
                role: "user" | "assistant";
                content: string;
                createdAt: string;
            }>;
        };
        setMessages(
            data.messages.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.createdAt),
            })),
        );
    }, []);

    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            return;
        }
        if (!loadFromServer) {
            return;
        }
        let cancelled = false;
        void (async () => {
            await loadMessages(activeConversationId);
            if (cancelled) return;
        })();
        return () => {
            cancelled = true;
        };
    }, [activeConversationId, loadFromServer, loadMessages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingText, isStreaming]);

    const formatTime = (date: Date) =>
        new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(date);

    const startNewChat = () => {
        setLoadFromServer(false);
        setActiveConversationId(null);
        setMessages([]);
    };

    const selectConversation = (id: string) => {
        setLoadFromServer(true);
        setActiveConversationId(id);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isStreaming) return;

        const userMessage: Message = {
            id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-u`,
            content: text,
            role: "user",
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");

        try {
            const { text: assistantText, conversationId } = await sendMessage(
                text,
                activeConversationId,
            );

            if (!activeConversationId) {
                setLoadFromServer(false);
                setActiveConversationId(conversationId);
            }

            setMessages(prev => [
                ...prev,
                {
                    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-a`,
                    content: assistantText,
                    role: "assistant",
                    timestamp: new Date(),
                },
            ]);

            await queryClient.invalidateQueries({ queryKey: ["conversations"] });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.";
            setMessages(prev => [
                ...prev,
                {
                    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-e`,
                    content: msg,
                    role: "assistant",
                    timestamp: new Date(),
                },
            ]);
        }
    };

    return (
        <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl flex-col gap-3 md:flex-row md:gap-4">
            <Card className="flex max-h-44 flex-shrink-0 flex-col md:max-h-none md:w-64 md:shrink-0">
                <CardHeader className="pb-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={startNewChat}
                    >
                        <MessageSquarePlus className="size-4" />
                        Nowa rozmowa
                    </Button>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 pt-0">
                    <ScrollArea className="h-28 md:h-[calc(100vh-12rem)]">
                        <nav className="flex flex-row gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-x-visible">
                            {conversations.map(c => (
                                <Button
                                    key={c.id}
                                    type="button"
                                    variant={activeConversationId === c.id ? "secondary" : "ghost"}
                                    className="h-auto shrink-0 justify-start text-left whitespace-normal md:w-full"
                                    onClick={() => selectConversation(c.id)}
                                >
                                    <span className="line-clamp-2 text-sm">
                                        {c.title?.trim() ||
                                            new Intl.DateTimeFormat("pl-PL", {
                                                dateStyle: "short",
                                                timeStyle: "short",
                                            }).format(new Date(c.updatedAt))}
                                    </span>
                                </Button>
                            ))}
                        </nav>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card className="flex min-h-0 min-w-0 flex-1 flex-col">
                <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        Chat z AI Trenerem
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
                    <ScrollArea className="min-h-0 flex-1">
                        <div className="space-y-4 p-2 md:p-4">
                            {messages.length === 0 && !isStreaming && (
                                <div className="text-muted-foreground py-8 text-center">
                                    <Bot className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                    <p>Witaj! Jestem Twoim AI trenerem.</p>
                                    <p className="text-sm">
                                        Pytaj o treningi — pobiorę tylko potrzebne dane z Twojego
                                        profilu i historii aktywności.
                                    </p>
                                </div>
                            )}

                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex items-start gap-3 ${
                                        msg.role === "user" ? "flex-row-reverse" : ""
                                    }`}
                                >
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback>
                                            {msg.role === "user" ? (
                                                <User className="h-4 w-4" />
                                            ) : (
                                                <Bot className="h-4 w-4" />
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div
                                        className={`max-w-[min(100%,36rem)] ${msg.role === "user" ? "text-right" : ""}`}
                                    >
                                        <div
                                            className={`rounded-lg p-3 ${
                                                msg.role === "user"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                            }`}
                                        >
                                            {msg.role === "user" ? (
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {msg.content}
                                                </p>
                                            ) : (
                                                <div className="prose prose-sm max-w-none text-sm">
                                                    <ReactMarkdown
                                                        components={markdownChatComponents}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            {formatTime(msg.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {isStreaming && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback>
                                            <Bot className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted max-w-[min(100%,36rem)] rounded-lg p-3">
                                        {!streamingText && (
                                            <p className="text-muted-foreground text-sm">
                                                Korzystam z danych treningowych (narzędzia) lub
                                                generuję odpowiedź…
                                            </p>
                                        )}
                                        {streamingText ? (
                                            <div className="prose prose-sm max-w-none text-sm">
                                                <ReactMarkdown components={markdownChatComponents}>
                                                    {streamingText}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="mt-2 flex gap-1">
                                                <div className="h-2 w-2 animate-bounce rounded-full bg-current" />
                                                <div
                                                    className="h-2 w-2 animate-bounce rounded-full bg-current"
                                                    style={{ animationDelay: "0.1s" }}
                                                />
                                                <div
                                                    className="h-2 w-2 animate-bounce rounded-full bg-current"
                                                    style={{ animationDelay: "0.2s" }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    <div className="shrink-0 space-y-2">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Napisz wiadomość…"
                                disabled={isStreaming}
                                className="flex-1"
                            />
                            <SubmitButton
                                type="submit"
                                disabled={!input.trim()}
                                isLoading={isStreaming}
                                loadingText=""
                            >
                                <Send className="h-4 w-4" />
                            </SubmitButton>
                        </form>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                            Korzystając z czatu wyrażasz zgodę na przetwarzanie przez OpenAI treści
                            rozmowy oraz danych treningowych i zdrowotnych pobieranych w jej toku w
                            celu wygenerowania odpowiedzi, zgodnie z{" "}
                            <a
                                href="https://openai.com/policies/privacy-policy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground underline underline-offset-2"
                            >
                                polityką prywatności OpenAI
                            </a>
                            .
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
