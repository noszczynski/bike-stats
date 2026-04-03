"use client";

import { SubmitButton } from "@/components/submit-button";
import { useUpdateTrainings } from "@/hooks/use-update-trainings";

export function UpdateTrainingsButton() {
    const { mutate, isPending } = useUpdateTrainings();

    const handleUpdate = () => {
        // Call the mutation without tokens - the API will get them from cookies
        mutate();
    };

    return (
        <SubmitButton
            variant="link"
            onClick={handleUpdate}
            isLoading={isPending}
            loadingText="Aktualizowanie…"
        >
            Aktualizuj
        </SubmitButton>
    );
}
