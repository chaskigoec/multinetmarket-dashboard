import { ParsedCampaign } from './excel'

export interface CampaignIndex {
  id: string
  nombre: string
  filename: string   // nombre original del archivo .xlsx para deduplicación
  fechaCarga: string
  total: number
  enviados: number
  entregados: number
  fallidos: number
}

import { Redis } from '@upstash/redis'

// In-memory fallback for local dev without KV credentials
const memStore: Record<string, string> = {}

function getRedis(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null
  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  })
}

async function kvGet(key: string): Promise<string | null> {
  const redis = getRedis()
  if (!redis) return memStore[key] ?? null
  const val = await redis.get<string>(key)
  return val ?? null
}

async function kvSet(key: string, value: string): Promise<void> {
  const redis = getRedis()
  if (!redis) { memStore[key] = value; return }
  await redis.set(key, value)
}

async function kvDel(key: string): Promise<void> {
  const redis = getRedis()
  if (!redis) { delete memStore[key]; return }
  await redis.del(key)
}

export async function saveCampaign(campaign: ParsedCampaign, filename?: string): Promise<void> {
  await kvSet(`campaign:${campaign.id}`, JSON.stringify(campaign))

  const existing = await getIndex()
  const entry: CampaignIndex = {
    id: campaign.id,
    nombre: campaign.nombre,
    filename: filename ?? campaign.nombre,
    fechaCarga: campaign.fechaCarga,
    total: campaign.metrics.total,
    enviados: campaign.metrics.enviadosCanal,
    entregados: campaign.metrics.entregados,
    fallidos: campaign.metrics.fallidos,
  }
  const updated = [entry, ...existing.filter(c => c.filename !== entry.filename)]
  await kvSet('campaigns:index', JSON.stringify(updated))
}

export async function getIndex(): Promise<CampaignIndex[]> {
  const raw = await kvGet('campaigns:index')
  if (!raw) return []
  try {
    return JSON.parse(raw) as CampaignIndex[]
  } catch {
    return []
  }
}

export async function getCampaign(id: string): Promise<ParsedCampaign | null> {
  const raw = await kvGet(`campaign:${id}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ParsedCampaign
  } catch {
    return null
  }
}

export async function deleteCampaign(id: string): Promise<void> {
  await kvDel(`campaign:${id}`)
  const existing = await getIndex()
  await kvSet('campaigns:index', JSON.stringify(existing.filter(c => c.id !== id)))
}
