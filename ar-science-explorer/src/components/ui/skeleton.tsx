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

/** Dashboard skeleton: stat cards + chart placeholders */
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

/** Generic page-level skeleton for Suspense fallback */
export function PageSkeleton() {
  return (
    <div className="space-y-6 w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10">
      <DashboardSkeleton />
    </div>
  )
}
