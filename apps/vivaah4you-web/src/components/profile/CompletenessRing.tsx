'use client'

interface CompletenessRingProps {
  value: number
  /** Overrides the aria-label; defaults to a generic "Profile N% complete". */
  label?: string
}

/**
 * Shared by the home welcome band and the registration wizard, so both read as
 * the same component. `CompatibilityPanel` has its own near-identical ring for
 * a match compatibility score, which is a different metric and is left as is.
 */
export default function CompletenessRing({ value, label }: CompletenessRingProps) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
      className="strength-ring strength-ring-sm"
      role="img"
      aria-label={label ?? `Profile ${clamped}% complete`}
    >
      <svg viewBox="0 0 64 64" className="strength-ring-svg" aria-hidden="true">
        <circle className="strength-ring-track" cx="32" cy="32" r={radius} />
        <circle
          className="strength-ring-value"
          cx="32"
          cy="32"
          r={radius}
          strokeDasharray={circumference}
          /* Offset is the unfilled remainder, so 100% closes the ring. */
          strokeDashoffset={circumference * (1 - clamped / 100)}
        />
      </svg>
      <span className="strength-ring-label">{clamped}%</span>
    </div>
  )
}
