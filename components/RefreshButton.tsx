'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RefreshButton() {
  const [spinning, setSpinning] = useState(false)
  const router = useRouter()

  const handleRefresh = () => {
    setSpinning(true)
    router.refresh()
    setTimeout(() => setSpinning(false), 800)
  }

  return (
    <button
      onClick={handleRefresh}
      title="Actualizar campañas"
      className="flex items-center justify-center p-1.5 rounded-md transition-colors hover:bg-gray-100"
      style={{ color: "var(--ink-3)" }}
    >
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ animation: spinning ? "spin 0.8s linear" : "none" }}
      >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M8 16H3v5"/>
      </svg>
    </button>
  )
}
