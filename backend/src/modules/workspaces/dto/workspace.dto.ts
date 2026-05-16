import { z } from 'zod';

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(120),
  kind: z.enum([
    'trip','group','roommates','couple','event','team','subscription','temporary','longterm','business','other',
  ]),
  baseCurrency: z.string().length(3),
  description: z.string().max(2000).optional().nullable(),
  coverColor: z.string().max(32).optional().nullable(),
});
export type CreateWorkspaceDto = z.infer<typeof CreateWorkspaceSchema>;

export const SetStatusSchema = z.object({
  status: z.enum(['active','paused','completed','archived']),
});
export type SetStatusDto = z.infer<typeof SetStatusSchema>;
