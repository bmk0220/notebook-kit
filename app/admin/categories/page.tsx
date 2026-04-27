"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getCountFromServer,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Plus,
  Trash2,
  Loader2,
  Tags,
  AlertCircle,
  Palette,
  Search,
  ShieldCheck,
  Notebook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KIT_CATEGORIES } from "@/lib/constants/forge";

interface Category {
  id: string;
  name: string;
  color: string;
  bgLight: string;
  kitCount: number;
  isDefault: boolean; // true = from hardcoded constants, false = from Firestore
  createdAt?: any;
}

// Curated preset colors for category creation
const COLOR_PRESETS = [
  { color: "#3b82f6", label: "Blue" },
  { color: "#10b981", label: "Emerald" },
  { color: "#f59e0b", label: "Amber" },
  { color: "#8b5cf6", label: "Violet" },
  { color: "#6b7280", label: "Gray" },
  { color: "#ec4899", label: "Pink" },
  { color: "#ef4444", label: "Red" },
  { color: "#14b8a6", label: "Teal" },
  { color: "#f97316", label: "Orange" },
  { color: "#06b6d4", label: "Cyan" },
  { color: "#a855f7", label: "Purple" },
  { color: "#84cc16", label: "Lime" },
];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // New category form
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PRESETS[0].color);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load from Firestore
      const snapshot = await getDocs(collection(db, "kit_categories"));
      const firestoreCategories: Category[] = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name,
        color: d.data().color,
        bgLight: d.data().bgLight,
        kitCount: 0,
        isDefault: false,
        createdAt: d.data().createdAt,
      }));

      // 2. Merge with hardcoded defaults (hardcoded ones not yet in Firestore)
      const firestoreNames = new Set(firestoreCategories.map((c) => c.name));
      const defaultCategories: Category[] = Object.entries(KIT_CATEGORIES)
        .filter(([name]) => !firestoreNames.has(name))
        .map(([name, config]) => ({
          id: `default-${name}`,
          name,
          color: config.color,
          bgLight: config.bgLight,
          kitCount: 0,
          isDefault: true,
        }));

      const allCategories = [...firestoreCategories, ...defaultCategories];

      // 3. Count kits per category
      for (const cat of allCategories) {
        try {
          const q = query(
            collection(db, "kits"),
            where("categories", "array-contains", cat.name)
          );
          const countSnap = await getCountFromServer(q);
          cat.kitCount = countSnap.data().count;
        } catch {
          // Silently handle - might not have index
          cat.kitCount = 0;
        }
      }

      // Sort: defaults first alphabetically, then Firestore ones
      allCategories.sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      setCategories(allCategories);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setFormError("Category name is required.");
      return;
    }
    if (trimmedName.length < 2) {
      setFormError("Name must be at least 2 characters.");
      return;
    }
    if (
      categories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())
    ) {
      setFormError("A category with this name already exists.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const bgLight = hexToRgba(newColor, 0.1);
      await addDoc(collection(db, "kit_categories"), {
        name: trimmedName,
        color: newColor,
        bgLight,
        createdAt: serverTimestamp(),
      });

      setNewName("");
      setNewColor(COLOR_PRESETS[0].color);
      setShowForm(false);
      await fetchCategories();
    } catch (err) {
      console.error("Error adding category:", err);
      setFormError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat.isDefault) {
      alert(
        "Default categories are defined in code and cannot be deleted from this interface."
      );
      return;
    }

    if (cat.kitCount > 0) {
      if (
        !confirm(
          `"${cat.name}" is used by ${cat.kitCount} kit(s). Deleting it won't remove the tag from existing kits, but it will no longer appear as an option in the Forge. Continue?`
        )
      )
        return;
    } else {
      if (!confirm(`Delete the "${cat.name}" category?`)) return;
    }

    setDeletingId(cat.id);
    try {
      await deleteDoc(doc(db, "kit_categories", cat.id));
      await fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">
            Categories
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm">
            Manage marketplace categories for Knowledge Kits.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "h-12 px-6 rounded-xl font-bold gap-2 flex items-center justify-center transition-all",
            showForm
              ? "bg-muted text-muted-foreground border border-border"
              : "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          )}
        >
          <Plus
            className={cn(
              "h-5 w-5 transition-transform",
              showForm && "rotate-45"
            )}
          />
          {showForm ? "Cancel" : "New Category"}
        </button>
      </div>

      {/* New Category Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Create New Category
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Category Name
              </label>
              <input
                type="text"
                placeholder="e.g. Finance, Science, Marketing..."
                className="w-full h-12 px-4 rounded-xl border border-border bg-background font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setFormError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                maxLength={30}
              />
              <p className="text-[10px] text-muted-foreground">
                {newName.length}/30 characters
              </p>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Accent Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.color}
                    onClick={() => setNewColor(preset.color)}
                    className={cn(
                      "h-10 w-10 rounded-xl border-2 transition-all hover:scale-110 active:scale-95",
                      newColor === preset.color
                        ? "border-foreground scale-110 shadow-lg"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: preset.color }}
                    title={preset.label}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-muted-foreground">
                  Custom:
                </span>
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-8 w-8 rounded-lg cursor-pointer border-none"
                />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {newColor}
                </span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 rounded-xl border border-border/50 bg-muted/20">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-3">
              Preview
            </span>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: hexToRgba(newColor, 0.1) }}
              >
                <Tags className="h-5 w-5" style={{ color: newColor }} />
              </div>
              <span
                className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border"
                style={{
                  backgroundColor: hexToRgba(newColor, 0.1),
                  color: newColor,
                  borderColor: hexToRgba(newColor, 0.2),
                }}
              >
                {newName || "Category Name"}
              </span>
            </div>
          </div>

          {formError && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-500 font-bold">
              <AlertCircle className="h-4 w-4" />
              {formError}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAdd}
              disabled={saving || !newName.trim()}
              className="h-12 px-8 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Add Category"}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search categories..."
          className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4 opacity-50">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-bold uppercase tracking-widest text-xs">
            Loading Categories...
          </p>
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="group relative bg-card border border-border rounded-2xl p-5 transition-all hover:shadow-md hover:border-border"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: cat.bgLight }}
                  >
                    <Tags className="h-6 w-6" style={{ color: cat.color }} />
                  </div>

                  <div>
                    <h3 className="font-bold text-base leading-tight">
                      {cat.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {cat.kitCount} kit{cat.kitCount !== 1 ? "s" : ""}
                      </span>
                      {cat.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-primary/70">
                          <ShieldCheck className="h-3 w-3" />
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete */}
                {!cat.isDefault && (
                  <button
                    onClick={() => handleDelete(cat)}
                    disabled={deletingId === cat.id}
                    className="h-9 w-9 rounded-lg border border-border bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 hover:border-red-200 transition-all shrink-0"
                    title="Delete category"
                  >
                    {deletingId === cat.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Color bar */}
              <div
                className="mt-4 h-1.5 rounded-full"
                style={{ backgroundColor: cat.bgLight }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: cat.color,
                    width: cat.kitCount > 0 ? `${Math.min(cat.kitCount * 20, 100)}%` : "5%",
                    opacity: cat.kitCount > 0 ? 1 : 0.3,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center rounded-3xl border-2 border-dashed border-border bg-background/50">
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Search className="h-8 w-8 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">
              No categories found.
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between px-2 pt-4 border-t border-border/40">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {categories.length} total categories •{" "}
          {categories.filter((c) => c.isDefault).length} defaults •{" "}
          {categories.filter((c) => !c.isDefault).length} custom
        </p>
        <div className="flex items-center gap-2">
          <Notebook className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground">
            {categories.reduce((sum, c) => sum + c.kitCount, 0)} kits
            categorized
          </span>
        </div>
      </div>
    </div>
  );
}
