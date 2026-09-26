import { z } from 'zod';

const FIRST_MONTH = 1;
const LAST_MONTH = 12;

export const availablePeriodsSchema = z.array(
  z.object({
    year: z.number().int(),
    months: z.array(z.number().int().min(FIRST_MONTH).max(LAST_MONTH)),
  }),
);
