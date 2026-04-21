import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function countRegenerationsUsed(calendarId: number): Promise<number> {
  const payload = await getPayload({ config: configPromise })
  const { totalDocs } = await payload.find({
    collection: 'generation-jobs',
    where: {
      and: [
        { calendar: { equals: calendarId } },
        { type: { equals: 'single-image' } },
        { status: { not_equals: 'failed' } },
      ],
    },
    limit: 0,
    overrideAccess: true,
  })
  return totalDocs
}
