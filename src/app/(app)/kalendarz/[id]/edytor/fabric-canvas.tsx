'use client'

import React, { useEffect, useRef } from 'react'
import { buildSlots } from '@/lib/layout/build-slots'
import type { Day, Media } from '@/payload-types'

// A4 dimensions in PDF points (1 pt = 1/72 inch): 210mm × 297mm
const PAGE_W = 595
const PAGE_H = 842

interface Props {
  days: Day[]
  daysInMonth: number
}

export function FabricCanvas({ days, daysInMonth }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let fabricCanvas: import('fabric').Canvas | null = null

    async function init() {
      const { Canvas, FabricImage } = await import('fabric')
      if (!canvasRef.current || !containerRef.current) return

      const containerW = containerRef.current.clientWidth || PAGE_W
      const scale = containerW / PAGE_W

      fabricCanvas = new Canvas(canvasRef.current, {
        width: PAGE_W * scale,
        height: PAGE_H * scale,
        selection: false,
      })

      // Zoom canvas so slot coordinates (in A4 point space) map correctly to pixels
      fabricCanvas.setZoom(scale)

      const slots = buildSlots(daysInMonth, PAGE_W, PAGE_H)

      await Promise.all(
        days.map(async (day) => {
          const media = day.image as Media
          if (!media?.url) return

          const slot = slots.find((s) => s.dayNumber === day.day)
          if (!slot) return

          const img = await FabricImage.fromURL(media.url, { crossOrigin: 'anonymous' })

          img.scaleToWidth(slot.w)
          img.set({
            left: slot.x + slot.w / 2,
            top: slot.y + slot.h / 2,
            angle: slot.rotationDeg,
            originX: 'center',
            originY: 'center',
          })

          fabricCanvas!.add(img)
        }),
      )

      fabricCanvas.renderAll()
    }

    init()

    return () => {
      fabricCanvas?.dispose()
    }
  }, [days, daysInMonth])

  return (
    <div ref={containerRef} className="fabric-editor-container">
      <canvas ref={canvasRef} id="fabric-canvas" />
    </div>
  )
}
