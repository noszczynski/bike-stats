"use client";

import { useCallback, useRef, useState } from "react";
import { GpxMap } from "@/components/gpx/gpx-map";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { parseGpxToLatLngs } from "@/lib/gpx-parse";
import { Loader2, MapPinned, Upload } from "lucide-react";

const HARDCODED_PUBLIC_ACTIVITY_ID = "17990579757";
const HARDCODED_PUBLIC_ACTIVITY_LABEL = "Publiczna aktywność testowa ze Stravy";

export function GpxViewer() {
    const [positions, setPositions] = useState<[number, number][]>([]);
    const [activeTrackLabel, setActiveTrackLabel] = useState<string | null>(null);
    const [activeTrackSource, setActiveTrackSource] = useState<"gpx" | "strava-activity" | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);
    const [isLoadingPublicActivity, setIsLoadingPublicActivity] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((file: File | undefined) => {
        if (!file) {
            return;
        }

        setError(null);

        if (!file.name.toLowerCase().endsWith(".gpx")) {
            setError("Wybierz plik z rozszerzeniem .gpx.");
            setPositions([]);
            setActiveTrackLabel(null);
            setActiveTrackSource(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            try {
                if (typeof reader.result !== "string") {
                    throw new Error("Nie udało się odczytać pliku jako tekstu.");
                }
                const pts = parseGpxToLatLngs(reader.result);
                setPositions(pts);
                setActiveTrackLabel(file.name);
                setActiveTrackSource("gpx");
            } catch (e) {
                const message =
                    e instanceof Error ? e.message : "Nie udało się odczytać pliku GPX.";
                setError(message);
                setPositions([]);
                setActiveTrackLabel(null);
                setActiveTrackSource(null);
            }
        };
        reader.onerror = () => {
            setError("Błąd odczytu pliku.");
            setPositions([]);
            setActiveTrackLabel(null);
            setActiveTrackSource(null);
        };
        reader.readAsText(file, "UTF-8");
    }, []);

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        handleFile(file);
        event.target.value = "";
    };

    const openPicker = () => {
        inputRef.current?.click();
    };

    const handleLoadPublicActivity = useCallback(async () => {
        setIsLoadingPublicActivity(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/strava/public-gpx?activity_id=${encodeURIComponent(HARDCODED_PUBLIC_ACTIVITY_ID)}`,
            );

            if (!response.ok) {
                const data = (await response.json()) as { error?: string };
                throw new Error(data.error || "Nie udało się pobrać publicznego GPX ze Stravy.");
            }

            const gpxXml = await response.text();
            const pts = parseGpxToLatLngs(gpxXml);

            setPositions(pts);
            setActiveTrackLabel(HARDCODED_PUBLIC_ACTIVITY_LABEL);
            setActiveTrackSource("strava-activity");
        } catch (e) {
            const message =
                e instanceof Error ? e.message : "Nie udało się załadować aktywności ze Stravy.";
            setError(message);
        } finally {
            setIsLoadingPublicActivity(false);
        }
    }, []);

    const hasTrack = positions.length > 0;
    const activeTrackLabelText = activeTrackLabel
        ? activeTrackSource === "gpx"
            ? `GPX: ${activeTrackLabel}`
            : `Strava activity: ${activeTrackLabel}`
        : null;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <input
                ref={inputRef}
                type="file"
                accept=".gpx,application/gpx+xml"
                onChange={onInputChange}
                aria-label="Wybierz plik GPX"
                className="sr-only"
            />

            <div className="relative flex min-h-0 flex-1 flex-col">
                <GpxMap positions={positions} />

                <div
                    className="pointer-events-none absolute inset-x-3 top-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
                    style={{ zIndex: 500 }}
                >
                    <div className="pointer-events-auto w-full max-w-[min(100%,24rem)] rounded-md border bg-background/95 shadow-sm backdrop-blur-sm">
                        <div className="border-b p-3">
                            <div className="flex items-center gap-2">
                                <MapPinned className="text-muted-foreground h-4 w-4" />
                                <div>
                                    <p className="text-sm font-medium">Publiczny GPX Stravy</p>
                                    <p className="text-muted-foreground text-xs">
                                        Testowo ładujemy GPX z publicznej aktywności po stałym
                                        activity id.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 p-3">
                            <div className="rounded-md border px-3 py-2">
                                <p className="text-sm font-medium">{HARDCODED_PUBLIC_ACTIVITY_LABEL}</p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    activity id: {HARDCODED_PUBLIC_ACTIVITY_ID}
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                disabled={isLoadingPublicActivity}
                                onClick={() => void handleLoadPublicActivity()}
                            >
                                {isLoadingPublicActivity ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <MapPinned />
                                )}
                                Załaduj publiczny GPX
                            </Button>
                        </div>
                    </div>

                    <div className="flex w-full flex-col items-end gap-2 md:max-w-[min(100%,20rem)]">
                        <div className="bg-background/95 pointer-events-auto w-full rounded-md border p-3 shadow-sm backdrop-blur-sm">
                            <Button type="button" variant="outline" onClick={openPicker}>
                                <Upload />
                                Wybierz plik GPX
                            </Button>
                            {activeTrackLabelText ? (
                                <p
                                    className="text-muted-foreground mt-2 truncate text-xs"
                                    title={activeTrackLabelText}
                                >
                                    {activeTrackLabelText}
                                </p>
                            ) : null}
                        </div>

                        {!hasTrack && !error ? (
                            <div className="bg-background/90 pointer-events-none w-full rounded-md border px-3 py-2 text-sm shadow-sm backdrop-blur-sm">
                                <p className="text-muted-foreground">
                                    Załaduj plik GPX albo użyj testowej publicznej aktywności
                                    Stravy, aby zobaczyć ją na mapie.
                                </p>
                            </div>
                        ) : null}

                        {error ? (
                            <div className="pointer-events-auto w-full">
                                <Alert variant="destructive">
                                    <AlertTitle>Błąd</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
