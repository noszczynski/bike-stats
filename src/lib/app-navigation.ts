/**
 * Kanoniczne ścieżki aplikacji — używane przez nawigację i narzędzia AI,
 * żeby odnośniki były spójne w całym projekcie.
 */
export const APP_MAIN_NAV_LINKS = [
    {
        id: "dashboard",
        title: "Panel",
        path: "/",
        description: "Główny widok — podsumowanie i szybki dostęp.",
    },
    {
        id: "profile",
        title: "Profil",
        path: "/profile",
        description: "Ustawienia profilu i integracje (np. Hammerhead).",
    },
    {
        id: "workouts",
        title: "Treningi",
        path: "/workouts",
        description: "Lista treningów (edytor planów / workout builder).",
    },
    {
        id: "rides",
        title: "Aktywności",
        path: "/rides",
        description: "Lista zaimportowanych aktywności treningowych.",
    },
    {
        id: "calendar",
        title: "Kalendarz",
        path: "/calendar",
        description: "Kalendarz z aktywnościami i przejściem do szczegółów jazdy.",
    },
    {
        id: "routes",
        title: "Moje trasy",
        path: "/routes",
        description: "Trasy ze Strava.",
    },
    {
        id: "gpx",
        title: "GPX",
        path: "/gpx",
        description: "Podgląd i praca z plikami GPX.",
    },
    {
        id: "chat",
        title: "Chat",
        path: "/chat",
        description: "Czat z asystentem treningowym.",
    },
] as const;

export type AppMainNavLinkId = (typeof APP_MAIN_NAV_LINKS)[number]["id"];

/** Dodatkowe strony poza głównym menu bocznym. */
export const APP_AUX_LINKS = [
    {
        id: "workout_new",
        title: "Nowy trening",
        path: "/workouts/new",
        description: "Tworzenie nowego planu treningowego.",
    },
    {
        id: "login",
        title: "Logowanie",
        path: "/login",
        description: "Strona logowania.",
    },
    {
        id: "register",
        title: "Rejestracja",
        path: "/register",
        description: "Tworzenie konta.",
    },
    {
        id: "auth_strava",
        title: "Strava — callback",
        path: "/auth/strava",
        description: "Ścieżka powrotu OAuth Strava (użytkownik zwykle trafia tu automatycznie).",
    },
    {
        id: "auth_hammerhead",
        title: "Hammerhead — połączenie",
        path: "/auth/hammerhead",
        description: "Konfiguracja integracji z Hammerhead Karoo.",
    },
] as const;

export const APP_DYNAMIC_ROUTE_TEMPLATES = [
    {
        id: "workout_detail",
        template: "/workouts/{workoutId}",
        pathParams: {
            workoutId: "Identyfikator treningu (UUID), np. z list_workouts lub get_workout.",
        },
        optionalQuery: null as string | null,
        description: "Szczegóły zapisanego treningu.",
    },
    {
        id: "workout_edit",
        template: "/workouts/{workoutId}/edit",
        pathParams: {
            workoutId: "Identyfikator treningu (UUID).",
        },
        optionalQuery: null,
        description: "Edycja treningu w builderze.",
    },
    {
        id: "ride_detail",
        template: "/rides/{trainingId}",
        pathParams: {
            trainingId: "Identyfikator treningu/aktywności w aplikacji (jak w get_activity_*).",
        },
        optionalQuery:
            "compareTo, tab — opcjonalnie do porównań i zakładek na widoku szczegółów (jak w interfejsie).",
        description: "Szczegóły pojedynczej aktywności / jazdy.",
    },
] as const;
