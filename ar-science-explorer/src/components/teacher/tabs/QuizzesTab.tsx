import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Plus, Trash2, Edit3, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle2, Search, AlertCircle } from 'lucide-react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { storage } from '../../../lib/storage'
import { useStorageData } from '../../../hooks/useStorageData'
import { LESSONS } from '../../../data/lessons'
import { PRE_TEST_QUESTIONS, POST_TEST_QUESTIONS } from '../../../data/curriculum'
import { builtinQuizId } from '../../../lib/quizId'
import { cn } from '../../../lib/utils'
import { SUBJECT_STYLES } from '../../../lib/variants'
import { FormInput } from '../../form/FormInput'
import { FormTextarea } from '../../form/FormTextarea'
import type { TeacherQuiz, SubjectKey, TeacherLesson, Lesson } from '../../../types'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { TableSkeleton } from '../../ui/skeleton'
import { useNotificationStore } from '../../../store/useNotificationStore'

const SUBJECT_OPTIONS: { value: SubjectKey; label: string }[] = [
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology',   label: 'Biology' },
  { value: 'physics',   label: 'Physics' },
]

const QuizQuestionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  type: z.enum(['mc', 'tf']).optional(),
  options: z.tuple([
    z.string().min(1,'Option A required'),
    z.string().min(1,'Option B required'),
    z.string().min(1,'Option C required'),
    z.string().min(1,'Option D required'),
  ]),
  correctIndex: z.number().min(0).max(3),
  hint: z.string(),
}).superRefine((q, ctx) => {
  // True/False only needs the first two option slots filled.
  if (q.type === 'tf') {
    if (!q.options[0] || !q.options[1]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'True/False options required', path: ['options'] })
    }
    if (q.correctIndex > 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pick True or False', path: ['correctIndex'] })
    }
  } else {
    // Multiple choice: all four options required.
    q.options.forEach((opt, i) => {
      if (!opt) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Option ${['A','B','C','D'][i]} required`, path: ['options', i] })
    })
  }
})

const QuizSchema = z.object({
  title:     z.string().min(1, 'Test title is required'),
  subject:   z.enum(['biology','chemistry','physics']),
  topicId:   z.string().min(1, 'Please select a topic'),
  phase:     z.enum(['pre', 'post']),
  questions: z.array(QuizQuestionSchema).min(1, 'At least one question is required'),
})

type QuizFormValues = z.infer<typeof QuizSchema>

function uid() { return Math.random().toString(36).slice(2, 9) }

function SubjectBadge({ subject }: { subject: SubjectKey }) {
  const s = SUBJECT_STYLES[subject]
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium', s.badge)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

function SegmentedOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-md text-[13px] font-medium border transition-colors duration-150',
        active
          ? 'bg-primary/10 text-primary border-primary/30'
          : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
      )}
    >
      {children}
    </button>
  )
}

/**
 * Right-anchored slide-in drawer shell. Backdrop + fixed inset-y-0 right-0 panel,
 * x-axis framer-motion slide. Wide (max-w-3xl) to comfortably host a long,
 * internally-scrolling field-array of question cards below a sticky header.
 */
function Drawer({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-50">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-y-0 right-0 w-full max-w-3xl bg-card border-l border-border shadow-popover flex flex-col z-10"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </motion.div>
    </div>,
    document.body
  )
}

function QuizBuilder({ initial, onSave, onCancel, teacherLessons, allQuizzes }: {
  initial?: TeacherQuiz
  onSave: (q: TeacherQuiz) => void | Promise<void>
  onCancel: () => void
  teacherLessons: (TeacherLesson | Lesson)[]
  allQuizzes: TeacherQuiz[]
}) {
  const [isSaving, setIsSaving] = useState(false)
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<QuizFormValues>({
    resolver: zodResolver(QuizSchema),
    defaultValues: {
      title:     initial?.title ?? '',
      subject:   initial?.subject ?? 'chemistry',
      topicId:   initial?.topicId ?? '',
      phase:     initial?.phase ?? 'post',
      questions: initial?.questions ?? [{ question:'', type:'mc', options:['','','',''], correctIndex:0, hint:'' }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'questions' })

  const subject = watch('subject')
  const topicId = watch('topicId')
  const phase = watch('phase')
  const subjectLessons = useMemo(() => {
    const builtIn = LESSONS.filter((l) => l.subject === subject)
    const teacherOwn = teacherLessons.filter((l) => l.subject === subject)
    const merged = [...builtIn]
    for (const tl of teacherOwn) {
      if (!merged.some(l => l.id === tl.id)) merged.push(tl as Lesson)
    }
    return merged
  }, [subject, teacherLessons])
  const [expanded, setExpanded] = useState<number | null>(0)

  const duplicateWarning = useMemo(() => {
    if (!topicId || initial) return null
    const selectedLesson = subjectLessons.find(l => l.id === topicId)
    if (!selectedLesson) return null
    // A lesson may have one Pre-Test AND one Post-Test — only warn on a same-phase dupe.
    const existingQuiz = allQuizzes.find(q => q.topicId === topicId && (q.phase ?? 'post') === phase)
    if (existingQuiz) {
      return {
        lessonTitle: selectedLesson.title,
        quizId: existingQuiz.id,
        phase,
      }
    }
    return null
  }, [topicId, subjectLessons, allQuizzes, initial, phase])

  useEffect(() => {
    if (!subjectLessons.some((l) => l.id === topicId)) {
      setValue('topicId', subjectLessons[0]?.id ?? '')
    }
  // Also run on mount (not just when `subject` changes) so a brand-new test's
  // empty default topicId gets resolved to a real lesson before the user saves.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, subjectLessons])

  const onSubmit = handleSubmit(async (data) => {
    if (isSaving) return
    const resolvedTopicId = data.topicId || subjectLessons[0]?.id
    if (!resolvedTopicId) return
    // Normalize each question: T/F rows serialize to ['True','False','-','-'] so the
    // stored data always satisfies the 4-option tuple shape used elsewhere.
    const questions = data.questions.map((q) => q.type === 'tf'
      ? { ...q, options: ['True', 'False', '-', '-'] as [string, string, string, string], correctIndex: q.correctIndex > 1 ? 0 : q.correctIndex }
      : { ...q, type: 'mc' as const })
    setIsSaving(true)
    try {
      await onSave({
        id: initial?.id ?? uid(),
        title: data.title.trim(),
        subject: data.subject,
        topicId: resolvedTopicId,
        phase: data.phase,
        questions,
        createdAt: initial?.createdAt ?? new Date().toISOString(),
      })
    } finally {
      setIsSaving(false)
    }
  })

  return (
    <Drawer onClose={onCancel}>
      <form onSubmit={onSubmit} className="flex flex-col h-full min-h-0">
        {/* Sticky header: quiz-level fields + Save/Cancel stay visible while the
            question list below scrolls. */}
        <div className="shrink-0 border-b border-border bg-card px-6 pt-5 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">{initial ? 'Edit Test' : 'New Test'}</h3>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
              <Button type="submit" disabled={isSaving} isLoading={isSaving}>
                {isSaving ? 'Saving...' : 'Save Test'}
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Close">
                <X size={16} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              {...register('title')}
              label="Test Title"
              placeholder="e.g. Motion & Forces Pre-Test"
              error={errors.title?.message}
              required
            />
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Lesson Module</label>
              <Controller
                control={control}
                name="topicId"
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full h-9 px-3 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {subjectLessons.map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                )}
              />
              {errors.topicId && <p className="text-xs text-destructive mt-1.5">{errors.topicId.message}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Subject</label>
              <Controller
                control={control}
                name="subject"
                render={({ field }) => (
                  <div className="flex gap-2 flex-wrap">
                    {SUBJECT_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => field.onChange(o.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-[13px] font-medium border transition-colors duration-150',
                          field.value === o.value
                            ? SUBJECT_STYLES[o.value].badge
                            : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Test Type</label>
              <Controller
                control={control}
                name="phase"
                render={({ field }) => (
                  <div className="flex gap-2">
                    {([['pre', 'Pre-Test'], ['post', 'Post-Test']] as const).map(([val, label]) => (
                      <SegmentedOption key={val} active={field.value === val} onClick={() => field.onChange(val)}>
                        {label}
                      </SegmentedOption>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Pre-Tests are taken before the lesson (ungated). Post-Tests are taken after and complete the lesson.
          </p>

          {duplicateWarning && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3">
              <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground">Test already assigned</p>
                <p className="text-xs text-muted-foreground mt-0.5">This lesson already has a {phase === 'pre' ? 'Pre-Test' : 'Post-Test'}. Edit it instead of creating a new one.</p>
              </div>
            </div>
          )}
        </div>

        {/* Internally scrollable question-list area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-2">
          <p className="text-[13px] font-medium text-foreground mb-3">Questions ({fields.length})</p>
          {fields.map((q, qi) => (
            <div key={q.id} className="rounded-lg border border-border bg-background overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setExpanded(expanded === qi ? null : qi)}
              >
                <span className="text-sm font-medium text-foreground truncate pr-4">
                  Q{qi + 1}{q.question ? ` — ${String(q.question).slice(0, 40)}${String(q.question).length > 40 ? '…' : ''}` : ' — Untitled'}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); remove(qi) }}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
                    aria-label="Remove question"
                  >
                    <Trash2 size={13} />
                  </button>
                  {expanded === qi
                    ? <ChevronUp size={14} className="text-muted-foreground" />
                    : <ChevronDown size={14} className="text-muted-foreground" />
                  }
                </div>
              </button>
              {expanded === qi && (
                <div className="px-4 pb-4 pt-3 border-t border-border space-y-3">
                  <FormTextarea
                    {...register(`questions.${qi}.question`)}
                    label={`Question ${qi + 1}`}
                    placeholder="Question text…"
                    rows={2}
                    error={errors.questions?.[qi]?.question?.message}
                    required
                  />

                  {/* Question type toggle: Multiple Choice vs True/False */}
                  <Controller
                    control={control}
                    name={`questions.${qi}.type`}
                    render={({ field }) => {
                      const qType = field.value ?? 'mc'
                      return (
                        <div className="flex gap-2">
                          {([['mc', 'Multiple Choice'], ['tf', 'True / False']] as const).map(([val, label]) => (
                            <SegmentedOption
                              key={val}
                              active={qType === val}
                              onClick={() => {
                                field.onChange(val)
                                if (val === 'tf') {
                                  // Seed the True/False labels and clamp the answer to 0/1.
                                  setValue(`questions.${qi}.options`, ['True', 'False', '-', '-'])
                                  const ci = watch(`questions.${qi}.correctIndex`)
                                  if (ci > 1) setValue(`questions.${qi}.correctIndex`, 0)
                                } else {
                                  setValue(`questions.${qi}.options`, ['', '', '', ''])
                                }
                              }}
                            >
                              {label}
                            </SegmentedOption>
                          ))}
                        </div>
                      )
                    }}
                  />

                  {(watch(`questions.${qi}.type`) ?? 'mc') === 'tf' ? (
                    <div className="space-y-2">
                      {[0, 1].map((oi) => (
                        <label key={oi} className="flex items-center gap-3 px-3 py-2 rounded-md border border-border cursor-pointer hover:bg-muted/50 transition-colors duration-150">
                          <Controller
                            control={control}
                            name={`questions.${qi}.correctIndex`}
                            render={({ field }) => (
                              <input
                                type="radio"
                                name={`correct-${qi}`}
                                checked={field.value === oi}
                                onChange={() => field.onChange(oi)}
                                className="accent-primary w-4 h-4 shrink-0"
                              />
                            )}
                          />
                          <span className="text-sm text-foreground">{['True', 'False'][oi]}</span>
                        </label>
                      ))}
                      <p className="text-xs text-muted-foreground">Select the correct answer.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[0, 1, 2, 3].map((oi) => (
                        <div key={oi} className="flex items-center gap-3">
                          <Controller
                            control={control}
                            name={`questions.${qi}.correctIndex`}
                            render={({ field }) => (
                              <input
                                type="radio"
                                name={`correct-${qi}`}
                                checked={field.value === oi}
                                onChange={() => field.onChange(oi)}
                                className="accent-primary w-4 h-4 shrink-0"
                              />
                            )}
                          />
                          <span className="text-xs font-medium text-muted-foreground w-4 shrink-0">{['A', 'B', 'C', 'D'][oi]}</span>
                          <Controller
                            control={control}
                            name={`questions.${qi}.options.${oi as 0 | 1 | 2 | 3}`}
                            render={({ field }) => (
                              <input
                                {...field}
                                placeholder={`Option ${['A', 'B', 'C', 'D'][oi]}…`}
                                className="flex-1 h-9 px-3 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <FormInput
                    {...register(`questions.${qi}.hint`)}
                    label="Hint (optional)"
                    placeholder="Hint text…"
                    error={errors.questions?.[qi]?.hint?.message}
                  />
                </div>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              append({ question: '', type: 'mc', options: ['', '', '', ''], correctIndex: 0, hint: '' })
              setExpanded(fields.length)
            }}
            className="w-full border-dashed gap-2"
          >
            <Plus size={14} /> Add Question
          </Button>
        </div>
      </form>
    </Drawer>
  )
}

const ITEMS_PER_PAGE = 10
const HIDDEN_KEY = 'hidden-builtin-quiz-ids'

function getHiddenIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? '[]')) }
  catch { return new Set() }
}
function hideBuiltIn(id: string) {
  const ids = getHiddenIds()
  ids.add(id)
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...ids]))
}

function buildQuizList(teacherQuizzes: TeacherQuiz[]): TeacherQuiz[] {
  const hidden = getHiddenIds()
  const allQuizzes: TeacherQuiz[] = [...teacherQuizzes]

  const pushBuiltin = (lesson: Lesson, phase: 'pre' | 'post', questions: TeacherQuiz['questions']) => {
    if (questions.length === 0) return
    const builtInId = builtinQuizId(lesson.id, phase)
    // Skip if a teacher quiz already exists for this lesson+phase, or it was hidden.
    if (allQuizzes.some(q => q.id === builtInId)) return
    if (allQuizzes.some(q => q.topicId === lesson.id && (q.phase ?? 'post') === phase && !q.id.startsWith('builtin-'))) return
    if (hidden.has(builtInId)) return
    allQuizzes.push({
      id: builtInId,
      title: `${lesson.title} — ${phase === 'pre' ? 'Pre-Test' : 'Post-Test'}`,
      subject: lesson.subject,
      topicId: lesson.id,
      phase,
      questions,
      createdAt: new Date(0).toISOString(),
    })
  }

  for (const lesson of LESSONS) {
    pushBuiltin(lesson, 'pre', PRE_TEST_QUESTIONS.filter(q => q.lessonId === lesson.id))
    pushBuiltin(lesson, 'post', POST_TEST_QUESTIONS.filter(q => q.lessonId === lesson.id))
  }
  return allQuizzes
}

export function QuizzesTab() {
  const { data } = useStorageData()
  const showSkeleton = false // Disabled - Firebase loads from cache instantly
  const [building, setBuilding]       = useState(false)
  const [editing, setEditing]         = useState<TeacherQuiz | null>(null)
  const [previewQuiz, setPreviewQuiz] = useState<TeacherQuiz | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterSubject, setFilterSubject] = useState<'all' | 'chemistry' | 'biology' | 'physics'>('all')
  const [searchQuery, setSearchQuery]     = useState('')
  const showErrorModal   = useNotificationStore(s => s.showErrorModal)
  const showConfirmModal = useNotificationStore(s => s.showConfirmModal)

  // Compute quiz list (teacher + built-in) without storing in state
  const quizzes = useMemo(() => buildQuizList(data.quizzes), [data.quizzes])

  // Reset pagination when quiz list changes
  useEffect(() => {
    setCurrentPage(1)
  }, [data.quizzes])

  const filteredQuizzes = quizzes.filter(q => {
    if (filterSubject !== 'all' && q.subject !== filterSubject) return false
    if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const totalPages = Math.ceil(filteredQuizzes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedQuizzes = filteredQuizzes.slice(startIndex, endIndex)

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1))
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1))

  const handleSave = async (q: TeacherQuiz) => {
    try {
      const saved = await storage.saveQuiz(q)
      if (!saved) {
        showErrorModal('Save Failed', 'Failed to save test. Check your connection and try again.')
        return
      }

      // Update the lesson to link this quiz
      const lesson = data.lessons.find(l => l.id === q.topicId)
      if (lesson && !lesson.isPredefined) {
        await storage.saveLesson({
          ...lesson,
          linkedQuizId: q.id,
        })
      }

      await storage.getAll()
      // Quiz list will auto-update via Firestore subscription in useStorageData
      setBuilding(false)
      setEditing(null)
    } catch (error) {
      console.error('[QuizzesTab] Error saving quiz:', error)
      showErrorModal('Save Failed', error instanceof Error ? error.message : 'An error occurred saving the test.')
    }
  }

  if (showSkeleton) {
    return <TableSkeleton columns={['Test', 'Module', 'Questions', '']} rows={8} />
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-[28px] font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Brain size={22} className="text-subject-biology" /> Tests
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredQuizzes.length} of {quizzes.length} test{quizzes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setBuilding(true)} className="gap-2">
          <Plus size={14} /> New Test
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            placeholder="Search tests…"
            className="h-8 pl-8 pr-3 rounded-md border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring w-44"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-md bg-muted border border-border">
          {(['all', 'chemistry', 'biology'] as const).map(s => (
            <button key={s} onClick={() => { setFilterSubject(s); setCurrentPage(1) }}
              className={cn('px-2.5 py-1 rounded text-xs font-medium transition-colors duration-150 capitalize',
                filterSubject === s ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground')}>
              {s === 'all' ? 'All Subjects' : s}
            </button>
          ))}
        </div>
        {(searchQuery || filterSubject !== 'all') && (
          <button onClick={() => { setSearchQuery(''); setFilterSubject('all'); setCurrentPage(1) }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-colors duration-150">
            <X size={11} /> Clear
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Test</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Module</th>
                <th className="px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">Questions</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedQuizzes.map((q) => {
                const isBuiltIn = q.id.startsWith('builtin-')
                // Built-in that was edited by the teacher and saved to Firestore
                const isModified = isBuiltIn && data.quizzes.some((dq) => dq.id === q.id)
                const isCustom = !isBuiltIn
                // q.topicId is always a lesson id (built-in or teacher-created), never a subject topic id.
                const moduleName = LESSONS.find((l) => l.id === q.topicId)?.title
                  ?? data.lessons.find((l) => l.id === q.topicId)?.title
                  ?? (q.topicId ? q.topicId.toUpperCase() : '—')
                return (
                  <tr
                    key={q.id}
                    onClick={() => setPreviewQuiz(q)}
                    className="hover:bg-muted/20 cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-150 truncate max-w-[220px]">{q.title}</p>
                      <div className="mt-1"><SubjectBadge subject={q.subject} /></div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-foreground truncate max-w-[200px] block">{moduleName}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-sm font-medium text-foreground tabular-nums">{q.questions.length}</span>
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(q)} aria-label="Edit test">
                          <Edit3 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete test"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => showConfirmModal(
                            isModified ? 'Reset Test' : 'Delete Test',
                            isModified
                              ? `Reset "${q.title}" back to the original built-in version? Your edits will be lost.`
                              : `Delete "${q.title}"? This cannot be undone.`,
                            async () => {
                              if (isCustom || isModified) {
                                await storage.deleteQuiz(q.id)
                              }
                              if (!isCustom) {
                                hideBuiltIn(q.id)
                              }
                              await storage.getAll()
                              // Quiz list will auto-update via Firestore subscription
                            }
                          )}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {quizzes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center">
                        <Brain size={18} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No tests yet</p>
                      <p className="text-xs text-muted-foreground">Create a test to assign to your students.</p>
                      <Button onClick={() => setBuilding(true)} className="gap-2 mt-1">
                        <Plus size={14} /> Create First Quiz
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10">
            <div className="text-xs text-muted-foreground">
              Showing {startIndex + 1}–{Math.min(endIndex, filteredQuizzes.length)} of {filteredQuizzes.length} tests
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
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
                      'min-w-8 h-8 rounded-md text-xs font-medium transition-colors duration-150',
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
                className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {(building || editing) && (
          <QuizBuilder
            key="quiz-builder-drawer"
            initial={editing ?? undefined}
            onSave={handleSave}
            onCancel={() => { setBuilding(false); setEditing(null) }}
            teacherLessons={data.lessons}
            allQuizzes={quizzes}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewQuiz && createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setPreviewQuiz(null)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-card border border-border rounded-xl w-full max-w-lg max-h-[75vh] overflow-y-auto p-6 shadow-popover z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="font-semibold text-foreground text-base tracking-tight">{previewQuiz.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <SubjectBadge subject={previewQuiz.subject} />
                    <span className="text-xs text-muted-foreground">{previewQuiz.questions.length} question{previewQuiz.questions.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setPreviewQuiz(null)} aria-label="Close" className="shrink-0">
                  <X size={16} />
                </Button>
              </div>
              <div className="space-y-4">
                {previewQuiz.questions.map((q, qi) => (
                  <div key={qi} className="rounded-lg border border-border p-4 bg-muted/20">
                    <p className="text-sm font-medium text-foreground mb-3">Q{qi + 1}. {q.question}</p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                            oi === q.correctIndex
                              ? 'bg-success/10 text-success font-medium'
                              : 'text-muted-foreground'
                          )}
                        >
                          {oi === q.correctIndex
                            ? <CheckCircle2 size={13} className="shrink-0" />
                            : <span className="w-[13px] shrink-0" />
                          }
                          <span className="font-medium text-xs w-4 shrink-0">{['A','B','C','D'][oi]}</span>
                          <span className="truncate">{opt}</span>
                        </div>
                      ))}
                    </div>
                    {q.hint && (
                      <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-2">
                        Hint: {q.hint}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </>
  )
}
