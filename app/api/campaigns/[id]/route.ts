import { NextRequest, NextResponse } from 'next/server'
import { getCampaign } from '@/lib/kv'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaign = await getCampaign(id)
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
  return NextResponse.json(campaign)
}
