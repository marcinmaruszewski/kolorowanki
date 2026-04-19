import { z } from 'zod'

export const MonthPlanSchema = z.object({
  year: z.number(),
  month: z.number(),
  daysInMonth: z.number(),
  days: z.array(
    z.object({
      day: z.number(),
      weekday: z.enum(['pon', 'wt', 'sr', 'czw', 'pt', 'sob', 'nd']),
      occasion: z.string().nullable(),
      motif: z.string(),
      sources: z.array(z.url()),
    }),
  ),
  seriesNotes: z.string().nullable(),
})

export type MonthPlan = z.infer<typeof MonthPlanSchema>
