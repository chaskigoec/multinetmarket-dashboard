import { NextResponse } from 'next/server'
import { getIndex } from '@/lib/kv'

export async function GET() {
  const campaigns = await getIndex()
  return NextResponse.json(campaigns)
}
