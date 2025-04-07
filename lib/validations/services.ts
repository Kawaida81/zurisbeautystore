import * as z from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  category: z.string().min(1, 'Category is required'),
  duration: z.number().min(5, 'Duration must be at least 5 minutes'),
  price: z.number().min(0, 'Price must be a positive number'),
  is_active: z.boolean().optional().default(true),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  id: z.string().uuid('Invalid service ID'),
});

export type CreateServiceSchema = z.infer<typeof createServiceSchema>;
export type UpdateServiceSchema = z.infer<typeof updateServiceSchema>;
