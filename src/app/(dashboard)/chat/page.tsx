"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatAI } from "@/hooks/use-chat-ai";
import { AlertTriangle, Bot, Send, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

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

export default function ChatPage() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [dataAccessRequests, setDataAccessRequests] = useState<DataAccessRequest[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { sendMessage, respondToDataAccessRequest, isLoading } = useChatAI({
        onMessage: (newMessage: Message) => {
            setMessages(prev => [...prev, newMessage]);
        },
        onDataAccessRequest: (request: DataAccessRequest) => {
            setDataAccessRequests(prev => [...prev, request]);
        },
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: message,
            role: "user",
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setMessage("");

        await sendMessage(message);
    };

    const handleDataAccessResponse = (requestId: string, granted: boolean) => {
        const request = dataAccessRequests.find(req => req.id === requestId);

        setDataAccessRequests(prev =>
            prev.map(req => (req.id === requestId ? { ...req, pending: false } : req)),
        );

        if (request) {
            respondToDataAccessRequest(requestId, granted, request.dataTypes);
        }
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    return (
        <div className="container mx-auto h-[calc(100vh-8rem)] max-w-4xl">
            <Card className="flex h-full flex-col">
                <CardHeader className="flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        Chat z AI Trenerem
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
                    {/* Data Access Requests */}
                    <div className="flex-shrink-0 space-y-4">
                        {dataAccessRequests
                            .filter(req => req.pending)
                            .map(request => (
                                <Alert key={request.id}>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">
                                                AI prosi o dostęp do danych:
                                            </p>
                                            <p className="text-muted-foreground text-sm">
                                                {request.description}
                                            </p>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                Typy danych: {request.dataTypes.join(", ")}
                                            </p>
                                        </div>
                                        <div className="ml-4 flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    handleDataAccessResponse(request.id, true)
                                                }
                                            >
                                                Pozwól
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    handleDataAccessResponse(request.id, false)
                                                }
                                            >
                                                Odmów
                                            </Button>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            ))}
                    </div>

                    {/* Messages */}
                    <ScrollArea className="min-h-0 flex-1">
                        <div className="space-y-4 p-4">
                            {messages.length === 0 && (
                                <div className="text-muted-foreground py-8 text-center">
                                    <Bot className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                    <p>Witaj! Jestem Twoim AI trenerem.</p>
                                    <p className="text-sm">
                                        Mogę pomóc Ci analizować treningi, dawać rady i odpowiadać
                                        na pytania.
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
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarFallback>
                                            {msg.role === "user" ? (
                                                <User className="h-4 w-4" />
                                            ) : (
                                                <Bot className="h-4 w-4" />
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div
                                        className={`max-w-[80%] ${msg.role === "user" ? "text-right" : ""}`}
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
                                                        components={{
                                                            h2: ({ children }) => (
                                                                <h2 className="mb-3 text-lg font-bold">
                                                                    {children}
                                                                </h2>
                                                            ),
                                                            h3: ({ children }) => (
                                                                <h3 className="mb-2 text-base font-semibold">
                                                                    {children}
                                                                </h3>
                                                            ),
                                                            p: ({ children }) => (
                                                                <p className="mb-2 leading-relaxed">
                                                                    {children}
                                                                </p>
                                                            ),
                                                            ul: ({ children }) => (
                                                                <ul className="mb-2 space-y-1 pl-4">
                                                                    {children}
                                                                </ul>
                                                            ),
                                                            ol: ({ children }) => (
                                                                <ol className="mb-2 list-decimal space-y-1 pl-4">
                                                                    {children}
                                                                </ol>
                                                            ),
                                                            li: ({ children }) => (
                                                                <li className="ml-1 list-disc">
                                                                    {children}
                                                                </li>
                                                            ),
                                                            strong: ({ children }) => (
                                                                <strong className="font-semibold">
                                                                    {children}
                                                                </strong>
                                                            ),
                                                            em: ({ children }) => (
                                                                <em className="italic">
                                                                    {children}
                                                                </em>
                                                            ),
                                                            code: ({ children }) => (
                                                                <code className="bg-accent rounded px-1 py-0.5 font-mono text-xs">
                                                                    {children}
                                                                </code>
                                                            ),
                                                            blockquote: ({ children }) => (
                                                                <blockquote className="border-accent my-2 border-l-2 pl-3 italic">
                                                                    {children}
                                                                </blockquote>
                                                            ),
                                                        }}
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

                            {isLoading && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarFallback>
                                            <Bot className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted rounded-lg p-3">
                                        <div className="flex gap-1">
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
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* Input Form */}
                    <div className="flex-shrink-0">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Napisz wiadomość..."
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button type="submit" disabled={isLoading || !message.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
