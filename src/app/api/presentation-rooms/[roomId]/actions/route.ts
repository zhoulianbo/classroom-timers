import { NextResponse } from 'next/server'
import {
  applyPresentationAction,
  PresentationRoomError,
} from '@/features/presentation-timer/server/rooms'
import type { PresentationAction } from '@/features/presentation-timer/types'

export const dynamic = 'force-dynamic'
type RouteContext = { params: Promise<{ roomId: string }> }

function errorResponse(error: unknown) {
  if (error instanceof PresentationRoomError) {
    const status =
      error.code === 'BAD_REQUEST'
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
  console.error('presentation room action failed', error)
  return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { roomId } = await context.params
    const action = (await request.json()) as PresentationAction
    if (
      !action ||
      typeof action.type !== 'string' ||
      !['start', 'pause', 'reset', 'adjust', 'select', 'next', 'previous', 'output'].includes(
        action.type,
      )
    ) {
      return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
    }
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
    return NextResponse.json(await applyPresentationAction(roomId, token, action))
  } catch (error) {
    return errorResponse(error)
  }
}
