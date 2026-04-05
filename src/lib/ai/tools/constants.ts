import { z } from "zod";

export const periodSchema = z.enum(["7d", "30d", "90d", "1y"]);
export const activityIdSchema = z.string().uuid();

export const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const ACTIVITY_NOT_FOUND_MESSAGE = "Aktywność nie istnieje lub nie należy do użytkownika.";
