import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Copy, Check, Info, GraduationCap, AlertCircle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/utils'
import { pageVariants, SUBJECT_STYLES } from '../../lib/variants'
import { getAllUnlockCodes, createUnlockCode, deleteUnlockCode, type UnlockCodeData } from '../../lib/unlockCodeManager'
import { useStorageData } from '../../hooks/useStorageData'
import { useNotificationStore } from '../../store/useNotificationStore'
import type { SubjectKey } from '../../types'
import { SUBJECTS } from '../../data/subjects'
import { LESSONS } from '../../data/lessons'

/** Returns a Tailwind text-size class that keeps the code readable regardless of length. */
function codeTextClass(code: string): string {
  const len = code.length
  if (len <= 10) return 'text-2xl'
  if (len <= 14) return 'text-xl'
  if (len <= 18) return 'text-lg'
  if (len <= 24) return 'text-base'
  return 'text-sm'
}

// Derive weeks by subject from LESSONS
const WEEKS_BY_SUBJECT: Record<SubjectKey, { id: string; title: string; week: number }[]> = {
  chemistry: LESSONS.filter(l => l.subject === 'chemistry' && l.week != null).map(l => ({ id: l.id, title: l.title, week: l.week! })),
  biology:   LESSONS.filter(l => l.subject === 'biology' && l.week != null).map(l => ({ id: l.id, title: l.title, week: l.week! })),
}

export function UnlockCodeManager() {
  const { data } = useStorageData(true)
  const { showConfirmModal } = useNotificationStore()
  const [codes, setCodes] = useState<UnlockCodeData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form State
  const [newCode, setNewCode] = useState('')
  const [codeType, setCodeType] = useState<'subject' | 'quiz'>('subject')
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>('chemistry')
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([])
  const [selectedTargetId, setSelectedTargetId] = useState<string>(LESSONS[0]?.id || '')
  const [selectedTargetStudent, setSelectedTargetStudent] = useState<string>('')
  const [showWeekPicker, setShowWeekPicker] = useState(false)
  const [showQuizPicker, setShowQuizPicker] = useState(false)
  const [showStudentPicker, setShowStudentPicker] = useState(false)

  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [errorVisible, setErrorVisible] = useState<string | null>(null)

  useEffect(() => { loadCodes() }, [])

  // Reset week selection when subject changes
  useEffect(() => { setSelectedWeeks([]) }, [selectedSubject])

  const loadCodes = async () => {
    setLoading(true)
    const data = await getAllUnlockCodes()
    setCodes(data)
    setLoading(false)
  }

  // Get lesson IDs that are already used in existing codes
  const usedLessonIds = new Set(codes.flatMap(c => c.lessonIds || (c.targetId ? [c.targetId] : [])))

  const handleCreateCode = async () => {
    if (!newCode.trim()) return
    if (codeType === 'subject' && selectedWeeks.length === 0) {
      setErrorVisible('Please select at least one week to unlock.')
      return
    }
    if (codeType === 'quiz' && !selectedTargetId) return

    setErrorVisible(null)

    let config: { subjects?: SubjectKey[]; lessonIds?: string[]; targetId?: string; targetStudentId?: string }

    if (codeType === 'subject') {
      config = {
        subjects: [selectedSubject],
        lessonIds: selectedWeeks,
      }
    } else {
      config = {
        targetId: selectedTargetId,
        targetStudentId: selectedTargetStudent || undefined,
      }
    }

    const result = await createUnlockCode(newCode.trim().toUpperCase(), codeType, config)
    if (result.success) {
      setNewCode('')
      setSelectedWeeks([])
      setSelectedTargetStudent('')
      setShowForm(false)
      await loadCodes()
    } else {
      setErrorVisible(result.error || 'Failed to generate code.')
    }
  }

  const handleDeleteCode = (code: string) => {
    showConfirmModal(
      'Delete Code',
      `Are you sure you want to delete "${code}"? This cannot be undone.`,
      async () => {
        const success = await deleteUnlockCode(code)
        if (success) await loadCodes()
      }
    )
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const toggleWeek = (lessonId: string) => {
    setSelectedWeeks(prev =>
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    )
  }

  const availableWeeks = WEEKS_BY_SUBJECT[selectedSubject].filter(w => !usedLessonIds.has(w.id))

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            🔑 Access Codes
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{codes.length} active codes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-foreground text-background text-sm font-bold hover:brightness-110 transition-all shadow-lg"
        >
          <Plus size={16} /> Generate New Code
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-[2rem] border border-border p-8 mb-8 space-y-6 shadow-xl">
          {/* Code Type Toggle */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Code Type</label>
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              {([
                { id: 'subject', label: 'Lesson Unlock', icon: BookOpen },
                { id: 'quiz',    label: 'Quiz Retake',   icon: GraduationCap },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCodeType(t.id)}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2',
                    codeType === t.id
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50'
                  )}
                >
                  <t.icon size={20} />
                  <span className="text-[10px] font-bold uppercase">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Code string */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Access Code</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder={codeType === 'subject' ? 'e.g. Q1W2-UNLOCK' : 'e.g. RETAKE-QUIZ1'}
                  className="w-full px-5 py-4 rounded-2xl bg-muted/50 border border-border text-lg font-mono font-bold tracking-widest text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-blue-600/80 leading-relaxed font-medium">
                  {codeType === 'subject'
                    ? 'Unlocks the selected weeks (AR + Study Hub) for any student who enters this code.'
                    : 'Allows a specific student to retake the final quiz for a lesson.'}
                </p>
              </div>
            </div>

            {/* Right: Subject + Week picker OR Quiz picker */}
            <div className="space-y-4">
              {codeType === 'subject' ? (
                <>
                  {/* Subject selector */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Subject (Quarter)</label>
                    <div className="flex gap-2">
                      {SUBJECTS.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSubject(s.id)}
                          className={cn(
                            'flex-1 py-3 rounded-2xl text-xs font-bold border-2 transition-all',
                            selectedSubject === s.id
                              ? SUBJECT_STYLES[s.id as SubjectKey].badge + ' border-current'
                              : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted'
                          )}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Week picker */}
                  <div>
                    <button
                      onClick={() => setShowWeekPicker(p => !p)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-muted/50 border border-border text-sm font-bold text-foreground hover:bg-muted transition-all"
                    >
                      <span>
                        {selectedWeeks.length === 0
                          ? 'Select weeks to unlock…'
                          : `${selectedWeeks.length} week${selectedWeeks.length > 1 ? 's' : ''} selected`}
                      </span>
                      {showWeekPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showWeekPicker && (
                      <div className="mt-2 p-3 rounded-2xl border border-border bg-muted/30 space-y-1.5 max-h-52 overflow-y-auto">
                        {availableWeeks.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-2">All weeks already have active codes.</p>
                        ) : (
                          availableWeeks.map(w => (
                            <button
                              key={w.id}
                              onClick={() => toggleWeek(w.id)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm',
                                selectedWeeks.includes(w.id)
                                  ? 'bg-primary/10 text-primary border border-primary/20'
                                  : 'hover:bg-muted text-foreground'
                              )}
                            >
                              <div className={cn(
                                'w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0',
                                selectedWeeks.includes(w.id) ? 'bg-primary border-primary' : 'border-border'
                              )}>
                                {selectedWeeks.includes(w.id) && <Check size={10} className="text-primary-foreground" />}
                              </div>
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Week {w.week}</span>
                                <p className="text-xs font-semibold leading-tight">{w.title}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Target Quiz Picker */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Target Quiz</label>
                    <button
                      onClick={() => setShowQuizPicker(p => !p)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-muted/50 border border-border text-sm font-bold text-foreground hover:bg-muted transition-all"
                    >
                      <span>
                        {selectedTargetId ? LESSONS.find(l => l.id === selectedTargetId)?.title : 'Select quiz…'}
                      </span>
                      {showQuizPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showQuizPicker && (
                      <div className="mt-2 p-3 rounded-2xl border border-border bg-muted/30 space-y-1.5 max-h-52 overflow-y-auto">
                        {LESSONS.map(l => (
                          <button
                            key={l.id}
                            onClick={() => {
                              setSelectedTargetId(l.id)
                              setShowQuizPicker(false)
                            }}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm',
                              selectedTargetId === l.id
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'hover:bg-muted text-foreground'
                            )}
                          >
                            <div className={cn(
                              'w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0',
                              selectedTargetId === l.id ? 'bg-primary border-primary' : 'border-border'
                            )}>
                              {selectedTargetId === l.id && <Check size={10} className="text-primary-foreground" />}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{l.id.toUpperCase()}</span>
                              <p className="text-xs font-semibold leading-tight">{l.title}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Target Student Picker (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Target Student (Optional)</label>
                    <button
                      onClick={() => setShowStudentPicker(p => !p)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-muted/50 border border-border text-sm font-bold text-foreground hover:bg-muted transition-all"
                    >
                      <span>
                        {selectedTargetStudent
                          ? `${data.students.find(s => s.id === selectedTargetStudent)?.name || 'Unknown'}`
                          : 'All students (leave blank)'}
                      </span>
                      {showStudentPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showStudentPicker && (
                      <div className="mt-2 p-3 rounded-2xl border border-border bg-muted/30 space-y-1.5 max-h-52 overflow-y-auto">
                        <button
                          onClick={() => {
                            setSelectedTargetStudent('')
                            setShowStudentPicker(false)
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm',
                            selectedTargetStudent === ''
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'hover:bg-muted text-foreground'
                          )}
                        >
                          <div className={cn(
                            'w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0',
                            selectedTargetStudent === '' ? 'bg-primary border-primary' : 'border-border'
                          )}>
                            {selectedTargetStudent === '' && <Check size={10} className="text-primary-foreground" />}
                          </div>
                          <span className="text-xs font-semibold">All Students</span>
                        </button>
                        {data.students.map(s => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedTargetStudent(s.id)
                              setShowStudentPicker(false)
                            }}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm',
                              selectedTargetStudent === s.id
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'hover:bg-muted text-foreground'
                            )}
                          >
                            <div className={cn(
                              'w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0',
                              selectedTargetStudent === s.id ? 'bg-primary border-primary' : 'border-border'
                            )}>
                              {selectedTargetStudent === s.id && <Check size={10} className="text-primary-foreground" />}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ID {s.studentId}</span>
                              <p className="text-xs font-semibold leading-tight">{s.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {errorVisible && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-bold">
              <AlertCircle size={14} /> {errorVisible}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-border/50">
            <button
              onClick={handleCreateCode}
              disabled={!newCode.trim() || (codeType === 'subject' && selectedWeeks.length === 0)}
              className="flex-1 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Generate Access Code
            </button>
            <button
              onClick={() => { setShowForm(false); setErrorVisible(null) }}
              className="px-8 py-4 rounded-2xl bg-muted/50 border border-border font-bold text-muted-foreground hover:text-foreground transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 opacity-50">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-3xl animate-pulse" />)}
        </div>
      ) : !showForm && codes.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-[3rem] border border-dashed border-border">
          <div className="w-20 h-20 bg-background rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">🔑</div>
          <h3 className="text-xl font-bold mb-2">No active codes</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8">
            Create codes to unlock specific weeks for students or give quiz retakes.
          </p>
          <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-foreground text-background rounded-xl font-bold text-sm">
            Generate First Code
          </button>
        </div>
      ) : !showForm && codes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {codes.map((codeData) => {
            const lesson = codeData.targetId ? LESSONS.find(l => l.id === codeData.targetId) : null
            const weekLessons = codeData.lessonIds?.map(id => LESSONS.find(l => l.id === id)).filter(Boolean) || []

            return (
              <div key={codeData.code} className="group relative bg-card rounded-[2rem] border border-border p-6 hover:shadow-xl hover:shadow-primary/5 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <span className={cn(
                      'px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider',
                      codeData.type === 'subject' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                      'bg-green-500/10 text-green-600 border border-green-500/20'
                    )}>
                      {codeData.type === 'subject' ? 'Lesson Unlock' : 'Quiz Retake'}
                    </span>
                    <p className={cn('font-black font-mono tracking-tighter text-foreground break-all leading-tight', codeTextClass(codeData.code))}>{codeData.code}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopyCode(codeData.code)}
                      className="p-2.5 bg-background border border-border rounded-xl text-muted-foreground hover:text-primary transition-colors"
                    >
                      {copiedCode === codeData.code ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => handleDeleteCode(codeData.code)}
                      className="p-2.5 bg-background border border-border rounded-xl text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-border/40">
                  {codeData.subjects && (
                    <div className="flex flex-wrap gap-1">
                      {codeData.subjects.map(s => (
                        <span key={s} className={cn('px-2 py-0.5 rounded-md border text-[10px] font-bold capitalize', SUBJECT_STYLES[s as SubjectKey].badge)}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {weekLessons.length > 0 && (
                    <div className="space-y-1">
                      {weekLessons.map(l => l && (
                        <p key={l.id} className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                          <BookOpen size={10} className="text-primary" />
                          <span className="font-bold text-foreground">W{l.week}</span> {l.title}
                        </p>
                      ))}
                    </div>
                  )}
                  {lesson && (
                    <p className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                      <GraduationCap size={12} className="text-primary" /> {lesson.title}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 font-medium">Created {new Date(codeData.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </motion.div>
  )
}
