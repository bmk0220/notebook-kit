"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Package,
  Tags,
  DollarSign,
  Info,
  Loader2,
  Save,
  Globe,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { kitSchema, type Kit } from '@/lib/schemas/kit';
import { KIT_ICONS } from '@/lib/constants/forge';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/lib/hooks/useCategories';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function EditKitPage() {
  const params = useParams();
  const kitId = params.kitId as string;

  
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { categories: dynamicCategories, categoryMap } = useCategories();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<Partial<Kit>>({
    resolver: zodResolver(kitSchema.partial()),
  });

  useEffect(() => {
    async function fetchKit() {
      if (!kitId) return;
      try {
        const docRef = doc(db, 'kits', kitId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Kit;
          reset(data);
        } else {
          setError("Kit not found");
        }
      } catch (err) {
        console.error("Error fetching kit:", err);
        setError("Failed to fetch kit data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchKit();
  }, [kitId, reset]);

  const selectedIconName = watch('assets.iconSvgName') || 'Package';
  const title = watch('title') || '';
  const selectedCategories = watch('categories') || [];
  const status = watch('status') || 'draft';

  const onSubmit = async (data: Partial<Kit>) => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg('');

    try {
      const updateData = {
        title: data.title,
        slug: data.slug,
        description: data.description,
        price: data.price,
        categories: data.categories || [],
        status: data.status,
        assets: {
          iconSvgName: data.assets?.iconSvgName || 'Package',
          fileUrl: data.assets?.fileUrl || '',
        },
        tags: data.tags || [],
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'kits', kitId), updateData);
      setSuccessMsg("Kit updated successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while saving.');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary/50" /></div>;
  if (!user || !isAdmin) return <div className="p-12 text-center text-error bg-background min-h-screen">Access Restricted to Admin Accounts</div>;
  if (error && !watch('id')) return <div className="p-12 text-center text-error bg-background min-h-screen">{error}</div>;

  const getIcon = (name: string) => {
    return KIT_ICONS[name] || Package;
  };
  const IconComponent = getIcon(selectedIconName);

  const onFormError = (errors: unknown) => {
    const findErrorMessage = (obj: any): string | null => {
      if (typeof obj !== 'object' || obj === null) return null;
      for (const key in obj) {
        if (obj[key]?.message && typeof obj[key].message === 'string') {
          return obj[key].message;
        }
        if (typeof obj[key] === 'object') {
          const nested = findErrorMessage(obj[key]);
          if (nested) return `${key} -> ${nested}`;
        }
      }
      return null;
    };
    const msg = findErrorMessage(errors);
    setError(msg ? `Form Validation Failed: ${msg}` : "Form Validation Failed. Please check all required inputs.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 p-6 lg:p-12">
        <form onSubmit={handleSubmit(onSubmit, onFormError)} className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link href="/admin/kits" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Manage Kits
              </Link>
              <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                Edit Kit
                <span className={cn(
                  "text-xs px-3 py-1 rounded-full uppercase tracking-widest font-bold",
                  status === 'published' ? 'bg-green-500/10 text-green-600' :
                  status === 'draft' ? 'bg-amber-500/10 text-amber-600' :
                  'bg-muted text-muted-foreground'
                )}>{status}</span>
              </h1>
              <p className="text-muted-foreground mt-1 font-mono text-xs">ID: {kitId}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary shadow-lg shadow-primary/20 h-12 px-8 rounded-xl font-bold gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </header>

          {error && (
            <div className="alert alert-error shadow-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success shadow-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="card bg-card border border-border shadow-sm overflow-visible">
                <div className="card-body p-6 space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    Kit Metadata
                  </h2>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Display Icon</label>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => setShowIconPicker(true)}
                      >
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={() => setShowIconPicker(true)}
                      >
                        Change Icon
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Kit Title</span></label>
                      <input
                        {...register('title')}
                        className={cn("input input-bordered w-full bg-background", errors.title && "input-error")}
                        placeholder="e.g., Master Marketing Toolkit"
                      />
                      {errors.title && <span className="text-error text-xs mt-1">{errors.title.message}</span>}
                    </div>

                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Slug</span></label>
                      <input
                        {...register('slug')}
                        className={cn("input input-bordered w-full bg-background font-mono text-sm", errors.slug && "input-error")}
                        placeholder="master-marketing-toolkit"
                      />
                      {errors.slug && <span className="text-error text-xs mt-1">{errors.slug.message}</span>}
                    </div>

                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Description</span></label>
                      <textarea
                        {...register('description')}
                        className={cn("textarea textarea-bordered w-full bg-background min-h-[100px]", errors.description && "textarea-error")}
                        placeholder="A compelling overview of what's inside this kit..."
                      />
                      {errors.description && <span className="text-error text-xs mt-1">{errors.description.message}</span>}
                    </div>

                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Price (USD)</span></label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          {...register('price', { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          className="input input-bordered w-full bg-background pl-9"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label py-1"><span className="label-text font-medium">Status</span></label>
                      <select 
                        {...register('status')}
                        className="select select-bordered w-full bg-background"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card bg-card border border-border shadow-sm">
                <div className="card-body p-6 space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Tags className="w-5 h-5 text-primary" />
                    Classification & Assets
                  </h2>

                  <div className="form-control">
                    <label className="label py-1"><span className="label-text font-medium">Categories</span></label>
                    <div className="flex flex-wrap gap-2">
                      {dynamicCategories.map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => {
                            const current = selectedCategories;
                            const next = current.includes(cat.name)
                              ? current.filter((c: string) => c !== cat.name)
                              : [...current, cat.name];
                            setValue('categories', next, { shouldDirty: true });
                          }}
                          className={cn(
                            "badge badge-lg cursor-pointer py-4 px-4 border transition-all",
                            selectedCategories.includes(cat.name)
                              ? "badge-primary text-white"
                              : "bg-background border-border text-muted-foreground hover:border-primary/50"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label py-1"><span className="label-text font-medium">Download URL (assets.fileUrl)</span></label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        {...register('assets.fileUrl')}
                        type="url"
                        className="input input-bordered w-full bg-background pl-9 text-sm"
                        placeholder="https://example.com/download.zip"
                      />
                    </div>
                  </div>

                  {/* Preview Card */}
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Marketplace Preview</h3>
                    <div className="bg-muted/30 border border-border border-dashed rounded-xl p-6">
                      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: selectedCategories[0] && categoryMap[selectedCategories[0]] ? categoryMap[selectedCategories[0]].bgLight : 'rgba(0,0,0,0.05)',
                            color: selectedCategories[0] && categoryMap[selectedCategories[0]] ? categoryMap[selectedCategories[0]].color : 'currentColor'
                          }}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground leading-tight">{title || 'Your Kit Title'}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {selectedCategories[0] || 'Category'} • {watch('price') === 0 ? 'Free' : `$${watch('price')}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {showIconPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="card bg-card border border-border w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="card-body p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Select Kit Icon</h3>
                  <button type="button" onClick={() => setShowIconPicker(false)} className="btn btn-ghost btn-sm btn-circle">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    className="input input-bordered w-full bg-background pl-10"
                    placeholder="Search icons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 max-h-[350px] overflow-y-auto p-1 custom-scrollbar">
                  {Object.keys(KIT_ICONS)
                    .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(name => {
                      const Icon = KIT_ICONS[name];
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setValue('assets.iconSvgName', name, { shouldDirty: true });
                            setShowIconPicker(false);
                          }}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                            watch('assets.iconSvgName') === name
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50 hover:bg-muted"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-[9px] truncate w-full text-center">{name}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
