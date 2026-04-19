import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: user.id } }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
    create: () => true,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      options: ['user', 'admin'],
      defaultValue: 'user',
      required: true,
      saveToJWT: true,
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'googleSub',
      type: 'text',
      unique: true,
      index: true,
    },
    {
      name: 'calendarsThisMonth',
      type: 'number',
      defaultValue: 0,
      required: true,
      access: {
        update: () => false,
      },
    },
    {
      name: 'quotaResetAt',
      type: 'date',
      access: {
        update: () => false,
      },
    },
  ],
}
