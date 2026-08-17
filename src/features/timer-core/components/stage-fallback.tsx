export function StageFallback() {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem-4.25rem)] items-center justify-center sm:min-h-[calc(100dvh-4rem)]">
      <span className="font-timer tnum text-timer-display leading-none font-light text-muted-foreground/30">
        --:--
      </span>
    </div>
  )
}
