import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const template = fs.readFileSync(
  path.join(__dirname, 'templates', 'image-prompt-template.txt'),
  'utf-8',
)

export function buildImagePrompt(args: {
  day: number
  month: number
  occasion: string | null
  motif: string
  seriesDirection: string | null
}): string {
  const { day, month, occasion, motif, seriesDirection } = args
  const dd = String(day).padStart(2, '0')
  const mm = String(month).padStart(2, '0')
  const date = `${dd}.${mm}`

  const motywDnia = occasion ? `${motif} (${occasion})` : motif

  let prompt = template
    .replace(/<motyw dnia>/g, motywDnia)
    .replace(/<glowny symbol albo mala scenka>/g, motif)
    .replace(/DD\.MM/g, date)

  if (seriesDirection) {
    prompt = `Series constraints: ${seriesDirection}\n\n${prompt}`
  }

  return prompt
}
