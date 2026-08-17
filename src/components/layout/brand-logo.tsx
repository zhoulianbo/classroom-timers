import Image from 'next/image'
import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  priority?: boolean
  size?: 'header' | 'footer'
}

export function BrandLogo({
  className,
  priority = false,
  size = 'header',
}: BrandLogoProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center',
        size === 'footer' ? 'gap-2.5' : 'gap-2',
        className,
      )}
    >
      <Image
        src="/mark.svg"
        alt=""
        width={128}
        height={128}
        priority={priority}
        aria-hidden="true"
        className={cn(
          'shrink-0',
          size === 'footer' ? 'size-10' : 'size-8 sm:size-9',
        )}
      />
      <span
        className={cn(
          'leading-none font-semibold tracking-[-0.035em] whitespace-nowrap',
          size === 'footer' ? 'text-xl' : 'text-base sm:text-[19px]',
        )}
      >
        <span className="text-foreground">Classroom</span>
        <span className="text-primary">Timers</span>
      </span>
    </span>
  )
}
