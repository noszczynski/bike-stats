"use client";

import { KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ZwoWorkout } from "@/lib/zwo/types";
import { Plus, X } from "lucide-react";

type WorkoutMetadataFormProps = {
    workout: ZwoWorkout;
    tagInput: string;
    onWorkoutChange: (workout: ZwoWorkout) => void;
    onTagInputChange: (value: string) => void;
    onAddTag: () => void;
    onRemoveTag: (tag: string) => void;
    onTagKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

export function WorkoutMetadataForm({
    workout,
    tagInput,
    onWorkoutChange,
    onTagInputChange,
    onAddTag,
    onRemoveTag,
    onTagKeyDown,
}: WorkoutMetadataFormProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Metadane workoutu</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="workout-name">Nazwa</Label>
                        <Input
                            id="workout-name"
                            value={workout.name}
                            onChange={event =>
                                onWorkoutChange({ ...workout, name: event.target.value })
                            }
                            placeholder="Np. Sweet Spot 4x8"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="workout-description">Opis</Label>
                        <Textarea
                            id="workout-description"
                            value={workout.description}
                            onChange={event =>
                                onWorkoutChange({ ...workout, description: event.target.value })
                            }
                            placeholder="Opis celu treningu"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="workout-author">Autor</Label>
                        <Input
                            id="workout-author"
                            value={workout.author}
                            onChange={event =>
                                onWorkoutChange({ ...workout, author: event.target.value })
                            }
                            placeholder="Np. Adam"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="workout-tag-input">Tagi</Label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                                id="workout-tag-input"
                                value={tagInput}
                                onChange={event => onTagInputChange(event.target.value)}
                                onKeyDown={onTagKeyDown}
                                placeholder="Dodaj tag i naciśnij Enter"
                            />
                            <Button type="button" onClick={onAddTag}>
                                <Plus />
                                Dodaj tag
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {workout.tags.map(tag => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => onRemoveTag(tag)}
                                        aria-label={`Usuń tag ${tag}`}
                                    >
                                        <X />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
