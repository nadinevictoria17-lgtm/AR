import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Edit3, Trash2, X } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { storage } from '../../../lib/storage'
import { useStorageData } from '../../../hooks/useStorageData'
import { LESSONS } from '../../../data/lessons'
import { EXPERIMENTS } from '../../../data/experiments'
import { cn } from '../../../lib/utils'
import type { TeacherLesson, Lesson, TeacherQuiz, SubjectKey } from '../../../types'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

const SUBJECT_OPTIONS: { value: SubjectKey; label: string }[] = [
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology',   label: 'Biology' },
]

const SUBJECT_STYLES: Record<SubjectKey, { badge: string; dot: string; label: string }> = {
  biology:   { badge: 'bg-subject-biology/10 text-subject-biology border-subject-biology/20',   dot: 'bg-subject-biology',   label: 'Biology' },
  chemistry: { badge: 'bg-subject-chemistry/10 text-subject-chemistry border-subject-chemistry/20', dot: 'bg-subject-chemistry', label: 'Chemistry' },
}

const LessonSchema = z.object({
  title: z.string().min(1,'Lesson title is required'),
  subject: z.enum(['biology','chemistry']),
  summary: z.string(),
  content: z.string(),
  linkedQuizId: z.string(),
  labExperimentId: z.string(),
  arModelIndex: z.coerce.number().min(0,'Must be 0–7').max(7,'Must be 0–7'),
  detectionMode: z.enum(['marker','surface']),
  anchorHint: z.string(),
  arSteps: z.string(),
})

type LessonFormValues = z.infer<typeof LessonSchema>

function uid() { return Math.random().toString(36).slice(2, 9) }

function isTeacherLesson(lesson: TeacherLesson | Lesson): lesson is TeacherLesson {
  return 'createdAt' in lesson && 'content' in lesson
}

function SubjectBadge({ subject }: { subject: SubjectKey }) {
  const s = SUBJECT_STYLES[subject]
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold', s.badge)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

export function LessonsTab() {
  const { data } = useStorageData()
  const [lessons, setLessons] = useState<(TeacherLesson | Lesson)[]>([])
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>(data.quizzes)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<(TeacherLesson | Lesson) | null>(null)
  const [viewTarget, setViewTarget] = useState<(TeacherLesson | Lesson) | null>(null)

  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm<LessonFormValues>({
    resolver: zodResolver(LessonSchema),
    defaultValues: { title:'', subject:'chemistry', summary:'', content:'', linkedQuizId:'', labExperimentId:'', arModelIndex:0, detectionMode:'marker', anchorHint:'', arSteps:'' },
  })

  // Show all lessons (teacher-created + built-in templates) as editable
  useEffect(() => {
    const allLessons: (TeacherLesson | Lesson)[] = [...data.lessons]

    // Add built-in lessons (from LESSONS template data)
    for (const builtInLesson of LESSONS) {
      // Don't duplicate if teacher already created a lesson with the same ID
      if (!data.lessons.some(l => l.id === builtInLesson.id)) {
        allLessons.push(builtInLesson)
      }
    }

    setLessons(allLessons)
    setQuizzes(data.quizzes)
  }, [data.lessons, data.quizzes])

  const subject = watch('subject')

  const openNew = () => {
    reset({ title:'', subject:'chemistry', summary:'', content:'', linkedQuizId:'', labExperimentId:'', arModelIndex:0, detectionMode:'marker', anchorHint:'', arSteps:'' })
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

  const handleSave = handleSubmit(async (data) => {
    const createdAt = editTarget && isTeacherLesson(editTarget) ? editTarget.createdAt : undefined
    await storage.saveLesson({
      id: editTarget?.id ?? uid(),
      title: data.title.trim(),
      subject: data.subject,
      content: data.content,
      summary: data.summary.trim(),
      createdAt: createdAt ?? new Date().toISOString(),
      ...(data.linkedQuizId    ? { linkedQuizId: data.linkedQuizId }       : {}),
      ...(data.labExperimentId ? { labExperimentId: data.labExperimentId } : {}),
      arPayload: {
        modelIndex:    data.arModelIndex,
        detectionMode: data.detectionMode,
        anchorHint:    data.anchorHint.trim() || `Scan a ${data.subject} marker.`,
        lessonSteps:   data.arSteps.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 6),
      },
    })
    const updatedData = await storage.getAll()
    setLessons(updatedData.lessons)
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
            const isTeacher = isTeacherLesson(l)
            const linkedQuiz = isTeacher && l.linkedQuizId ? quizzes.find((q) => q.id === l.linkedQuizId) : null
            return (
              <div key={l.id} onClick={() => setViewTarget(l)}
                className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 cursor-pointer hover:border-border/70 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{l.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <SubjectBadge subject={l.subject} />
                    {linkedQuiz && <span className="text-xs text-primary font-medium">Quiz: {linkedQuiz.title}</span>}
                    {isTeacher && l.createdAt && <span className="text-xs text-muted-foreground">{format(parseISO(l.createdAt), 'MMM d, yyyy')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isTeacher && <button onClick={(e) => { e.stopPropagation(); openEdit(l) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Edit3 size={14} />
                  </button>}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (!window.confirm(`Delete lesson "${l.title}"? This cannot be undone.`)) return
                      await storage.deleteLesson(l.id)
                      setLessons(prev => prev.filter(lesson => lesson.id !== l.id))
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

      {viewTarget && createPortal(
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
            {isTeacherLesson(viewTarget) && (
              <>
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
              </>
            )}
          </motion.div>
        </div>,
        document.body
      )}
    </motion.div>
  )
}
