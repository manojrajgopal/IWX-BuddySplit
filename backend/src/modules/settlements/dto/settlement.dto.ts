import { z } from 'zod';

export const RecordSettlementSchema = z.object({
  amountMinor: z.string().regex(/^\d+$/),
  method: z.string().max(60).optional(),
  reference: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
});
export type RecordSettlementDto = z.infer<typeof RecordSettlementSchema>;
