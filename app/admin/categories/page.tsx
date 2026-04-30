"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
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
  Notebook,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  color: string;
  bgLight: string;
  kitCount: number;
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

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "kit_categories"));
      const allCategories: Category[] = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name,
        color: d.data().color,
        bgLight: d.data().bgLight,
        kitCount: 0,
      }));

      // Count kits per category
      for (const cat of allCategories) {
        try {
          const q = query(
            collection(db, "kits"),
            where("categories", "array-contains", cat.name)
          );
          const countSnap = await getCountFromServer(q);
          cat.kitCount = countSnap.data().count;
        } catch {
          cat.kitCount = 0;
        }
      }

      allCategories.sort((a, b) => a.name.localeCompare(b.name));
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

  // --- ADD ---
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

  // --- EDIT ---
  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
    setEditError("");
  };

  const handleEdit = async () => {
    if (!editingId) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError("Category name is required.");
      return;
    }
    if (trimmedName.length < 2) {
      setEditError("Name must be at least 2 characters.");
      return;
    }
    // Duplicate check (excluding current)
    if (
      categories.some(
        (c) =>
          c.id !== editingId &&
          c.name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      setEditError("A category with this name already exists.");
      return;
    }

    setEditSaving(true);
    setEditError("");

    try {
      const bgLight = hexToRgba(editColor, 0.1);
      await updateDoc(doc(db, "kit_categories", editingId), {
        name: trimmedName,
        color: editColor,
        bgLight,
      });

      cancelEdit();
      await fetchCategories();
    } catch (err) {
      console.error("Error updating category:", err);
      setEditError("Failed to save changes.");
    } finally {
      setEditSaving(false);
    }
  };

  // --- DELETE ---
  const handleDelete = async (cat: Category) => {
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
          onClick={() => {
            setShowForm(!showForm);
            if (editingId) cancelEdit();
          }}
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
              className={cn(
                "group relative bg-card border rounded-2xl p-5 transition-all",
                editingId === cat.id
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border hover:shadow-md"
              )}
            >
              {/* EDIT MODE */}
              {editingId === cat.id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Editing Category
                    </span>
                    <button
                      onClick={cancelEdit}
                      className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Edit Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        setEditError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background font-medium focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm"
                      maxLength={30}
                    />
                  </div>

                  {/* Edit Color */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.color}
                          onClick={() => setEditColor(preset.color)}
                          className={cn(
                            "h-7 w-7 rounded-lg border-2 transition-all hover:scale-110",
                            editColor === preset.color
                              ? "border-foreground scale-110"
                              : "border-transparent"
                          )}
                          style={{ backgroundColor: preset.color }}
                          title={preset.label}
                        />
                      ))}
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="h-7 w-7 rounded-lg cursor-pointer border-none"
                      />
                    </div>
                  </div>

                  {/* Edit Preview */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: hexToRgba(editColor, 0.1) }}
                    >
                      <Tags
                        className="h-4 w-4"
                        style={{ color: editColor }}
                      />
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                      style={{
                        backgroundColor: hexToRgba(editColor, 0.1),
                        color: editColor,
                        borderColor: hexToRgba(editColor, 0.2),
                      }}
                    >
                      {editName || "Preview"}
                    </span>
                  </div>

                  {editError && (
                    <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {editError}
                    </p>
                  )}

                  {/* Save / Cancel */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleEdit}
                      disabled={editSaving || !editName.trim()}
                      className="flex-1 h-10 bg-primary text-primary-foreground rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {editSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      {editSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="h-10 px-4 bg-muted text-muted-foreground rounded-lg font-bold text-sm hover:bg-muted/80 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* VIEW MODE */
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: cat.bgLight }}
                      >
                        <Tags
                          className="h-6 w-6"
                          style={{ color: cat.color }}
                        />
                      </div>

                      <div>
                        <h3 className="font-bold text-base leading-tight">
                          {cat.name}
                        </h3>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {cat.kitCount} kit{cat.kitCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(cat)}
                        className="h-9 w-9 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all shrink-0"
                        title="Edit category"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={deletingId === cat.id}
                        className="h-9 w-9 rounded-lg border border-border bg-background flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 hover:border-red-200 transition-all shrink-0"
                        title="Delete category"
                      >
                        {deletingId === cat.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
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
                        width:
                          cat.kitCount > 0
                            ? `${Math.min(cat.kitCount * 20, 100)}%`
                            : "5%",
                        opacity: cat.kitCount > 0 ? 1 : 0.3,
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center rounded-3xl border-2 border-dashed border-border bg-background/50">
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Tags className="h-8 w-8 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">
              {categories.length === 0
                ? "No categories yet. Create your first one!"
                : "No categories found."}
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      {categories.length > 0 && (
        <div className="flex items-center justify-between px-2 pt-4 border-t border-border/40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {categories.length} total categories
          </p>
          <div className="flex items-center gap-2">
            <Notebook className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground">
              {categories.reduce((sum, c) => sum + c.kitCount, 0)} kits
              categorized
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
