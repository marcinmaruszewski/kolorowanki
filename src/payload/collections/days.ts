import type { CollectionConfig } from 'payload'

export const Days: CollectionConfig = {
  slug: 'days',
  indexes: [
    {
      fields: ['calendar', 'day'],
      unique: true,
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { 'calendar.owner': { equals: user.id } }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { 'calendar.owner': { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { 'calendar.owner': { equals: user.id } }
    },
  },
  fields: [
    {
      name: 'calendar',
      type: 'relationship',
      relationTo: 'calendars',
      required: true,
      hasMany: false,
    },
    {
      name: 'day',
      type: 'number',
      required: true,
      min: 1,
      max: 31,
    },
    {
      name: 'weekday',
      type: 'select',
      options: ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'niedz'],
    },
    {
      name: 'occasion',
      type: 'text',
    },
    {
      name: 'motif',
      type: 'textarea',
    },
    {
      name: 'prompt',
      type: 'textarea',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'status',
      type: 'select',
      options: ['planned', 'prompting', 'generating', 'generated', 'failed'],
      defaultValue: 'planned',
    },
    {
      name: 'sources',
      type: 'array',
      fields: [
        {
          name: 'url',
          type: 'text',
        },
      ],
    },
  ],
}
