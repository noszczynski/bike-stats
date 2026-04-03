"use client";

import { HammerheadLoginButton } from "@/components/HammerheadLoginButton";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useHammerheadAuth } from "@/hooks/use-hammerhead-auth";
import { suggestHammerheadActivity } from "@/lib/hammerhead-match";
import type { HammerheadActivityListItem } from "@/types/hammerhead";
import type { Training } from "@/types/training";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Download, Link2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type HammerheadMatchDialogProps = {
    trainingId: string;
    training: Training;
    /** `import` — pobranie .fit i przetworzenie; `link` — tylko zapis hammerhead_activity_id (trening musi mieć już FIT). */
    mode?: "import" | "link";
    /** Wywoływane po udanym imporcie / powiązaniu. */
    onImportSuccess?: () => void;
    disabled?: boolean;
};

async function fetchHammerheadActivitiesList(): Promise<HammerheadActivityListItem[]> {
    const res = await fetch("/api/hammerhead/activities?per_page=50");
    if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Nie udało się pobrać listy aktywności");
    }
    const json = (await res.json()) as { activities: HammerheadActivityListItem[] };
    return json.activities ?? [];
}

export function HammerheadMatchDialog({
    trainingId,
    training,
    mode = "import",
    onImportSuccess,
    disabled,
}: HammerheadMatchDialogProps) {
    const isLinkMode = mode === "link";
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string>("");

    const { data: auth, isLoading: authLoading } = useHammerheadAuth();

    const activitiesQuery = useQuery({
        queryKey: ["hammerhead-activities"],
        queryFn: fetchHammerheadActivitiesList,
        enabled: open && !!auth?.isAuthenticated,
    });

    const referenceMeters = training.distance_km * 1000;
    const suggestion = useMemo(() => {
        const list = activitiesQuery.data ?? [];
        return suggestHammerheadActivity(list, training.date, referenceMeters);
    }, [activitiesQuery.data, training.date, referenceMeters]);

    useEffect(() => {
        if (!open) return;
        if (suggestion.suggestedId) {
            setSelectedId(suggestion.suggestedId);
            return;
        }
        const first = suggestion.ranked[0]?.item.id;
        if (first) setSelectedId(first);
        else setSelectedId("");
    }, [open, suggestion.suggestedId, suggestion.ranked]);

    const importMutation = useMutation({
        mutationFn: async (hammerheadActivityId: string) => {
            const path = isLinkMode ? "link" : "fit";
            const res = await fetch(
                `/api/hammerhead/activities/${encodeURIComponent(hammerheadActivityId)}/${path}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ training_id: trainingId }),
                },
            );
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            if (!res.ok) {
                throw new Error(body.error ?? (isLinkMode ? "Powiązanie nie powiodło się" : "Import nie powiódł się"));
            }
            return body;
        },
        onSuccess: () => {
            toast.success(
                isLinkMode
                    ? "Trening został powiązany z aktywnością Hammerhead."
                    : "Plik .fit z Hammerhead został zaimportowany.",
            );
            onImportSuccess?.();
            setOpen(false);
        },
        onError: (err: Error) => {
            toast.error(err.message);
        },
    });

    const formatWhen = (iso: string | null) => {
        if (!iso) return "—";
        const d = dayjs(iso);
        return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : "—";
    };

    const formatDist = (m: number) => {
        if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
        return `${Math.round(m)} m`;
    };

    const triggerLabel = isLinkMode
        ? training.hammerhead_activity_id
            ? "Hammerhead — zmień"
            : "Hammerhead — powiąż"
        : "Pobierz dane .fit (Hammerhead)";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" disabled={disabled}>
                    {isLinkMode ? <Link2 /> : <Download />}
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isLinkMode ? "Powiązanie z Hammerhead" : "Import .fit z Hammerhead"}
                    </DialogTitle>
                    <DialogDescription>
                        {isLinkMode
                            ? `Trening ma już przetworzony plik FIT. Wybierz odpowiadającą aktywność w Hammerhead (${training.date}, ok. ${formatDist(referenceMeters)}) — zapiszemy tylko powiązanie, bez ponownego importu.`
                            : `Wybierz aktywność z konta Hammerhead, która odpowiada temu treningowi (${training.date}, ok. ${formatDist(referenceMeters)}).`}
                    </DialogDescription>
                </DialogHeader>

                {authLoading && <Skeleton className="h-24 w-full" />}

                {!authLoading && !auth?.isAuthenticated && (
                    <div className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                            {isLinkMode
                                ? "Aby wyświetlić listę aktywności, połącz konto Hammerhead."
                                : "Aby pobrać plik, połącz konto Hammerhead."}
                        </p>
                        <HammerheadLoginButton />
                    </div>
                )}

                {!authLoading && auth?.isAuthenticated && (
                    <>
                        {activitiesQuery.isLoading && <Skeleton className="h-48 w-full" />}
                        {activitiesQuery.isError && (
                            <p className="text-destructive text-sm">
                                {(activitiesQuery.error as Error).message}
                            </p>
                        )}
                        {activitiesQuery.data && activitiesQuery.data.length === 0 && (
                            <p className="text-muted-foreground text-sm">
                                Brak aktywności na koncie Hammerhead.
                            </p>
                        )}
                        {activitiesQuery.data && activitiesQuery.data.length > 0 && (
                            <div className="space-y-2">
                                {suggestion.suggestedId && (
                                    <p className="text-sm font-medium">
                                        Sugerowane dopasowanie (data / dystans): wybrano automatycznie
                                        — możesz zmienić wybór poniżej.
                                    </p>
                                )}
                                <ScrollArea className="max-h-72 pr-3">
                                    <RadioGroup value={selectedId} onValueChange={setSelectedId}>
                                        {suggestion.ranked.map(({ item, score, sameDay }) => (
                                            <div
                                                key={item.id}
                                                className="flex items-start gap-3 rounded-md border p-3"
                                            >
                                                <RadioGroupItem value={item.id} id={item.id} />
                                                <div className="grid flex-1 gap-1">
                                                    <Label htmlFor={item.id} className="cursor-pointer">
                                                        {item.name}
                                                    </Label>
                                                    <p className="text-muted-foreground text-xs">
                                                        {formatWhen(item.startedAt)} ·{" "}
                                                        {formatDist(item.distanceMeters)}
                                                        {sameDay ? ` · dopasowanie ${score}%` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </ScrollArea>
                            </div>
                        )}
                    </>
                )}

                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                        Anuluj
                    </Button>
                    <SubmitButton
                        type="button"
                        disabled={
                            !auth?.isAuthenticated ||
                            !selectedId ||
                            activitiesQuery.isLoading
                        }
                        isLoading={importMutation.isPending}
                        loadingText={isLinkMode ? "Zapisywanie…" : "Import…"}
                        onClick={() => importMutation.mutate(selectedId)}
                    >
                        {isLinkMode ? "Zapisz powiązanie" : "Importuj wybrany .fit"}
                    </SubmitButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
