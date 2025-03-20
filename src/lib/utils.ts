import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and merges Tailwind classes using twMerge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Get a deterministic color from a string
 */
export function getColorFromString(str: string): string {
  const colors = [
    "#9333EA", // purple-600
    "#6366F1", // indigo-500
    "#3B82F6", // blue-500
    "#0EA5E9", // sky-500
    "#06B6D4", // cyan-500
    "#14B8A6", // teal-500
    "#10B981", // emerald-500
    "#22C55E", // green-500
    "#84CC16", // lime-500
    "#EAB308", // yellow-500
    "#F59E0B", // amber-500
    "#F97316", // orange-500
    "#EF4444", // red-500
    "#E11D48", // rose-500
  ]
  
  // Simple hash function to get a number from a string
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Get positive value and mod it by the number of colors
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

/**
 * Format a date as "Tuesday, March 18, 2025"
 */
export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  return date.toLocaleDateString('en-US', options)
} 