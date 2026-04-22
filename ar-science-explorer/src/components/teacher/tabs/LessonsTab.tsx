import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Edit3, Trash2, X, ChevronLeft, ChevronRight, FileText, Upload, Search } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { storage } from '../../../lib/storage'
import { useStorageData } from '../../../hooks/useStorageData'
import { LESSONS } from '../../../data/lessons'
import { QUIZ_QUESTIONS } from '../../../data/quiz'
import { cn } from '../../../lib/utils'
import { pageVariants, SUBJECT_STYLES } from '../../../lib/variants'
import type { TeacherLesson, Lesson, SubjectKey, TeacherQuiz } from '../../../types'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { TableSkeleton } from '../../ui/skeleton'
import { useNotificationStore } from '../../../store/useNotificationStore'

const SUBJECT_OPTIONS: { value: SubjectKey; label: string }[] = [
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology',   label: 'Biology' },
  { value: 'physics',   label: 'Physics' },
]

const LessonSchema = z.object({
  title:                  z.string().min(1, 'Lesson title is required'),
  subject:                z.enum(['biology', 'chemistry', 'physics']),
  summary:                z.string().min(10, 'Summary must be at least 10 characters'),
  content:                z.string().min(20, 'Content must be at least 20 characters'),
  linkedQuizId:           z.string().optional(),
  labExperimentId:        z.string().optional(),
  week:                   z.coerce.number().min(1, 'Week must be 1–10').max(10, 'Week must be 1–10'),
  steps:                  z.string().min(5, 'At least one step is required'),
  arModelIndex:           z.coerce.number().min(0, 'Must be 0–8').max(8, 'Must be 0–8'),
  detectionMode:          z.enum(['marker', 'surface']),
  anchorHint:             z.string().optional(),
  arTitle:                z.string().optional(),
  arSubtitle:             z.string().optional(),
  arDescription:          z.string().optional(),
  arKeyIdeas:             z.string().optional(),
  arSteps:                z.string().optional(),
  // Curriculum (Phase 2 – Study Hub)
  standards:              z.string().optional(),
  performanceStandards:   z.string().optional(),
  contentDetails:         z.string().optional(),
  learningCompetencies:   z.string().optional(),
  objectives:             z.string().optional(),
  integrationQualities:   z.string().optional(),
  integrationDescription: z.string().optional(),
})

type LessonFormValues = z.infer<typeof LessonSchema>

const PDF_LS_PREFIX = 'lesson-pdf:'

function uid() { return Math.random().toString(36).slice(2, 9) }

const ITEMS_PER_PAGE = 10

// Build combined quiz list: teacher-created + built-in templates
function buildQuizList(teacherQuizzes: TeacherQuiz[]): { builtin: TeacherQuiz[]; created: TeacherQuiz[] } {
  const created = [...teacherQuizzes]
  const builtin: TeacherQuiz[] = []

  for (const lesson of LESSONS) {
    const builtInId = `builtin-${lesson.id}`
    if (created.some(q => q.id === builtInId)) continue
    const lessonQuestions = QUIZ_QUESTIONS.filter(q => q.lessonId === lesson.id)
    if (lessonQuestions.length === 0) continue
    builtin.push({
      id: builtInId,
      title: lesson.title,
      subject: lesson.subject,
      topicId: lesson.id,
      questions: lessonQuestions,
      createdAt: new Date(0).toISOString(),
    })
  }

  return { builtin, created }
}

function isTeacherLesson(lesson: TeacherLesson | Lesson): lesson is TeacherLesson {
  return 'createdAt' in lesson && 'content' in lesson
}

function getQuarterFromSubject(subject: SubjectKey): number {
  return subject === 'chemistry' ? 1 : subject === 'biology' ? 2 : 3
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
  const showSkeleton = false
  const [currentPage, setCurrentPage]   = useState(1)
  const [showForm, setShowForm]         = useState(false)
  const [editTarget, setEditTarget]     = useState<(TeacherLesson | Lesson) | null>(null)
  const [viewTarget, setViewTarget]     = useState<(TeacherLesson | Lesson) | null>(null)
  const [pdfDataUrl, setPdfDataUrl]         = useState<string | null>(null)
  const [pdfFileName, setPdfFileName]       = useState<string | null>(null)
  const [markerImageName, setMarkerImageName] = useState<string | null>(null)
  const [filterSubject, setFilterSubject]   = useState<'all' | 'chemistry' | 'biology' | 'physics' >('all')
  const [searchQuery, setSearchQuery]       = useState('')
  const [activeTab, setActiveTab]       = useState<'basic' | 'curriculum' | 'ar'>('basic')
  const [quizSearchOpen, setQuizSearchOpen] = useState(false)
  const [quizSearchInput, setQuizSearchInput] = useState('')
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const markerInputRef = useRef<HTMLInputElement>(null)
  const showConfirmModal = useNotificationStore(s => s.showConfirmModal)

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<LessonFormValues>({
    resolver: zodResolver(LessonSchema),
    defaultValues: {
      title: '', subject: 'chemistry', summary: '', content: '',
      linkedQuizId: '', labExperimentId: '',
      week: 1, steps: '',
      arModelIndex: 0, detectionMode: 'marker', anchorHint: '', arTitle: '', arSubtitle: '', arDescription: '', arKeyIdeas: '', arSteps: '',
      standards: '', performanceStandards: '', contentDetails: '',
      learningCompetencies: '', objectives: '',
      integrationQualities: '', integrationDescription: '',
    },
  })

  // Compute merged lessons (teacher + built-in) without storing in state
  const lessons = useMemo(() => {
    const merged: (TeacherLesson | Lesson)[] = [...data.lessons]
    for (const builtInLesson of LESSONS) {
      if (!data.lessons.some(l => l.id === builtInLesson.id)) {
        merged.push(builtInLesson)
      }
    }
    return merged
  }, [data.lessons])

  // Compute combined quiz list (teacher + built-in templates)
  const quizzesByType = useMemo(() => buildQuizList(data.quizzes), [data.quizzes])

  // Create flat quiz list for quick lookup by ID
  const allQuizzesFlat = useMemo(() =>
    [...quizzesByType.builtin, ...quizzesByType.created],
    [quizzesByType]
  )

  // Reset pagination when lessons change
  useEffect(() => {
    setCurrentPage(1)
  }, [data.lessons])

  const filteredLessons = lessons.filter(l => {
    if (filterSubject !== 'all' && l.subject !== filterSubject) return false
    if (searchQuery && !l.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const totalPages = Math.ceil(filteredLessons.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedLessons = filteredLessons.slice(startIndex, endIndex)

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1))
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1))

  const openNew = () => {
    reset({
      title: '', subject: 'chemistry', summary: '', content: '',
      linkedQuizId: '', labExperimentId: '',
      week: 1, steps: '',
      arModelIndex: 0, detectionMode: 'marker', anchorHint: '', arTitle: '', arSubtitle: '', arDescription: '', arKeyIdeas: '', arSteps: '',
      standards: '', performanceStandards: '', contentDetails: '',
      learningCompetencies: '', objectives: '',
      integrationQualities: '', integrationDescription: '',
    })
    setPdfDataUrl(null)
    setPdfFileName(null)
    setEditTarget(null)
    setShowForm(true)
  }

  const openEdit = (l: TeacherLesson | Lesson) => {
    const tl = isTeacherLesson(l) ? l : null
    reset({
      title:                  l.title,
      subject:                l.subject,
      summary:                l.summary ?? '',
      content:                tl?.content ?? '',
      linkedQuizId:           tl?.linkedQuizId ?? '',
      labExperimentId:        l.labExperimentId ?? '',
      week:                   l.week ?? 1,
      steps:                  (l.steps ?? []).join('\n'),
      arModelIndex:           l.arPayload?.modelIndex ?? 0,
      detectionMode:          l.arPayload?.detectionMode ?? 'marker',
      anchorHint:             l.arPayload?.anchorHint ?? '',
      arTitle:                l.arPayload?.title ?? '',
      arSubtitle:             l.arPayload?.subtitle ?? '',
      arDescription:          l.arPayload?.description ?? '',
      arKeyIdeas:             (l.arPayload?.keyIdeas ?? []).join('\n'),
      arSteps:                (l.arPayload?.lessonSteps ?? []).join('\n'),
      standards:              l.curriculum?.standards ?? '',
      performanceStandards:   l.curriculum?.performanceStandards ?? '',
      contentDetails:         l.curriculum?.contentDetails ?? '',
      learningCompetencies:   (l.curriculum?.learningCompetencies ?? []).join('\n'),
      objectives:             (l.curriculum?.objectives ?? []).join('\n'),
      integrationQualities:   (l.curriculum?.integration?.qualities ?? []).join(', '),
      integrationDescription: l.curriculum?.integration?.description ?? '',
    })
    // Resolve existing PDF
    const existingPdfUrl = tl?.pdfUrl ?? (l as Lesson).pdfUrl ?? null
    if (existingPdfUrl?.startsWith('local:')) {
      const stored = localStorage.getItem(`${PDF_LS_PREFIX}${existingPdfUrl.slice(6)}`) ?? null
      setPdfDataUrl(stored)
      setPdfFileName(existingPdfUrl.slice(6))
    } else if (existingPdfUrl) {
      setPdfDataUrl(existingPdfUrl)
      setPdfFileName('Current PDF')
    } else {
      setPdfDataUrl(null)
      setPdfFileName(null)
    }
    setEditTarget(l)
    setShowForm(true)
  }

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPdfDataUrl(reader.result as string)
      setPdfFileName(file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleMarkerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMarkerImageName(file.name)
  }

  const handleSave = handleSubmit(async (formData) => {
    const lessonId = editTarget?.id ?? uid()
    const createdAt = editTarget && isTeacherLesson(editTarget)
      ? editTarget.createdAt
      : new Date().toISOString()

    // Check for duplicate lessons in same week for same subject
    const duplicateLesson = lessons.find(l =>
      l.id !== lessonId &&
      l.subject === formData.subject &&
      l.week === formData.week
    )
    if (duplicateLesson) {
      showConfirmModal(
        'Duplicate Week',
        `A lesson already exists for ${formData.subject} Week ${formData.week}: "${duplicateLesson.title}". Continue anyway?`,
        () => handleSaveAfterValidation(lessonId, createdAt as string, formData, pdfDataUrl ?? null)
      )
      return
    }

    await handleSaveAfterValidation(lessonId, createdAt as string, formData, pdfDataUrl ?? null)
  });

  const handleSaveAfterValidation = async (lessonId: string, createdAt: string, formData: LessonFormValues, pdfDataUrl: string | null | undefined) => {

    // Upload PDF to Firebase Storage
    let pdfUrl: string | undefined
    if (pdfDataUrl && pdfDataUrl.startsWith('data:')) {
      // Convert data URL to Blob
      const response = await fetch(pdfDataUrl)
      const blob = await response.blob()
      const file = new File([blob], 'lesson.pdf', { type: 'application/pdf' })
      const uploadedUrl = await storage.uploadLessonPdf(lessonId, file)
      if (uploadedUrl) pdfUrl = uploadedUrl
    } else if (pdfDataUrl && !pdfDataUrl.startsWith('local:')) {
      // Already a Firebase URL from existing lesson
      pdfUrl = pdfDataUrl
    }

    // Auto-calculate quarter from subject
    const quarter = getQuarterFromSubject(formData.subject)

    // Auto-generate marker image path (teacher uploads to CDN separately or uses this path)
    const markerImagePath = `/markers/Q${quarter}W${formData.week}.jpg`

    await storage.saveLesson({
      id:              lessonId,
      title:           formData.title.trim(),
      subject:         formData.subject,
      content:         formData.content,
      summary:         formData.summary.trim(),
      createdAt:       createdAt ?? new Date().toISOString(),
      quarter:         quarter,
      week:            formData.week,
      steps:           formData.steps.split('\n').map(s => s.trim()).filter(Boolean),
      ...(formData.linkedQuizId    ? { linkedQuizId: formData.linkedQuizId }       : {}),
      ...(formData.labExperimentId ? { labExperimentId: formData.labExperimentId } : {}),
      ...(pdfUrl ? { pdfUrl } : {}),
      arPayload: {
        modelIndex:    formData.arModelIndex,
        detectionMode: formData.detectionMode,
        anchorHint:    (formData.anchorHint ?? '').trim() || `Scan a ${formData.subject} marker.`,
        title:         (formData.arTitle ?? '').trim() || undefined,
        subtitle:      (formData.arSubtitle ?? '').trim() || undefined,
        description:   (formData.arDescription ?? '').trim() || undefined,
        keyIdeas:      (formData.arKeyIdeas ?? '').split('\n').map(s => s.trim()).filter(Boolean),
        markerImage:   markerImagePath,
        lessonSteps:   (formData.arSteps ?? '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 6),
      },
      curriculum: {
        standards:            (formData.standards ?? '').trim() || undefined,
        performanceStandards: (formData.performanceStandards ?? '').trim() || undefined,
        contentDetails:       (formData.contentDetails ?? '').trim() || undefined,
        learningCompetencies: (formData.learningCompetencies ?? '').split('\n').map(s => s.trim()).filter(Boolean),
        objectives:           (formData.objectives ?? '').split('\n').map(s => s.trim()).filter(Boolean),
        ...(formData.integrationQualities || formData.integrationDescription ? {
          integration: {
            qualities:   (formData.integrationQualities ?? '').split(',').map(s => s.trim()).filter(Boolean),
            description: (formData.integrationDescription ?? '').trim(),
          },
        } : {}),
      },
    })
    await storage.getAll()
    // Lessons list will auto-update via Firestore subscription in useStorageData
    setShowForm(false)
  };

  if (showSkeleton) {
    return <TableSkeleton columns={['Lesson', 'Linked Quiz', 'Created', '']} rows={8} />
  }

  if (showForm) return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground">{editTarget ? 'Edit Lesson' : 'New Lesson'}</h3>
        <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} aria-label="Close">
          <X size={16} />
        </Button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {(['basic', 'curriculum', 'ar'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-3 text-sm font-semibold border-b-2 transition-colors capitalize whitespace-nowrap',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="w-full">
        {/* ── BASIC INFO TAB ── */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: Main fields */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Title</label>
                  <input {...register('title')} placeholder="Lesson title…"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Summary</label>
                  <input {...register('summary')} placeholder="Short lesson summary…"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Lesson Content</label>
                  <textarea {...register('content')} placeholder="Write your lesson content…" rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                </div>
              </div>

              {/* Right column: Schedule + Quick Setup */}
              <div className="space-y-4">
                <Card className="p-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Subject</p>
                  <Controller control={control} name="subject" render={({ field }) => (
                    <div className="space-y-2">
                      {SUBJECT_OPTIONS.map(o => (
                        <button key={o.value} type="button" onClick={() => field.onChange(o.value)}
                          className={cn('w-full px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left',
                            field.value === o.value ? SUBJECT_STYLES[o.value].badge + ' shadow-sm' : 'border-border text-muted-foreground hover:border-border/70')}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  )} />
                </Card>

                <Card className="p-4 space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Week</p>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase">Which Week? (1-10)</label>
                    <input type="number" {...register('week')}
                      className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                    {errors.week && <p className="text-xs text-destructive mt-1">{errors.week.message}</p>}
                  </div>
                </Card>

                <Card className="p-4 space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Linked Quiz</p>
                  <Controller
                    control={control}
                    name="linkedQuizId"
                    render={({ field }) => (
                      <div className="relative" onBlur={() => setTimeout(() => setQuizSearchOpen(false), 200)}>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase">Search & Select Quiz (Optional)</label>
                        <input
                          type="text"
                          placeholder="Type to search quizzes..."
                          value={quizSearchInput}
                          onChange={(e) => {
                            setQuizSearchInput(e.target.value)
                            setQuizSearchOpen(true)
                          }}
                          onFocus={() => setQuizSearchOpen(true)}
                          className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {quizSearchOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                field.onChange('')
                                setQuizSearchInput('')
                                setQuizSearchOpen(false)
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted/50 transition-colors border-b border-border/50"
                            >
                              — None —
                            </button>
                            {quizzesByType.builtin.filter(q => q.title.toLowerCase().includes(quizSearchInput.toLowerCase())).length > 0 && (
                              <>
                                <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase bg-muted/30 sticky top-0 border-b border-border/50">Built-in Templates</div>
                                {quizzesByType.builtin
                                  .filter(q => q.title.toLowerCase().includes(quizSearchInput.toLowerCase()))
                                  .map(q => (
                                    <button
                                      key={q.id}
                                      type="button"
                                      onClick={() => {
                                        field.onChange(q.id)
                                        setQuizSearchInput(q.title)
                                        setQuizSearchOpen(false)
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted/50 transition-colors truncate"
                                    >
                                      {q.title}
                                    </button>
                                  ))}
                              </>
                            )}
                            {quizzesByType.created.filter(q => q.title.toLowerCase().includes(quizSearchInput.toLowerCase())).length > 0 && (
                              <>
                                <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase bg-muted/30 sticky top-0 border-b border-border/50">Your Quizzes</div>
                                {quizzesByType.created
                                  .filter(q => q.title.toLowerCase().includes(quizSearchInput.toLowerCase()))
                                  .map(q => (
                                    <button
                                      key={q.id}
                                      type="button"
                                      onClick={() => {
                                        field.onChange(q.id)
                                        setQuizSearchInput(q.title)
                                        setQuizSearchOpen(false)
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-muted/50 transition-colors truncate"
                                    >
                                      {q.title}
                                    </button>
                                  ))}
                              </>
                            )}
                            {quizzesByType.builtin.filter(q => q.title.toLowerCase().includes(quizSearchInput.toLowerCase())).length === 0 &&
                             quizzesByType.created.filter(q => q.title.toLowerCase().includes(quizSearchInput.toLowerCase())).length === 0 && (
                              <div className="px-3 py-3 text-center text-xs text-muted-foreground">No quizzes found</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  />
                </Card>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Learning Steps <span className="normal-case font-normal text-[11px]">(one per line)</span>
              </label>
              <textarea {...register('steps')} placeholder={'Understand the concept\nExplore through AR\nPractice and review'} rows={3}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>
          </div>
        )}

        {/* ── CURRICULUM TAB ── */}
        {activeTab === 'curriculum' && (
          <div className="space-y-4">
            <p className="text-[11px] text-muted-foreground">This content is shown to students in the curriculum study phase.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Content Standards</label>
                <textarea {...register('standards')} placeholder="What learners should know…" rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Performance Standards</label>
                <textarea {...register('performanceStandards')} placeholder="What learners should do…" rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Content Details</label>
              <input {...register('contentDetails')} placeholder="Summary of what the content covers…"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Learning Competencies <span className="normal-case font-normal text-[11px]">(one per line)</span>
                </label>
                <textarea {...register('learningCompetencies')} placeholder={'Recognize models…\nDescribe particle model…'} rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Lesson Objectives <span className="normal-case font-normal text-[11px]">(one per line)</span>
                </label>
                <textarea {...register('objectives')} placeholder={'Describe and explain models…\nRecognize matter particles…'} rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Scientific Qualities <span className="normal-case font-normal text-[11px]">(comma-separated)</span>
                </label>
                <input {...register('integrationQualities')} placeholder="Critical Thinking, Perseverance"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Integration Description</label>
                <input {...register('integrationDescription')} placeholder="How these qualities apply…"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
          </div>
        )}

        {/* ── AR LAB TAB (includes PDF & Links) ── */}
        {activeTab === 'ar' && (
          <div className="space-y-6">
            {/* AR Content */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">AR Lab Configuration</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">AR Title</label>
                <input {...register('arTitle')} placeholder="e.g. Democritus Atom"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">AR Subtitle</label>
                <input {...register('arSubtitle')} placeholder="e.g. Ancient Greek Atomic Theory"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">AR Description</label>
              <textarea {...register('arDescription')} placeholder="Describe the AR model and its significance…" rows={2}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Key Ideas <span className="normal-case font-normal text-[11px]">(one per line)</span>
              </label>
              <textarea {...register('arKeyIdeas')} placeholder={'Concept 1\nConcept 2'} rows={2}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Marker Image (JPG)</label>
              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                {markerImageName && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <FileText size={16} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{markerImageName}</p>
                      <p className="text-[10px] text-muted-foreground">Ready to upload</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setMarkerImageName(null)}
                    >
                      <X size={13} />
                    </Button>
                  </div>
                )}
                <input
                  ref={markerInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg"
                  onChange={handleMarkerImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 border-dashed"
                  onClick={() => markerInputRef.current?.click()}
                >
                  <Upload size={14} />
                  {markerImageName ? 'Change Marker Image' : 'Upload Marker Image (JPG)'}
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Anchor Hint</label>
              <input {...register('anchorHint')} placeholder="e.g. Scan the Q1W1 worksheet marker."
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Model Index (0–8)</label>
                <input type="number" {...register('arModelIndex')}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                {errors.arModelIndex && <p className="text-xs text-destructive mt-1">{errors.arModelIndex.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Detection Mode</label>
                <Controller control={control} name="detectionMode" render={({ field }) => (
                  <select {...field} className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="marker">Marker</option>
                    <option value="surface">Surface</option>
                  </select>
                )} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Execution Steps <span className="normal-case font-normal text-[11px]">(one per line, max 6)</span>
              </label>
              <textarea {...register('arSteps')} placeholder={'Aim camera at marker\nScan AR target\nInspect 3D model'} rows={3}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>
            </div>
            </div>

            {/* PDF & Links Section */}
            <div className="border-t border-border pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PDF Module */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">PDF Module</p>
                <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
                  {pdfDataUrl && pdfFileName && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <FileText size={16} className="text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{pdfFileName}</p>
                        <p className="text-[10px] text-muted-foreground">Stored locally in this browser</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { setPdfDataUrl(null); setPdfFileName(null) }}
                      >
                        <X size={13} />
                      </Button>
                    </div>
                  )}
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-dashed"
                    onClick={() => pdfInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    {pdfDataUrl ? 'Swap PDF' : 'Upload PDF'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        <div className="mt-6">
          <Button type="submit" className="btn-glow w-full">
            Save Lesson
          </Button>
        </div>
      </form>
    </motion.div>
  )

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="w-full space-y-6">
        <div className="flex items-center justify-between mb-0">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookOpen size={20} className="text-subject-chemistry" /> Lessons
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredLessons.length} of {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openNew} className="gap-2 btn-glow">
          <Plus size={14} /> New Lesson
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            placeholder="Search lessons…"
            className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-muted text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 w-44"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border overflow-x-auto">
          {(['all', 'chemistry', 'biology', 'physics'] as const).map(s => (
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
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Lesson</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Linked Quiz</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Created</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedLessons.map((l) => {
                const isTeacher = isTeacherLesson(l)
                const linkedQuizId = (isTeacher ? l.linkedQuizId : null) || `builtin-${l.id}`
                const linkedQuizTitle = allQuizzesFlat.find(q => q.id === linkedQuizId)?.title ?? null
                const hasPdf = !!(isTeacher ? l.pdfUrl : (l as Lesson).pdfUrl)
                return (
                  <tr
                    key={l.id}
                    onClick={() => setViewTarget(l)}
                    className="hover:bg-muted/20 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[240px]">{l.title}</p>
                        {hasPdf && <FileText size={12} className="text-primary shrink-0" />}
                      </div>
                      <div className="mt-1"><SubjectBadge subject={l.subject} /></div>
                    </td>
                    <td className="px-6 py-4">
                      {linkedQuizTitle
                        ? <span className="text-xs font-semibold text-primary truncate max-w-[160px] block">{linkedQuizTitle}</span>
                        : <span className="text-xs text-muted-foreground/50">—</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-muted-foreground">
                        {isTeacher && l.createdAt ? format(parseISO(l.createdAt), 'MMM d, yyyy') : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Edit lesson" onClick={() => openEdit(l)}>
                          <Edit3 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete lesson"
                          className="text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => showConfirmModal(
                            'Delete Lesson',
                            `Delete "${l.title}"? This cannot be undone.`,
                            async () => {
                              await storage.deleteLesson(l.id)
                              // Clear local PDF if stored
                              localStorage.removeItem(`${PDF_LS_PREFIX}${l.id}`)
                              // Lessons list will auto-update via Firestore subscription
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
              {lessons.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                        <BookOpen size={20} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No lessons yet</p>
                      <p className="text-xs text-muted-foreground">Create lessons and link them to quizzes.</p>
                      <Button onClick={openNew} className="gap-2 btn-glow mt-1">
                        <Plus size={14} /> Create First Lesson
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
              Showing {startIndex + 1}–{Math.min(endIndex, filteredLessons.length)} of {filteredLessons.length} lessons
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePrevPage} disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"><ChevronLeft size={16} /></button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={cn('min-w-8 h-8 rounded-lg text-xs font-semibold transition-colors',
                      currentPage === page ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground')}>
                    {page}
                  </button>
                ))}
              </div>
              <button onClick={handleNextPage} disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {viewTarget && createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setViewTarget(null)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="relative bg-card border border-border rounded-3xl w-full max-w-lg max-h-[75vh] overflow-y-auto p-6 shadow-2xl z-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-foreground text-base">{viewTarget.title}</h3>
                  <div className="mt-1.5"><SubjectBadge subject={viewTarget.subject} /></div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setViewTarget(null)} aria-label="Close" className="shrink-0">
                  <X size={16} />
                </Button>
              </div>
              {isTeacherLesson(viewTarget) ? (
                <>
                  {viewTarget.summary && <p className="text-xs font-medium text-muted-foreground mb-3">{viewTarget.summary}</p>}
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {viewTarget.content || 'No content added yet.'}
                  </p>
                  {viewTarget.curriculum?.standards && (
                    <div className="pt-4 mt-4 border-t border-border">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Content Standards</p>
                      <p className="text-xs text-foreground leading-relaxed">{viewTarget.curriculum.standards}</p>
                    </div>
                  )}
                  {(() => {
                    const quizId = (viewTarget as TeacherLesson).linkedQuizId || `builtin-${viewTarget.id}`
                    const quiz = allQuizzesFlat.find(q => q.id === quizId)
                    return quiz ? (
                      <div className="pt-4 mt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Linked quiz: <span className="text-primary font-semibold">{quiz.title}</span>
                        </p>
                      </div>
                    ) : null
                  })()}
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {'summary' in viewTarget ? String(viewTarget.summary ?? '') : 'Built-in lesson.'}
                  </p>
                  {(viewTarget as Lesson).curriculum?.standards && (
                    <div className="pt-4 mt-4 border-t border-border">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Content Standards</p>
                      <p className="text-xs text-foreground leading-relaxed">{(viewTarget as Lesson).curriculum?.standards}</p>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </motion.div>
  )
}
