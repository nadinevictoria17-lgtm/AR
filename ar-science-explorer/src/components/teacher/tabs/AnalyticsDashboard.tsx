import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { useStorageData } from '../../../hooks/useStorageData'
import { LESSONS } from '../../../data/lessons'
import { LayoutDashboard, TrendingUp, Users, CheckCircle } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { db } from '../../../lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import type { SubjectKey, StudentRecord } from '../../../types'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export function AnalyticsDashboard() {
  const { data: initialData } = useStorageData(true)
  const [students, setStudents] = useState(initialData.students)
  const [isLiveUpdating, setIsLiveUpdating] = useState(false)

  const { quizzes, lessons } = initialData

  // Subscribe to real-time student updates
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'students'),
        (snapshot) => {
          const updatedStudents = snapshot.docs.map((doc) => {
            const data = doc.data() as any
            // Sanitize scores
            const scores = {
              biology: data.scores?.biology ?? null,
              chemistry: data.scores?.chemistry ?? null,
            }
            return { ...data, id: doc.id, scores } as StudentRecord
          })
          setStudents(updatedStudents)
          setIsLiveUpdating(true)
        },
        (error) => {
          console.error('[AnalyticsDashboard] Real-time listener failed:', error)
        }
      )

      return () => unsubscribe()
    } catch (error) {
      console.warn('[AnalyticsDashboard] Could not establish real-time connection:', error)
    }
  }, [])

  // 1. Calculate Subject Averages
  const subjectAverages = (['biology', 'chemistry'] as SubjectKey[]).map((subject) => {
    const scoredStudents = students.filter((s) => s.scores[subject] != null)
    const avg = scoredStudents.length > 0 
      ? Math.round(scoredStudents.reduce((acc, s) => acc + (s.scores[subject] || 0), 0) / scoredStudents.length)
      : 0
    return { name: subject.charAt(0).toUpperCase() + subject.slice(1), value: avg }
  })

  // 2. Completion Rates
  const totalStaticLessons = LESSONS.length
  const totalTeacherLessons = lessons.length
  const totalLessons = totalStaticLessons + totalTeacherLessons

  const totalTeacherQuizzes = quizzes.length
  const totalQuizzes = totalTeacherQuizzes // Assuming built-in quizzes aren't tracked as separate entities in completion yet

  const avgLessonCompletion = students.length > 0
    ? Math.round((students.reduce((acc, s) => acc + (s.completedLessonIds?.length || 0), 0) / (students.length * Math.max(totalLessons, 1))) * 100)
    : 0

  const avgQuizCompletion = students.length > 0
    ? Math.round((students.reduce((acc, s) => acc + (s.completedQuizIds?.length || 0), 0) / (students.length * Math.max(totalQuizzes, 1))) * 100)
    : 0

  // 3. Score Distribution (Pie Chart)
  const scoreCategories = [
    { name: 'Needs Help (<75)', value: 0, color: '#ef4444' },
    { name: 'Average (75-89)', value: 0, color: '#f59e0b' },
    { name: 'Excellent (90+)', value: 0, color: '#22c55e' },
  ]

  students.forEach((s) => {
    const scores = Object.values(s.scores).filter((v) => v !== null) as number[]
    if (scores.length === 0) return
    const avg = scores.reduce((acc, v) => acc + v, 0) / scores.length
    if (avg < 75) scoreCategories[0].value++
    else if (avg < 90) scoreCategories[1].value++
    else scoreCategories[2].value++
  })

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard size={20} className="text-primary" /> Class Analytics
            {isLiveUpdating && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <span className="animate-pulse w-2 h-2 rounded-full bg-emerald-500" />
                Live
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Visual insights into student performance across 16 weeks.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={students.length} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard icon={TrendingUp} label="Avg Class Score" value={`${Math.round(subjectAverages.reduce((acc, s) => acc + s.value, 0) / Math.max(subjectAverages.length, 1))}%`} color="text-green-500" bg="bg-green-500/10" />
        <StatCard icon={CheckCircle} label="Lesson Progress" value={`${avgLessonCompletion}%`} color="text-amber-500" bg="bg-amber-500/10" />
        <StatCard icon={CheckCircle} label="Quiz Progress" value={`${avgQuizCompletion}%`} color="text-purple-500" bg="bg-purple-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Performance Bar Chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-6">Subject Performance Average</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAverages}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.3)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {subjectAverages.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#22c55e', '#3b82f6'][index % 2]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Distribution Pie Chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-6">Class Score Distribution</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {scoreCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {scoreCategories.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-[10px] text-muted-foreground font-medium">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any, label: string, value: string | number, color: string, bg: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground leading-none mb-1">{label}</p>
        <p className="text-xl font-bold text-foreground leading-none">{value}</p>
      </div>
    </div>
  )
}
