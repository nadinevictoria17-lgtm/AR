import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Brain, BookOpen, Users, Plus, Trash2, Edit3, X,
  ChevronDown, ChevronUp, Trophy, LayoutDashboard, Menu,
  type LucideIcon,
} from 'lucide-react'
import { storage } from '../lib/storage'
import { TeacherSidebar } from '../components/layout/TeacherSidebar'
import type { TeacherTab } from '../components/layout/TeacherSidebar'
import type { TeacherQuiz, TeacherLesson, StudentRecord, TeacherQuizQuestion, SubjectKey } from '../types'
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
  const [title, setTitle] = useState(initial?.title ?? '')
  const [subject, setSubject] = useState<SubjectKey>(initial?.subject ?? 'physics')
  const topics = SUBJECTS.find((s) => s.id === subject)?.topics ?? []
  const [topicId, setTopicId] = useState<string>(() => initial?.topicId ?? topics[0]?.id ?? '')
  const [questions, setQuestions] = useState<TeacherQuizQuestion[]>(
    initial?.questions ?? [{ question: '', options: ['', '', '', ''], correctIndex: 0, hint: '' }]
  )
  const [expanded, setExpanded] = useState<number | null>(0)

  useEffect(() => {
    // Keep topic assignment valid when teacher switches subject.
    if (!topics.some((t) => t.id === topicId)) {
      setTopicId(topics[0]?.id ?? '')
    }
  }, [subject, topicId, topics])

  const addQuestion = () => {
    setQuestions((p) => [...p, { question: '', options: ['', '', '', ''], correctIndex: 0, hint: '' }])
    setExpanded(questions.length)
  }
  const removeQuestion = (i: number) => { setQuestions((p) => p.filter((_, idx) => idx !== i)); setExpanded(null) }
  const updateQ = (i: number, f: keyof TeacherQuizQuestion, v: string | number) =>
    setQuestions((p) => p.map((q, idx) => idx === i ? { ...q, [f]: v } : q))
  const updateOpt = (qi: number, oi: number, v: string) =>
    setQuestions((p) => p.map((q, idx) =>
      idx === qi ? { ...q, options: q.options.map((o, j) => j === oi ? v : o) as [string, string, string, string] } : q
    ))

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground">{initial ? 'Edit Quiz' : 'New Quiz'}</h3>
        <button onClick={onCancel} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="w-full space-y-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Quiz Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Motion & Forces Quiz"
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Subject</label>
          <div className="flex gap-2 flex-wrap">
            {SUBJECT_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setSubject(o.value)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-semibold border transition-all',
                  subject === o.value
                    ? SUBJECT_STYLES[o.value].badge + ' shadow-sm'
                    : 'border-border text-muted-foreground hover:border-border/70'
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Module (Topic)</label>
          {topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No topics found for this subject.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopicId(t.id)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-semibold border transition-all',
                    topicId === t.id
                      ? SUBJECT_STYLES[subject].badge + ' shadow-sm'
                      : 'border-border text-muted-foreground hover:border-border/70'
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full space-y-2 mb-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Questions ({questions.length})</p>
        {questions.map((q, qi) => (
          <div key={qi} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setExpanded(expanded === qi ? null : qi)}
            >
              <span className="text-sm font-semibold text-foreground truncate pr-4">
                Q{qi + 1}{q.question ? ` — ${q.question.slice(0, 40)}${q.question.length > 40 ? '…' : ''}` : ' — Untitled'}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); removeQuestion(qi) }}
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
                <textarea
                  value={q.question}
                  onChange={(e) => updateQ(qi, 'question', e.target.value)}
                  placeholder="Question text…"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correctIndex === oi}
                        onChange={() => updateQ(qi, 'correctIndex', oi)}
                        className="accent-primary w-4 h-4 shrink-0"
                      />
                      <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{['A', 'B', 'C', 'D'][oi]}</span>
                      <input
                        value={opt}
                        onChange={(e) => updateOpt(qi, oi, e.target.value)}
                        placeholder={`Option ${['A', 'B', 'C', 'D'][oi]}…`}
                        className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Hint (optional)</label>
                  <input
                    value={q.hint}
                    onChange={(e) => updateQ(qi, 'hint', e.target.value)}
                    placeholder="Hint text…"
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        <button
          onClick={addQuestion}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors w-full justify-center"
        >
          <Plus size={14} /> Add Question
        </button>
      </div>

      <div className="w-full">
        <button
          onClick={() => {
            if (!title.trim() || questions.some((q) => !q.question.trim())) return
            const resolvedTopicId = topicId || topics[0]?.id
            if (!resolvedTopicId) return
            onSave({
              id: initial?.id ?? uid(),
              title: title.trim(),
              subject,
              topicId: resolvedTopicId,
              questions,
              createdAt: initial?.createdAt ?? new Date().toISOString(),
            })
          }}
          disabled={!title.trim() || !topicId}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all btn-glow"
        >
          Save Quiz
        </button>
      </div>
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
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState<SubjectKey>('physics')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [linkedQuizId, setLinkedQuizId] = useState('')
  const [labExperimentId, setLabExperimentId] = useState('')
  const [arModelIndex, setArModelIndex] = useState(0)
  const [detectionMode, setDetectionMode] = useState<'marker' | 'surface'>('marker')
  const [anchorHint, setAnchorHint] = useState('')
  const [arSteps, setArSteps] = useState('')

  useEffect(() => {
    const data = storage.getAll()
    setLessons(data.lessons)
    setQuizzes(data.quizzes)
  }, [])

  const openNew = () => {
    setTitle('')
    setSubject('physics')
    setSummary('')
    setContent('')
    setLinkedQuizId('')
    setLabExperimentId('')
    setArModelIndex(0)
    setDetectionMode('marker')
    setAnchorHint('')
    setArSteps('')
    setEditTarget(null)
    setShowForm(true)
  }
  const openEdit = (l: TeacherLesson) => {
    setTitle(l.title)
    setSubject(l.subject)
    setSummary(l.summary ?? '')
    setContent(l.content)
    setLinkedQuizId(l.linkedQuizId ?? '')
    setLabExperimentId(l.labExperimentId ?? '')
    setArModelIndex(l.arPayload?.modelIndex ?? 0)
    setDetectionMode(l.arPayload?.detectionMode ?? 'marker')
    setAnchorHint(l.arPayload?.anchorHint ?? '')
    setArSteps((l.arPayload?.lessonSteps ?? []).join('\n'))
    setEditTarget(l)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!title.trim()) return
    storage.saveLesson({
      id: editTarget?.id ?? uid(),
      title: title.trim(), subject, content, summary: summary.trim(),
      createdAt: editTarget?.createdAt ?? new Date().toISOString(),
      ...(linkedQuizId ? { linkedQuizId } : {}),
      ...(labExperimentId ? { labExperimentId } : {}),
      arPayload: {
        modelIndex: arModelIndex,
        detectionMode,
        anchorHint: anchorHint.trim() || `Scan a ${subject} marker.`,
        lessonSteps: arSteps.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 6),
      },
    })
    setLessons(storage.getAll().lessons)
    setShowForm(false)
  }

  if (showForm) return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground">{editTarget ? 'Edit Lesson' : 'New Lesson'}</h3>
        <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="w-full space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson title…"
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Subject</label>
          <div className="flex gap-2 flex-wrap">
            {SUBJECT_OPTIONS.map((o) => (
              <button key={o.value} onClick={() => setSubject(o.value)}
                className={cn('px-4 py-2 rounded-xl text-xs font-semibold border transition-all',
                  subject === o.value ? SUBJECT_STYLES[o.value].badge + ' shadow-sm' : 'border-border text-muted-foreground hover:border-border/70')}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Summary</label>
          <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Short lesson summary…"
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Content</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your lesson content…" rows={6}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Linked Lab (optional)</label>
          <select value={labExperimentId} onChange={(e) => setLabExperimentId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">None</option>
            {EXPERIMENTS.filter((exp) => exp.subject === subject).map((exp) => <option key={exp.id} value={exp.id}>{exp.name}</option>)}
          </select>
        </div>
        <div className="rounded-xl border border-border p-3 space-y-3 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AR Metadata (optional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="number"
              value={arModelIndex}
              onChange={(e) => setArModelIndex(Number(e.target.value || 0))}
              placeholder="Model index"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <select
              value={detectionMode}
              onChange={(e) => setDetectionMode(e.target.value as 'marker' | 'surface')}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="marker">Marker</option>
              <option value="surface">Surface</option>
            </select>
          </div>
          <input
            value={anchorHint}
            onChange={(e) => setAnchorHint(e.target.value)}
            placeholder="Anchor hint for students"
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <textarea
            value={arSteps}
            onChange={(e) => setArSteps(e.target.value)}
            placeholder={'AR steps (one per line)\nOpen camera\nScan marker\nInspect model'}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Linked Quiz (optional)</label>
          <select value={linkedQuizId} onChange={(e) => setLinkedQuizId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="">None</option>
            {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
          </select>
        </div>
        <button onClick={handleSave} disabled={!title.trim()}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all btn-glow">
          Save Lesson
        </button>
      </div>
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
  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [section, setSection] = useState('')
  useEffect(() => { setStudents(storage.getAll().students) }, [])

  const handleAdd = () => {
    if (!name.trim()) return
    storage.saveStudent({ id: uid(), name: name.trim(), studentId: studentId.trim(), grade: '7', section: section.trim(), scores: {} as Record<SubjectKey, number | null> })
    setStudents(storage.getAll().students)
    setName(''); setStudentId(''); setSection(''); setShowForm(false)
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
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all btn-glow"
        >
          <Plus size={14} /> Add Student
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-5">
          <p className="font-semibold text-foreground text-sm mb-4">New Student</p>
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name…"
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <div className="flex gap-3">
              <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="000-000"
                className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={section} onChange={(e) => setSection(e.target.value)} placeholder="Section…"
                className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <button onClick={handleAdd} disabled={!name.trim()}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Add Student
            </button>
          </div>
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
