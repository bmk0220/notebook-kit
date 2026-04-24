'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Plus, 
  Upload, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Search,
  Package,
  Tags,
  DollarSign,
  Info,
  Loader2,
  Rocket
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { kitSchema, type Kit } from '@/lib/schemas/kit';
import { FORGE_REQUIRED_FILES, KIT_CATEGORIES } from '@/lib/constants/forge';
import { useAuth } from '@/context/AuthContext';
import { ingestKit } from './actions';
import { v4 as uuidv4 } from 'uuid';
import { db, storage } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import JSZip from 'jszip';
// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COMMON_ICONS = [
  'Book', 'FileText', 'Cpu', 'Database', 'Globe', 
  'Zap', 'Settings', 'Shield', 'FlaskConical', 'Layers',
  'Code', 'Layout', 'Terminal', 'Brain', 'Workflow'
];

export default function ForgePage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [isReading, setIsReading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedKitId, setPublishedKitId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUrlManuallyEdited, setIsUrlManuallyEdited] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Partial<Kit>>({
    resolver: zodResolver(kitSchema.partial()), // Use partial for draft state
    defaultValues: {
      status: 'draft',
      price: 0,
      categories: [],
      tags: [],
      assets: {
        iconSvgName: 'Package',
        fileUrl: '',
      }
    }
  });

  const selectedIconName = watch('assets.iconSvgName') || 'Package';
  const title = watch('title');
  const selectedCategories = watch('categories') || [];
  
  // Auto-generate fileUrl based on title
  useEffect(() => {
    if (title && !isUrlManuallyEdited) {
      const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
      setValue('assets.fileUrl', `https://storage.googleapis.com/notebook-kit-assets/kits/${slug}.zip`);
    }
  }, [title, isUrlManuallyEdited, setValue]);

  // Handle bulk file upload
  const handleBulkUpload = async (files: FileList | File[]) => {
    setIsReading(true);
    const newFiles = { ...uploadedFiles };
    const newContents = { ...fileContents };

    for (const file of Array.from(files)) {
      // Find matching requirement by filename
      const match = FORGE_REQUIRED_FILES.find((req: any) => 
        req.filename.toLowerCase() === file.name.toLowerCase()
      );

      if (match) {
        newFiles[match.id] = file;
        const content = await file.text();
        newContents[match.id] = content;

        // Auto-extract description from overview
        if (match.id === 'overview' && !watch('description')) {
          const preview = content.slice(0, 500).replace(/[#*`]/g, '').trim();
          if (preview.length > 20) {
            setValue('description', preview);
          }
        }
      }
    }

    setUploadedFiles(newFiles);
    setFileContents(newContents);
    setIsReading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBulkUpload([file]);
    }
  };

  const onSubmit = async (data: Partial<Kit>) => {
    if (Object.keys(uploadedFiles).length < FORGE_REQUIRED_FILES.length) {
      setError(`Publishing Blocked: You must upload all ${FORGE_REQUIRED_FILES.length} required markdown files. Check the Readiness list below.`);
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      // Construct the final object for validation
      const submissionData = {
        ...data,
        description: fileContents.description || data.description || '',
        id: uuidv4(),
        userId: user?.uid || 'anonymous',
        slug: data.slug || data.title?.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '') || '',
        manifest: Object.keys(uploadedFiles).map(id => {
          const fileMeta = FORGE_REQUIRED_FILES.find(f => f.id === id);
          return fileMeta ? fileMeta.filename : id;
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: fileContents,
        metadata: {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authorId: user?.uid || 'anonymous',
        },
        assets: {
          iconSvgName: selectedIconName || 'Package',
          fileUrl: data.assets?.fileUrl || '',
        }
      };

      // Client-side validation check
      const validation = kitSchema.safeParse(submissionData);
      if (!validation.success) {
        const firstError = validation.error.issues[0];
        setError(`${firstError.path.join('.')}: ${firstError.message}`);
        setIsPublishing(false);
        return;
      }

      // 2. Generate ZIP locally using JSZip
      const zip = new JSZip();
      const folder = zip.folder(submissionData.slug);
      if (!folder) throw new Error("Failed to create zip folder");

      Object.entries(submissionData.content).forEach(([id, content]) => {
        const fileMeta = FORGE_REQUIRED_FILES.find(f => f.id === id);
        if (fileMeta) {
          folder.file(fileMeta.filename, content as string);
        }
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // 3. Upload to Firebase Storage using the authenticated Client SDK
      const storagePath = `kits/${submissionData.id}/${submissionData.slug}.zip`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, zipBlob, {
        contentType: 'application/zip',
        customMetadata: {
          kitId: submissionData.id,
          version: submissionData.metadata.version
        }
      });

      const downloadUrl = await getDownloadURL(storageRef);

      // 4. Update submission data with the final URL
      const finalKit: Kit = {
        ...(submissionData as Kit),
        assets: {
          ...submissionData.assets,
          fileUrl: downloadUrl
        },
        status: 'published'
      };

      // 5. Save metadata to Firestore using authenticated Client SDK
      await setDoc(doc(db, 'kits', finalKit.id), finalKit);

      setPublishedKitId(finalKit.id);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      console.error('Submission Crash:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary/50" /></div>;
  if (!user || !isAdmin) return <div className="p-12 text-center text-error bg-background min-h-screen">Access Restricted to Admin Accounts</div>;

  if (publishedKitId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Kit Published!</h1>
        <p className="text-muted-foreground mb-8 max-w-md">Your kit has been successfully validated, zipped, and pushed to the marketplace.</p>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="btn btn-outline">Publish Another</button>
          <button onClick={() => router.push('/marketplace')} className="btn btn-primary">View Marketplace</button>
        </div>
      </div>
    );
  }

  // Safe icon resolution to prevent runtime crashes with dynamic lookups
  const getIcon = (name: string) => {
    const Icon = (LucideIcons as any)[name];
    // Check if it's a valid React component (function or object with render)
    if (Icon && (typeof Icon === 'function' || (typeof Icon === 'object' && Icon.$$typeof))) {
      return Icon;
    }
    return Package;
  };

  const IconComponent = getIcon(selectedIconName);

  const onFormError = (errors: any) => {
    const findErrorMessage = (obj: any): string | null => {
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
      <form onSubmit={handleSubmit(onSubmit, onFormError)} className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Forge 2.0</h1>
            <p className="text-muted-foreground mt-1">Deterministic Kit Ingestion Pipeline</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 rounded-full">
              Ingestion Mode: Manual
            </div>
          </div>
        </header>

        {error && (
          <div className="alert alert-error shadow-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Metadata */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card bg-card border border-border shadow-sm overflow-visible">
              <div className="card-body p-6 space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Kit Metadata
                </h2>

                {/* Icon Selection */}
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

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium">Kit Title</span>
                    </label>
                    <input 
                      {...register('title')}
                      className={cn("input input-bordered w-full bg-background", errors.title && "input-error")}
                      placeholder="e.g., Master Marketing Toolkit"
                    />
                    {errors.title && <span className="text-error text-xs mt-1">{errors.title.message}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium">Description</span>
                    </label>
                    <textarea 
                      {...register('description')}
                      className={cn("textarea textarea-bordered w-full bg-background min-h-[100px]", errors.description && "textarea-error")}
                      placeholder="A compelling overview of what's inside this kit..."
                    />
                    {errors.description && <span className="text-error text-xs mt-1">{errors.description.message}</span>}
                    <label className="label">
                      <span className="label-text-alt text-muted-foreground">Auto-extracted from 01_overview.md if uploaded.</span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium">Price (USD)</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        {...register('price', { valueAsNumber: true })}
                        type="number"
                        className="input input-bordered w-full bg-background pl-9"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium">Download URL (assets.fileUrl)</span>
                    </label>
                    <div className="relative">
                      <LucideIcons.Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        {...register('assets.fileUrl', {
                          onChange: () => setIsUrlManuallyEdited(true)
                        })}
                        type="url"
                        className="input input-bordered w-full bg-background pl-9"
                        placeholder="https://example.com/download.zip"
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium">Categories</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(KIT_CATEGORIES).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            const current = selectedCategories;
                            const next = current.includes(cat) 
                              ? current.filter((c: string) => c !== cat)
                              : [...current, cat];
                            setValue('categories', next as any);
                          }}
                          className={cn(
                            "badge badge-lg cursor-pointer py-4 px-4 border transition-all",
                            selectedCategories.includes(cat)
                              ? "badge-primary text-white"
                              : "bg-background border-border text-muted-foreground hover:border-primary/50"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-medium">Tags</span>
                    </label>
                    <div className="relative">
                      <Tags className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        className="input input-bordered w-full bg-background pl-9"
                        placeholder="Add tags, separated by commas"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="card bg-muted/30 border border-border border-dashed">
              <div className="card-body p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Marketplace Preview</h3>
                <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: selectedCategories[0] ? (KIT_CATEGORIES as any)[selectedCategories[0]].bgLight : 'rgba(0,0,0,0.05)',
                      color: selectedCategories[0] ? (KIT_CATEGORIES as any)[selectedCategories[0]].color : 'currentColor'
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

            {/* Publish Actions */}
            <div className="card bg-card border border-border shadow-sm overflow-hidden">
              <div className="card-body p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Publishing Readiness</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {FORGE_REQUIRED_FILES.map(req => {
                      const isUploaded = !!uploadedFiles[req.id];
                      return (
                        <div key={req.id} className="flex items-center gap-2 text-[10px]">
                          {isUploaded ? (
                            <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-warning/30 shrink-0" />
                          )}
                          <span className={isUploaded ? "text-foreground font-medium truncate" : "text-muted-foreground truncate"}>
                            {req.filename}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="w-full h-12 bg-primary text-primary-foreground font-black rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 cursor-pointer"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        PUBLISHING...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5" />
                        PUBLISH KIT
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setError('Draft feature coming soon! All data is currently in-memory.')}
                    className="w-full h-12 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-muted/80 transition-all cursor-pointer"
                  >
                    SAVE DRAFT
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: File Ingestion */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-card border border-border shadow-sm">
              <div className="card-body p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Upload className="w-5 h-5 text-primary" />
                      File Ingestion
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Upload the required 10 markdown files for validation.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-primary/5 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/10">
                    {Object.keys(uploadedFiles).length} / {FORGE_REQUIRED_FILES.length} FILES DETECTED
                  </div>
                </div>

                {/* Bulk Upload Dropzone */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleBulkUpload(e.dataTransfer.files);
                  }}
                  className="mb-8 p-8 border-2 border-dashed border-border rounded-2xl bg-muted/20 hover:bg-muted/30 hover:border-primary/50 transition-all text-center group cursor-pointer relative"
                >
                  <input 
                    type="file" 
                    multiple 
                    accept=".md"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => e.target.files && handleBulkUpload(e.target.files)}
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-background rounded-full border border-border group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Drop files here or click to bulk upload</p>
                      <p className="text-xs text-muted-foreground mt-1">Files will be automatically mapped by name (e.g. 01_overview.md)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FORGE_REQUIRED_FILES.map((file: any) => {
                    const isUploaded = !!uploadedFiles[file.id];
                    return (
                      <div 
                        key={file.id}
                        className={cn(
                          "group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                          isUploaded 
                            ? "bg-success/5 border-success/30 text-success-content" 
                            : "bg-background border-border hover:border-primary/40 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            isUploaded ? "bg-success/20 text-success" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                          )}>
                            {isUploaded ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{file.label}</div>
                            <div className="text-[10px] opacity-60 font-mono uppercase">{file.filename}</div>
                          </div>
                        </div>
                        
                        <label className="cursor-pointer absolute inset-0 opacity-0">
                          <input 
                            type="file" 
                            accept=".md"
                            onChange={(e) => handleFileChange(e, file.id)}
                            className="hidden"
                          />
                        </label>

                        {isUploaded && (
                          <button 
                            type="button"
                            onClick={() => {
                              const next = { ...uploadedFiles };
                              delete next[file.id];
                              setUploadedFiles(next);
                            }}
                            className="p-1 hover:bg-success/20 rounded-md transition-colors relative z-10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Global Validation Status */}
                <div className="mt-8 p-4 rounded-xl bg-muted/20 border border-border">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-background rounded-lg border border-border mt-1">
                      <FileCheck className={cn(
                        "w-6 h-6",
                        Object.keys(uploadedFiles).length === FORGE_REQUIRED_FILES.length ? "text-success" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Validation Pipeline Status</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Object.keys(uploadedFiles).length === FORGE_REQUIRED_FILES.length 
                          ? "All files detected. Ready for schema validation."
                          : `Awaiting ${FORGE_REQUIRED_FILES.length - Object.keys(uploadedFiles).length} mandatory files to begin parsing.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Icon Picker Modal (Simulated) */}
      {showIconPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="card bg-card border border-border w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="card-body p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Select Kit Icon</h3>
                <button 
                  type="button" 
                  onClick={() => setShowIconPicker(false)} 
                  className="btn btn-ghost btn-sm btn-circle"
                >
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
                {Object.keys(LucideIcons)
                  .filter(name => {
                    // Only include PascalCase names (icons) and exclude internal utilities
                    if (!/^[A-Z]/.test(name) || name === 'LucideIcon' || name === 'createLucideIcon') return false;
                    const Icon = (LucideIcons as any)[name];
                    const isComponent = Icon && (typeof Icon === 'function' || (typeof Icon === 'object' && Icon.$$typeof));
                    return isComponent && name.toLowerCase().includes(searchTerm.toLowerCase());
                  })
                  .slice(0, 100) // Performance limit for initial render/search
                  .map(name => {
                    const Icon = (LucideIcons as any)[name];
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setValue('assets.iconSvgName', name);
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
