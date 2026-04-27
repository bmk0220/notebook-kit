"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CategoryConfig {
  name: string;
  color: string;
  bgLight: string;
}

const DEFAULT_FALLBACK = { color: "#6b7280", bgLight: "rgba(107, 114, 128, 0.1)" };

/**
 * Fetches categories from Firestore's `kit_categories` collection.
 * Returns a unified list and a lookup map keyed by category name.
 */
export function useCategories() {
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, { color: string; bgLight: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const map: Record<string, { color: string; bgLight: string }> = {};

        try {
          const snapshot = await getDocs(collection(db, "kit_categories"));
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            if (data.name) {
              map[data.name] = {
                color: data.color || DEFAULT_FALLBACK.color,
                bgLight: data.bgLight || DEFAULT_FALLBACK.bgLight,
              };
            }
          });
        } catch (err) {
          console.warn("Failed to fetch categories from Firestore:", err);
        }

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
