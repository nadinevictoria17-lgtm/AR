import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, X, Trash2, Book, ChevronLeft, ChevronRight, Search, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import Papa from 'papaparse'
import { storage } from '../../../lib/storage'
import { firebaseCreateStudentAccount } from '../../../lib/firebaseAuth'
import { useStorageData } from '../../../hooks/useStorageData'
import { LESSONS } from '../../../data/lessons'
import { QUIZ_QUESTIONS } from '../../../data/quiz'
import { cn } from '../../../lib/utils'
import { pageVariants } from '../../../lib/variants'
import type { StudentRecord, TeacherQuiz } from '../../../types'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { Input } from '../../ui/input'
import { TableSkeleton } from '../../ui/skeleton'
import { useNotificationStore } from '../../../store/useNotificationStore'

const StudentSchema = z.object({
  name:      z.string().min(1, 'Student name is required'),
  studentId: z.string().regex(/^\d{6}$/, 'Student ID must be exactly 6 digits'),
  section:   z.string().min(1, 'Section is required'),
  password:  z.string().min(6, 'Password must be at least 6 characters'),
})

type StudentFormValues = z.infer<typeof StudentSchema>

function uid() { return Math.random().toString(36).slice(2, 9) }

/** Merges built-in (one per lesson) and teacher-created quizzes into one list. */
function buildAllQuizzes(teacherQuizzes: TeacherQuiz[]): TeacherQuiz[] {
  const merged: TeacherQuiz[] = []
  for (const lesson of LESSONS) {
    const builtInId = `builtin-${lesson.id}`
    if (merged.some(q => q.id === builtInId)) continue
    const override = teacherQuizzes.find(q => q.id === builtInId)
    merged.push(
      override ?? {
        id:        builtInId,
        title:     lesson.title,
        subject:   lesson.subject,
        topicId:   lesson.id,
        questions: QUIZ_QUESTIONS.filter(q => q.lessonId === lesson.id),
        createdAt: new Date(0).toISOString(),
      }
    )
  }
  // Append any purely custom quizzes (not linked to a lesson)
  for (const q of teacherQuizzes) {
    if (!merged.some(m => m.id === q.id)) merged.push(q)
  }
  return merged
}

const ITEMS_PER_PAGE = 10

export function StudentsTab() {
  const { data } = useStorageData(true)
  const showSkeleton = false
  // Use data.students directly instead of mirroring to state
  const students = data.students
  const [showForm, setShowForm] = useState(false)
  const [viewStudent, setViewStudent] = useState<StudentRecord | null>(null)
  const [currentPage, setCurrentPage]     = useState(1)
  const [filterSection, setFilterSection] = useState('all')
  const [searchQuery, setSearchQuery]     = useState('')
  const allQuizzes = buildAllQuizzes(data.quizzes)
  const showConfirmModal = useNotificationStore(s => s.showConfirmModal)

  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successName, setSuccessName] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentFormValues>({
    resolver: zodResolver(StudentSchema),
    defaultValues: { name:'', studentId:'', section:'', password:'' },
  })

  const handleAdd = handleSubmit(async (formData) => {
    setFormError(null)
    const cleanId = formData.studentId.trim()

    // 1. Create the Firebase Auth account so the student can log in
    const firebaseUser = await firebaseCreateStudentAccount(cleanId, formData.password)
    if (!firebaseUser) {
      setFormError(
        'Could not create login account. The Student ID may already be registered, ' +
        'or there was a network error. Please try a different ID.'
      )
      return
    }

    // 2. Save the Firestore student record (also seeds Zustand via useStorageData)
    await storage.saveStudent({
      id:  uid(),
      name:      formData.name.trim(),
      studentId: cleanId,
      grade:     '7',
      section:   formData.section.trim(),
      scores:    { biology: null, chemistry: null, physics: null },
      completedLessonIds:       [],
      completedLabExperimentIds:[],
      completedQuizIds:         [],
      unlockedLessonIds:        [],
      unlockedQuizIds:          [],
      quizAttempts:             [],
    })

    reset()
    setShowPassword(false)
    setShowForm(false)
    setSuccessName(formData.name.trim())
    setTimeout(() => setSuccessName(null), 4000)
  })

  const handleExportCSV = () => {
    const rows = students.map((s) => ({
      studentId: s.studentId,
      name: s.name,
      grade: s.grade,
      section: s.section,
      biology_score: s.scores.biology ?? '',
      chemistry_score: s.scores.chemistry ?? '',
      physics_score: s.scores.physics ?? '',
      completed_lessons:  (s.completedLessonIds ?? []).length,
      completed_labs:     (s.completedLabExperimentIds ?? []).length,
      completed_quizzes:  (s.completedQuizIds ?? []).length,
    }))
    const csv  = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `students-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Unique sections for the section filter
  const sections = ['all', ...Array.from(new Set(students.map(s => s.section).filter(Boolean))).sort()]

  // Filtered list (applied before pagination)
  const filteredStudents = students.filter(s => {
    if (s.isArchived) return false // Hide archived students
    if (filterSection !== 'all' && s.section !== filterSection) return false
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !s.studentId.includes(searchQuery)) return false
    return true
  })

  // Pagination over filtered set
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1))
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1))

  if (showSkeleton) {
    return <TableSkeleton columns={['Student', 'Section', 'Last Quiz', 'Joined', '']} rows={8} />
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users size={20} className="text-primary" /> Students
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/20 text-success text-xs font-semibold">
              <span className="animate-pulse w-2 h-2 rounded-full bg-success" />
              Live
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleExportCSV}
            className="border border-border rounded-xl"
          >
            Export CSV
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="gap-2 rounded-xl btn-glow"
          >
            <Plus size={14} /> Add Student
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            placeholder="Search name or ID…"
            className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-muted text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 w-44"
          />
        </div>
        {sections.length > 1 && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border flex-wrap">
            {sections.map(sec => (
              <button key={sec} onClick={() => { setFilterSection(sec); setCurrentPage(1) }}
                className={cn('px-3 py-1 rounded-md text-[11px] font-semibold transition-colors',
                  filterSection === sec ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {sec === 'all' ? 'All Sections' : sec}
              </button>
            ))}
          </div>
        )}
        {(searchQuery || filterSection !== 'all') && (
          <button onClick={() => { setSearchQuery(''); setFilterSection('all'); setCurrentPage(1) }}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted transition-colors">
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {showForm && (
        <Card className="rounded-2xl p-6 mb-8 max-w-lg border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Add New Student</h3>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setFormError(null); reset() }} aria-label="Close">
              <X size={16} />
            </Button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Full Name</label>
              <Input {...register('name')} placeholder="e.g. Juan De La Cruz" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Student ID (6 digits)</label>
                <Input {...register('studentId')} placeholder="e.g. 123456" maxLength={6} />
                {errors.studentId && <p className="text-xs text-destructive mt-1">{errors.studentId.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Section</label>
                <Input {...register('section')} placeholder="e.g. St. Jude" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Login Password</label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
              <p className="text-[11px] text-muted-foreground mt-1">
                This password will be used by the student to log in.
              </p>
            </div>
            {formError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                {formError}
              </div>
            )}
            <Button type="submit" className="w-full rounded-xl btn-glow mt-2">
              Save Student Record
            </Button>
          </form>
        </Card>
      )}

      <AnimatePresence>
        {successName && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-semibold"
          >
            <CheckCircle2 size={16} className="shrink-0" />
            <span>Student <span className="font-bold">{successName}</span> was added successfully.</span>
            <button onClick={() => setSuccessName(null)} className="ml-auto text-success/60 hover:text-success transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="rounded-2xl border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Student Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Section</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">Score: Bio</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">Score: Chem</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">Score: Phys</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Last Quiz</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedStudents.map((s) => {
                const lastAttempt = s.quizAttempts?.length
                  ? [...s.quizAttempts].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
                  : null
                const lastQuizTitle = lastAttempt
                  ? (allQuizzes.find(q => q.id === lastAttempt.quizId)?.title
                    ?? (lastAttempt.quizId.startsWith('builtin-')
                      ? (() => {
                          const lessonId = lastAttempt.quizId.replace('builtin-', '')
                          const firstQ = QUIZ_QUESTIONS.find(q => q.lessonId === lessonId)
                          return firstQ ? `${lessonId.toUpperCase()} Quiz` : lastAttempt.quizId
                        })()
                      : lastAttempt.quizId))
                  : null
                return (
                <tr key={s.id} className="hover:bg-muted/20 cursor-default transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ID: {s.studentId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-foreground">{s.section}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn('text-xs font-bold', s.scores.biology != null ? 'text-subject-biology' : 'text-muted-foreground opacity-40')}>{s.scores.biology ?? '—'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn('text-xs font-bold', s.scores.chemistry != null ? 'text-subject-chemistry' : 'text-muted-foreground opacity-40')}>{s.scores.chemistry ?? '—'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn('text-xs font-bold', s.scores.physics != null ? 'text-subject-physics' : 'text-muted-foreground opacity-40')}>{s.scores.physics ?? '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {lastQuizTitle ? (
                      <div>
                        <p className="text-xs font-semibold text-foreground truncate max-w-[160px]">{lastQuizTitle}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {lastAttempt!.correctAnswers}/{lastAttempt!.totalQuestions} correct
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground opacity-40">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="View quizzes"
                        title="View Quizzes"
                        onClick={(e) => { e.stopPropagation(); setViewStudent(s) }}
                      >
                        <Book size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete student"
                        className="text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          showConfirmModal(
                            'Archive Student',
                            `Archive record for "${s.name}"? This marks the ID as used. Firestore record stays for history.`,
                            async () => {
                              try {
                                await storage.archiveStudent(s.studentId)
                                const showToast = useNotificationStore.getState().showToast
                                showToast({
                                  description: `Student "${s.name}" archived. ID "${s.studentId}" marked as used.`,
                                  type: 'success',
                                })
                              } catch (error) {
                                const showToast = useNotificationStore.getState().showToast
                                showToast({
                                  description: `Failed to archive student.`,
                                  type: 'destructive',
                                })
                              }
                            }
                          )
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
                )
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">No student records found. Add students to track their progress.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
            <div className="text-xs text-muted-foreground">
              Showing {startIndex + 1}–{Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'min-w-8 h-8 rounded-lg text-xs font-semibold transition-colors',
                      currentPage === page
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {viewStudent && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewStudent(null)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative bg-card border border-border rounded-3xl w-full max-w-lg p-6 shadow-2xl z-10"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-foreground text-lg">{viewStudent.name}'s Quizzes</h3>
                <p className="text-sm text-muted-foreground">
                  {viewStudent.quizAttempts?.length ?? 0} attempted
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewStudent(null)} aria-label="Close" className="shrink-0">
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {(() => {
                return allQuizzes.map((q) => {
                  const attempts = (viewStudent.quizAttempts ?? [])
                    .filter(a => a.quizId === q.id)
                    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                  const lastAttempt = attempts[0] ?? null
                  
                  return (
                    <div
                      key={q.id}
                      className={cn(
                        'flex items-center justify-between gap-3 p-3 rounded-xl border bg-muted/20',
                        lastAttempt ? 'border-primary/30' : 'border-border'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{q.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={cn('text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-muted', 
                            q.subject === 'biology' ? 'text-subject-biology' : 
                            q.subject === 'chemistry' ? 'text-subject-chemistry' : 'text-subject-physics')}>{q.subject}</span>
                          {lastAttempt && (
                            <span className="text-xs text-muted-foreground">
                              {lastAttempt.score}% ({lastAttempt.correctAnswers}/{lastAttempt.totalQuestions})
                            </span>
                          )}
                        </div>
                      </div>
                      
                    </div>
                  )
                })
              })()}
            </div>
          </motion.div>
        </div>,
        document.body
      )}

    </motion.div>
  )
}
