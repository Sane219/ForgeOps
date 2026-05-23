import { z } from 'zod';

export const idSchema = z.string().min(1).max(64);

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type Pagination = z.infer<typeof paginationSchema>;

export const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/, 'must be lowercase kebab-case');

export const envVarSchema = z.object({
  key: z.string().regex(/^[A-Z_][A-Z0-9_]*$/, 'must be UPPER_SNAKE_CASE'),
  value: z.string(),
  secret: z.boolean().default(false),
});
export type EnvVar = z.infer<typeof envVarSchema>;

export interface PageResult<T> {
  items: T[];
  nextCursor?: string;
}
