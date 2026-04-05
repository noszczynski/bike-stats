"use client";

import { useCallback, useRef, useState } from "react";
import { GpxMap } from "@/components/gpx/gpx-map";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { parseGpxToLatLngs } from "@/lib/gpx-parse";
import { Upload } from "lucide-react";

export function GpxViewer() {
    const [positions, setPositions] = useState<[number, number][]>([]);
    const [fileLabel, setFileLabel] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((file: File | undefined) => {
        if (!file) {
            return;
        }

        setError(null);

        if (!file.name.toLowerCase().endsWith(".gpx")) {
            setError("Wybierz plik z rozszerzeniem .gpx.");
            setPositions([]);
            setFileLabel(null);
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
                setFileLabel(file.name);
            } catch (e) {
                const message =
                    e instanceof Error ? e.message : "Nie udało się odczytać pliku GPX.";
                setError(message);
                setPositions([]);
                setFileLabel(null);
            }
        };
        reader.onerror = () => {
            setError("Błąd odczytu pliku.");
            setPositions([]);
            setFileLabel(null);
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

    const hasTrack = positions.length > 0;

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
                    className="pointer-events-none absolute top-3 right-3 flex max-w-[min(100%,20rem)] flex-col gap-2"
                    style={{ zIndex: 500 }}
                >
                    <div className="bg-background/95 pointer-events-auto rounded-md border p-3 shadow-sm backdrop-blur-sm">
                        <Button type="button" variant="outline" onClick={openPicker}>
                            <Upload />
                            Wybierz plik GPX
                        </Button>
                        {fileLabel ? (
                            <p
                                className="text-muted-foreground mt-2 truncate text-xs"
                                title={fileLabel}
                            >
                                {fileLabel}
                            </p>
                        ) : null}
                    </div>

                    {!hasTrack && !error ? (
                        <div className="bg-background/90 pointer-events-none rounded-md border px-3 py-2 text-sm shadow-sm backdrop-blur-sm">
                            <p className="text-muted-foreground">
                                Załaduj plik GPX, aby zobaczyć trasę na mapie.
                            </p>
                        </div>
                    ) : null}

                    {error ? (
                        <div className="pointer-events-auto">
                            <Alert variant="destructive">
                                <AlertTitle>Błąd</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
