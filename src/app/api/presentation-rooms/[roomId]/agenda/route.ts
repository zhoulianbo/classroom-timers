import { NextResponse } from 'next/server'
import {
  PresentationRoomError,
  updatePresentationAgenda,
} from '@/features/presentation-timer/server/rooms'
import type { AgendaItem } from '@/features/presentation-timer/types'

export const dynamic = 'force-dynamic'
type RouteContext = { params: Promise<{ roomId: string }> }

function errorResponse(error: unknown) {
  if (error instanceof PresentationRoomError) {
    const status =
      error.code === 'BAD_REQUEST' || error.code === 'INVALID_NAME'
        ? 400
        : error.code === 'FORBIDDEN'
          ? 403
          : error.code === 'NOT_FOUND'
            ? 404
            : error.code === 'CONFLICT'
              ? 409
              : 503
    return NextResponse.json({ error: error.code }, { status })
  }
  console.error('presentation room agenda update failed', error)
  return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { roomId } = await context.params
    const body = (await request.json()) as {
      name?: string
      agenda?: AgendaItem[]
      expectedRevision?: number
    }
    if (!Array.isArray(body.agenda) || !Number.isInteger(body.expectedRevision)) {
      return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
    }
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
    return NextResponse.json(
      await updatePresentationAgenda(roomId, token, {
        name: body.name,
        agenda: body.agenda,
        expectedRevision: body.expectedRevision as number,
      }),
    )
  } catch (error) {
    return errorResponse(error)
  }
}
