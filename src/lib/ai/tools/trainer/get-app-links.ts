import { createLoggedTool } from "@/lib/ai/tools/logged-tool";
import {
    APP_AUX_LINKS,
    APP_DYNAMIC_ROUTE_TEMPLATES,
    APP_MAIN_NAV_LINKS,
} from "@/lib/app-navigation";
import { z } from "zod";

const inputSchema = z.object({});

function normalizeOrigin(url: string | undefined): string | null {
    if (!url?.trim()) return null;
    return url.replace(/\/$/, "");
}

function toMarkdownLink(title: string, path: string, origin: string | null): string {
    const href = origin ? `${origin}${path}` : path;
    return `[${title}](${href})`;
}

export function createGetAppLinksTool() {
    return createLoggedTool({
        name: "get_app_links",
        description:
            "Zwraca mapę ścieżek i gotowe przykłady markdown z klikalnymi linkami do podstron tej aplikacji. Wywołaj, gdy użytkownik ma przejść do konkretnego miejsca w Bike Stats (panel, trening, aktywność, kalendarz itd.).",
        inputSchema,
        execute: async () => {
            const origin = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);

            const mainNav = APP_MAIN_NAV_LINKS.map(link => ({
                ...link,
                markdown: toMarkdownLink(link.title, link.path, origin),
            }));

            const auxiliary = APP_AUX_LINKS.map(link => ({
                ...link,
                markdown: toMarkdownLink(link.title, link.path, origin),
            }));

            const dynamicRoutes = APP_DYNAMIC_ROUTE_TEMPLATES.map(route => ({
                id: route.id,
                template: route.template,
                pathParams: route.pathParams,
                optionalQuery: route.optionalQuery,
                description: route.description,
                hint:
                    "Podstaw wartości w {nawiasach} w template — ścieżka musi zaczynać się od /. W markdown użyj pełnej ścieżki w nawiasie url.",
            }));

            return {
                appOrigin: origin,
                usage:
                    "W odpowiedzi dla użytkownika użyj pola `markdown` przy linkach statycznych albo zbuduj URL ze `template` (podstawiając parametry) i wpisz go w markdown: [tekst](ścieżka). Przy ustawionym `appOrigin` preferuj bezwzględne URL w markdown, żeby link działał także poza aplikacją.",
                mainNav,
                auxiliary,
                dynamicRoutes,
            };
        },
    });
}
