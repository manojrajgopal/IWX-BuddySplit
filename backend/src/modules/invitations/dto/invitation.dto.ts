import { z } from 'zod';

export const CreateInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin','editor','viewer']).optional(),
  ttlHours: z.number().int().positive().max(720).optional(),
});
export type CreateInviteDto = z.infer<typeof CreateInviteSchema>;
