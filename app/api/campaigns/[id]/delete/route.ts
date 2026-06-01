import { NextRequest, NextResponse } from 'next/server'
import { deleteCampaign } from '@/lib/kv'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteCampaign(id)
  return NextResponse.json({ ok: true })
}
