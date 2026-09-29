import { NextResponse } from 'next/server'
import {
  getPresentationRoom,
  PresentationRoomError,
  updatePresentationSettings,
} from '@/features/presentation-timer/server/rooms'
import type { PresentationRoom } from '@/features/presentation-timer/types'

export const dynamic = 'force-dynamic'
type RouteContext = { params: Promise<{ roomId: string }> }

function bearerToken(request: Request) {
  return request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
}

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
  console.error('presentation room request failed', error)
  return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { roomId } = await context.params
    return NextResponse.json(
      await getPresentationRoom(
        roomId,
        bearerToken(request),
        request.headers.get('x-presentation-client-id') ?? '',
        request.headers.get('x-presentation-view') === 'display',
      ),
    )
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { roomId } = await context.params
    const body = (await request.json()) as {
      settings?: PresentationRoom['settings']
      expectedRevision?: number
    }
    if (!body.settings || !Number.isInteger(body.expectedRevision)) {
      return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
    }
    return NextResponse.json(
      await updatePresentationSettings(roomId, bearerToken(request), {
        settings: body.settings,
        expectedRevision: body.expectedRevision as number,
      }),
    )
  } catch (error) {
    return errorResponse(error)
  }
}
