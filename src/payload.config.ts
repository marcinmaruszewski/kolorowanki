import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Users } from './payload/collections/users'
import { Calendars } from './payload/collections/calendars'
import { Days } from './payload/collections/days'
import { Media } from './payload/collections/media'
import { resetMonthlyQuotasIfFirstOfMonth } from './jobs/quota-reset-cron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET ?? '',
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  collections: [Users, Calendars, Days, Media],
  editor: lexicalEditor({}),
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  jobs: {
    tasks: [
      {
        slug: 'quota-reset',
        handler: async ({ req }) => {
          await resetMonthlyQuotasIfFirstOfMonth(req.payload)
          return { output: {} }
        },
        inputSchema: [],
        outputSchema: [],
        schedule: [
          {
            cron: '5 0 * * *',
            queue: 'default',
          },
        ],
      },
    ],
    autoRun: [
      {
        cron: '5 0 * * *',
        queue: 'default',
      },
    ],
  },
})
