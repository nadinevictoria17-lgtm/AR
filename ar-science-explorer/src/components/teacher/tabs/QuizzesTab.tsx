import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Plus, Trash2, Edit3, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle2, Search } from 'lucide-react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { storage } from '../../../lib/storage'
import { useStorageData } from '../../../hooks/useStorageData'
import { SUBJECTS } from '../../../data/subjects'
import { LESSONS } from '../../../data/lessons'
import { QUIZ_QUESTIONS } from '../../../data/quiz'
import { cn } from '../../../lib/utils'
import { pageVariants, SUBJECT_STYLES } from '../../../lib/variants'
import { FormInput } from '../../form/FormInput'
import { FormTextarea } from '../../form/FormTextarea'
import type { TeacherQuiz, SubjectKey } from '../../../types'
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
  subject:   z.enum(['biology','chemistry','physics']),
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
  const subjectLessons = LESSONS.filter((l) => l.subject === subject)
  const [expanded, setExpanded] = useState<number | null>(0)

  useEffect(() => {
    if (!subjectLessons.some((l) => l.id === topicId)) {
      setValue('topicId', subjectLessons[0]?.id ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject])

  const onSubmit = handleSubmit((data) => {
    const resolvedTopicId = data.topicId || subjectLessons[0]?.id
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
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Close">
          <X size={16} />
        </Button>
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
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Lesson Module</label>
            <Controller
              control={control}
              name="topicId"
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {subjectLessons.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              )}
            />
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
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ question: '', options: ['', '', '', ''], correctIndex: 0, hint: '' })}
            className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/5 gap-2"
          >
            <Plus size={14} /> Add Question
          </Button>
        </div>

        <div className="w-full">
          <Button type="submit" className="btn-glow">
            Save Quiz
          </Button>
        </div>
      </form>
    </motion.div>
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
  for (const lesson of LESSONS) {
    const builtInId = `builtin-${lesson.id}`
    if (allQuizzes.some(q => q.id === builtInId)) continue
    if (hidden.has(builtInId)) continue
    const lessonQuestions = QUIZ_QUESTIONS.filter(q => q.lessonId === lesson.id)
    allQuizzes.push({
      id: builtInId,
      title: lesson.title,
      subject: lesson.subject,
      topicId: lesson.id,
      questions: lessonQuestions,
      createdAt: new Date(0).toISOString(),
    })
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
        showErrorModal('Save Failed', 'Failed to save quiz. Check your connection and try again.')
        return
      }
      await storage.getAll()
      // Quiz list will auto-update via Firestore subscription in useStorageData
      setBuilding(false)
      setEditing(null)
    } catch (error) {
      console.error('[QuizzesTab] Error saving quiz:', error)
      showErrorModal('Save Failed', error instanceof Error ? error.message : 'An error occurred saving the quiz.')
    }
  }

  if (building || editing) {
    return <QuizBuilder initial={editing ?? undefined} onSave={handleSave} onCancel={() => { setBuilding(false); setEditing(null) }} />
  }

  if (showSkeleton) {
    return <TableSkeleton columns={['Quiz', 'Module', 'Questions', '']} rows={8} />
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Brain size={20} className="text-subject-biology" /> Quizzes
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredQuizzes.length} of {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}
          </p>
        </div>
        <Button onClick={() => setBuilding(true)} className="gap-2 btn-glow">
          <Plus size={14} /> New Quiz
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            placeholder="Search quizzes…"
            className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-muted text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 w-44"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
          {(['all', 'chemistry', 'biology'] as const).map(s => (
            <button key={s} onClick={() => { setFilterSubject(s); setCurrentPage(1) }}
              className={cn('px-3 py-1 rounded-md text-[11px] font-semibold transition-colors capitalize',
                filterSubject === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {s === 'all' ? 'All Subjects' : s}
            </button>
          ))}
        </div>
        {(searchQuery || filterSubject !== 'all') && (
          <button onClick={() => { setSearchQuery(''); setFilterSubject('all'); setCurrentPage(1) }}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted transition-colors">
            <X size={11} /> Clear
          </button>
        )}
      </div>

      <Card className="rounded-2xl border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Quiz</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Module</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">Questions</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedQuizzes.map((q) => {
                const isBuiltIn = q.id.startsWith('builtin-')
                // Built-in that was edited by the teacher and saved to Firestore
                const isModified = isBuiltIn && data.quizzes.some((dq) => dq.id === q.id)
                const isCustom = !isBuiltIn
                const moduleName = isBuiltIn
                  ? LESSONS.find((l) => l.id === q.topicId)?.title ?? (q.topicId ?? '').toUpperCase()
                  : SUBJECTS.find((s) => s.id === q.subject)?.topics.find((t) => t.id === q.topicId)?.name ?? '—'
                return (
                  <tr
                    key={q.id}
                    onClick={() => setPreviewQuiz(q)}
                    className="hover:bg-muted/20 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[220px]">{q.title}</p>
                      <div className="mt-1"><SubjectBadge subject={q.subject} /></div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-foreground truncate max-w-[200px] block">{moduleName}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-foreground">{q.questions.length}</span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(q)} aria-label="Edit quiz">
                          <Edit3 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete quiz"
                          className="text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => showConfirmModal(
                            isModified ? 'Reset Quiz' : 'Delete Quiz',
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
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                        <Brain size={20} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No quizzes yet</p>
                      <p className="text-xs text-muted-foreground">Create a quiz to assign to your students.</p>
                      <Button onClick={() => setBuilding(true)} className="gap-2 btn-glow mt-1">
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
            <div className="text-xs text-muted-foreground">
              Showing {startIndex + 1}–{Math.min(endIndex, filteredQuizzes.length)} of {filteredQuizzes.length} quizzes
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

      <AnimatePresence>
        {previewQuiz && createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setPreviewQuiz(null)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="relative bg-card border border-border rounded-3xl w-full max-w-lg max-h-[75vh] overflow-y-auto p-6 shadow-2xl z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="font-bold text-foreground text-base">{previewQuiz.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <SubjectBadge subject={previewQuiz.subject} />
                    <span className="text-[11px] text-muted-foreground">{previewQuiz.questions.length} question{previewQuiz.questions.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setPreviewQuiz(null)} aria-label="Close" className="shrink-0">
                  <X size={16} />
                </Button>
              </div>
              <div className="space-y-4">
                {previewQuiz.questions.map((q, qi) => (
                  <div key={qi} className="rounded-xl border border-border p-4 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground mb-3">Q{qi + 1}. {q.question}</p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                            oi === q.correctIndex
                              ? 'bg-success/10 text-success font-semibold'
                              : 'text-muted-foreground'
                          )}
                        >
                          {oi === q.correctIndex
                            ? <CheckCircle2 size={13} className="shrink-0" />
                            : <span className="w-[13px] shrink-0" />
                          }
                          <span className="font-bold text-xs w-4 shrink-0">{['A','B','C','D'][oi]}</span>
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
    </motion.div>
  )
}
