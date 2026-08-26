import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Printer, Box, Target, ChevronRight, FileText, Lock, BookOpen, Star, CheckCircle2, Zap, Camera, Check } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../../store/useAppStore'
import { useQuizStore } from '../../../store/useQuizStore'
import { cn } from '../../../lib/utils'
import { POST_TEST_QUESTIONS } from '../../../data/curriculum'
import { LESSONS } from '../../../data/lessons'
import { builtinQuizId } from '../../../lib/quizId'
import type { Lesson, SubjectKey, TeacherLesson } from '../../../types'
import { useVoiceOver } from '../../../hooks/useVoiceOver'
import { useStorageData } from '../../../hooks/useStorageData'
import { useDeferredLoading } from '../../../hooks/useDeferredLoading'
import { ContentSkeleton } from '../../ui/skeleton'
import { ARLearningControls } from '../../ar/ARLearningControls'
import { VOICE_SCRIPTS } from '../../../data/voiceScripts'
import { storage } from '../../../lib/storage'
import { getFallbackMarkerPath } from '../../../lib/markerUtils'
import { getARConfig } from '../../../lib/arConfig'
import { ARCameraView } from '../../ar/ARCameraView'
import { useNavigate } from 'react-router-dom'
import { AccessCodeModal } from '../../shared/AccessCodeModal'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { pageVariants } from '../../../lib/variants'

const SUBJECT_ORDER: SubjectKey[] = ['chemistry', 'biology', 'physics']

const PHASE_TABS = [
  { key: 'visual'     as const, icon: Target,   label: 'AR Lab'    },
  { key: 'curriculum' as const, icon: BookOpen,  label: 'Study Hub' },
  { key: 'reflection' as const, icon: Star,      label: 'Finish'    },
]


function parseStepsFromContent(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 5)
}

const PDF_LS_PREFIX = 'lesson-pdf:'

function resolvePdfUrl(pdfUrl?: string): string | undefined {
  if (!pdfUrl) return undefined
  if (pdfUrl.startsWith('local:')) {
    return localStorage.getItem(`${PDF_LS_PREFIX}${pdfUrl.slice(6)}`) ?? undefined
  }
  return pdfUrl
}

function mapTeacherLessonToLesson(lesson: TeacherLesson): Lesson {
  const fallbackModelIdx = lesson.arModelIndex ?? Math.max(SUBJECT_ORDER.indexOf(lesson.subject), 0)
  const content = lesson.content ?? ''
  return {
    id: lesson.id,
    title: lesson.title,
    subject: lesson.subject,
    summary: lesson.summary ?? (content.slice(0, 120) || 'Teacher-provided lesson content.'),
    steps: lesson.steps?.length ? lesson.steps : (content ? parseStepsFromContent(content) : []),
    labExperimentId: lesson.labExperimentId,
    curriculum: lesson.curriculum,
    pdfUrl: resolvePdfUrl(lesson.pdfUrl),
    arPayload: lesson.arPayload ?? {
      modelIndex: fallbackModelIdx,
      detectionMode: 'marker',
      anchorHint: lesson.arContext ?? `Scan this marker to view the 3D model.`,
      lessonSteps: ['Open the AR app', 'Aim camera at the marker', 'Interact with the 3D model'],
    },
  }
}

export function ARLabScreen() {
  const {
    currentStudentId,
    activeLessonId,
    voiceLang,
    setVoiceLang,
  } = useAppStore(useShallow((s) => ({
    currentStudentId:       s.currentStudentId,
    activeLessonId:         s.activeLessonId,
    voiceLang:              s.voiceLang,
    setVoiceLang:           s.setVoiceLang,
  })))

  const { setActiveQuizSubject, initQuiz, setRunningQuizId } = useQuizStore(
    useShallow((s) => ({ setActiveQuizSubject: s.setActiveQuizSubject, initQuiz: s.initQuiz, setRunningQuizId: s.setRunningQuizId }))
  )

  const [phase, setPhase] = useState<'visual' | 'curriculum' | 'reflection'>('visual')
  const [activeStep, setActiveStep] = useState(0)
  const [arMarked, setArMarked] = useState(false)
  const [isQuizUnlocked, setIsQuizUnlocked] = useState(false)
  const [isCheckingUnlock, setIsCheckingUnlock] = useState(true)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [showARCamera, setShowARCamera] = useState(false)

  const { data, isLoading } = useStorageData()
  // Gate the skeleton on both the shared data load AND the quiz-unlock check,
  // so the Start/Unlock Post-Test button never flashes its default (locked)
  // state before flipping to the real eligibility once it resolves.
  const showSkeleton = useDeferredLoading(isLoading || isCheckingUnlock)
  const navigate = useNavigate()

  const mergedLessons = useMemo<Lesson[]>(
    () => [...LESSONS, ...data.lessons.map(mapTeacherLessonToLesson)],
    [data.lessons]
  )
  const activeLesson = useMemo(
    () => mergedLessons.find(l => l.id === activeLessonId) ?? null,
    [mergedLessons, activeLessonId]
  )
  const voiceList = VOICE_SCRIPTS.onboarding[voiceLang as 'en' | 'Filipino' || 'en'] || VOICE_SCRIPTS.onboarding['en']

  useEffect(() => {
    setPhase('visual')
    setActiveStep(0)
    setArMarked(false)

    if (!currentStudentId || !activeLessonId) {
      setIsCheckingUnlock(false)
      return
    }

    setIsCheckingUnlock(true)
    const checkQuizUnlock = async () => {
      try {
        const quizId = builtinQuizId(activeLessonId, 'post')
        const eligibility = await storage.validateQuizEligibility(currentStudentId, quizId)
        setIsQuizUnlocked(eligibility.canTake)
      } catch (error) {
        console.error('[ARLabScreen] Quiz unlock check failed:', error)
        setIsQuizUnlocked(false)
      } finally {
        setIsCheckingUnlock(false)
      }
    }

    checkQuizUnlock()
  }, [activeLessonId, currentStudentId])

  const tutorialSteps = activeLesson?.arPayload?.lessonSteps ?? ['Open AR App', 'Scan Marker', 'View Model']

  // Use lesson's quarter/week for marker path
  const markerImage = activeLesson?.arPayload?.markerImage ||
    (activeLesson ? `/markers/Q${activeLesson.quarter}W${activeLesson.week}.jpg` : null)

  // Get AR configuration (NFT prefix + GLB path) for the current lesson
  const arConfig = (activeLesson?.hasAR !== false && activeLesson?.quarter && activeLesson?.week)
    ? getARConfig(activeLesson.quarter, activeLesson.week)
    : null

  const voiceOver = useVoiceOver({ lines: voiceList, language: voiceLang })

  const startQuiz = useCallback(async () => {
    if (!currentStudentId || !activeLessonId || !activeLesson) return
    try {
      const quizQuestions = POST_TEST_QUESTIONS.filter(q => q.lessonId === activeLesson.id)
      setActiveQuizSubject(activeLesson.subject)
      initQuiz(quizQuestions)
      // The AR lab leads into the POST-test (taken after the lesson).
      setRunningQuizId(builtinQuizId(activeLesson.id, 'post'))
      navigate('/app/quiz')
    } catch (error) {
      console.error('[ARLabScreen] Start quiz failed:', error)
    }
  }, [currentStudentId, activeLessonId, activeLesson, setActiveQuizSubject, initQuiz, setRunningQuizId, navigate])

  const handleStartQuizClick = useCallback(async () => {
    if (!currentStudentId || !activeLessonId) return
    const quizId = builtinQuizId(activeLessonId, 'post')
    try {
      const eligibility = await storage.validateQuizEligibility(currentStudentId, quizId)
      if (!eligibility.canTake) {
        setShowUnlockModal(true)
      } else {
        void startQuiz()
      }
    } catch {
      // fail-closed: if check errors out, do not allow quiz start
      setShowUnlockModal(true)
    }
  }, [currentStudentId, activeLessonId, startQuiz])

  const handleBack = useCallback(() => {
    navigate('/app/learn')
  }, [navigate])

  if (showSkeleton) return <ContentSkeleton />

  const phaseIndex = PHASE_TABS.findIndex((p) => p.key === phase)

  return (
    <div className="w-full pb-12">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-border bg-background text-[13px] font-medium text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors duration-150"
        >
          <ChevronRight size={14} className="rotate-180" />
          Back to AR + Learn
        </button>

        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
          Quarter {activeLesson?.quarter || 1} · Week {activeLesson?.week || 1}
        </Badge>
      </div>

      {/* ── Persistent two-column layout: orientation rail + phase-specific content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main column: switches per phase */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <AnimatePresence mode="wait">
            {phase === 'curriculum' && (
              <motion.div
                key="curriculum"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <Card className="p-6 md:p-8">
                  <div className="space-y-7">
                    <section className="space-y-3">
                      <h4 className="text-[11px] font-medium text-primary flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" /> I. Curriculum Content &amp; Standards
                      </h4>
                      <div className="p-5 rounded-lg bg-muted/40 border border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Content Standards</p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {activeLesson?.curriculum?.standards || "Standard content for this module is being processed."}
                        </p>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-[11px] font-medium text-primary flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" /> II. Performance Standards
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed bg-primary/5 p-5 rounded-lg border border-primary/10 italic">
                        {activeLesson?.curriculum?.performanceStandards}
                      </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <section className="space-y-3">
                        <h4 className="text-[11px] font-medium text-primary flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Learning Competencies
                        </h4>
                        <ul className="space-y-2.5">
                          {activeLesson?.curriculum?.learningCompetencies?.map((lc, i) => (
                            <li key={i} className="flex gap-2.5 text-[13px] text-foreground/80 leading-normal">
                              <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0 mt-0.5"><CheckCircle2 size={12} /></div>
                              {lc}
                            </li>
                          ))}
                        </ul>
                      </section>
                      <section className="space-y-3">
                        <h4 className="text-[11px] font-medium text-primary flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Lesson Objectives
                        </h4>
                        <ul className="space-y-2.5">
                          {activeLesson?.curriculum?.objectives?.map((obj, i) => (
                            <li key={i} className="flex gap-2.5 text-[13px] text-foreground/80 leading-normal">
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5 font-semibold text-[10px]">{i + 1}</div>
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-between items-center bg-foreground text-background p-5 rounded-xl">
                  <div>
                    <p className="text-[11px] font-medium opacity-60">Scientific Quality</p>
                    <p className="text-sm font-medium flex items-center gap-2 mt-1">
                      <Zap size={16} className="text-primary" /> {activeLesson?.curriculum?.integration?.qualities?.join(' & ')}
                    </p>
                  </div>
                  <Button
                    className="bg-primary text-primary-foreground"
                    onClick={async () => {
                      if (currentStudentId && activeLessonId) {
                        console.log(`[Storage] Marking lesson ${activeLessonId} as completed...`)
                        await storage.saveStudentLessonCompletion(currentStudentId, activeLessonId)
                      }
                      setPhase('reflection')
                    }}
                  >
                    Mark as Read
                  </Button>
                </div>

                {activeLesson?.pdfUrl && (
                  <Button
                    variant="outline"
                    className="w-full h-14 gap-2.5"
                    onClick={() => window.open(activeLesson.pdfUrl, '_blank')}
                  >
                    <FileText size={18} className="text-primary" />
                    Download PDF Module
                  </Button>
                )}
              </motion.div>
            )}

            {phase === 'visual' && (
              <motion.div
                key="visual"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                <Card className="p-6">
                  <h4 className="text-[11px] font-medium text-muted-foreground mb-5">AR Target Marker</h4>

                  {markerImage && (
                    <div
                      data-print-marker
                      className="mx-auto bg-white rounded-lg overflow-hidden aspect-square w-full max-w-[280px] flex items-center justify-center p-6 border border-border mb-5"
                    >
                      <img
                        src={markerImage}
                        alt="AR Target Marker"
                        className="w-full h-full object-contain block"
                        onError={(e) => {
                          const fallback = getFallbackMarkerPath(activeLesson?.arPayload?.modelIndex ?? 0)
                          if ((e.target as HTMLImageElement).src !== window.location.origin + fallback) {
                            ;(e.target as HTMLImageElement).src = fallback
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-muted/40 border border-border flex items-start gap-3">
                    <Smartphone className="text-primary mt-0.5 shrink-0" size={16} />
                    <div>
                      <p className="text-xs font-semibold text-foreground">How to scan?</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                        Ensure this marker is visible. Use your phone&apos;s AR Science app to aim at it.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (!markerImage) return
                        const absUrl = markerImage.startsWith('http')
                          ? markerImage
                          : `${window.location.origin}${markerImage}`
                        const pw = window.open('', '_blank', 'width=700,height=700')
                        if (!pw) return
                        pw.document.write(`<!DOCTYPE html>
<html><head><title>AR Marker</title>
<style>
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: white; }
  body { display: flex; align-items: center; justify-content: center; }
  img { max-width: 90vmin; max-height: 90vmin; object-fit: contain; display: block; }
</style>
</head><body>
<img src="${absUrl}" onload="window.print();window.close();" onerror="document.body.innerHTML='<p>Marker image not found.</p>'" />
</body></html>`)
                        pw.document.close()
                      }}
                    >
                      <Printer size={14} /> Print Target Image
                    </Button>

                    {markerImage && arConfig && (
                      <Button
                        onClick={() => setShowARCamera(true)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Camera size={14} /> Open AR Camera
                      </Button>
                    )}
                    {!markerImage || !arConfig && (
                      <Button disabled>
                        <Camera size={14} /> AR Not Available
                      </Button>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="text-[11px] font-medium text-muted-foreground mb-5">Execution Steps</h4>
                  <div className="grid gap-3">
                    {tutorialSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border transition-colors duration-150",
                          idx === activeStep
                            ? "bg-primary/5 border-primary/30"
                            : "bg-muted/20 border-transparent opacity-50"
                        )}
                      >
                        <span className={cn(
                          "w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-semibold",
                          idx === activeStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {idx + 1}
                        </span>
                        <p className="text-sm font-medium">{step}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="flex gap-3">
                  {!arMarked ? (
                    <Button
                      onClick={() => setArMarked(true)}
                      size="lg"
                      className="flex-1"
                    >
                      Mark Scan Complete
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setPhase('curriculum')}
                      size="lg"
                      className="flex-1"
                    >
                      Study Full Curriculum
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {phase === 'reflection' && (
              <motion.div
                key="reflection"
                variants={pageVariants}
                initial="initial"
                animate="animate"
              >
                <Card className="p-8 md:p-10 text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-5 text-primary">
                    <Box size={28} />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight mb-2.5">Lesson Complete</h2>
                  <p className="text-muted-foreground text-sm mb-7 leading-relaxed">
                    {arMarked
                      ? <>You&apos;ve explored the structural visual and studied the content for <span className="text-foreground font-medium">{activeLesson?.title}</span>. Ready to test your knowledge?</>
                      : <>You&apos;ve studied the content for <span className="text-foreground font-medium">{activeLesson?.title}</span>. Ready to test your knowledge?</>
                    }
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      size="lg"
                      onClick={handleStartQuizClick}
                    >
                      {isQuizUnlocked ? (
                        <>Start Post-Test <ChevronRight size={18} /></>
                      ) : (
                        <><Lock size={16} /> Unlock Post-Test</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => navigate('/app/progress')}
                    >
                      View My Progress
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right rail: persistent orientation context — does not change with phase */}
        <div className="lg:col-span-1 order-1 lg:order-2 space-y-5 lg:sticky lg:top-6">
          <Card className="p-5">
            <p className="text-[11px] font-medium text-muted-foreground">
              Science ({activeLesson?.subject}) / Quarter {activeLesson?.quarter || 1} / Grade 7
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-foreground mt-1 mb-5">
              {activeLesson?.title}
            </h2>

            {/* Vertical stepper replaces the horizontal phase pills */}
            <div className="space-y-1">
              {PHASE_TABS.map((item, idx) => {
                const isActive = phase === item.key
                const isDone = idx < phaseIndex
                return (
                  <button
                    key={item.key}
                    onClick={() => setPhase(item.key)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150 text-left',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    <span className={cn(
                      'w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isDone
                          ? 'bg-success/15 text-success'
                          : 'bg-muted text-muted-foreground'
                    )}>
                      {isDone ? <Check size={12} /> : idx + 1}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <item.icon size={13} />
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-medium text-muted-foreground">Expert Voice Assistance</h4>
              <Badge variant="success" className="text-[10px]">AI guide ready</Badge>
            </div>
            <ARLearningControls
              language={voiceLang}
              onLanguageToggle={() => {
                voiceOver.reset()
                setVoiceLang(voiceLang === 'en' ? 'Filipino' : 'en')
              }}
              onPlayAll={voiceOver.playAll}
              onStop={voiceOver.stop}
              onReplay={voiceOver.replay}
              isPlaying={voiceOver.isPlaying}
              currentIndex={voiceOver.currentIndex}
              total={voiceList.length}
              unsupported={!voiceOver.supported}
            />
          </Card>

          <Card className="p-5">
            <h3 className="text-xs font-semibold text-muted-foreground mb-4">Reading Progress</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span>Content Depth</span>
                <span className="text-primary">100%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full w-full bg-primary rounded-full" />
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                &quot;Perseverance: Grasping the abstract concept of the Particle Model might take some effort.&quot;
              </p>
            </div>
          </Card>
        </div>
      </div>

      {showARCamera && arConfig && markerImage && (
        <ARCameraView
          markerImage={markerImage}
          glbPath={arConfig.glbPath}
          title={activeLesson?.title ?? ''}
          description={activeLesson?.arPayload?.description ?? ''}
          onExit={() => setShowARCamera(false)}
          onMarkerFound={() => setArMarked(true)}
        />
      )}

      <AccessCodeModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        targetId={activeLessonId || ''}
        type="quiz"
        title={`${activeLesson?.title || ''} Post-Test`}
        onSuccess={() => {
          setIsQuizUnlocked(true)
          void startQuiz()
        }}
      />
    </div>
  )
}
