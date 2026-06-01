import path from 'path'
import fs from 'fs'
import { parseExcel, ParsedCampaign } from './excel'
import { encodeId, decodeId } from './utils'

export { encodeId, decodeId }

export const RESULTADOS_FOLDER = path.join(
  process.env.USERPROFILE ?? process.env.HOME ?? '',
  'OneDrive - ChaskiGo',
  'Documentos - OPERACIONES CHASKI',
  'PROYECTOS',
  '2026',
  'MULTINETMARKET',
  'ETAPA',
  'Resultados'
)

const IS_VERCEL = !!process.env.VERCEL


export function listExcelFiles(): { filename: string; id: string; mtime: Date }[] {
  if (IS_VERCEL || !fs.existsSync(RESULTADOS_FOLDER)) return []
  return fs
    .readdirSync(RESULTADOS_FOLDER)
    .filter(f => /\.xlsx?$/i.test(f))
    .map(f => ({
      filename: f,
      id: encodeId(f),
      mtime: fs.statSync(path.join(RESULTADOS_FOLDER, f)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
}

export function readCampaignFromDisk(filename: string): ParsedCampaign | null {
  const filepath = path.join(RESULTADOS_FOLDER, filename)
  if (!fs.existsSync(filepath)) return null
  const buffer = fs.readFileSync(filepath)
  return parseExcel(buffer.buffer, filename)
}

// Lee desde disco (local) o desde KV (Vercel) según el entorno
export async function readCampaign(filename: string): Promise<ParsedCampaign | null> {
  if (!IS_VERCEL && fs.existsSync(path.join(RESULTADOS_FOLDER, filename))) {
    return readCampaignFromDisk(filename)
  }
  const { getCampaign, getIndex } = await import('./kv')
  const index = await getIndex()
  const entry = index.find(c => c.filename === filename)
  if (!entry) return null
  return getCampaign(entry.id)
}

// Lee todas: disco en local, KV en Vercel
export async function readAllCampaigns(): Promise<ParsedCampaign[]> {
  if (!IS_VERCEL && fs.existsSync(RESULTADOS_FOLDER)) {
    return listExcelFiles()
      .map(f => readCampaignFromDisk(f.filename))
      .filter((c): c is ParsedCampaign => c !== null)
  }
  // Vercel: leer desde KV
  const { getIndex, getCampaign } = await import('./kv')
  const index = await getIndex()
  const campaigns = await Promise.all(index.map(c => getCampaign(c.id)))
  return campaigns.filter((c): c is ParsedCampaign => c !== null)
}
