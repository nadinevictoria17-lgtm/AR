import { cn } from '../../lib/utils'

/** Base shimmer block */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-muted', className)} />
  )
}

/** Full table skeleton — header + N shimmer rows */
export function TableSkeleton({
  columns,
  rows = 6,
}: {
  columns: string[]
  rows?: number
}) {
  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      {/* Filter bar placeholder */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/10">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-8 w-36 rounded-lg" />
        <div className="ml-auto">
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-6 py-4">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {/* First cell: title + badge */}
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </td>
                {/* Remaining cells */}
                {columns.slice(1, -1).map((_, ci) => (
                  <td key={ci} className="px-6 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                ))}
                {/* Action cell */}
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Dashboard-style skeleton: stat cards + chart blocks */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Content-area skeleton — used when the component is already INSIDE the app
 * layout (sidebar is already visible on the left). Fills only the right-side
 * content column with generic card/text placeholders.
 */
export function ContentSkeleton() {
  return (
    <div className="space-y-6 py-2">
      {/* Title + subtitle */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Hero / banner block */}
      <Skeleton className="h-40 w-full rounded-[2rem]" />

      {/* Two-column card row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[2rem] border border-border bg-card p-6 space-y-3">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* List / activity block */}
      <div className="rounded-[2rem] border border-border bg-card p-6 space-y-4">
        <Skeleton className="h-4 w-36" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-full max-w-[200px]" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Full-page skeleton for Suspense fallbacks and route guards — rendered
 * BEFORE any layout exists. Includes a sidebar stub on the left so the
 * overall proportions match the real app shell.
 */
export function PageSkeleton() {
  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* ── Sidebar stub (desktop only) ─────────────────────────────── */}
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-border bg-background h-dvh sticky top-0">
        {/* Logo row */}
        <div className="flex items-center gap-2.5 h-16 px-4 border-b border-border">
          <Skeleton className="w-7 h-7 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="h-[18px] w-[18px] rounded-md shrink-0" />
              <Skeleton className="h-3 flex-1 max-w-[100px]" />
            </div>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-3 border-t border-border space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="h-4 w-4 rounded-md shrink-0" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="h-4 w-4 rounded-md shrink-0" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      </aside>

      {/* ── Content area ────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 md:px-8 py-6 sm:py-10">
        <DashboardSkeleton />
      </main>
    </div>
  )
}
