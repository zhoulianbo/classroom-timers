import { NextResponse } from 'next/server'
import { createPresentationRoom, PresentationRoomError } from '@/features/presentation-timer/server/rooms'
import type { AgendaItem } from '@/features/presentation-timer/types'

export const dynamic = 'force-dynamic'

function errorResponse(error: unknown) {
  if (error instanceof PresentationRoomError) {
    const status = error.code === 'BAD_REQUEST' || error.code === 'INVALID_NAME' ? 400 : error.code === 'STORE_UNAVAILABLE' ? 503 : 500
    return NextResponse.json({ error: error.code }, { status })
  }
  console.error('presentation room create failed', error)
  return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; agenda?: AgendaItem[] }
    if (typeof body.name !== 'string' || !Array.isArray(body.agenda)) {
      return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
    }
    return NextResponse.json(await createPresentationRoom({ name: body.name, agenda: body.agenda }))
  } catch (error) {
    return errorResponse(error)
  }
}
