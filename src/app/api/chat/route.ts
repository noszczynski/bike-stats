import { NextRequest, NextResponse } from 'next/server';
import { completion } from '@/lib/api/openai';
import { getAuthenticatedUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type ActivityData = {
    id: string;
    name: string | null;
    date: Date | null;
    distance_m: number | null;
    moving_time_s: number | null;
    avg_speed_kmh: number | null;
    type: string;
    avg_heart_rate_bpm: number | null;
    max_heart_rate_bpm: number | null;
};

// In-memory storage for conversation context and call counts
const conversationContexts = new Map<string, {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    callCount: number;
    authorizedDataTypes: Set<string>;
}>();

const MAX_CALLS_PER_CONVERSATION = 10;

export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, conversationId } = await request.json();

        if (!message || !conversationId) {
            return NextResponse.json({ error: 'Message and conversationId are required' }, { status: 400 });
        }

        // Get or create conversation context
        let context = conversationContexts.get(conversationId);
        if (!context) {
            context = {
                messages: [],
                callCount: 0,
                authorizedDataTypes: new Set()
            };
            conversationContexts.set(conversationId, context);
        }

        // Check call limit
        if (context.callCount >= MAX_CALLS_PER_CONVERSATION) {
            return NextResponse.json({ 
                error: 'Osiągnięto maksymalną liczbę wywołań dla tej konwersacji (10)' 
            }, { status: 429 });
        }

        context.callCount++;

        // Add user message to context
        context.messages.push({ role: 'user', content: message });

        // Build system prompt with available data context
        let systemPrompt = `Jesteś AI trenerem pomagającym analizować dane treningowe. 

WAŻNE ZASADY:
1. Odpowiadaj zawsze w języku polskim
2. Jeśli potrzebujesz danych treningowych, poproś o dostęp używając funkcji requestDataAccess
3. Bazuj analizy tylko na autoryzowanych danych
4. Bądź pomocny, profesjonalny i skupiony na treningach
5. Nie udzielaj porad medycznych - tylko treningowe
6. **FORMATOWANIE**: Używaj Markdown do formatowania odpowiedzi:
   - **Pogrubienie** dla ważnych informacji
   - *Kursywa* dla akcentów
   - ## Nagłówki dla sekcji
   - ### Podsekcje dla kategorii
   - - Listy punktowane dla wyliczenia
   - \`kod\` dla konkretnych wartości i metryk

Dostępne typy danych treningowych:
- basic: podstawowe info (nazwa, data, dystans, czas)
- performance: wydajność (tempo, prędkość, tętno)
- detailed: szczegółowe (punkty trasy, przewyższenia)
- tags: tagi i kategorie treningów

Obecnie autoryzowane typy danych: ${Array.from(context.authorizedDataTypes).join(', ') || 'brak'}`;

        // If user has authorized data access, fetch relevant data
        let activityData: ActivityData[] = [];
        if (context.authorizedDataTypes.has('basic') || context.authorizedDataTypes.has('performance')) {
            try {
                const activities = await prisma.activity.findMany({
                    where: { user_id: userId },
                    orderBy: { created_at: 'desc' },
                    take: 20, // Limit to recent activities
                    include: {
                        strava_activity: {
                            select: {
                                name: true,
                                date: true,
                                distance_m: true,
                                moving_time_s: true,
                                avg_speed_kmh: true,
                                ...(context.authorizedDataTypes.has('performance') && {
                                    avg_heart_rate_bpm: true,
                                    max_heart_rate_bpm: true,
                                    elevation_gain_m: true
                                })
                            }
                        }
                    }
                });
                
                activityData = activities.map(activity => ({
                    id: activity.id,
                    name: activity.strava_activity?.name || null,
                    date: activity.strava_activity?.date || null,
                    distance_m: activity.strava_activity?.distance_m || null,
                    moving_time_s: activity.strava_activity?.moving_time_s || null,
                    avg_speed_kmh: activity.strava_activity?.avg_speed_kmh ? Number(activity.strava_activity.avg_speed_kmh) : null,
                    type: activity.type,
                    avg_heart_rate_bpm: activity.strava_activity?.avg_heart_rate_bpm || null,
                    max_heart_rate_bpm: activity.strava_activity?.max_heart_rate_bpm || null
                }));
            } catch (error) {
                console.error('Error fetching activity data:', error);
            }
        }

        // Add activity data context if available
        if (activityData.length > 0) {
            systemPrompt += `\n\nDostępne dane treningowe użytkownika (ostatnie ${activityData.length} aktywności):\n`;
            systemPrompt += activityData.map(a => {
                const name = a.name || 'Bez nazwy';
                const date = a.date ? a.date.toLocaleDateString('pl-PL') : 'Brak daty';
                const distance = a.distance_m ? `${(a.distance_m / 1000).toFixed(1)}km` : 'Brak dystansu';
                const time = a.moving_time_s ? `${Math.round(a.moving_time_s / 60)}min` : 'Brak czasu';
                const speed = a.avg_speed_kmh ? `${a.avg_speed_kmh.toFixed(1)}km/h` : '';
                const hr = context.authorizedDataTypes.has('performance') && a.avg_heart_rate_bpm ? `, śr. HR: ${a.avg_heart_rate_bpm}bpm` : '';
                
                return `- ${name} (${date}): ${distance}, ${time}, ${a.type}${speed ? `, ${speed}` : ''}${hr}`;
            }).join('\n');
        }

        // Build full prompt with conversation history
        const conversationHistory = context.messages.map(msg => 
            `${msg.role === 'user' ? 'Użytkownik' : 'AI'}: ${msg.content}`
        ).join('\n');

        const fullPrompt = `${systemPrompt}\n\nHistoria konwersacji:\n${conversationHistory}\n\nOdpowiedź AI:`;

        // Check if AI needs data access and user hasn't authorized yet
        const needsBasicData = fullPrompt.toLowerCase().includes('trening') || 
                              fullPrompt.toLowerCase().includes('dystans') ||
                              fullPrompt.toLowerCase().includes('czas') ||
                              fullPrompt.toLowerCase().includes('analiz');
        
        if (needsBasicData && !context.authorizedDataTypes.has('basic')) {
            const waitingResponse = 'Aby przeanalizować Twoje treningi, potrzebuję dostępu do danych. Proszę o zgodę w okienku powyżej.';
            
            context.messages.push({ role: 'assistant', content: waitingResponse });
            
            return NextResponse.json({ 
                message: waitingResponse,
                callCount: context.callCount,
                maxCalls: MAX_CALLS_PER_CONVERSATION,
                dataAccessRequested: true
            });
        }

        // Get AI response
        const aiResponse = await completion(fullPrompt);

        // Add AI response to context
        context.messages.push({ role: 'assistant', content: aiResponse });

        // Clean up old conversations (optional)
        if (conversationContexts.size > 100) {
            const oldestKey = conversationContexts.keys().next().value;
            if (oldestKey) {
                conversationContexts.delete(oldestKey);
            }
        }

        return NextResponse.json({ 
            message: aiResponse,
            callCount: context.callCount,
            maxCalls: MAX_CALLS_PER_CONVERSATION
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json({ 
            error: 'Wystąpił błąd podczas przetwarzania wiadomości' 
        }, { status: 500 });
    }
}

// Endpoint for handling data access authorization
export async function PUT(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { conversationId, dataTypes, granted } = await request.json();

        if (!conversationId) {
            return NextResponse.json({ error: 'ConversationId is required' }, { status: 400 });
        }

        const context = conversationContexts.get(conversationId);
        if (!context) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        if (granted && dataTypes) {
            dataTypes.forEach((type: string) => context.authorizedDataTypes.add(type));
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Data access authorization error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}