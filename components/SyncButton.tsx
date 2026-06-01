'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

type Status = 'idle' | 'syncing' | 'success' | 'error'

export function SyncButton() {
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<{ synced: number; skipped: number } | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSync = async () => {
    setStatus('syncing')
    setResult(null)
    setError('')

    try {
      const res = await fetch('/api/campaigns/sync-folder', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al sincronizar')
        setStatus('error')
        return
      }

      setResult({ synced: data.synced, skipped: data.skipped })
      setStatus('success')
      router.refresh()

      // Volver a idle después de 4 segundos
      setTimeout(() => setStatus('idle'), 4000)
    } catch {
      setError('No se pudo conectar con el servidor')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSync}
        disabled={status === 'syncing'}
        className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163050] transition-colors shadow-sm disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${status === 'syncing' ? 'animate-spin' : ''}`} />
        {status === 'syncing' ? 'Leyendo carpeta...' : 'Sincronizar campañas'}
      </button>

      {status === 'success' && result && (
        <p className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="h-3 w-3" />
          {result.synced > 0
            ? `${result.synced} campaña${result.synced !== 1 ? 's' : ''} nueva${result.synced !== 1 ? 's' : ''} cargada${result.synced !== 1 ? 's' : ''}`
            : 'Todo al día'}
          {result.skipped > 0 && ` · ${result.skipped} ya existía${result.skipped !== 1 ? 'n' : ''}`}
        </p>
      )}

      {status === 'error' && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
