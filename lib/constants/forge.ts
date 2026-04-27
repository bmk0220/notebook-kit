/**
 * Forge 2.0 Central Configuration
 * This file defines the rigid data contract for Kit ingestion.
 */

export const FORGE_REQUIRED_FILES = [
  { id: 'description', filename: 'DESCRIPTION.md', label: 'Product Description' },
  { id: 'instructions', filename: 'INSTRUCTIONS.md', label: 'Instructions' },
  { id: 'custom', filename: 'CUSTOM.md', label: 'Custom' },
  { id: 'source', filename: '00_source.md', label: 'Source Material' },
  { id: 'overview', filename: '01_overview.md', label: 'Overview' },
  { id: 'concepts', filename: '02_concepts.md', label: 'Key Concepts' },
  { id: 'steps', filename: '03_steps.md', label: 'Action Steps' },
  { id: 'resources', filename: '04_resources.md', label: 'Resources' },
  { id: 'faq', filename: '05_faq.md', label: 'FAQ' },
  { id: 'checklists', filename: '06_checklists.md', label: 'Checklists' },
  { id: 'tips', filename: '07_tips.md', label: 'Tips & Tricks' },
] as const;

export type ForgeFileId = typeof FORGE_REQUIRED_FILES[number]['id'];



import { 
  // Core & Marketplace
  Notebook, FileText, Layout, Package, Star, Zap, Rocket,
  
  // Arts & Creative
  Palette, Music, Camera, Brush, Languages, Image,
  
  // Business & Finance
  Briefcase, TrendingUp, BarChart, PieChart, Globe, 
  DollarSign, CreditCard, Wallet, Banknote, Landmark,
  
  // Education & Learning
  GraduationCap, BookOpen, Pencil, School, Library, Brain,
  
  // Technology & Technical
  Cpu, Database, Terminal, Code, Wifi, Smartphone, 
  Settings, Shield, Workflow, Layers,
  
  // Health & Wellness
  Heart, Activity, Stethoscope, Trees, Dumbbell,
  
  // Organization
  List, Calendar, Clock, ClipboardList,
  
  // UI Elements
  CheckCircle, AlertCircle, Loader2, Download, Search, Info
} from 'lucide-react';

export const KIT_ICONS: Record<string, any> = {
  // Core
  Notebook, FileText, Layout, Package, Star, Zap, Rocket,
  
  // Arts
  Palette, Music, Camera, Brush, Languages, Image,
  
  // Business
  Briefcase, TrendingUp, BarChart, PieChart, Globe,
  DollarSign, CreditCard, Wallet, Banknote, Landmark,
  
  // Education
  GraduationCap, BookOpen, Pencil, School, Library, Brain,
  
  // Technical
  Cpu, Database, Terminal, Code, Wifi, Smartphone,
  Settings, Shield, Workflow, Layers,
  
  // Health
  Heart, Activity, Stethoscope, Trees, Dumbbell,
  
  // Organization
  List, Calendar, Clock, ClipboardList,
  
  // UI
  CheckCircle, AlertCircle, Loader2, Download, Search, Info
};
