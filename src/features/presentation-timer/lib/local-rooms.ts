'use client'

import type { LocalPresentationRoom } from '../types'

export const PRESENTATION_STORAGE_KEY = 'classroomtimers:presentation:v1'

export function loadLocalPresentationRooms() {
  try {
    const value = window.localStorage.getItem(PRESENTATION_STORAGE_KEY)
    if (!value) return []
    const rooms = JSON.parse(value) as LocalPresentationRoom[]
    return Array.isArray(rooms)
      ? rooms.filter((room) => room.expiresAt > Date.now()).slice(0, 10)
      : []
  } catch {
    return []
  }
}

export function saveLocalPresentationRoom(room: LocalPresentationRoom) {
  const rooms = loadLocalPresentationRooms().filter((item) => item.roomId !== room.roomId)
  window.localStorage.setItem(
    PRESENTATION_STORAGE_KEY,
    JSON.stringify([room, ...rooms].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt).slice(0, 10)),
  )
}

export function getLocalPresentationRoom(roomId: string) {
  return loadLocalPresentationRooms().find((room) => room.roomId === roomId) ?? null
}

export function removeLocalPresentationRoom(roomId: string) {
  const rooms = loadLocalPresentationRooms().filter((room) => room.roomId !== roomId)
  window.localStorage.setItem(PRESENTATION_STORAGE_KEY, JSON.stringify(rooms))
}
