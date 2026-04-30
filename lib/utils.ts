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

export const setPartnerCookie = (code: string) => {
  const expires = new Date();
  expires.setDate(expires.getDate() + 120);
  document.cookie = `partnerCode=${code};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

export const getPartnerCookie = () => {
  const name = "partnerCode=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1);
    if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
  }
  return null;
};
