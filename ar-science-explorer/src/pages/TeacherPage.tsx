import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Brain, BookOpen, Users, Plus, Trash2, Edit3, X,
  ChevronDown, ChevronUp, Trophy, LayoutDashboard, Menu,
  type LucideIcon,
} from 'lucide-react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import Papa from 'papaparse'
import { storage } from '../lib/storage'
import { TeacherSidebar } from '../components/layout/TeacherSidebar'
import type { TeacherTab } from '../components/layout/TeacherSidebar'
import type { TeacherQuiz, TeacherLesson, StudentRecord, SubjectKey } from '../types'
import { cn } from '../lib/utils'
import { useAppStore } from '../store/useAppStore'
import { EXPERIMENTS } from '../data/experiments'
import { SUBJECTS } from '../data/subjects'
import { LESSONS } from '../data/lessons'
import { QUIZ_QUESTIONS } from '../data/quiz'

function uid() { return Math.random().toString(36).slice(2, 9) }

const SUBJECT_OPTIONS: { value: SubjectKey; label: string }[] = [
  { value: 'physics',   label: 'Physics' },
  { value: 'biology',   label: 'Biology' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'earth',     label: 'Earth Science' },
]

const SUBJECT_STYLES: Record<SubjectKey, { badge: string; dot: string; label: string }> = {
  physics:   { badge: 'bg-subject-physics/10 text-subject-physics border-subject-physics/20',   dot: 'bg-subject-physics',   label: 'Physics' },
  biology:   { badge: 'bg-subject-biology/10 text-subject-biology border-subject-biology/20',   dot: 'bg-subject-biology',   label: 'Biology' },
  chemistry: { badge: 'bg-subject-chemistry/10 text-subject-chemistry border-subject-chemistry/20', dot: 'bg-subject-chemistry', label: 'Chemistry' },
  earth:     { badge: 'bg-subject-earth/10 text-subject-earth border-subject-earth/20',         dot: 'bg-subject-earth',     label: 'Earth Sci' },
}

// ── Zod Schemas ────────────────────────────────────────────────

const QuizQuestionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  options: z.tuple([
    z.string().min(1,'Option A required'),
    z.string().min(1,'Option B required'),
    z.string().min(1,'Option C required'),
    z.string().min(1,'Option D required'),
  ]),
  correctIndex: z.number().min(0).max(3),
  hint: z.string(),
})

const QuizSchema = z.object({
  title:     z.string().min(1, 'Quiz title is required'),
  subject:   z.enum(['physics','biology','chemistry','earth']),
  topicId:   z.string().min(1, 'Please select a topic'),
  questions: z.array(QuizQuestionSchema).min(1, 'At least one question is required'),
})

type QuizFormValues = z.infer<typeof QuizSchema>

const LessonSchema = z.object({
  title: z.string().min(1,'Lesson title is required'),
  subject: z.enum(['physics','biology','chemistry','earth']),
  summary: z.string(),
  content: z.string(),
  linkedQuizId: z.string(),
  labExperimentId: z.string(),
  arModelIndex: z.coerce.number().min(0,'Must be 0–3').max(3,'Must be 0–3'),
  detectionMode: z.enum(['marker','surface']),
  anchorHint: z.string(),
  arSteps: z.string(),
})

type LessonFormValues = z.infer<typeof LessonSchema>

const StudentSchema = z.object({
  name:      z.string().min(1,'Student name is required'),
  studentId: z.string().regex(/^$|^\d{6}$/, 'Student ID must be 6 digits if provided'),
  section:   z.string(),
})

type StudentFormValues = z.infer<typeof StudentSchema>

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent }: {
  icon: LucideIcon
  label: string; value: number | string; accent: string
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', accent)}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
      </div>
    </div>
  )
}

// ── Subject Badge ──────────────────────────────────────────────
function SubjectBadge({ subject }: { subject: SubjectKey }) {
  const s = SUBJECT_STYLES[subject]
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold', s.badge)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

// ── Quiz Builder ───────────────────────────────────────────────
function QuizBuilder({ initial, onSave, onCancel }: {
  initial?: TeacherQuiz
  onSave: (q: TeacherQuiz) => void
  onCancel: () => void
}) {
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<QuizFormValues>({
    resolver: zodResolver(QuizSchema),
    defaultValues: {
      title:     initial?.title ?? '',
      subject:   initial?.subject ?? 'physics',
      topicId:   initial?.topicId ?? '',
      questions: initial?.questions ?? [{ question:'', options:['','','',''], correctIndex:0, hint:'' }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'questions' })

  const subject = watch('subject')
  const topicId = watch('topicId')
  const topics = SUBJECTS.find((s) => s.id === subject)?.topics ?? []
  const [expanded, setExpanded] = useState<number | null>(0)

  useEffect(() => {
    // Keep topic assignment valid when teacher switches subject.
    if (!topics.some((t) => t.id === topicId)) {
      setValue('topicId', topics[0]?.id ?? '')
    }
  }, [subject, topicId, topics, setValue])

  const onSubmit = handleSubmit((data) => {
    const resolvedTopicId = data.topicId || topics[0]?.id
    if (!resolvedTopicId) return
    onSave({
      id: initial?.id ?? uid(),
      title: data.title.trim(),
      subject: data.subject,
      topicId: resolvedTopicId,
      questions: data.questions,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    })
  })

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground">{initial ? 'Edit Quiz' : 'New Quiz'}</h3>
        <button onClick={onCancel} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="w-full space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Quiz Title</label>
            <input
              {...register('title')}
              placeholder="e.g. Motion & Forces Quiz"
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Subject</label>
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
                        'px-4 py-2 rounded-xl text-xs font-semibold border transition-all',
                        field.value === o.value
                          ? SUBJECT_STYLES[o.value].badge + ' shadow-sm'
                          : 'border-border text-muted-foreground hover:border-border/70'
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </div>

        <div className="w-full space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Module (Topic)</label>
            {topics.length === 0 ? (
              <p className="text-sm text-muted-foreground">No topics found for this subject.</p>
            ) : (
              <Controller
                control={control}
                name="topicId"
                render={({ field }) => (
                  <div className="flex gap-2 flex-wrap">
                    {topics.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => field.onChange(t.id)}
                        className={cn(
                          'px-3 py-2 rounded-xl text-xs font-semibold border transition-all',
                          field.value === t.id
                            ? SUBJECT_STYLES[subject].badge + ' shadow-sm'
                            : 'border-border text-muted-foreground hover:border-border/70'
                        )}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              />
            )}
            {errors.topicId && <p className="text-xs text-destructive mt-1">{errors.topicId.message}</p>}
          </div>
        </div>

        <div className="w-full space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Questions ({fields.length})</p>
          {fields.map((q, qi) => (
            <div key={q.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setExpanded(expanded === qi ? null : qi)}
              >
                <span className="text-sm font-semibold text-foreground truncate pr-4">
                  Q{qi + 1}{q.question ? ` — ${String(q.question).slice(0, 40)}${String(q.question).length > 40 ? '…' : ''}` : ' — Untitled'}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); remove(qi) }}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                  {expanded === qi
                    ? <ChevronUp size={14} className="text-muted-foreground" />
                    : <ChevronDown size={14} className="text-muted-foreground" />
                  }
                </div>
              </button>
              {expanded === qi && (
                <div className="px-4 pb-4 pt-3 border-t border-border space-y-3">
                  <div>
                    <textarea
                      {...register(`questions.${qi}.question`)}
                      placeholder="Question text…"
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                    {errors.questions?.[qi]?.question && <p className="text-xs text-destructive mt-1">{errors.questions[qi]?.question?.message}</p>}
                  </div>
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
                        <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{['A', 'B', 'C', 'D'][oi]}</span>
                        <Controller
                          control={control}
                          name={`questions.${qi}.options.${oi as 0 | 1 | 2 | 3}`}
                          render={({ field }) => (
                            <input
                              {...field}
                              placeholder={`Option ${['A', 'B', 'C', 'D'][oi]}…`}
                              className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                          )}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Hint (optional)</label>
                    <input
                      {...register(`questions.${qi}.hint`)}
                      placeholder="Hint text…"
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => append({ question: '', options: ['', '', '', ''], correctIndex: 0, hint: '' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors w-full justify-center"
          >
            <Plus size={14} /> Add Question
          </button>
          {errors.questions && errors.questions.root && <p className="text-xs text-destructive">{errors.questions.root.message}</p>}
        </div>

        <div className="w-full">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all btn-glow"
          >
            Save Quiz
          </button>
        </div>
      </form>
    </motion.div>
  )
}

// ── Quizzes Tab ────────────────────────────────────────────────
function QuizzesTab() {
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([])
  const [building, setBuilding] = useState(false)
  const [editing, setEditing] = useState<TeacherQuiz | null>(null)
  useEffect(() => { setQuizzes(storage.getAll().quizzes) }, [])

  const handleSave = (q: TeacherQuiz) => {
    storage.saveQuiz(q)
    setQuizzes(storage.getAll().quizzes)
    setBuilding(false)
    setEditing(null)
  }

  if (building || editing) {
    return <QuizBuilder initial={editing ?? undefined} onSave={handleSave} onCancel={() => { setBuilding(false); setEditing(null) }} />
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Brain size={20} className="text-subject-biology" /> Quizzes
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} created</p>
        </div>
        <button
          onClick={() => setBuilding(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all btn-glow"
        >
          <Plus size={14} /> New Quiz
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Brain size={24} className="text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground mb-1">No quizzes yet</p>
          <p className="text-sm text-muted-foreground mb-5">Create a quiz and assign it to your students.</p>
          <button onClick={() => setBuilding(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all btn-glow">
            <Plus size={14} /> Create First Quiz
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {quizzes.map((q) => {
            const quizSubject = SUBJECTS.find((s) => s.id === q.subject)
            const resolvedTopicId = q.topicId ?? quizSubject?.topics[0]?.id
            const topicName = resolvedTopicId
              ? quizSubject?.topics.find((t) => t.id === resolvedTopicId)?.name
              : null
            return (
            <div key={q.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:border-border/70 transition-colors">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', SUBJECT_STYLES[q.subject].badge)}>
                <Brain size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{q.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <SubjectBadge subject={q.subject} />
                  {topicName && <span className="text-xs font-medium text-primary">{topicName}</span>}
                  <span className="text-xs text-muted-foreground">{q.questions.length} questions</span>
                  <span className="text-xs text-muted-foreground">{format(parseISO(q.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setEditing(q)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => {
                    if (!window.confirm(`Delete quiz "${q.title}"? This cannot be undone.`)) return
                    storage.deleteQuiz(q.id)
                    setQuizzes(storage.getAll().quizzes)
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

// ── Lessons Tab ────────────────────────────────────────────────
function LessonsTab() {
  const [lessons, setLessons] = useState<TeacherLesson[]>([])
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<TeacherLesson | null>(null)
  const [viewTarget, setViewTarget] = useState<TeacherLesson | null>(null)

  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm<LessonFormValues>({
    resolver: zodResolver(LessonSchema),
    defaultValues: { title:'', subject:'physics', summary:'', content:'', linkedQuizId:'', labExperimentId:'', arModelIndex:0, detectionMode:'marker', anchorHint:'', arSteps:'' },
  })

  useEffect(() => {
    const data = storage.getAll()
    setLessons(data.lessons)
    setQuizzes(data.quizzes)
  }, [])

  const subject = watch('subject')

  const openNew = () => {
    reset({ title:'', subject:'physics', summary:'', content:'', linkedQuizId:'', labExperimentId:'', arModelIndex:0, detectionMode:'marker', anchorHint:'', arSteps:'' })
    setEditTarget(null)
    setShowForm(true)
  }

  const openEdit = (l: TeacherLesson) => {
    reset({
      title:           l.title,
      subject:         l.subject,
      summary:         l.summary ?? '',
      content:         l.content,
      linkedQuizId:    l.linkedQuizId ?? '',
      labExperimentId: l.labExperimentId ?? '',
      arModelIndex:    l.arPayload?.modelIndex ?? 0,
      detectionMode:   l.arPayload?.detectionMode ?? 'marker',
      anchorHint:      l.arPayload?.anchorHint ?? '',
      arSteps:         (l.arPayload?.lessonSteps ?? []).join('\n'),
    })
    setEditTarget(l)
    setShowForm(true)
  }

  const handleSave = handleSubmit((data) => {
    storage.saveLesson({
      id: editTarget?.id ?? uid(),
      title: data.title.trim(),
      subject: data.subject,
      content: data.content,
      summary: data.summary.trim(),
      createdAt: editTarget?.createdAt ?? new Date().toISOString(),
      ...(data.linkedQuizId    ? { linkedQuizId: data.linkedQuizId }       : {}),
      ...(data.labExperimentId ? { labExperimentId: data.labExperimentId } : {}),
      arPayload: {
        modelIndex:    data.arModelIndex,
        detectionMode: data.detectionMode,
        anchorHint:    data.anchorHint.trim() || `Scan a ${data.subject} marker.`,
        lessonSteps:   data.arSteps.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 6),
      },
    })
    setLessons(storage.getAll().lessons)
    setShowForm(false)
  })

  if (showForm) return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground">{editTarget ? 'Edit Lesson' : 'New Lesson'}</h3>
        <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSave} className="w-full space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Title</label>
          <input {...register('title')} placeholder="Lesson title…"
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
          {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Subject</label>
          <Controller
            control={control}
            name="subject"
            render={({ field }) => (
              <div className="flex gap-2 flex-wrap">
                {SUBJECT_OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => field.onChange(o.value)}
                    className={cn('px-4 py-2 rounded-xl text-xs font-semibold border transition-all',
                      field.value === o.value ? SUBJECT_STYLES[o.value].badge + ' shadow-sm' : 'border-border text-muted-foreground hover:border-border/70')}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Summary</label>
          <input {...register('summary')} placeholder="Short lesson summary…"
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Content</label>
          <textarea {...register('content')} placeholder="Write your lesson content…" rows={6}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Linked Lab (optional)</label>
          <select {...register('labExperimentId')}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">None</option>
            {EXPERIMENTS.filter((exp) => exp.subject === subject).map((exp) => <option key={exp.id} value={exp.id}>{exp.name}</option>)}
          </select>
        </div>
        <div className="rounded-xl border border-border p-3 space-y-3 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AR Metadata (optional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                {...register('arModelIndex')}
                placeholder="Model index"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {errors.arModelIndex && <p className="text-xs text-destructive mt-1">{errors.arModelIndex.message}</p>}
            </div>
            <Controller
              control={control}
              name="detectionMode"
              render={({ field }) => (
                <select {...field}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="marker">Marker</option>
                  <option value="surface">Surface</option>
                </select>
              )}
            />
          </div>
          <input
            {...register('anchorHint')}
            placeholder="Anchor hint for students"
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <textarea
            {...register('arSteps')}
            placeholder={'AR steps (one per line)\nOpen camera\nScan marker\nInspect model'}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Linked Quiz (optional)</label>
          <select {...register('linkedQuizId')}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">None</option>
            {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
          </select>
        </div>
        <button type="submit"
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all btn-glow">
          Save Lesson
        </button>
      </form>
    </motion.div>
  )

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookOpen size={20} className="text-subject-chemistry" /> Lessons
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''} created</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all btn-glow">
          <Plus size={14} /> New Lesson
        </button>
      </div>

      {lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BookOpen size={24} className="text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground mb-1">No lessons yet</p>
          <p className="text-sm text-muted-foreground mb-5">Create lessons and link them to quizzes.</p>
          <button onClick={openNew} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all btn-glow">
            <Plus size={14} /> Create First Lesson
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((l) => {
            const linkedQuiz = l.linkedQuizId ? quizzes.find((q) => q.id === l.linkedQuizId) : null
            return (
              <div key={l.id} onClick={() => setViewTarget(l)}
                className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 cursor-pointer hover:border-border/70 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{l.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <SubjectBadge subject={l.subject} />
                    {linkedQuiz && <span className="text-xs text-primary font-medium">Quiz: {linkedQuiz.title}</span>}
                    <span className="text-xs text-muted-foreground">{format(parseISO(l.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(l) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!window.confirm(`Delete lesson "${l.title}"? This cannot be undone.`)) return
                      storage.deleteLesson(l.id)
                      setLessons(storage.getAll().lessons)
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setViewTarget(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="relative bg-card border border-border rounded-3xl w-full max-w-lg max-h-[75vh] overflow-y-auto p-6 shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-foreground text-base">{viewTarget.title}</h3>
                <SubjectBadge subject={viewTarget.subject} />
              </div>
              <button onClick={() => setViewTarget(null)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {viewTarget.content || 'No content added yet.'}
            </p>
            {viewTarget.linkedQuizId && quizzes.find((q) => q.id === viewTarget.linkedQuizId) && (
              <div className="pt-4 mt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Linked quiz: <span className="text-primary font-semibold">{quizzes.find((q) => q.id === viewTarget.linkedQuizId)?.title}</span>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

// ── Students Tab ───────────────────────────────────────────────
function StudentsTab() {
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [viewStudent, setViewStudent] = useState<StudentRecord | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentFormValues>({
    resolver: zodResolver(StudentSchema),
    defaultValues: { name:'', studentId:'', section:'' },
  })

  useEffect(() => { setStudents(storage.getAll().students) }, [])

  const handleAdd = handleSubmit((data) => {
    storage.saveStudent({ id: uid(), name: data.name.trim(), studentId: data.studentId.trim(), grade: '7', section: data.section.trim(), scores: {} as Record<SubjectKey, number | null> })
    setStudents(storage.getAll().students)
    reset()
    setShowForm(false)
  })

  const handleExportCSV = () => {
    const rows = students.map((s) => ({
      studentId: s.studentId,
      name: s.name,
      grade: s.grade,
      section: s.section,
      physics_score: s.scores.physics ?? '',
      biology_score: s.scores.biology ?? '',
      chemistry_score: s.scores.chemistry ?? '',
      earth_score: s.scores.earth ?? '',
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

  const SCORE_SUBJECTS: { key: SubjectKey }[] = [
    { key: 'physics' }, { key: 'biology' }, { key: 'chemistry' }, { key: 'earth' },
  ]

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users size={20} className="text-subject-physics" /> Students
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{students.length} student{students.length !== 1 ? 's' : ''} enrolled</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-semibold hover:text-foreground hover:bg-muted transition-all"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all btn-glow"
          >
            <Plus size={14} /> Add Student
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-5">
          <p className="font-semibold text-foreground text-sm mb-4">New Student</p>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <input {...register('name')} placeholder="Full name…"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <input {...register('studentId')} placeholder="000000"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                {errors.studentId && <p className="text-xs text-destructive mt-1">{errors.studentId.message}</p>}
              </div>
              <input {...register('section')} placeholder="Section…"
                className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <button type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Add Student
            </button>
          </form>
        </div>
      )}

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Users size={24} className="text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground mb-1">No students enrolled</p>
          <p className="text-sm text-muted-foreground mb-4">Add students so their quiz and AR progress are tracked here.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Add First Student
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => {
            const hasScores = Object.keys(s.scores).length > 0
            const completedLessons = Array.isArray(s.completedLessonIds) ? s.completedLessonIds.length : 0
            const completedLabs = Array.isArray(s.completedLabExperimentIds) ? s.completedLabExperimentIds.length : 0
            return (
              <div
                key={s.id}
                className="bg-card rounded-2xl border border-border p-4 hover:border-border/70 transition-colors cursor-pointer"
                onClick={() => setViewStudent(s)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">{s.name[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.studentId} · Grade {s.grade} · {s.section}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!window.confirm(`Delete student "${s.name}"? This cannot be undone.`)) return
                      storage.deleteStudent(s.id)
                      setStudents(storage.getAll().students)
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive/50 hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                {hasScores ? (
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border/50">
                    {SCORE_SUBJECTS.map(({ key }) =>
                      s.scores[key] != null ? (
                        <span key={key} className={cn('px-2.5 py-1 rounded-full border text-[11px] font-semibold', SUBJECT_STYLES[key].badge)}>
                          {SUBJECT_STYLES[key].label}: {s.scores[key]}%
                        </span>
                      ) : null
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">No quiz scores yet</p>
                )}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="px-2.5 py-1 rounded-full border text-[11px] font-semibold bg-subject-chemistry/10 text-subject-chemistry border-subject-chemistry/30">
                    Lessons done: {completedLessons}
                  </span>
                  <span className="px-2.5 py-1 rounded-full border text-[11px] font-semibold bg-subject-physics/10 text-subject-physics border-subject-physics/30">
                    AR Labs done: {completedLabs}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewStudent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setViewStudent(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="relative bg-card border border-border rounded-3xl w-full max-w-lg max-h-[75vh] overflow-y-auto p-6 shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-foreground text-base">{viewStudent.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{viewStudent.studentId} · Grade {viewStudent.grade} · {viewStudent.section}</p>
              </div>
              <button onClick={() => setViewStudent(null)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Progress Timeline</p>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground">1) Lessons completed: <span className="font-semibold">{Array.isArray(viewStudent.completedLessonIds) ? viewStudent.completedLessonIds.length : 0}</span></p>
                  <p className="text-foreground">2) AR Labs completed: <span className="font-semibold">{Array.isArray(viewStudent.completedLabExperimentIds) ? viewStudent.completedLabExperimentIds.length : 0}</span></p>
                  <p className="text-foreground">3) Quiz records: <span className="font-semibold">{Object.values(viewStudent.scores).filter((v) => v != null).length}</span></p>
                </div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Quiz Scores</p>
                <div className="flex flex-wrap gap-1.5">
                  {SCORE_SUBJECTS.map(({ key }) =>
                    viewStudent.scores[key] != null ? (
                      <span key={key} className={cn('px-2.5 py-1 rounded-full border text-[11px] font-semibold', SUBJECT_STYLES[key].badge)}>
                        {SUBJECT_STYLES[key].label}: {viewStudent.scores[key]}%
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

// ── Dashboard Tab ──────────────────────────────────────────────
function DashboardTab({ onNavigate }: { onNavigate: (t: TeacherTab) => void }) {
  const data = storage.getAll()
  const totalScores = data.students.reduce((acc, s) => acc + Object.keys(s.scores).length, 0)
  const totalLessonsCompleted = data.students.reduce((acc, s) => acc + (Array.isArray(s.completedLessonIds) ? s.completedLessonIds.length : 0), 0)
  const totalLabsCompleted = data.students.reduce((acc, s) => acc + (Array.isArray(s.completedLabExperimentIds) ? s.completedLabExperimentIds.length : 0), 0)
  const totalLessonsVisibleToStudents = LESSONS.length + data.lessons.length
  const totalQuizModulesVisibleToStudents = SUBJECTS.reduce((acc, subject) => {
    const firstTopicId = subject.topics[0]?.id
    for (const topic of subject.topics) {
      const teacherCount = data.quizzes.filter((q) => q.subject === subject.id && (q.topicId ?? firstTopicId) === topic.id).length
      if (teacherCount > 0) {
        acc += teacherCount
        continue
      }
      const hasBuiltIn = QUIZ_QUESTIONS.some((q) => q.subject === subject.id && q.topicId === topic.id)
      if (hasBuiltIn) acc += 1
    }
    return acc
  }, 0)
  const avgScore = totalScores > 0
    ? Math.round(data.students.reduce((acc, s) => acc + Object.values(s.scores).reduce((a: number, v) => a + (v ?? 0), 0), 0) / totalScores)
    : null
  const avgLessonsPerStudent = data.students.length > 0 ? (totalLessonsCompleted / data.students.length).toFixed(1) : '0.0'
  const avgLabsPerStudent = data.students.length > 0 ? (totalLabsCompleted / data.students.length).toFixed(1) : '0.0'

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <LayoutDashboard size={20} className="text-primary" /> Dashboard
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of your class</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users}    label="Students"  value={data.students.length} accent="bg-subject-physics/15 text-subject-physics" />
        <StatCard icon={Brain}    label="Quizzes"   value={totalQuizModulesVisibleToStudents}  accent="bg-subject-biology/15 text-subject-biology" />
        <StatCard icon={BookOpen} label="Lessons"   value={totalLessonsVisibleToStudents}  accent="bg-subject-chemistry/15 text-subject-chemistry" />
        <StatCard icon={Trophy}   label="Avg Score" value={avgScore != null ? `${avgScore}%` : '—'} accent="bg-subject-earth/15 text-subject-earth" />
      </div>
      <p className="text-xs text-muted-foreground">
        Dashboard counts above reflect what students can access (built-in + teacher-added content).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class Progress</p>
          <p className="text-2xl font-bold text-foreground mt-1">{avgLessonsPerStudent}</p>
          <p className="text-xs text-muted-foreground mt-1">Average lessons completed per student</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AR Lab Progress</p>
          <p className="text-2xl font-bold text-foreground mt-1">{avgLabsPerStudent}</p>
          <p className="text-xs text-muted-foreground mt-1">Average AR labs completed per student</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <p className="font-semibold text-foreground text-sm mb-4">Quick Access</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'quizzes' as TeacherTab,  Icon: Brain,    label: 'Quizzes',  accent: 'bg-subject-biology/10 text-subject-biology' },
            { key: 'lessons' as TeacherTab,  Icon: BookOpen, label: 'Lessons',  accent: 'bg-subject-chemistry/10 text-subject-chemistry' },
            { key: 'students' as TeacherTab, Icon: Users,    label: 'Students', accent: 'bg-subject-physics/10 text-subject-physics' },
          ].map(({ key, Icon, label, accent }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', accent)}>
                <Icon size={18} />
              </div>
              <span className="text-xs font-semibold text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {data.students.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="font-semibold text-foreground text-sm mb-4">Recent Students</p>
          <div className="space-y-2">
            {data.students.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-xs">{s.name[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.studentId} · {s.section}</p>
                </div>
                <span className="text-xs text-muted-foreground">{Object.keys(s.scores).length} scores</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ── Main Teacher Page ──────────────────────────────────────────
export function TeacherPage() {
  const [tab, setTab] = useState<TeacherTab>('dashboard')
  const { theme, toggleTheme } = useAppStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className={cn('flex min-h-dvh bg-surface text-foreground', theme)}>
      <TeacherSidebar
        activeTab={tab}
        onNavigate={setTab}
        onLogout={() => { window.location.href = '/login' }}
        theme={theme}
        onToggleTheme={toggleTheme}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <div>
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors mb-1"
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>
            <p className="font-semibold text-foreground text-sm capitalize">{tab}</p>
            <p className="text-xs text-muted-foreground">AR Science Explorer · Teacher Portal</p>
          </div>
          <div className="w-9 h-9" aria-hidden />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="w-full max-w-6xl mx-auto">
            <div className="rounded-2xl border border-border bg-muted/20 p-3 mb-4">
              <p className="text-xs text-muted-foreground">
                Local demo mode: teacher and student data sync only on this browser/device.
              </p>
            </div>
            {tab === 'dashboard' && <DashboardTab onNavigate={setTab} />}
            {tab === 'quizzes'   && <QuizzesTab />}
            {tab === 'lessons'   && <LessonsTab />}
            {tab === 'students'  && <StudentsTab />}
          </div>
        </div>
      </main>
    </div>
  )
}

export default TeacherPage
