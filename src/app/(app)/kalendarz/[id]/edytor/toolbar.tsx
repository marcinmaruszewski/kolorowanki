'use client'

import React from 'react'

interface Props {
  onShuffle: () => void
  onReset: () => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  canUndo: boolean
  canRedo: boolean
  isSaving: boolean
}

export function Toolbar({ onShuffle, onReset, onUndo, onRedo, onSave, canUndo, canRedo, isSaving }: Props) {
  return (
    <div className="editor-toolbar">
      <button onClick={onShuffle}>Przetasuj</button>
      <button onClick={onReset}>Reset</button>
      <button onClick={onUndo} disabled={!canUndo}>
        Cofnij
      </button>
      <button onClick={onRedo} disabled={!canRedo}>
        Ponów
      </button>
      <button onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Zapisywanie…' : 'Zapisz'}
      </button>
    </div>
  )
}
