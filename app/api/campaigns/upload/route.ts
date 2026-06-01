import { NextRequest, NextResponse } from 'next/server'
import { parseExcel } from '@/lib/excel'
import { saveCampaign, getIndex } from '@/lib/kv'

export const runtime = 'nodejs'

// Optional Blob upload — only when BLOB_READ_WRITE_TOKEN is set
async function storeBlob(buffer: ArrayBuffer, filename: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return
  const { put } = await import('@vercel/blob')
  await put(`campaigns/${filename}`, Buffer.from(buffer), {
    access: 'public',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'xlsx' && ext !== 'xls') {
      return NextResponse.json({ error: 'Solo se aceptan archivos Excel (.xlsx)' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()

    // Skip if a campaign with same filename already exists
    const index = await getIndex()
    const alreadyExists = index.find(c => c.filename === file.name)
    if (alreadyExists) {
      return NextResponse.json({ id: alreadyExists.id, nombre: alreadyExists.nombre, skipped: true })
    }

    const campaign = parseExcel(buffer, file.name)
    await Promise.all([
      saveCampaign(campaign, file.name),
      storeBlob(buffer, file.name),
    ])

    return NextResponse.json({ id: campaign.id, nombre: campaign.nombre, skipped: false })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Error al procesar el archivo' }, { status: 500 })
  }
}
