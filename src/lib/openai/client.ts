import OpenAI from 'openai'

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
export const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4'
export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1.5'
