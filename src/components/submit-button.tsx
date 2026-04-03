"use client";

import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import type { ComponentProps } from "react";

export type SubmitButtonProps = ComponentProps<typeof Button> & {
    isLoading?: boolean;
    /** Domyślny tekst podczas ładowania. Pusty string — tylko ikona spinnera (np. przyciski typu ikona). */
    loadingText?: string;
};

export function SubmitButton({
    isLoading = false,
    loadingText = "Chwilkę poczekaj",
    children,
    disabled,
    ...props
}: SubmitButtonProps) {
    return (
        <Button disabled={disabled || isLoading} {...props}>
            {isLoading ? (
                loadingText ? (
                    <>
                        <Loader className="animate-spin" />
                        {loadingText}
                    </>
                ) : (
                    <Loader className="animate-spin" />
                )
            ) : (
                children
            )}
        </Button>
    );
}
