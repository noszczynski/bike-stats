"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGetTrainings } from "@/hooks/use-get-trainings";
import { TrainingFilters } from "@/lib/api/trainings";
import type { Training } from "@/types/training";
import dayjs, { type Dayjs } from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import weekday from "dayjs/plugin/weekday";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

// Initialize dayjs plugins
dayjs.extend(weekOfYear);
dayjs.extend(weekday);
dayjs.extend(updateLocale);

// Configure first day of week to Monday (1)
dayjs.updateLocale("en", {
    weekStart: 1,
});

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
    const [filters, setFilters] = useState<TrainingFilters>({
        startDate: currentMonth.startOf("month").format("YYYY-MM-DD"),
        endDate: currentMonth.endOf("month").format("YYYY-MM-DD"),
    });

    // Update filters when month changes
    useEffect(() => {
        setFilters({
            startDate: currentMonth.startOf("month").format("YYYY-MM-DD"),
            endDate: currentMonth.endOf("month").format("YYYY-MM-DD"),
        });
    }, [currentMonth]);

    // Get trainings for the current month with pagination (100 items per page to show all)
    const { data, isLoading, error } = useGetTrainings(filters, { page: 1, pageSize: 100 });

    // Navigate to previous month
    const prevMonth = () => {
        setCurrentMonth(currentMonth.subtract(1, "month"));
    };

    // Navigate to next month
    const nextMonth = () => {
        setCurrentMonth(currentMonth.add(1, "month"));
    };

    // Generate calendar days
    const generateCalendarDays = (): Dayjs[] => {
        const firstDayOfMonth = currentMonth.startOf("month");
        const lastDayOfMonth = currentMonth.endOf("month");

        // Start from the first day of week containing the first day of month
        const startDay = firstDayOfMonth.startOf("week");
        // End on the last day of week containing the last day of month
        const endDay = lastDayOfMonth.endOf("week");

        const days: Dayjs[] = [];
        let day = startDay;

        while (day.isBefore(endDay) || day.isSame(endDay, "day")) {
            days.push(day);
            day = day.add(1, "day");
        }

        return days;
    };

    // Monday first
    const daysOfWeek = [
        "Poniedziałek",
        "Wtorek",
        "Środa",
        "Czwartek",
        "Piątek",
        "Sobota",
        "Niedziela",
    ];
    const calendarDays = generateCalendarDays();

    // Find trainings for a specific day
    const getTrainingsForDay = (day: Dayjs): Training[] => {
        if (!data?.trainings || data.trainings.length === 0) return [];

        const formattedDay = day.format("YYYY-MM-DD");

        return data.trainings.filter((training: Training) => training.date === formattedDay);
    };

    return (
        <div className="space-y-4">
            <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{currentMonth.format("MMMM YYYY")}</h1>
                    <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={prevMonth}>
                            <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentMonth(dayjs())}>
                            Dziś
                        </Button>
                        <Button variant="outline" size="icon" onClick={nextMonth}>
                            <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <p>Ładowanie treningów...</p>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-red-500">
                            Błąd ładowania treningów:{" "}
                            {error instanceof Error ? error.message : "Unknown error"}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Display total trainings count */}
                        <div className="text-muted-foreground mb-4 text-sm">
                            {data?.totalCount === 0 ? (
                                <p>Brak treningów w tym miesiącu</p>
                            ) : (
                                <p>Znaleziono {data?.totalCount} treningów</p>
                            )}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Days of week headers */}
                            {daysOfWeek.map((day, index) => (
                                <div key={index} className="py-2 text-center text-sm font-semibold">
                                    {day.substring(0, 3)}
                                </div>
                            ))}

                            {/* Calendar days */}
                            {calendarDays.map((day, index) => {
                                const isCurrentMonth = day.month() === currentMonth.month();
                                const isToday =
                                    day.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
                                const dayTrainings = getTrainingsForDay(day);

                                return (
                                    <div
                                        key={index}
                                        className={`min-h-28 rounded-md border p-1 ${
                                            isCurrentMonth ? "bg-card" : "bg-muted/30"
                                        } ${isToday ? "ring-primary ring-2" : ""}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <span
                                                className={`text-sm font-medium ${!isCurrentMonth ? "text-muted-foreground" : ""}`}
                                            >
                                                {day.format("D")}
                                            </span>
                                            {isCurrentMonth && (
                                                <span className="text-muted-foreground text-xs">
                                                    {day.format("ddd")}
                                                </span>
                                            )}
                                        </div>

                                        {/* Trainings for this day */}
                                        <div className="mt-1 space-y-1">
                                            {dayTrainings.map((training: Training) => (
                                                <Link
                                                    href={`/trainings/${training.id}`}
                                                    key={training.id}
                                                    className="bg-primary text-primary-foreground hover:bg-primary/80 block truncate rounded p-1 text-xs transition-colors"
                                                >
                                                    {training.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
