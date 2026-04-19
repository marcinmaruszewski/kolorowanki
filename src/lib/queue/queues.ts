import { Queue } from 'bullmq'
import { redisConnection } from './connection'

export const researchQueue = new Queue('research', { connection: redisConnection })
export const imagesQueue = new Queue('images', { connection: redisConnection })
export const singleImageQueue = new Queue('single-image', { connection: redisConnection })
export const pdfQueue = new Queue('pdf', { connection: redisConnection })

export async function enqueueResearch(calendarId: string) {
  return researchQueue.add('research', { calendarId })
}

export async function enqueueImages(calendarId: string) {
  return imagesQueue.add('images', { calendarId })
}

export async function enqueueSingleImage(calendarId: string, dayId: string) {
  return singleImageQueue.add('single-image', { calendarId, dayId })
}

export async function enqueuePdf(calendarId: string) {
  return pdfQueue.add('pdf', { calendarId })
}
