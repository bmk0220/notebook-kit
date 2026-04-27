import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatDate(date: any): string {
  if (!date) return 'N/A';
  
  // Handle Firestore Timestamp
  if (typeof date.toDate === 'function') {
    return date.toDate().toLocaleDateString();
  }
  
  // Handle Date object
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  
  // Handle ISO string or number
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString();
  } catch {
    return 'N/A';
  }
}
