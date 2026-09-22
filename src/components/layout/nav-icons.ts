import { Clock, Globe2, Home, Layers, Timer, type LucideIcon } from 'lucide-react'
import type { NavItem } from '@/config/navigation'

export const navigationIcons: Record<NavItem['key'], LucideIcon> = {
  home: Home,
  worldClock: Globe2,
  flipClock: Layers,
  digitalClock: Clock,
  stopwatch: Timer,
}
