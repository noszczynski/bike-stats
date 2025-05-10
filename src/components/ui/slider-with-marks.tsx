import * as React from 'react';

import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import * as SliderPrimitive from '@radix-ui/react-slider';

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    showTooltip?: boolean;
    hasMarks?: boolean;
    labelTitle?: string;
    labelValue?: number;
    labelFor?: string;
};

const SliderTooltip = React.forwardRef<React.ComponentRef<typeof SliderPrimitive.Root>, SliderProps>(
    ({ className, showTooltip = false, hasMarks = false, labelTitle, labelValue, labelFor, ...props }, ref) => {
        const [value, setValue] = React.useState<number[]>(props.defaultValue ? [...props.defaultValue] : [0]);
        const [showTooltipState, setShowTooltipState] = React.useState(false);
        const space = props.max && props.step ? props?.max / props.step : 0;

        const handlePointerDown = () => {
            setShowTooltipState(true);
        };

        const handlePointerUp = React.useCallback(() => {
            setShowTooltipState(false);
        }, []);

        React.useEffect(() => {
            document.addEventListener('pointerup', handlePointerUp);

            return () => {
                document.removeEventListener('pointerup', handlePointerUp);
            };
        }, [handlePointerUp]);

        return (
            <div className='grid gap-6'>
                {labelFor && labelTitle && (
                    <Label htmlFor={labelFor} className='text-muted-foreground justify-between pl-0.5'>
                        <span>{labelTitle}</span>
                        <span>{labelValue}</span>
                    </Label>
                )}

                <SliderPrimitive.Root
                    ref={ref}
                    className={cn('relative flex w-full touch-none items-center select-none', className)}
                    onValueChange={(val) => {
                        setValue(val);
                        props.onValueChange?.(val);
                    }}
                    onPointerDown={handlePointerDown}
                    {...props}>
                    <SliderPrimitive.Track className='bg-primary/20 relative h-1 w-full grow overflow-hidden rounded-full'>
                        <SliderPrimitive.Range className='bg-primary absolute h-full' />
                    </SliderPrimitive.Track>

                    {hasMarks && (
                        <div className='absolute inset-0 flex w-full items-center justify-between'>
                            {Array.from({ length: space + 1 }).map((_, index) => {
                                const percent = (index / (space - 1)) * 100;

                                if (index === space) {
                                    return <div className='hidden' key={index} />;
                                }

                                return (
                                    <div className='relative' key={index}>
                                        <div className='bg-primary absolute top-1/2 left-0 -mt-1 h-2 w-[4px] rounded-full' />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <TooltipProvider>
                        <Tooltip open={showTooltip && showTooltipState}>
                            <TooltipTrigger asChild className='pointer-events-none'>
                                <SliderPrimitive.Thumb
                                    className='border-primary/50 bg-background focus-visible:ring-ring block h-4 w-4 rounded-full border shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'
                                    onMouseEnter={() => setShowTooltipState(true)}
                                    onMouseLeave={() => setShowTooltipState(false)}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{value[0]}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </SliderPrimitive.Root>
            </div>
        );
    }
);

SliderTooltip.displayName = 'SliderTooltip';

export default SliderTooltip;
