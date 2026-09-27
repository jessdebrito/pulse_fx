import { z } from 'zod';

const FIRST_MONTH = 1;
const LAST_MONTH = 12;

export const availablePeriodsSchema = z.array(
  z.object({
    year: z.number().int(),
    months: z.array(z.number().int().min(FIRST_MONTH).max(LAST_MONTH)),
  }),
);

export const variationSchema = z.object({
  percent: z.number(),
  absoluteChange: z.number(),
  latestDate: z.iso.date(),
  latestValue: z.number(),
  baseDate: z.iso.date(),
  baseValue: z.number(),
  rule: z.object({ kind: z.enum(['observations', 'months']), count: z.number().int().positive() }),
});

export const trendSchema = z.array(z.object({ date: z.iso.date(), value: z.number() }));

export type Variation = z.infer<typeof variationSchema>;

export type TrendPoint = z.infer<typeof trendSchema>[number];

export type VariationRule = Variation['rule'];
