import { NotFoundPage } from '@payloadcms/next/views'
import config from '@payload-config'
import { importMap } from '@/app/(payload)/admin/importMap'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

const NotFound = ({ params, searchParams }: Args) =>
  NotFoundPage({ config, params, searchParams, importMap })

export default NotFound
