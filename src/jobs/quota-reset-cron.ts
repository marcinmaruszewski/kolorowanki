import type { Payload } from 'payload'

export async function resetMonthlyQuotasIfFirstOfMonth(payload: Payload): Promise<void> {
  if (new Date().getDate() !== 1) return

  await payload.update({
    collection: 'users',
    where: {},
    data: {
      calendarsThisMonth: 0,
      quotaResetAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })
}
