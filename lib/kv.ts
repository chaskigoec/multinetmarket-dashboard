import { Redis } from '@upstash/redis'
import { ParsedCampaign } from './excel'

export interface CampaignIndex {
  id: string
  nombre: string
  filename: string
  fechaCarga: string
  total: number
  enviados: number
  entregados: number
  fallidos: number
}

// In-memory fallback for local dev without KV credentials
const memStore: Record<string, unknown> = {}

function getRedis(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null
  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  })
}

async function kvGet<T>(key: string): Promise<T | null> {
  const redis = getRedis()
  if (!redis) return (memStore[key] as T) ?? null
  return redis.get<T>(key)
}

async function kvSet<T>(key: string, value: T): Promise<void> {
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
  await kvSet<ParsedCampaign>(`campaign:${campaign.id}`, campaign)

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
  await kvSet<CampaignIndex[]>('campaigns:index', updated)
}

export async function getIndex(): Promise<CampaignIndex[]> {
  const raw = await kvGet<CampaignIndex[]>('campaigns:index')
  return raw ?? []
}

export async function getCampaign(id: string): Promise<ParsedCampaign | null> {
  return kvGet<ParsedCampaign>(`campaign:${id}`)
}

export async function deleteCampaign(id: string): Promise<void> {
  await kvDel(`campaign:${id}`)
  const existing = await getIndex()
  await kvSet<CampaignIndex[]>('campaigns:index', existing.filter(c => c.id !== id))
}
