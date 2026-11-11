import type { ReactNode } from 'react'

type IconProps = { className?: string }

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? 'icon'} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

export function IconHome() {
  return (
    <Svg>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1z" />
    </Svg>
  )
}

export function IconReview() {
  return (
    <Svg>
      <path d="M20 12a8 8 0 1 1-2.3-5.6" />
      <path d="M20 4.5V10h-5.5" />
    </Svg>
  )
}

export function IconStash() {
  return (
    <Svg>
      <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.2L6 20V5.5a1 1 0 0 1 1-1z" />
    </Svg>
  )
}

export function IconStats() {
  return (
    <Svg>
      <path d="M5 19V10" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
    </Svg>
  )
}

export function IconSearch() {
  return (
    <Svg>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </Svg>
  )
}

export function IconHeart({ filled = false }: { filled?: boolean }) {
  return (
    <Svg>
      <path
        d="M12 19s-7-4.35-7-8.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 14.65 12 19 12 19z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </Svg>
  )
}

export function IconClose() {
  return (
    <Svg>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  )
}
