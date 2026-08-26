/**
 * The product's one genuinely bespoke visual asset — an orbiting-atom mark
 * tying the "Explorer" name to the actual AR/science subject matter.
 * Previously copy-pasted with drifted values into LoginPage and
 * GetStartedScreen; extracted here as the single source of truth.
 *
 * Cleaned up from the original: one solid nucleus color instead of a
 * radial rainbow gradient, one restrained shadow instead of a stacked
 * double-glow — the mark stays recognizable without the decorative haze.
 */
import { cn } from '../../lib/utils'

const ORBIT_COLORS = [
  'hsl(var(--subject-biology))',
  'hsl(var(--subject-chemistry))',
  'hsl(var(--subject-physics))',
] as const

export function AtomLogo({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
  const dim = size === 'sm' ? 72 : 96

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: dim, height: dim }}>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary z-10"
        style={{
          width: dim * 0.26,
          height: dim * 0.26,
          boxShadow: '0 0 12px hsl(var(--primary) / 0.45)',
        }}
      />
      {ORBIT_COLORS.map((color, i) => (
        <div
          key={color}
          className="absolute inset-0 rounded-full border"
          style={{
            borderColor: color,
            borderWidth: '1.5px',
            opacity: 0.55,
            animation: `orbit ${2.8 + i * 0.6}s linear infinite ${i === 1 ? 'reverse' : 'normal'}`,
            animationDelay: `${i * 0.3}s`,
            transform: `rotateX(70deg) rotateZ(${i * 60}deg)`,
          }}
        >
          <div
            className="absolute w-1.5 h-1.5 rounded-full -top-[3px] left-1/2 -translate-x-1/2"
            style={{ background: color }}
          />
        </div>
      ))}
    </div>
  )
}
