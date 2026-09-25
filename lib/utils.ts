import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts major currency units (e.g. 125.50) to integer minor units (paise/cents: 12550)
 * Uses Math.round to eliminate IEEE 754 floating-point inaccuracies
 */
export function toMinorUnits(amount: number | string): number {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer minor units back to major units (e.g. 12550 -> 125.5)
 */
export function fromMinorUnits(minorUnits: number): number {
  if (typeof minorUnits !== "number" || isNaN(minorUnits)) return 0;
  return minorUnits / 100;
}

/**
 * Formats minor units into an authoritative locale currency string
 * e.g. 12500000 -> ₹1,25,000 for INR, $1,250.00 for USD
 */
export function formatCurrency(
  minorUnits: number,
  currency: string = "INR",
  locale?: string
): string {
  const major = fromMinorUnits(minorUnits);
  const targetLocale = locale || (currency === "INR" ? "en-IN" : "en-US");

  try {
    return new Intl.NumberFormat(targetLocale, {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    const symbol = currency === "INR" ? "₹" : "$";
    return `${symbol}${major.toFixed(2)}`;
  }
}

/**
 * Formats a Date object or ISO string safely
 */
export function formatDate(
  date: Date | string | number,
  formatPattern: string = "dd MMM yyyy"
): string {
  try {
    const d = new Date(date);
    if (!isValid(d)) return "Invalid Date";
    return format(d, formatPattern);
  } catch {
    return "Invalid Date";
  }
}

/**
 * Generates a cryptographically random, human-friendly alphanumeric code (e.g. for room invites)
 */
export function generateRandomCode(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omits confusing characters (0, O, 1, I)
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculates percentage safely without division by zero
 */
export function calculatePercentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
}
