import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, Plus, Trash2, Edit3, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { storage } from '../../../lib/storage'
import { useStorageData } from '../../../hooks/useStorageData'
import { SUBJECTS } from '../../../data/subjects'
import { QUIZ_QUESTIONS } from '../../../data/quiz'
import { cn } from '../../../lib/utils'
import { FormInput } from '../../form/FormInput'
import { FormTextarea } from '../../form/FormTextarea'
import type { TeacherQuiz, SubjectKey } from '../../../types'

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
  subject:   z.enum(['biology','chemistry']),
  topicId:   z.string().min(1, 'Please select a topic'),
  questions: z.array(QuizQuestionSchema).min(1, 'At least one question is required'),
})

type QuizFormValues = z.infer<typeof QuizSchema>

function uid() { return Math.random().toString(36).slice(2, 9) }

function SubjectBadge({ subject }: { subject: SubjectKey }) {
  const s = SUBJECT_STYLES[subject]
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold', s.badge)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

function QuizBuilder({ initial, onSave, onCancel }: {
  initial?: TeacherQuiz
  onSave: (q: TeacherQuiz) => void
  onCancel: () => void
}) {
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<QuizFormValues>({
    resolver: zodResolver(QuizSchema),
    defaultValues: {
      title:     initial?.title ?? '',
      subject:   initial?.subject ?? 'chemistry',
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
          <FormInput
            {...register('title')}
            label="Quiz Title"
            placeholder="e.g. Motion & Forces Quiz"
            error={errors.title?.message}
            required
          />
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
                  <FormTextarea
                    {...register(`questions.${qi}.question`)}
                    label={`Question ${qi + 1}`}
                    placeholder="Question text…"
                    rows={2}
                    error={errors.questions?.[qi]?.question?.message}
                    required
                  />
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
          <button
            type="button"
            onClick={() => append({ question: '', options: ['', '', '', ''], correctIndex: 0, hint: '' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors w-full justify-center"
          >
            <Plus size={14} /> Add Question
          </button>
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

export function QuizzesTab() {
  const { data } = useStorageData()
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([])
  const [building, setBuilding] = useState(false)
  const [editing, setEditing] = useState<TeacherQuiz | null>(null)

  // Show all quizzes (teacher-created + built-in templates) grouped by LESSON (5 questions per lesson)
  useEffect(() => {
    const allQuizzes: TeacherQuiz[] = [...data.quizzes]

    // Get unique lessons from QUIZ_QUESTIONS
    const lessonIds = [...new Set(QUIZ_QUESTIONS.filter(q => q.lessonId).map(q => q.lessonId!))]

    for (const lessonId of lessonIds) {
      // Skip if teacher already created a quiz with this ID
      if (allQuizzes.some(q => q.id === `builtin-${lessonId}`)) continue

      const lessonQuestions = QUIZ_QUESTIONS.filter(q => q.lessonId === lessonId)
      if (lessonQuestions.length > 0) {
        const firstQuestion = lessonQuestions[0]
        const builtInQuiz: TeacherQuiz = {
          id: `builtin-${lessonId}`,
          title: `${lessonId.toUpperCase()} Quiz`,
          subject: firstQuestion.subject,
          topicId: firstQuestion.topicId,
          questions: lessonQuestions,
          createdAt: new Date(0).toISOString(),
        }
        allQuizzes.push(builtInQuiz)
      }
    }

    setQuizzes(allQuizzes)
  }, [data.quizzes])

  const handleSave = async (q: TeacherQuiz) => {
    try {
      const saved = await storage.saveQuiz(q)
      if (!saved) {
        alert('❌ Failed to save quiz. Check browser console for errors.')
        return
      }
      const updatedData = await storage.getAll()
      setQuizzes(updatedData.quizzes)
      setBuilding(false)
      setEditing(null)
      console.log('✅ Quiz saved successfully:', q)
    } catch (error) {
      console.error('❌ Error saving quiz:', error)
      alert('Error saving quiz: ' + (error instanceof Error ? error.message : String(error)))
    }
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
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditing(q)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm(`Delete quiz "${q.title}"? This cannot be undone.`)) return
                    await storage.deleteQuiz(q.id)
                    setQuizzes(prev => prev.filter(quiz => quiz.id !== q.id))
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
