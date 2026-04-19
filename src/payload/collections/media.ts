import path from 'path'
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: path.join(process.cwd(), 'media'),
    mimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'calendar',
      type: 'relationship',
      relationTo: 'calendars',
    },
  ],
}
