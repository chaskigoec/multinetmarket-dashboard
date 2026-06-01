'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function FileDropzone() {
  const [status, setStatus] = useState<Status>('idle')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      setError('Solo se aceptan archivos Excel (.xlsx)')
      setStatus('error')
      return
    }
    setFileName(file.name)
    setStatus('loading')
    setError('')

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/campaigns/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al subir')
      setStatus('success')
      setTimeout(() => router.push(`/campaign/${data.id}`), 1200)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setStatus('error')
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => status === 'idle' || status === 'error' ? inputRef.current?.click() : null}
      className={`
        border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
        ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50'}
        ${status === 'success' ? 'border-green-400 bg-green-50' : ''}
        ${status === 'error' ? 'border-red-300 bg-red-50' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {status === 'idle' && (
        <>
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700">Arrastra tu archivo Excel aquí</p>
          <p className="text-sm text-gray-500 mt-1">o haz clic para seleccionar</p>
          <p className="text-xs text-gray-400 mt-3">Solo archivos .xlsx de resultados YCloud</p>
        </>
      )}

      {status === 'loading' && (
        <>
          <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
          <p className="text-lg font-medium text-gray-700">Procesando campaña...</p>
          <p className="text-sm text-gray-500 mt-1 truncate max-w-xs mx-auto">{fileName}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <p className="text-lg font-medium text-green-700">¡Campaña cargada!</p>
          <p className="text-sm text-gray-500 mt-1">Redirigiendo al dashboard...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <p className="text-lg font-medium text-red-700">Error al procesar</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
          <p className="text-xs text-gray-400 mt-3">Haz clic para intentar de nuevo</p>
        </>
      )}

      {status === 'idle' && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Exporta el reporte de YCloud y súbelo aquí</span>
        </div>
      )}
    </div>
  )
}
