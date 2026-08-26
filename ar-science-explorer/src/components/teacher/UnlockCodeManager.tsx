import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Copy, Check, GraduationCap, AlertCircle,
  BookOpen, ChevronDown, ChevronUp, Search, X, RefreshCw,
  KeyRound, Users, Clock, CheckCircle2, XCircle,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { pageVariants, SUBJECT_STYLES } from '../../lib/variants'
import { getAllUnlockCodes, createUnlockCode, getUnlockCodeData, deleteUnlockCode, type UnlockCodeData } from '../../lib/unlockCodeManager'
import { storage } from '../../lib/storage'
import { useStorageData } from '../../hooks/useStorageData'
import { useNotificationStore } from '../../store/useNotificationStore'
import type { QuizUnlockCode, SubjectKey } from '../../types'
import { SUBJECTS } from '../../data/subjects'
import { LESSONS } from '../../data/lessons'
import { PRE_TEST_QUESTIONS, POST_TEST_QUESTIONS } from '../../data/curriculum'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'

/** Lesson ids that actually have a test defined (built-in or teacher-created). */
function lessonIdsWithTests(teacherQuizzes: { topicId?: string }[]): Set<string> {
  const ids = new Set<string>()
  for (const q of PRE_TEST_QUESTIONS) if (q.lessonId) ids.add(q.lessonId)
  for (const q of POST_TEST_QUESTIONS) if (q.lessonId) ids.add(q.lessonId)
  for (const q of teacherQuizzes) if (q.topicId) ids.add(q.topicId)
  return ids
}

const WEEKS_BY_SUBJECT: Record<SubjectKey, { id: string; title: string; week: number }[]> = {
  chemistry: LESSONS.filter(l => l.subject === 'chemistry' && l.week != null).map(l => ({ id: l.id, title: l.title, week: l.week! })),
  biology:   LESSONS.filter(l => l.subject === 'biology'   && l.week != null).map(l => ({ id: l.id, title: l.title, week: l.week! })),
  physics:   LESSONS.filter(l => l.subject === 'physics'   && l.week != null).map(l => ({ id: l.id, title: l.title, week: l.week! })),
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified row shape for table rendering
// ─────────────────────────────────────────────────────────────────────────────
type RowKind = 'lesson' | 'retake-manual' | 'retake-auto'

interface CodeRow {
  key:              string
  kind:             RowKind
  code:             string
  target:           string          // quiz/lesson title or list of weeks
  studentName:      string | null
  studentId:        string | null
  status:           'active' | 'used' | 'expired'
  createdAt:        string
  expiresAt?:       string          // expiration date for retake codes
  usedByStudentIds: string[]        // lesson codes: who applied it
  // raw refs for delete
  _lessonCode?:  UnlockCodeData
  _retakeCode?:  QuizUnlockCode
}

/** Shared right-side slide-in drawer shell (matches the pattern used elsewhere in this pass). */
function Drawer({
  onClose,
  title,
  subtitle,
  children,
}: {
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return createPortal(
    <div className="fixed inset-0 z-50">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
        className="fixed inset-y-0 right-0 z-10 w-full max-w-md bg-card border-l border-border shadow-popover flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="shrink-0">
            <X size={16} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

export function UnlockCodeManager() {
  const { data } = useStorageData(true)
  const showConfirmModal = useNotificationStore((s) => s.showConfirmModal)
  const [codes, setCodes]           = useState<UnlockCodeData[]>([])
  const [retakeCodes, setRetakeCodes] = useState<QuizUnlockCode[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)

  // Filters
  const [filterType,   setFilterType]   = useState<'all' | 'subject' | 'lesson' | 'quiz'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'used'>('all')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [quizSearchInput, setQuizSearchInput] = useState('')
  const [studentSearchInput, setStudentSearchInput] = useState('')

  // Form state
  const [newCode,               setNewCode]               = useState('')
  const [codeType,              setCodeType]              = useState<'subject' | 'lesson' | 'quiz'>('subject')
  const [selectedSubject,       setSelectedSubject]       = useState<SubjectKey>('chemistry')
  const [selectedWeeks,         setSelectedWeeks]         = useState<string[]>([])
  const [selectedTargetId,      setSelectedTargetId]      = useState<string>(LESSONS[0]?.id || '')
  const [selectedTargetStudent, setSelectedTargetStudent] = useState<string>('')
  const [showWeekPicker,        setShowWeekPicker]        = useState(false)
  const [showQuizPicker,        setShowQuizPicker]        = useState(false)
  const [showStudentPicker,     setShowStudentPicker]     = useState(false)
  const [copiedCode,   setCopiedCode]   = useState<string | null>(null)
  const [expandedRow,  setExpandedRow]  = useState<string | null>(null)
  const [errorVisible, setErrorVisible] = useState<string | null>(null)
  const [expirationModal, setExpirationModal] = useState<{ isOpen: boolean; selectedDate: string } | null>(null)
  const [pendingRetakeCodeData, setPendingRetakeCodeData] = useState<{ quizId: string; studentId: string } | null>(null)

  // Built-in lessons + teacher-created lessons, so custom lessons show up in the
  // "Test" picker too. A lesson only appears here if a test (built-in or
  // teacher-created) actually exists for it.
  const testableLessons = useMemo(() => {
    const withTests = lessonIdsWithTests(data.quizzes)
    const merged = [...LESSONS]
    for (const tl of data.lessons) {
      if (!merged.some(l => l.id === tl.id)) merged.push(tl as typeof LESSONS[number])
    }
    return merged.filter(l => withTests.has(l.id))
  }, [data.lessons, data.quizzes])

  // Which phases (Pre/Post) exist for a given lesson id, so the picker can show
  // exactly what a "Test Unlock" code for that lesson will actually gate.
  const phasesForLesson = useMemo(() => {
    const map = new Map<string, { pre: boolean; post: boolean }>()
    const mark = (lessonId: string | undefined, phase: 'pre' | 'post') => {
      if (!lessonId) return
      const entry = map.get(lessonId) ?? { pre: false, post: false }
      entry[phase] = true
      map.set(lessonId, entry)
    }
    for (const q of PRE_TEST_QUESTIONS) mark(q.lessonId, 'pre')
    for (const q of POST_TEST_QUESTIONS) mark(q.lessonId, 'post')
    for (const q of data.quizzes) mark(q.topicId, (q.phase ?? 'post'))
    return map
  }, [data.quizzes])

  // Keep the selected test valid: if it points at a lesson with no test (e.g.
  // the initial default, or after switching code type), snap to the first
  // lesson that actually has one.
  useEffect(() => {
    if (codeType !== 'lesson' && codeType !== 'quiz') return
    const pool = codeType === 'quiz'
      ? testableLessons.filter(l => phasesForLesson.get(l.id)?.post)
      : testableLessons
    if (!pool.some(l => l.id === selectedTargetId)) {
      setSelectedTargetId(pool[0]?.id ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeType, testableLessons, phasesForLesson])

  useEffect(() => { loadCodes() }, [])

  const loadCodes = async () => {
    setLoading(true)
    const [lessonCodes, quizRetakeCodes] = await Promise.all([
      getAllUnlockCodes(),
      storage.getQuizRetakeCodes(),
    ])
    setCodes(lessonCodes)
    setRetakeCodes(quizRetakeCodes)
    setLoading(false)
  }

  const usedLessonIds = new Set(codes.flatMap(c => c.lessonIds || (c.targetId ? [c.targetId] : [])))

  const handleCreateCode = async () => {
    if (!newCode.trim()) return
    if (codeType === 'subject' && selectedWeeks.length === 0) {
      setErrorVisible('Select at least one week to unlock.')
      return
    }
    if ((codeType === 'lesson' || codeType === 'quiz') && !selectedTargetId) {
      setErrorVisible('Select a test.')
      return
    }
    setErrorVisible(null)

    // Check if code already exists
    const normalizedCode = newCode.trim().toUpperCase()
    const existingCode = await getUnlockCodeData(normalizedCode)
    if (existingCode) {
      setErrorVisible(`Code "${normalizedCode}" already exists. Please use a different code name.`)
      return
    }

    // For quiz retake, show date picker modal
    if (codeType === 'quiz') {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setExpirationModal({ isOpen: true, selectedDate: tomorrow.toISOString().split('T')[0] })
      setPendingRetakeCodeData({ quizId: selectedTargetId, studentId: selectedTargetStudent })
      return
    }

    let config: any
    if (codeType === 'subject') {
      config = { subjects: [selectedSubject], lessonIds: selectedWeeks }
    } else if (codeType === 'lesson') {
      // Quiz Unlock — no student targeting
      config = { targetId: selectedTargetId }
    }

    const result = await createUnlockCode(normalizedCode, codeType, config)
    if (result.success) {
      setNewCode(''); setSelectedWeeks([]); setSelectedTargetStudent(''); setSelectedTargetId(testableLessons[0]?.id || '')
      setShowForm(false); await loadCodes()
    } else {
      setErrorVisible(result.error || 'Failed to generate code.')
    }
  }

  const handleConfirmRetakeExpiration = async () => {
    if (!expirationModal || !pendingRetakeCodeData) return

    const normalizedCode = newCode.trim().toUpperCase()
    const expiresAtDate = new Date(expirationModal.selectedDate)

    const config = {
      targetId: pendingRetakeCodeData.quizId,
      ...(pendingRetakeCodeData.studentId ? { targetStudentId: pendingRetakeCodeData.studentId } : {}),
      expiresAtDate
    }

    const result = await createUnlockCode(normalizedCode, 'quiz', config)
    if (result.success) {
      setNewCode(''); setSelectedWeeks([]); setSelectedTargetStudent(''); setSelectedTargetId(testableLessons[0]?.id || '')
      setShowForm(false); setExpirationModal(null); setPendingRetakeCodeData(null); await loadCodes()
    } else {
      setErrorVisible(result.error || 'Failed to generate code.')
      setExpirationModal(null); setPendingRetakeCodeData(null)
    }
  }

  const handleDelete = (row: CodeRow) => {
    showConfirmModal('Delete Code', `Permanently delete code "${row.code}"? This action cannot be undone.`, async () => {
      const showToast = useNotificationStore.getState().showToast
      try {
        if (row._retakeCode) {
          await storage.deleteQuizRetakeCode(row._retakeCode.id)
        } else if (row._lessonCode) {
          await deleteUnlockCode(row._lessonCode.code)
        }
        showToast({
          description: `Code "${row.code}" deleted.`,
          type: 'success',
        })
        await loadCodes()
      } catch (error) {
        showToast({
          description: `Failed to delete code.`,
          type: 'destructive',
        })
      }
    })
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const toggleWeek = (id: string) =>
    setSelectedWeeks(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const availableWeeks = WEEKS_BY_SUBJECT[selectedSubject].filter(w => !usedLessonIds.has(w.id))

  const closeForm = () => { setShowForm(false); setErrorVisible(null) }

  // ── Build unified rows ────────────────────────────────────────────────────
  const allRows = useMemo<CodeRow[]>(() => {
    const rows: CodeRow[] = []

    // Lesson/Subject unlock codes
    codes.filter(c => c.type !== 'quiz').forEach(c => {
      const weekTitles = (c.lessonIds ?? [])
        .map(id => { const l = LESSONS.find(x => x.id === id); return l ? `W${l.week} ${l.title}` : id })

      let targetLabel = 'All'
      if (weekTitles.length > 0) {
        targetLabel = weekTitles.join(' · ')
      } else if (c.type === 'lesson' && c.targetId) {
        const lessonId = c.targetId.startsWith('builtin-') ? c.targetId.replace('builtin-', '') : c.targetId
        const lesson = LESSONS.find(l => l.id === lessonId)
        targetLabel = lesson?.title ?? c.targetId
      } else if (c.subjects?.length) {
        targetLabel = c.subjects.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
      }

      rows.push({
        key: `lesson-${c.code}`, kind: 'lesson', code: c.code,
        target: targetLabel,
        studentName: null, studentId: null, status: 'active',
        createdAt: c.createdAt,
        usedByStudentIds: c.usedByStudentIds ?? [],
        _lessonCode: c,
      })
    })

    // Manual quiz retake codes (type='quiz' in unlockCodes)
    codes.filter(c => c.type === 'quiz').forEach(c => {
      const lesson  = c.targetId ? LESSONS.find(l => l.id === c.targetId) : null
      const student = c.targetStudentId ? data.students.find(s => s.id === c.targetStudentId) : null
      const isExpired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false
      rows.push({
        key: `manual-${c.code}`, kind: 'retake-manual', code: c.code,
        target: lesson?.title ?? c.targetId ?? '—',
        studentName: student?.name ?? null,
        studentId:   student?.studentId ?? null,
        status: c.isUsed ? 'used' : isExpired ? 'expired' : 'active',
        createdAt: c.createdAt,
        expiresAt: c.expiresAt,
        usedByStudentIds: c.usedByStudentIds ?? [],
        _lessonCode: c,
      })
    })

    // Auto-generated retake codes (quizUnlockCodes collection)
    retakeCodes.forEach(rc => {
      const lessonId = rc.quizId.startsWith('builtin-') ? rc.quizId.replace('builtin-', '') : rc.quizId
      const lesson   = LESSONS.find(l => l.id === lessonId)
      const student  = data.students.find(s => s.studentId === rc.studentId)
      const isExpired = rc.expiresAt ? new Date(rc.expiresAt) < new Date() : false
      rows.push({
        key: `auto-${rc.id}`, kind: 'retake-auto', code: rc.code,
        target: lesson?.title ?? rc.quizId,
        studentName: student?.name ?? null,
        studentId:   rc.studentId,
        status: rc.isUsed ? 'used' : isExpired ? 'expired' : 'active',
        createdAt: rc.generatedAt,
        expiresAt: rc.expiresAt,
        usedByStudentIds: [],
        _retakeCode: rc,
      })
    })

    return rows
  }, [codes, retakeCodes, data.students])

  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      // Filter by code type
      if (filterType === 'subject' && row._lessonCode?.type !== 'subject') return false
      if (filterType === 'lesson' && row._lessonCode?.type !== 'lesson') return false
      if (filterType === 'quiz') {
        const isRetake = row.kind === 'retake-auto' || row.kind === 'retake-manual' || row._lessonCode?.type === 'quiz'
        if (!isRetake) return false
      }

      if (filterStatus === 'active' && row.status !== 'active') return false
      if (filterStatus === 'used'   && row.status === 'active') return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          row.code.toLowerCase().includes(q) ||
          row.target.toLowerCase().includes(q) ||
          (row.studentName ?? '').toLowerCase().includes(q) ||
          (row.studentId ?? '').includes(q)
        )
      }
      return true
    })
  }, [allRows, filterType, filterStatus, searchQuery])

  const totalCount   = allRows.length
  const activeRetake = allRows.filter(r => r.kind !== 'lesson' && r.status === 'active').length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-[28px] font-semibold tracking-tight text-foreground flex items-center gap-2">
            <KeyRound size={20} className="text-primary" /> Access Codes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} total &middot; {activeRetake} retake{activeRetake !== 1 ? 's' : ''} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadCodes} title="Refresh">
            <RefreshCw size={14} />
          </Button>
          <Button onClick={() => setShowForm(v => !v)}>
            <Plus size={14} /> Generate code
          </Button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value) }}
            placeholder="Search code, test, student…"
            className="h-9 pl-8 pr-3 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring w-52" />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-md bg-muted border border-border">
          {([
            { id: 'all', label: 'All' },
            { id: 'subject', label: 'Subject Unlock' },
            { id: 'lesson', label: 'Post-Test Unlock' },
            { id: 'quiz', label: 'Post-Test Retake' }
          ] as const).map(f => (
            <button key={f.id} onClick={() => { setFilterType(f.id); setFilterStatus('all') }}
              className={cn('px-2.5 py-1 rounded-sm text-xs font-medium transition-colors duration-150',
                filterType === f.id ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground')}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-md bg-muted border border-border">
          {([{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'used', label: 'Used' }] as const).map(f => (
            <button key={f.id} onClick={() => setFilterStatus(f.id)}
              className={cn('px-2.5 py-1 rounded-sm text-xs font-medium transition-colors duration-150',
                filterStatus === f.id ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground')}>
              {f.label}
            </button>
          ))}
        </div>
        {(searchQuery || filterType !== 'all' || filterStatus !== 'all') && (
          <button onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterStatus('all') }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-colors duration-150">
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <Card className="overflow-hidden">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0">
              <div className="w-20 h-4 bg-muted rounded animate-pulse" />
              <div className="w-32 h-4 bg-muted rounded animate-pulse" />
              <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </Card>
      ) : filteredRows.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border">
          <KeyRound size={32} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">
            {totalCount === 0 ? 'No codes yet' : 'No matching codes'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount === 0
              ? 'Generate a code to unlock lessons or allow test retakes.'
              : 'Try adjusting your filters.'}
          </p>
          {totalCount === 0 && (
            <Button onClick={() => setShowForm(true)} className="mt-4">
              <Plus size={14} /> Generate first code
            </Button>
          )}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Code</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Target</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Student</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Expires</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map(row => {
                  const isCopied  = copiedCode === row.code
                  const isLesson  = row.kind === 'lesson'
                  const isExpanded = expandedRow === row.key
                  const usageCount = row.usedByStudentIds.length

                  return (
                    <>
                      <tr key={row.key} className="hover:bg-muted/20 transition-colors duration-150 group">
                        {/* Code */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-foreground bg-muted px-2 py-1 rounded-md">
                              {row.code}
                            </span>
                            <button
                              onClick={() => handleCopy(row.code)}
                              disabled={row.status !== 'active'}
                              aria-label={isCopied ? 'Copied' : 'Copy code'}
                              className={cn(
                                'w-7 h-7 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150',
                                isCopied
                                  ? 'opacity-100 text-success'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30'
                              )}
                            >
                              {isCopied ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">
                          <Badge variant={
                            row._lessonCode?.type === 'subject' ? 'warning' :
                            row._lessonCode?.type === 'lesson' ? 'default' :
                            'success'
                          } className={row._lessonCode?.type === 'lesson' ? 'bg-primary/10 text-primary border-primary/20' : ''}>
                            {row._lessonCode?.type === 'subject' ? <><BookOpen size={10} className="mr-1" /> Subject</> :
                             row._lessonCode?.type === 'lesson' ? <><GraduationCap size={10} className="mr-1" /> Post-Test</> :
                             <><RefreshCw size={10} className="mr-1" /> Retake</>}
                          </Badge>
                        </td>

                        {/* Target */}
                        <td className="px-6 py-4 max-w-[200px]">
                          <p className="text-sm text-foreground truncate">{row.target}</p>
                        </td>

                        {/* Student */}
                        <td className="px-6 py-4">
                          {row.studentName ? (
                            <div>
                              <p className="text-sm text-foreground">{row.studentName}</p>
                              <p className="text-xs text-muted-foreground">ID {row.studentId}</p>
                            </div>
                          ) : isLesson ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Users size={11} /> All students
                            </span>
                          ) : row.studentId ? (
                            <p className="text-sm text-muted-foreground">ID {row.studentId}</p>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Users size={11} /> Any student
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {row.status === 'active' && (
                            <Badge variant="success"><CheckCircle2 size={10} className="mr-1" /> Active</Badge>
                          )}
                          {row.status === 'used' && (
                            <Badge variant="secondary"><Check size={10} className="mr-1" /> Used</Badge>
                          )}
                          {row.status === 'expired' && (
                            <Badge variant="destructive"><XCircle size={10} className="mr-1" /> Expired</Badge>
                          )}
                          {!isLesson && row.status === 'active' && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock size={10} /> 1-time use
                            </p>
                          )}
                          {isLesson && usageCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Users size={10} /> {usageCount} used
                            </p>
                          )}
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {new Date(row.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Expires */}
                        <td className="px-6 py-4">
                          {row.expiresAt ? (
                            <span className="text-sm text-muted-foreground">
                              {new Date(row.expiresAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Lesson codes: chevron to see who used this code */}
                            {isLesson && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setExpandedRow(isExpanded ? null : row.key)}
                                aria-label={isExpanded ? 'Hide usage' : 'Show who used this code'}
                                className={cn(
                                  'text-muted-foreground hover:text-primary',
                                  isExpanded && 'text-primary bg-primary/10'
                                )}
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </Button>
                            )}
                            <Button variant="ghost" size="icon"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(row)}
                              aria-label="Delete code">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expandable student-usage panel (lesson codes only) ── */}
                      {isLesson && isExpanded && (
                        <tr key={`${row.key}-expand`} className="bg-muted/10">
                          <td colSpan={8} className="px-6 py-3">
                            <AnimatePresence>
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-2"
                              >
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                  <Users size={11} /> Students who used this code
                                </p>
                                {usageCount === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">
                                    No student has entered this code yet.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {row.usedByStudentIds.map(sid => {
                                      const student = data.students.find(s => s.studentId === sid || s.id === sid)
                                      return (
                                        <span key={sid}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background text-xs font-medium text-foreground">
                                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                                            {(student?.name ?? sid).charAt(0).toUpperCase()}
                                          </div>
                                          {student ? (
                                            <span>
                                              {student.name}
                                              <span className="ml-1 text-xs text-muted-foreground font-normal">
                                                ID {student.studentId}
                                              </span>
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground">ID {sid}</span>
                                          )}
                                        </span>
                                      )
                                    })}
                                  </div>
                                )}
                              </motion.div>
                            </AnimatePresence>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Generate-code drawer ── */}
      <AnimatePresence>
        {showForm && (
          <Drawer onClose={closeForm} title="New access code">
            <div className="space-y-5">
              {/* Type selector */}
              <div className="grid grid-cols-1 gap-2">
                {([
                  { id: 'subject', label: 'Lesson Unlock',      icon: BookOpen },
                  { id: 'lesson',  label: 'Post-Test Unlock',   icon: GraduationCap },
                  { id: 'quiz',    label: 'Post-Test Retake',   icon: GraduationCap },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setCodeType(t.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-md border text-xs font-medium transition-colors duration-150',
                      codeType === t.id
                        ? 'bg-primary/5 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    )}>
                    <t.icon size={13} /> {t.label}
                  </button>
                ))}
              </div>

              {/* Code string */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Code string
                </label>
                <Input
                  value={newCode}
                  onChange={e => setNewCode(e.target.value.toUpperCase())}
                  placeholder={codeType === 'subject' ? 'e.g. Q1W2-UNLOCK' : 'e.g. RETAKE-001'}
                  className="font-mono tracking-wide"
                />
                <p className="text-xs text-muted-foreground">
                  {codeType === 'subject'
                    ? 'Unlocks selected weeks for any student who enters this.'
                    : codeType === 'lesson'
                    ? 'Unlocks the Post-Test for first-time access. Pre-Tests are always free and never need a code. Any student can use it.'
                    : 'Allows a student to retake the Post-Test once, after failing or completing it. Pre-Tests are always retakeable and never need a code.'}
                </p>
              </div>

              {/* Type-specific fields */}
              <div className="space-y-3">
                {codeType === 'subject' ? (
                  // Lesson Unlock: Subject + Weeks
                  <>
                    {/* Subject */}
                    <div className="flex gap-2">
                      {SUBJECTS.map(s => (
                        <button key={s.id} onClick={() => { setSelectedSubject(s.id as SubjectKey); setSelectedWeeks([]) }}
                          className={cn(
                            'flex-1 py-2 rounded-md text-xs font-medium border transition-colors duration-150',
                            selectedSubject === s.id
                              ? SUBJECT_STYLES[s.id as SubjectKey].badge
                              : 'border-border text-muted-foreground hover:bg-muted'
                          )}>
                          {s.name}
                        </button>
                      ))}
                    </div>

                    {/* Week picker */}
                    <div>
                      <button onClick={() => setShowWeekPicker(p => !p)}
                        className="w-full flex items-center justify-between px-3 py-2 h-9 rounded-md bg-background border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors duration-150">
                        <span>
                          {selectedWeeks.length === 0 ? 'Select weeks…' : `${selectedWeeks.length} week${selectedWeeks.length > 1 ? 's' : ''} selected`}
                        </span>
                        {showWeekPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {showWeekPicker && (
                        <div className="mt-1.5 p-2 rounded-md border border-border bg-muted/30 space-y-1 max-h-44 overflow-y-auto">
                          {availableWeeks.length === 0
                            ? <p className="text-xs text-muted-foreground text-center py-2">All weeks already have codes.</p>
                            : availableWeeks.map(w => (
                              <button key={w.id} onClick={() => toggleWeek(w.id)}
                                className={cn(
                                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors duration-150',
                                  selectedWeeks.includes(w.id) ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                                )}>
                                <div className={cn('w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                                  selectedWeeks.includes(w.id) ? 'bg-primary border-primary' : 'border-border')}>
                                  {selectedWeeks.includes(w.id) && <Check size={9} className="text-primary-foreground" />}
                                </div>
                                <span className="text-xs font-medium">W{w.week}</span>
                                <span className="text-xs truncate text-muted-foreground">{w.title}</span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : codeType === 'lesson' ? (
                  // Post-Test Unlock: lesson picker, restricted to lessons with a Post-Test.
                  // (Pre-Tests are always free/ungated, so a code is never generated for them.)
                  <div onBlur={() => setTimeout(() => setShowQuizPicker(false), 200)} tabIndex={-1}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Post-Test</label>
                    <button onClick={() => setShowQuizPicker(p => !p)}
                      className="w-full flex items-center justify-between px-3 py-2 h-9 rounded-md bg-background border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors duration-150">
                      <span className="truncate">{selectedTargetId ? testableLessons.find(l => l.id === selectedTargetId)?.title : 'Select a Post-Test…'}</span>
                      {showQuizPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {selectedTargetId && (() => {
                      const p = phasesForLesson.get(selectedTargetId)
                      if (!p?.post) return null
                      return (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          This code will unlock the Post-Test for this lesson.
                        </p>
                      )
                    })()}
                    {showQuizPicker && (
                      <div className="mt-1.5 rounded-md border border-border bg-muted/30">
                        <input
                          type="text"
                          placeholder="Search Post-Tests..."
                          value={quizSearchInput}
                          onChange={(e) => setQuizSearchInput(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs bg-background border-b border-border rounded-t-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <div className="space-y-1 max-h-44 overflow-y-auto p-2">
                          {testableLessons.filter(l => phasesForLesson.get(l.id)?.post).length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">No Post-Tests exist yet. Create one in the Tests tab first.</p>
                          )}
                          {testableLessons.filter(l => phasesForLesson.get(l.id)?.post && (l.title.toLowerCase().includes(quizSearchInput.toLowerCase()) || l.id.toLowerCase().includes(quizSearchInput.toLowerCase()))).map(l => {
                            return (
                              <button key={l.id} onClick={() => { setSelectedTargetId(l.id); setShowQuizPicker(false); setQuizSearchInput('') }}
                                className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors duration-150',
                                  selectedTargetId === l.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground')}>
                                <div className={cn('w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                                  selectedTargetId === l.id ? 'bg-primary border-primary' : 'border-border')}>
                                  {selectedTargetId === l.id && <Check size={9} className="text-primary-foreground" />}
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground shrink-0 uppercase">{l.id}</span>
                                <span className="text-xs truncate flex-1">{l.title}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : codeType === 'quiz' ? (
                  // Post-Test Retake: only lessons with a Post-Test (Pre-Tests are always retakeable already) + Student
                  <>
                    {/* Post-Test picker */}
                    <div onBlur={() => setTimeout(() => setShowQuizPicker(false), 200)} tabIndex={-1}>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Post-Test</label>
                      <button onClick={() => setShowQuizPicker(p => !p)}
                        className="w-full flex items-center justify-between px-3 py-2 h-9 rounded-md bg-background border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors duration-150">
                        <span className="truncate">{selectedTargetId ? testableLessons.find(l => l.id === selectedTargetId)?.title : 'Select a Post-Test…'}</span>
                        {showQuizPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {showQuizPicker && (
                        <div className="mt-1.5 rounded-md border border-border bg-muted/30">
                          <input
                            type="text"
                            placeholder="Search Post-Tests..."
                            value={quizSearchInput}
                            onChange={(e) => setQuizSearchInput(e.target.value)}
                            className="w-full px-2.5 py-2 text-xs bg-background border-b border-border rounded-t-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <div className="space-y-1 max-h-44 overflow-y-auto p-2">
                            {testableLessons.filter(l => (phasesForLesson.get(l.id)?.post) && (l.title.toLowerCase().includes(quizSearchInput.toLowerCase()) || l.id.toLowerCase().includes(quizSearchInput.toLowerCase()))).map(l => (
                              <button key={l.id} onClick={() => { setSelectedTargetId(l.id); setShowQuizPicker(false); setQuizSearchInput('') }}
                                className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors duration-150',
                                  selectedTargetId === l.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground')}>
                                <div className={cn('w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                                  selectedTargetId === l.id ? 'bg-primary border-primary' : 'border-border')}>
                                  {selectedTargetId === l.id && <Check size={9} className="text-primary-foreground" />}
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground shrink-0 uppercase">{l.id}</span>
                                <span className="text-xs truncate">{l.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Student picker */}
                    <div onBlur={() => setTimeout(() => setShowStudentPicker(false), 200)} tabIndex={-1}>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Student (optional)</label>
                      <button onClick={() => setShowStudentPicker(p => !p)}
                        className="w-full flex items-center justify-between px-3 py-2 h-9 rounded-md bg-background border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors duration-150">
                        <span>{selectedTargetStudent ? (data.students.find(s => s.id === selectedTargetStudent)?.name ?? 'Unknown') : 'Any student'}</span>
                        {showStudentPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {showStudentPicker && (
                        <div className="mt-1.5 rounded-md border border-border bg-muted/30">
                          <input
                            type="text"
                            placeholder="Search students..."
                            value={studentSearchInput}
                            onChange={(e) => setStudentSearchInput(e.target.value)}
                            className="w-full px-2.5 py-2 text-xs bg-background border-b border-border rounded-t-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <div className="space-y-1 max-h-44 overflow-y-auto p-2">
                            <button onClick={() => { setSelectedTargetStudent(''); setShowStudentPicker(false); setStudentSearchInput('') }}
                              className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors duration-150',
                                !selectedTargetStudent ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground')}>
                              <div className={cn('w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                                !selectedTargetStudent ? 'bg-primary border-primary' : 'border-border')}>
                                {!selectedTargetStudent && <Check size={9} className="text-primary-foreground" />}
                              </div>
                              <span className="text-xs font-medium">Any student</span>
                            </button>
                            {data.students.filter(s => s.name.toLowerCase().includes(studentSearchInput.toLowerCase()) || s.studentId.toLowerCase().includes(studentSearchInput.toLowerCase())).map(s => (
                              <button key={s.id} onClick={() => { setSelectedTargetStudent(s.id); setShowStudentPicker(false); setStudentSearchInput('') }}
                                className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors duration-150',
                                  selectedTargetStudent === s.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground')}>
                                <div className={cn('w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                                  selectedTargetStudent === s.id ? 'bg-primary border-primary' : 'border-border')}>
                                  {selectedTargetStudent === s.id && <Check size={9} className="text-primary-foreground" />}
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground shrink-0">ID {s.studentId}</span>
                                <span className="text-xs truncate">{s.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              {errorVisible && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-xs font-medium">
                  <AlertCircle size={14} /> {errorVisible}
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-border">
                <Button onClick={handleCreateCode}
                  disabled={!newCode.trim() || (codeType === 'subject' && selectedWeeks.length === 0) || ((codeType === 'lesson' || codeType === 'quiz') && !selectedTargetId)}
                  className="flex-1">
                  Generate access code
                </Button>
                <Button variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </Drawer>
        )}
      </AnimatePresence>

      {/* ── Expiration Date Picker Modal ── */}
      <AnimatePresence>
        {expirationModal?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setExpirationModal(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              aria-label="Close modal"
            />
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative bg-card border border-border rounded-xl w-full max-w-sm p-6 shadow-popover z-10 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-foreground">Set expiration date</h3>
              <p className="text-sm text-muted-foreground">
                When should this retake code expire?
              </p>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  Expiration date
                </label>
                <input
                  type="date"
                  value={expirationModal.selectedDate}
                  onChange={e => setExpirationModal({ ...expirationModal, selectedDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="flex gap-3 pt-2 border-t border-border">
                <Button
                  onClick={handleConfirmRetakeExpiration}
                  className="flex-1"
                >
                  Confirm & create code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setExpirationModal(null); setPendingRetakeCodeData(null) }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
