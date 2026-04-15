import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, AreaChart, Area, Label
} from 'recharts'
import { useStorageData } from '../../../hooks/useStorageData'
import { storage } from '../../../lib/storage'
import { useNotificationStore } from '../../../store/useNotificationStore'
import { LESSONS } from '../../../data/lessons'
import {
  LayoutDashboard, Users, TrendingUp, BookOpen, ClipboardCheck,
  Trophy, Activity, Clock, RotateCcw, Trash2, AlertTriangle
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { pageVariants } from '../../../lib/variants'
import { format, parseISO, startOfDay } from 'date-fns'
import type { SubjectKey } from '../../../types'
import { DashboardSkeleton } from '../../ui/skeleton'
import { Button } from '../../ui/button'

const BIOLOGY_COLOR   = 'hsl(var(--subject-biology))'
const CHEMISTRY_COLOR = 'hsl(var(--subject-chemistry))'
const PHYSICS_COLOR   = 'hsl(var(--subject-physics))'
const PRIMARY_COLOR   = 'hsl(var(--primary))'
const SUCCESS_COLOR   = 'hsl(var(--success))'
const WARNING_COLOR   = 'hsl(var(--warning))'
const DANGER_COLOR    = 'hsl(var(--destructive))'

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  borderColor:     'hsl(var(--border))',
  borderRadius:    '12px',
  fontSize:        '12px',
  color:           'hsl(var(--foreground))',
}

interface DayCount { date: string; attempts: number }
interface TopPerformer { name: string; avg: number; color: string }
interface RecentAttempt {
  studentName: string
  score:       number
  totalQ:      number
  pct:         number
  timestamp:   string
  displayTime: string
}

export function AnalyticsDashboard() {
  // useStorageData already opens real-time onSnapshot listeners for all collections.
  // A separate onSnapshot here was creating a duplicate student subscription — removed.
  const { data } = useStorageData(true)
  const showSkeleton = false
  const students = data.students
  const lessons = data.lessons
  const { showConfirmModal, showToast } = useNotificationStore()
  const [resetting, setResetting] = useState(false)
  const [deleting,  setDeleting]  = useState(false)

  const handleRestartQuarter = () => {
    showConfirmModal(
      'Restart Quarter',
      `This will clear ALL student progress — quiz attempts, scores, completed lessons, and unlock codes — for all ${students.length} student(s). Student accounts are kept. This cannot be undone.`,
      async () => {
        setResetting(true)
        try {
          const [progress, codes] = await Promise.all([
            storage.resetAllStudentsProgress([]),
            storage.deleteAllUnlockCodes(),
          ])
          showToast({
            description: codes
              ? `Quarter reset complete. ${progress.success} student(s) cleared.`
              : `Progress reset for ${progress.success} student(s), but unlock codes could not be deleted.`,
            type: progress.failed > 0 ? 'destructive' : 'success',
          })
        } finally {
          setResetting(false)
        }
      },
      undefined,
      'Yes, Reset All Progress',
      'destructive'
    )
  }

  const handleDeleteAllStudents = () => {
    showConfirmModal(
      'Delete All Students',
      'This will permanently remove all student Firestore records (except Student 000000) and their quiz data. Student login accounts in Firebase Auth are NOT deleted — only the Firestore data. This cannot be undone.',
      async () => {
        setDeleting(true)
        try {
          const [result, codes] = await Promise.all([
            storage.deleteStudentsExcept(['000000']),
            storage.deleteAllUnlockCodes(),
          ])
          showToast({
            description: codes
              ? `Deleted ${result.deleted} student record(s). Unlock codes cleared.`
              : `Deleted ${result.deleted} student record(s), but unlock codes could not be deleted.`,
            type: result.failed > 0 ? 'destructive' : 'success',
          })
        } finally {
          setDeleting(false)
        }
      },
      undefined,
      'Delete All Students',
      'destructive'
    )
  }

  const avgClassScore = useMemo(() => {
    const allScores: number[] = students.flatMap((s) =>
      (Object.values(s.scores) as (number | null)[]).filter((v): v is number => v !== null)
    )
    return allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0
  }, [students])

  const avgLessonProgress = useMemo(() => {
    const total = LESSONS.length + lessons.length
    if (students.length === 0 || total === 0) return 0
    const sum = students.reduce((acc, s) => acc + Math.min(s.completedLessonIds?.length ?? 0, total), 0)
    return Math.min(100, Math.round((sum / (students.length * total)) * 100))
  }, [students, lessons])

  const quizParticipation = useMemo(() => {
    if (students.length === 0) return 0
    const participated = students.filter((s) => (s.quizAttempts?.length ?? 0) > 0).length
    return Math.round((participated / students.length) * 100)
  }, [students])

  const subjectAverages = useMemo(() => {
    return (['chemistry', 'biology', 'physics'] as SubjectKey[]).map((subject) => {
      const scored = students.filter((s) => s.scores[subject] != null)
      const avg = scored.length > 0
        ? Math.round(scored.reduce((acc, s) => acc + (s.scores[subject] ?? 0), 0) / scored.length)
        : 0
      return {
        name:    subject === 'biology' ? 'Biology' : subject === 'chemistry' ? 'Chemistry' : 'Physics',
        value:   avg,
        subject,
      }
    })
  }, [students])

  const scoreDistribution = useMemo(() => {
    const cats = [
      { name: 'Needs Help',  range: '<75',   value: 0, color: DANGER_COLOR  },
      { name: 'Average',     range: '75–89', value: 0, color: WARNING_COLOR },
      { name: 'Excellent',   range: '90+',   value: 0, color: SUCCESS_COLOR },
    ]
    students.forEach((s) => {
      const scores = (Object.values(s.scores) as (number | null)[]).filter((v): v is number => v !== null)
      if (scores.length === 0) return
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      if (avg < 75)       cats[0].value++
      else if (avg < 90)  cats[1].value++
      else                cats[2].value++
    })
    return cats
  }, [students])

  const quizActivity = useMemo((): DayCount[] => {
    const dayMap = new Map<string, number>()
    students.forEach((s) => {
      s.quizAttempts?.forEach((attempt) => {
        try {
          const isoDay = format(startOfDay(parseISO(attempt.timestamp)), 'yyyy-MM-dd')
          dayMap.set(isoDay, (dayMap.get(isoDay) ?? 0) + 1)
        } catch {
          // skip
        }
      })
    })
    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([isoDate, attempts]) => ({
        date: format(parseISO(isoDate), 'MMM d'),
        attempts,
      }))
  }, [students])

  const topPerformers = useMemo((): TopPerformer[] => {
    return students
      .map((s) => {
        const scores = (Object.values(s.scores) as (number | null)[]).filter((v): v is number => v !== null)
        const avg = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0
        return { name: s.name, avg }
      })
      .filter((s) => s.avg > 0)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5)
      .map((s, i) => ({
        ...s,
        color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#c2956c' : PRIMARY_COLOR,
      }))
  }, [students])

  const recentActivity = useMemo((): RecentAttempt[] => {
    const all: RecentAttempt[] = []
    students.forEach((s) => {
      s.quizAttempts?.forEach((a) => {
        try {
          all.push({
            studentName: s.name,
            score:       a.correctAnswers ?? 0,
            totalQ:      a.totalQuestions ?? 0,
            pct:         a.score ?? 0,
            timestamp:   a.timestamp,
            displayTime: format(parseISO(a.timestamp), 'MMM d, h:mm a'),
          })
        } catch {
          // skip malformed
        }
      })
    })
    return all
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 8)
  }, [students])

  if (showSkeleton) return <DashboardSkeleton />

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard size={20} className="text-primary" /> Class Analytics
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/20 text-success text-xs font-semibold">
              <span className="animate-pulse w-2 h-2 rounded-full bg-success" />
              Live
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Visual insights into student performance across all subjects.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Students"
          value={students.length}
          context="enrolled in class"
          color="text-subject-physics"
          bg="bg-subject-physics/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Class Score"
          value={`${avgClassScore}%`}
          context="across all subjects"
          color="text-primary"
          bg="bg-primary/10"
        />
        <StatCard
          icon={BookOpen}
          label="Lesson Progress"
          value={`${avgLessonProgress}%`}
          context="avg completion rate"
          color="text-warning"
          bg="bg-warning/10"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Quiz Participation"
          value={`${quizParticipation}%`}
          context="attempted at least 1 quiz"
          color="text-success"
          bg="bg-success/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-1">Subject Performance Average</h3>
          <p className="text-xs text-muted-foreground mb-6">Mean score by subject</p>
          <div className="h-64 w-full">
            {subjectAverages.every(s => s.value === 0) ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <TrendingUp size={24} className="opacity-40" />
                <p className="text-sm">No scores recorded yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAverages}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.3)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v + '%'} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    <Cell fill={CHEMISTRY_COLOR} />
                    <Cell fill={BIOLOGY_COLOR} />
                    <Cell fill={PHYSICS_COLOR} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-1">Class Score Distribution</h3>
          <p className="text-xs text-muted-foreground mb-6">Students by performance tier</p>
          <div className="h-64 w-full flex items-center justify-center">
            {scoreDistribution.reduce((a, b) => a + b.value, 0) === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Trophy size={24} className="opacity-40" />
                <p className="text-sm">No students yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Label
                      content={({ viewBox }) => {
                        const { cx, cy } = viewBox as { cx: number; cy: number }
                        const total = scoreDistribution.reduce((a, b) => a + b.value, 0)
                        return (
                          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={cx} dy="-0.3em" className="fill-foreground font-bold" fontSize={18}>
                              {total}
                            </tspan>
                            <tspan x={cx} dy="1.4em" className="fill-muted-foreground" fontSize={11}>
                              students
                            </tspan>
                          </text>
                        )
                      }}
                    />
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            {scoreDistribution.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-[10px] text-muted-foreground font-medium">{cat.name} {cat.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-1">Quiz Activity</h3>
          <p className="text-xs text-muted-foreground mb-6">Last 14 days of quiz attempts</p>
          <div className="h-64 w-full">
            {quizActivity.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Activity size={24} className="opacity-40" />
                <p className="text-sm">No quiz attempts yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={quizActivity}>
                  <defs>
                    <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PRIMARY_COLOR} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={PRIMARY_COLOR} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.3)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area
                    type="monotone"
                    dataKey="attempts"
                    stroke={PRIMARY_COLOR}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAttempts)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-1">Top Performers</h3>
          <p className="text-xs text-muted-foreground mb-6">Top 5 students by average score</p>
          <div className="space-y-4">
            {topPerformers.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Trophy size={24} className="opacity-40" />
                <p className="text-sm">Not enough data</p>
              </div>
            ) : (
              topPerformers.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-foreground truncate max-w-[140px]">{s.name}</span>
                      <span className="text-sm font-bold" style={{ color: s.color }}>{s.avg}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${s.avg}%`, backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Recent Quiz Activity</h3>
          <span className="ml-auto text-[10px] text-muted-foreground">Last 8 attempts</span>
        </div>

        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No quiz attempts recorded yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {recentActivity.map((item) => {
              const pctColor = item.pct >= 90 ? SUCCESS_COLOR : item.pct >= 75 ? WARNING_COLOR : DANGER_COLOR
              return (
                <div key={`${item.studentName}-${item.timestamp}`} className="flex items-center gap-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-primary">
                      {item.studentName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.studentName}</p>
                    <p className="text-[11px] text-muted-foreground">{item.displayTime}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: pctColor }}>{item.pct}%</p>
                    <p className="text-[10px] text-muted-foreground">{item.score}/{item.totalQ} correct</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Class Management (Danger Zone) ─────────────────────────────── */}
      <div className="border border-destructive/30 rounded-2xl overflow-hidden">
        <div className="bg-destructive/5 px-6 py-4 flex items-center gap-2 border-b border-destructive/20">
          <AlertTriangle size={16} className="text-destructive" />
          <h3 className="text-sm font-bold text-destructive">Class Management</h3>
        </div>
        <div className="bg-card px-6 py-5 grid sm:grid-cols-2 gap-4">
          {/* Restart Quarter */}
          <div className="rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-warning/10 rounded-lg">
                <RotateCcw size={14} className="text-warning" />
              </div>
              <p className="text-sm font-semibold text-foreground">Restart Quarter</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Clears all student progress (scores, quiz attempts, completed lessons) and deletes all unlock codes. Student accounts are preserved.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestartQuarter}
              isLoading={resetting}
              disabled={resetting || deleting}
              className="w-full mt-1 border-warning/40 text-warning hover:bg-warning/10 hover:border-warning"
            >
              {!resetting && <RotateCcw size={14} />}
              {resetting ? 'Resetting…' : 'Reset All Progress'}
            </Button>
          </div>

          {/* Delete All Students */}
          <div className="rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-destructive/10 rounded-lg">
                <Trash2 size={14} className="text-destructive" />
              </div>
              <p className="text-sm font-semibold text-foreground">Delete All Students</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permanently removes all student Firestore records except Student 000000. Use at the start of a new school year to register fresh batches.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAllStudents}
              isLoading={deleting}
              disabled={resetting || deleting}
              className="w-full mt-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive"
            >
              {!deleting && <Trash2 size={14} />}
              {deleting ? 'Deleting…' : 'Delete All Students'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface StatCardProps {
  icon: typeof Users
  label: string
  value: string | number
  context: string
  color: string
  bg: string
}

function StatCard({ icon: Icon, label, value, context, color, bg }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</p>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', bg)}>
          <Icon size={15} className={color} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1.5">{context}</p>
      </div>
    </div>
  )
}
