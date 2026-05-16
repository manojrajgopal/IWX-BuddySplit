import { z } from 'zod';

const MoneyMinor = z.string().regex(/^\d+$/);
const Currency = z.string().length(3);

export const CreateExpenseSchema = z.object({
  payerMemberId: z.string().uuid(),
  description: z.string().min(1).max(200),
  category: z.string().max(60).nullable().optional(),
  occurredAt: z.string().datetime().optional(),
  amount: MoneyMinor,                    // minor units as string
  currency: Currency,
  splitMode: z.enum(['equal','exact','percentage','shares','adjustment','itemized']),
  splitConfig: z.record(z.string(), z.any()).default({}),
  participantMemberIds: z.array(z.string().uuid()).optional(),
  notes: z.string().max(2000).nullable().optional(),
});
export type CreateExpenseDto = z.infer<typeof CreateExpenseSchema>;
