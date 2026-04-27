"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { KIT_CATEGORIES } from "@/lib/constants/forge";

export interface CategoryConfig {
  name: string;
  color: string;
  bgLight: string;
}

/**
 * Fetches categories from Firestore and merges with hardcoded defaults.
 * Returns a unified list and a lookup map keyed by category name.
 */
export function useCategories() {
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, { color: string; bgLight: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        // 1. Start with hardcoded defaults
        const map: Record<string, { color: string; bgLight: string }> = {};
        Object.entries(KIT_CATEGORIES).forEach(([name, config]) => {
          map[name] = { color: config.color, bgLight: config.bgLight };
        });

        // 2. Fetch Firestore categories and merge (Firestore overrides defaults)
        try {
          const snapshot = await getDocs(collection(db, "kit_categories"));
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data.name) {
              map[data.name] = {
                color: data.color || "#6b7280",
                bgLight: data.bgLight || "rgba(107, 114, 128, 0.1)",
              };
            }
          });
        } catch (err) {
          // If Firestore read fails (e.g. offline), just use defaults
          console.warn("Failed to fetch Firestore categories, using defaults:", err);
        }

        // 3. Build sorted list
        const list: CategoryConfig[] = Object.entries(map)
          .map(([name, config]) => ({ name, ...config }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setCategories(list);
        setCategoryMap(map);
      } catch (err) {
        console.error("Error in useCategories:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, categoryMap, loading };
}
