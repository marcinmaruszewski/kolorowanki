import type { CollectionConfig } from 'payload'

export const GenerationJobs: CollectionConfig = {
  slug: 'generation-jobs',
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      // user może czytać tylko joby swoich kalendarzy
      return {
        'calendar.owner': { equals: user.id },
      }
    },
    create: () => false,
    update: () => false,
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'calendar',
      type: 'relationship',
      relationTo: 'calendars',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      options: ['research', 'images', 'single-image', 'pdf'],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: ['queued', 'submitted', 'in-progress', 'completed', 'failed', 'cancelled'],
      defaultValue: 'queued',
    },
    {
      name: 'openaiBatchId',
      type: 'text',
    },
    {
      name: 'costUsd',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'inputTokens',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'outputTokens',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'errorLog',
      type: 'textarea',
    },
    {
      name: 'startedAt',
      type: 'date',
    },
    {
      name: 'completedAt',
      type: 'date',
    },
  ],
}
