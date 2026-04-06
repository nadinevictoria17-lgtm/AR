import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, X, Trash2, KeyRound, ChevronLeft, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import Papa from 'papaparse'
import { storage } from '../../../lib/storage'
import { useStorageData } from '../../../hooks/useStorageData'
import { QuizUnlockGenerator } from '../QuizUnlockGenerator'
import { cn } from '../../../lib/utils'
import type { StudentRecord } from '../../../types'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

const StudentSchema = z.object({
  name:      z.string().min(1,'Student name is required'),
  studentId: z.string().regex(/^$|^\d{6}$/, 'Student ID must be 6 digits if provided'),
  section:   z.string(),
})

type StudentFormValues = z.infer<typeof StudentSchema>

function uid() { return Math.random().toString(36).slice(2, 9) }

const ITEMS_PER_PAGE = 10

export function StudentsTab() {
  const { data } = useStorageData(true)
  const [students, setStudents] = useState<StudentRecord[]>(data.students)
  const [showForm, setShowForm] = useState(false)
  const [viewStudent, setViewStudent] = useState<StudentRecord | null>(null)
  const [unlockStudent, setUnlockStudent] = useState<StudentRecord | null>(null)
  const [unlockQuiz, setUnlockQuiz] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const allQuizzes = data.quizzes

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentFormValues>({
    resolver: zodResolver(StudentSchema),
    defaultValues: { name:'', studentId:'', section:'' },
  })

  useEffect(() => {
    setStudents(data.students)
    setCurrentPage(1) // Reset to first page when students change
  }, [data.students])

  const handleAdd = handleSubmit(async (data) => {
    await storage.saveStudent({ 
      id: uid(), 
      name: data.name.trim(), 
      studentId: data.studentId.trim(), 
      grade: '7', 
      section: data.section.trim(), 
      scores: { biology: null, chemistry: null },
      completedLessonIds: [],
      completedLabExperimentIds: [],
      completedQuizIds: [],
      unlockedLessonIds: [],
      unlockedQuizIds: [],
      quizAttempts: []
    })
    const updatedData = await storage.getAll()
    setStudents(updatedData.students)
    reset()
    setShowForm(false)
  })

  const handleExportCSV = () => {
    const rows = students.map((s) => ({
      studentId: s.studentId,
      name: s.name,
      grade: s.grade,
      section: s.section,
      biology_score: s.scores.biology ?? '',
      chemistry_score: s.scores.chemistry ?? '',
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

  // Pagination
  const totalPages = Math.ceil(students.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedStudents = students.slice(startIndex, endIndex)

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1))
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1))

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users size={20} className="text-primary" /> Students
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
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

      {showForm && (
        <Card className="rounded-2xl p-6 mb-8 max-w-lg border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Add New Student</h3>
            <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Full Name</label>
              <input {...register('name')} placeholder="e.g. Juan De La Cruz" className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Student ID (6 digits)</label>
                <input {...register('studentId')} placeholder="e.g. 123456" className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                {errors.studentId && <p className="text-xs text-destructive mt-1">{errors.studentId.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Section</label>
                <input {...register('section')} placeholder="e.g. St. Jude" className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <Button type="submit" className="w-full rounded-xl btn-glow mt-2">
              Save Student Record
            </Button>
          </form>
        </Card>
      )}

      <Card className="rounded-2xl border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Student Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Section</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">Score: Bio</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">Score: Chem</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedStudents.map((s) => (
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
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setViewStudent(s)
                        }}
                        title="View Quizzes & Unlock"
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (!window.confirm(`Delete student record for "${s.name}"?`)) return
                          await storage.deleteStudent(s.id)
                          const updatedData = await storage.getAll()
                          setStudents(updatedData.students)
                        }}
                        className="p-2 rounded-lg text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">No student records found. Add students to track their progress.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
            <div className="text-xs text-muted-foreground">
              Showing {startIndex + 1}–{Math.min(endIndex, students.length)} of {students.length} students
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
                <p className="text-sm text-muted-foreground">Select a quiz to generate an unlock code for retake.</p>
              </div>
              <button onClick={() => setViewStudent(null)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {allQuizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No quizzes created yet.</p>
              ) : (
                allQuizzes.map((q) => (
                  <div key={q.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{q.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{q.subject}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setUnlockStudent(viewStudent)
                        setUnlockQuiz(q)
                      }}
                      className="rounded-lg text-xs"
                    >
                      Unlock
                    </Button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      <AnimatePresence>
        {unlockStudent && unlockQuiz && (
          <QuizUnlockGenerator
            student={unlockStudent}
            quiz={unlockQuiz}
            onClose={() => {
              setUnlockStudent(null)
              setUnlockQuiz(null)
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
