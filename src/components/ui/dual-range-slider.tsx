"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import * as SliderPrimitive from "@radix-ui/react-slider";

interface DualRangeSliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
    labelPosition?: "top" | "bottom";
    label?: (value: number | undefined) => React.ReactNode;
}

const DualRangeSlider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    DualRangeSliderProps
>(({ className, label, labelPosition = "top", ...props }, ref) => {
    const initialValue = Array.isArray(props.value) ? props.value : [props.min, props.max];

    return (
        <SliderPrimitive.Root
            ref={ref}
            className={cn("relative flex w-full touch-none items-center select-none", className)}
            {...props}
        >
            <SliderPrimitive.Track className="bg-secondary relative h-2 w-full grow overflow-hidden rounded-full">
                <SliderPrimitive.Range className="bg-primary absolute h-full" />
            </SliderPrimitive.Track>
            {initialValue.map((value, index) => (
                <React.Fragment key={index}>
                    <SliderPrimitive.Thumb className="border-primary bg-background ring-offset-background focus-visible:ring-ring relative block h-4 w-4 rounded-full border-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50">
                        {label && (
                            <span
                                className={cn(
                                    "absolute flex w-full justify-center",
                                    labelPosition === "top" && "-top-7",
                                    labelPosition === "bottom" && "top-4",
                                )}
                            >
                                {label(value)}
                            </span>
                        )}
                    </SliderPrimitive.Thumb>
                </React.Fragment>
            ))}
        </SliderPrimitive.Root>
    );
});
DualRangeSlider.displayName = "DualRangeSlider";

export { DualRangeSlider };
