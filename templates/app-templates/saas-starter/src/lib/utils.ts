import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 *
 * Combines multiple class values and resolves Tailwind CSS conflicts
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 *
 * @example
 * ```ts
 * cn('px-4 py-2', 'px-6') // => 'py-2 px-6'
 * cn('text-red-500', condition && 'text-blue-500')
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a readable string
 *
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format a number as currency
 *
 * @param amount - Amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Truncate a string to a maximum length
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string with ellipsis if needed
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Sleep for a specified duration
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a random ID
 *
 * @param length - Length of the ID (default: 12)
 * @returns Random ID string
 */
export function generateId(length = 12): string {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}
