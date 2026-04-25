'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { buildSlots } from '@/lib/layout/build-slots'
import type { Day, Media } from '@/payload-types'
import { Toolbar } from './toolbar'
import { saveLayout, exportPdf } from './actions'

// A4 dimensions in PDF points (1 pt = 1/72 inch): 210mm × 297mm
const PAGE_W = 595
const PAGE_H = 842
const SNAP = 10
const MAX_UNDO = 20

// djb2 hash — deterministyczny seed z calendarId (string)
function hashString(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) + str.charCodeAt(i)) >>> 0
  }
  return h
}

interface Props {
  days: Day[]
  daysInMonth: number
  initialLayout?: Record<string, unknown> | null
}

export function FabricCanvas({ days, daysInMonth, initialLayout }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<import('fabric').Canvas | null>(null)
  const daysRef = useRef(days)
  const undoStack = useRef<string[]>([])
  const undoIdx = useRef(-1)
  const [undoState, setUndoState] = useState({ canUndo: false, canRedo: false })
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const params = useParams()
  const router = useRouter()
  const calendarId = Number(params?.id ?? 0)
  const stableSeed = hashString(String(params?.id ?? ''))

  useEffect(() => {
    daysRef.current = days
  }, [days])

  const pushState = useCallback(() => {
    const fc = fabricRef.current
    if (!fc) return
    const json = JSON.stringify(fc.toJSON())
    undoStack.current = undoStack.current.slice(0, undoIdx.current + 1)
    undoStack.current.push(json)
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift()
    undoIdx.current = undoStack.current.length - 1
    setUndoState({ canUndo: undoIdx.current > 0, canRedo: false })
  }, [])

  const applySlots = useCallback(
    async (seed?: number) => {
      const fc = fabricRef.current
      if (!fc) return
      const { FabricImage } = await import('fabric')

      const slots = buildSlots(daysInMonth, PAGE_W, PAGE_H, seed)

      fc.clear()

      await Promise.all(
        daysRef.current.map(async (day) => {
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
            selectable: true,
            hasControls: true,
          })
          fc.add(img)
        }),
      )

      fc.renderAll()
      pushState()
    },
    [daysInMonth, pushState],
  )

  useEffect(() => {
    let fc: import('fabric').Canvas | null = null

    async function init() {
      const { Canvas } = await import('fabric')
      if (!canvasRef.current || !containerRef.current) return

      const containerW = containerRef.current.clientWidth || PAGE_W
      const scale = containerW / PAGE_W

      fc = new Canvas(canvasRef.current, {
        width: PAGE_W * scale,
        height: PAGE_H * scale,
        selection: true,
      })
      fc.setZoom(scale)
      fabricRef.current = fc

      // Snap do siatki co SNAP punktów
      fc.on('object:moving', (e) => {
        const obj = e.target
        if (!obj) return
        obj.set({
          left: Math.round((obj.left ?? 0) / SNAP) * SNAP,
          top: Math.round((obj.top ?? 0) / SNAP) * SNAP,
        })
      })

      // Zapisz stan po każdej modyfikacji obiektu
      fc.on('object:modified', pushState)

      if (initialLayout) {
        await fc.loadFromJSON(initialLayout)
        fc.renderAll()
        pushState()
      } else {
        await applySlots(stableSeed)
      }
    }

    init()

    return () => {
      fabricRef.current = null
      fc?.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleShuffle = useCallback(() => {
    applySlots(Date.now())
  }, [applySlots])

  const handleReset = useCallback(() => {
    applySlots(stableSeed)
  }, [applySlots, stableSeed])

  const handleUndo = useCallback(async () => {
    const fc = fabricRef.current
    if (!fc || undoIdx.current <= 0) return
    undoIdx.current -= 1
    const json = undoStack.current[undoIdx.current]
    await fc.loadFromJSON(JSON.parse(json))
    fc.renderAll()
    setUndoState({
      canUndo: undoIdx.current > 0,
      canRedo: undoIdx.current < undoStack.current.length - 1,
    })
  }, [])

  const handleRedo = useCallback(async () => {
    const fc = fabricRef.current
    if (!fc || undoIdx.current >= undoStack.current.length - 1) return
    undoIdx.current += 1
    const json = undoStack.current[undoIdx.current]
    await fc.loadFromJSON(JSON.parse(json))
    fc.renderAll()
    setUndoState({
      canUndo: undoIdx.current > 0,
      canRedo: undoIdx.current < undoStack.current.length - 1,
    })
  }, [])

  const handleSave = useCallback(async () => {
    const fc = fabricRef.current
    if (!fc || !calendarId) return
    setIsSaving(true)
    try {
      const layout = fc.toJSON() as Record<string, unknown>
      await saveLayout(calendarId, layout)
    } finally {
      setIsSaving(false)
    }
  }, [calendarId])

  const handleExportPdf = useCallback(async () => {
    const fc = fabricRef.current
    if (!fc || !calendarId) return
    setIsExporting(true)
    try {
      const layout = fc.toJSON() as Record<string, unknown>
      const { jobId } = await exportPdf(calendarId, layout)
      router.push(`/kalendarz/${calendarId}/pobierz?job=${jobId}`)
    } finally {
      setIsExporting(false)
    }
  }, [calendarId, router])

  return (
    <div>
      <Toolbar
        onShuffle={handleShuffle}
        onReset={handleReset}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onExportPdf={handleExportPdf}
        canUndo={undoState.canUndo}
        canRedo={undoState.canRedo}
        isSaving={isSaving}
        isExporting={isExporting}
      />
      <div ref={containerRef} className="fabric-editor-container">
        <canvas ref={canvasRef} id="fabric-canvas" />
      </div>
    </div>
  )
}
