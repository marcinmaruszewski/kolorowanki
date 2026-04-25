import type { CollectionConfig } from 'payload'
import { enforceCalendarQuota } from '../hooks/enforce-calendar-quota'

export const Calendars: CollectionConfig = {
  slug: 'calendars',
  admin: {
    useAsTitle: 'label',
  },
  hooks: {
    beforeChange: [enforceCalendarQuota],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { owner: { equals: user.id } }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { owner: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { owner: { equals: user.id } }
    },
  },
  indexes: [
    {
      fields: ['owner', 'year', 'month'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'year',
      type: 'number',
      required: true,
      min: 2025,
      max: 2100,
    },
    {
      name: 'month',
      type: 'number',
      required: true,
      min: 1,
      max: 12,
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      defaultValue: ({ user }: { user: { id: string } | null }) => user?.id,
    },
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'planned', 'plan_accepted', 'generated', 'composed', 'exported'],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'seriesDirection',
      type: 'textarea',
    },
    {
      name: 'planMd',
      type: 'textarea',
    },
    {
      name: 'layoutJson',
      type: 'json',
    },
    {
      name: 'label',
      type: 'text',
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ data }: { data?: { year?: number; month?: number } }) =>
            `${data?.year}-${String(data?.month).padStart(2, '0')}`,
        ],
      },
    },
  ],
}
