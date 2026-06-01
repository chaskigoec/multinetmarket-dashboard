import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { parseExcel } from '@/lib/excel'
import { saveCampaign, getIndex } from '@/lib/kv'

export const runtime = 'nodejs'

// Carpeta local donde YCloud exporta los resultados
const RESULTADOS_FOLDER = path.join(
  process.env.USERPROFILE ?? process.env.HOME ?? '',
  'OneDrive - ChaskiGo',
  'Documentos - OPERACIONES CHASKI',
  'PROYECTOS',
  '2026',
  'MULTINETMARKET',
  'ETAPA',
  'Resultados'
)

export async function POST() {
  try {
    if (!fs.existsSync(RESULTADOS_FOLDER)) {
      return NextResponse.json(
        { error: `Carpeta no encontrada: ${RESULTADOS_FOLDER}` },
        { status: 404 }
      )
    }

    const files = fs
      .readdirSync(RESULTADOS_FOLDER)
      .filter(f => /\.xlsx?$/i.test(f))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(RESULTADOS_FOLDER, f)).mtime }))
      .sort((a, b) => a.mtime.getTime() - b.mtime.getTime())

    if (!files.length) {
      return NextResponse.json({ synced: 0, skipped: 0, message: 'No hay archivos Excel en la carpeta' })
    }

    const index = await getIndex()
    const existingFilenames = new Set(index.map(c => c.filename))

    let synced = 0
    let skipped = 0
    const results: { filename: string; status: 'synced' | 'skipped'; nombre?: string }[] = []

    for (const file of files) {
      if (existingFilenames.has(file.name)) {
        skipped++
        results.push({ filename: file.name, status: 'skipped' })
        continue
      }

      const buffer = fs.readFileSync(path.join(RESULTADOS_FOLDER, file.name))
      const campaign = parseExcel(buffer.buffer, file.name)
      await saveCampaign(campaign, file.name)
      synced++
      results.push({ filename: file.name, status: 'synced', nombre: campaign.nombre })
    }

    return NextResponse.json({
      synced,
      skipped,
      total: files.length,
      results,
    })
  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
