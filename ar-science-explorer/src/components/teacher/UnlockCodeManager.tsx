import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Copy, Check, GraduationCap, AlertCircle,
  BookOpen, ChevronDown, ChevronUp, Search, X, RefreshCw,
  KeyRound, Users, Clock, CheckCircle2, XCircle,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { pageVariants, SUBJECT_STYLES } from '../../lib/variants'
import { getAllUnlockCodes, createUnlockCode, deleteUnlockCode, type UnlockCodeData } from '../../lib/unlockCodeManager'
import { storage } from '../../lib/storage'
import { useStorageData } from '../../hooks/useStorageData'
import { useNotificationStore } from '../../store/useNotificationStore'
import type { QuizUnlockCode, SubjectKey } from '../../types'
import { SUBJECTS } from '../../data/subjects'
import { LESSONS } from '../../data/lessons'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'

const WEEKS_BY_SUBJECT: Record<SubjectKey, { id: string; title: string; week: number }[]> = {
  chemistry: LESSONS.filter(l => l.subject === 'chemistry' && l.week != null).map(l => ({ id: l.id, title: l.title, week: l.week! })),
  biology:   LESSONS.filter(l => l.subject === 'biology'   && l.week != null).map(l => ({ id: l.id, title: l.title, week: l.week! })),
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
  usedByStudentIds: string[]        // lesson codes: who applied it
  // raw refs for delete
  _lessonCode?:  UnlockCodeData
  _retakeCode?:  QuizUnlockCode
}

export function UnlockCodeManager() {
  const { data } = useStorageData(true)
  const { showConfirmModal } = useNotificationStore()
  const [codes, setCodes]           = useState<UnlockCodeData[]>([])
  const [retakeCodes, setRetakeCodes] = useState<QuizUnlockCode[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)

  // Filters
  const [filterType,   setFilterType]   = useState<'all' | 'lesson' | 'retake'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'used'>('all')
  const [searchQuery,  setSearchQuery]  = useState('')

  // Form state
  const [newCode,               setNewCode]               = useState('')
  const [codeType,              setCodeType]              = useState<'subject' | 'quiz'>('subject')
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

  useEffect(() => { loadCodes() }, [])
  useEffect(() => { setSelectedWeeks([]) }, [selectedSubject])

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
    if (codeType === 'quiz' && !selectedTargetId) return
    setErrorVisible(null)

    const config = codeType === 'subject'
      ? { subjects: [selectedSubject], lessonIds: selectedWeeks }
      : { targetId: selectedTargetId, ...(selectedTargetStudent ? { targetStudentId: selectedTargetStudent } : {}) }

    const result = await createUnlockCode(newCode.trim().toUpperCase(), codeType, config)
    if (result.success) {
      setNewCode(''); setSelectedWeeks([]); setSelectedTargetStudent('')
      setShowForm(false); await loadCodes()
    } else {
      setErrorVisible(result.error || 'Failed to generate code.')
    }
  }

  const handleDelete = (row: CodeRow) => {
    showConfirmModal('Delete Code', `Delete "${row.code}"? This cannot be undone.`, async () => {
      if (row._retakeCode) await storage.deleteQuizRetakeCode(row._retakeCode.id)
      else if (row._lessonCode) await deleteUnlockCode(row._lessonCode.code)
      await loadCodes()
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

  // ── Build unified rows ────────────────────────────────────────────────────
  const allRows = useMemo<CodeRow[]>(() => {
    const rows: CodeRow[] = []

    // Lesson unlock codes
    codes.filter(c => c.type !== 'quiz').forEach(c => {
      const weekTitles = (c.lessonIds ?? [])
        .map(id => { const l = LESSONS.find(x => x.id === id); return l ? `W${l.week} ${l.title}` : id })
      rows.push({
        key: `lesson-${c.code}`, kind: 'lesson', code: c.code,
        target: weekTitles.length > 0 ? weekTitles.join(' · ') : (c.subjects?.join(', ') ?? 'All'),
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
      rows.push({
        key: `manual-${c.code}`, kind: 'retake-manual', code: c.code,
        target: lesson?.title ?? c.targetId ?? '—',
        studentName: student?.name ?? null,
        studentId:   student?.studentId ?? null,
        status: c.isUsed ? 'used' : 'active',
        createdAt: c.createdAt,
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
        usedByStudentIds: [],
        _retakeCode: rc,
      })
    })

    return rows
  }, [codes, retakeCodes, data.students])

  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      if (filterType === 'lesson'  && row.kind !== 'lesson') return false
      if (filterType === 'retake'  && row.kind === 'lesson') return false
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
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <KeyRound size={20} className="text-primary" /> Access Codes
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCount} total &middot; {activeRetake} retake{activeRetake !== 1 ? 's' : ''} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={loadCodes} title="Refresh" className="border border-border">
            <RefreshCw size={14} />
          </Button>
          <Button onClick={() => setShowForm(v => !v)} className="gap-2 rounded-xl btn-glow">
            <Plus size={14} /> Generate Code
          </Button>
        </div>
      </div>

      {/* ── Form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          >
            <Card className="rounded-2xl border-border p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">New Access Code</h3>
                <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setErrorVisible(null) }}>
                  <X size={16} />
                </Button>
              </div>

              {/* Type selector */}
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {([
                  { id: 'subject', label: 'Lesson Unlock', icon: BookOpen },
                  { id: 'quiz',    label: 'Quiz Retake',   icon: GraduationCap },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setCodeType(t.id)}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all',
                      codeType === t.id
                        ? 'bg-primary/5 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    )}>
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Code string */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Code String
                  </label>
                  <Input
                    value={newCode}
                    onChange={e => setNewCode(e.target.value.toUpperCase())}
                    placeholder={codeType === 'subject' ? 'e.g. Q1W2-UNLOCK' : 'e.g. RETAKE-001'}
                    className="font-mono tracking-widest"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {codeType === 'subject'
                      ? 'Unlocks selected weeks for any student who enters this.'
                      : 'Allows a student to retake the selected quiz once.'}
                  </p>
                </div>

                {/* Right panel */}
                <div className="space-y-3">
                  {codeType === 'subject' ? (
                    <>
                      {/* Subject */}
                      <div className="flex gap-2">
                        {SUBJECTS.map(s => (
                          <button key={s.id} onClick={() => setSelectedSubject(s.id as SubjectKey)}
                            className={cn(
                              'flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all',
                              selectedSubject === s.id
                                ? SUBJECT_STYLES[s.id as SubjectKey].badge + ' border-current'
                                : 'border-border text-muted-foreground hover:bg-muted'
                            )}>
                            {s.name}
                          </button>
                        ))}
                      </div>

                      {/* Week picker */}
                      <div>
                        <button onClick={() => setShowWeekPicker(p => !p)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm font-semibold text-foreground hover:bg-muted transition-all">
                          <span className="text-xs">
                            {selectedWeeks.length === 0 ? 'Select weeks…' : `${selectedWeeks.length} week${selectedWeeks.length > 1 ? 's' : ''} selected`}
                          </span>
                          {showWeekPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {showWeekPicker && (
                          <div className="mt-1.5 p-2 rounded-xl border border-border bg-muted/30 space-y-1 max-h-44 overflow-y-auto">
                            {availableWeeks.length === 0
                              ? <p className="text-xs text-muted-foreground text-center py-2">All weeks already have codes.</p>
                              : availableWeeks.map(w => (
                                <button key={w.id} onClick={() => toggleWeek(w.id)}
                                  className={cn(
                                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all',
                                    selectedWeeks.includes(w.id) ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                                  )}>
                                  <div className={cn('w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0',
                                    selectedWeeks.includes(w.id) ? 'bg-primary border-primary' : 'border-border')}>
                                    {selectedWeeks.includes(w.id) && <Check size={9} className="text-primary-foreground" />}
                                  </div>
                                  <span className="text-xs font-semibold">W{w.week}</span>
                                  <span className="text-xs truncate text-muted-foreground">{w.title}</span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Quiz picker */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Quiz</label>
                        <button onClick={() => setShowQuizPicker(p => !p)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-xs font-semibold text-foreground hover:bg-muted transition-all">
                          <span className="truncate">{selectedTargetId ? LESSONS.find(l => l.id === selectedTargetId)?.title : 'Select quiz…'}</span>
                          {showQuizPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {showQuizPicker && (
                          <div className="mt-1.5 p-2 rounded-xl border border-border bg-muted/30 space-y-1 max-h-44 overflow-y-auto">
                            {LESSONS.map(l => (
                              <button key={l.id} onClick={() => { setSelectedTargetId(l.id); setShowQuizPicker(false) }}
                                className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all',
                                  selectedTargetId === l.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground')}>
                                <div className={cn('w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0',
                                  selectedTargetId === l.id ? 'bg-primary border-primary' : 'border-border')}>
                                  {selectedTargetId === l.id && <Check size={9} className="text-primary-foreground" />}
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground shrink-0 uppercase">{l.id}</span>
                                <span className="text-xs truncate">{l.title}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Student picker */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Student (optional)</label>
                        <button onClick={() => setShowStudentPicker(p => !p)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-xs font-semibold text-foreground hover:bg-muted transition-all">
                          <span>{selectedTargetStudent ? (data.students.find(s => s.id === selectedTargetStudent)?.name ?? 'Unknown') : 'Any student'}</span>
                          {showStudentPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {showStudentPicker && (
                          <div className="mt-1.5 p-2 rounded-xl border border-border bg-muted/30 space-y-1 max-h-44 overflow-y-auto">
                            <button onClick={() => { setSelectedTargetStudent(''); setShowStudentPicker(false) }}
                              className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all',
                                !selectedTargetStudent ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground')}>
                              <div className={cn('w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0',
                                !selectedTargetStudent ? 'bg-primary border-primary' : 'border-border')}>
                                {!selectedTargetStudent && <Check size={9} className="text-primary-foreground" />}
                              </div>
                              <span className="text-xs font-semibold">Any student</span>
                            </button>
                            {data.students.map(s => (
                              <button key={s.id} onClick={() => { setSelectedTargetStudent(s.id); setShowStudentPicker(false) }}
                                className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all',
                                  selectedTargetStudent === s.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground')}>
                                <div className={cn('w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0',
                                  selectedTargetStudent === s.id ? 'bg-primary border-primary' : 'border-border')}>
                                  {selectedTargetStudent === s.id && <Check size={9} className="text-primary-foreground" />}
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground shrink-0">ID {s.studentId}</span>
                                <span className="text-xs truncate">{s.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {errorVisible && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-semibold">
                  <AlertCircle size={14} /> {errorVisible}
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-border">
                <Button onClick={handleCreateCode}
                  disabled={!newCode.trim() || (codeType === 'subject' && selectedWeeks.length === 0)}
                  className="flex-1 btn-glow rounded-xl">
                  Generate Access Code
                </Button>
                <Button variant="outline" onClick={() => { setShowForm(false); setErrorVisible(null) }} className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value) }}
            placeholder="Search code, quiz, student…"
            className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-muted text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 w-52" />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
          {([{ id: 'all', label: 'All' }, { id: 'lesson', label: 'Lesson Unlock' }, { id: 'retake', label: 'Quiz Retake' }] as const).map(f => (
            <button key={f.id} onClick={() => { setFilterType(f.id); setFilterStatus('all') }}
              className={cn('px-3 py-1 rounded-md text-[11px] font-semibold transition-colors',
                filterType === f.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
          {([{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'used', label: 'Used' }] as const).map(f => (
            <button key={f.id} onClick={() => setFilterStatus(f.id)}
              className={cn('px-3 py-1 rounded-md text-[11px] font-semibold transition-colors',
                filterStatus === f.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {f.label}
            </button>
          ))}
        </div>
        {(searchQuery || filterType !== 'all' || filterStatus !== 'all') && (
          <button onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterStatus('all') }}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted transition-colors">
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      {loading ? (
        <Card className="rounded-2xl border-border overflow-hidden">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0">
              <div className="w-20 h-4 bg-muted rounded animate-pulse" />
              <div className="w-32 h-4 bg-muted rounded animate-pulse" />
              <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </Card>
      ) : filteredRows.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border">
          <KeyRound size={32} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-semibold text-foreground">
            {totalCount === 0 ? 'No codes yet' : 'No matching codes'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount === 0
              ? 'Generate a code to unlock lessons or allow quiz retakes.'
              : 'Try adjusting your filters.'}
          </p>
          {totalCount === 0 && (
            <Button onClick={() => setShowForm(true)} className="mt-4 rounded-xl btn-glow">
              <Plus size={14} className="mr-1.5" /> Generate First Code
            </Button>
          )}
        </div>
      ) : (
        <Card className="rounded-2xl border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Code</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Target</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Created</th>
                  <th className="px-6 py-4" />
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
                      <tr key={row.key} className="hover:bg-muted/20 transition-colors group">
                        {/* Code */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-foreground tracking-widest">
                              {row.code}
                            </span>
                            <button
                              onClick={() => handleCopy(row.code)}
                              disabled={row.status !== 'active'}
                              className={cn(
                                'opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all',
                                isCopied
                                  ? 'opacity-100 bg-success/10 text-success'
                                  : 'bg-muted text-muted-foreground hover:text-primary disabled:opacity-30'
                              )}
                            >
                              {isCopied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                            </button>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide',
                            isLesson ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                          )}>
                            {isLesson ? <><BookOpen size={10} /> Lesson</> : <><GraduationCap size={10} /> Retake</>}
                          </span>
                        </td>

                        {/* Target */}
                        <td className="px-6 py-4 max-w-[200px]">
                          <p className="text-xs font-semibold text-foreground truncate">{row.target}</p>
                        </td>

                        {/* Student */}
                        <td className="px-6 py-4">
                          {row.studentName ? (
                            <div>
                              <p className="text-xs font-semibold text-foreground">{row.studentName}</p>
                              <p className="text-[10px] text-muted-foreground">ID {row.studentId}</p>
                            </div>
                          ) : isLesson ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Users size={10} /> All students
                            </span>
                          ) : row.studentId ? (
                            <p className="text-xs text-muted-foreground">ID {row.studentId}</p>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Users size={10} /> Any student
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {row.status === 'active' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success">
                              <CheckCircle2 size={10} /> Active
                            </span>
                          )}
                          {row.status === 'used' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                              <Check size={10} /> Used
                            </span>
                          )}
                          {row.status === 'expired' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive">
                              <XCircle size={10} /> Expired
                            </span>
                          )}
                          {!isLesson && row.status === 'active' && (
                            <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Clock size={9} /> 1-time use
                            </p>
                          )}
                          {isLesson && usageCount > 0 && (
                            <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Users size={9} /> {usageCount} used
                            </p>
                          )}
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4">
                          <span className="text-xs text-muted-foreground">
                            {new Date(row.createdAt).toLocaleDateString()}
                          </span>
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
                                  'text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all',
                                  isExpanded && 'text-primary bg-primary/10'
                                )}
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </Button>
                            )}
                            <Button variant="ghost" size="icon"
                              className="text-destructive/40 hover:text-destructive hover:bg-destructive/10"
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
                          <td colSpan={7} className="px-6 py-3">
                            <AnimatePresence>
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2"
                              >
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                  <Users size={10} /> Students who used this code
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
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground">
                                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary">
                                            {(student?.name ?? sid).charAt(0).toUpperCase()}
                                          </div>
                                          {student ? (
                                            <span>
                                              {student.name}
                                              <span className="ml-1 text-[10px] text-muted-foreground font-normal">
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
    </motion.div>
  )
}
