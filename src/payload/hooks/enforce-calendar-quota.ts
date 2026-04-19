import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

export const enforceCalendarQuota: CollectionBeforeChangeHook = async ({
  operation,
  req,
}) => {
  if (operation !== 'create') return
  if (!req.user) throw new APIError('Brak autoryzacji', 401)
  if (req.user.role === 'admin') return

  const { payload } = req
  const { docs } = await payload.find({
    collection: 'users',
    where: { id: { equals: req.user.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const user = docs[0]
  if (!user) throw new APIError('Nie znaleziono użytkownika', 404)

  if ((user.calendarsThisMonth ?? 0) >= 1) {
    throw new APIError('Przekroczono limit 1 kalendarza na miesiąc', 403)
  }

  await payload.update({
    collection: 'users',
    id: req.user.id,
    data: { calendarsThisMonth: (user.calendarsThisMonth ?? 0) + 1 },
    overrideAccess: true,
  })
}
