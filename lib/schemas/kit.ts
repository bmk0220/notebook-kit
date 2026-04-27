import { z } from 'zod';
import { FORGE_REQUIRED_FILES } from '../constants/forge';

/**
 * Forge 2.0 Kit Schema
 * This schema is the "Gatekeeper" for the ingestion pipeline.
 */

// Helper to build the content schema dynamically from constants
const contentSchemaObject: Record<string, z.ZodString> = {};
FORGE_REQUIRED_FILES.forEach((file) => {
  contentSchemaObject[file.id] = z.string().min(10, `${file.filename} is missing or too short (min 10 chars)`);
});

export const kitSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().min(20, "Product description is too short"),
  categories: z.array(z.string().min(1))
    .min(1, "At least one category is required"),
  tags: z.array(z.string()).default([]),
  price: z.number().min(0, "Price cannot be negative"),
  manifest: z.array(z.string()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  metadata: z.object({
    version: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    authorId: z.string(),
  }),
  content: z.object(contentSchemaObject),
  assets: z.object({
    iconSvgName: z.string().min(1, "Icon selection is required"),
    fileUrl: z.string().url("A valid download URL is required"),
  }),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export type Kit = z.infer<typeof kitSchema>;
