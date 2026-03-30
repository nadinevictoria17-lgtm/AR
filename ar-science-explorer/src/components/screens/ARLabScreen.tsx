import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/utils'
import { QUIZ_QUESTIONS } from '../../data/quiz'
import { EXPERIMENTS } from '../../data/experiments'
import { LESSONS } from '../../data/lessons'
import { storage } from '../../lib/storage'
import type { Lesson, SubjectKey, TeacherLesson } from '../../types'
import { useARSession } from '../../hooks/useARSession'
import { useVoiceOver } from '../../hooks/useVoiceOver'
import { ARLearningControls } from '../ar/ARLearningControls'
import { VOICE_SCRIPTS } from '../../data/voiceScripts'
import { LAB_EXPERIMENT_DESCRIPTIONS } from '../../data/labDescriptions'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

const SUBJECT_ORDER: SubjectKey[] = ['physics', 'biology', 'chemistry', 'earth']
const SUBJECT_STYLES: Record<SubjectKey, { text: string; badge: string }> = {
  physics: { text: 'text-subject-physics', badge: 'bg-subject-physics/15 text-subject-physics border-subject-physics/30' },
  biology: { text: 'text-subject-biology', badge: 'bg-subject-biology/15 text-subject-biology border-subject-biology/30' },
  chemistry: { text: 'text-subject-chemistry', badge: 'bg-subject-chemistry/15 text-subject-chemistry border-subject-chemistry/30' },
  earth: { text: 'text-subject-earth', badge: 'bg-subject-earth/15 text-subject-earth border-subject-earth/30' },
}

function parseStepsFromContent(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 5)
}

function mapTeacherLessonToLesson(lesson: TeacherLesson): Lesson {
  const fallbackModelIdx = Math.max(SUBJECT_ORDER.indexOf(lesson.subject), 0)
  return {
    id: `teacher-${lesson.id}`,
    title: lesson.title,
    subject: lesson.subject,
    summary: lesson.summary ?? (lesson.content.slice(0, 120) || 'Teacher-provided lesson content.'),
    steps: lesson.steps?.length ? lesson.steps : parseStepsFromContent(lesson.content),
    labExperimentId: lesson.labExperimentId,
    arPayload: lesson.arPayload ?? {
      modelIndex: fallbackModelIdx,
      detectionMode: 'marker',
      anchorHint: `Scan a ${lesson.subject} marker to open AR.`,
      lessonSteps: ['Open camera', 'Scan marker/surface', 'Inspect model'],
    },
  }
}

export function ARLabScreen() {
  const {
    currentStudentId,
    activeLessonId,
    activeARPayload,
    activeLabExperimentId,
    setActiveQuizSubject,
    setScreen,
    initQuiz,
    clearDetection,
    arDetected,
    voiceLang,
    setVoiceLang,
  } = useAppStore()

  const { activateCamera, getCameraStream, stopCamera, startLessonAR, startSpatialDetection } = useARSession()
  const [phase, setPhase] = useState<'prep' | 'ar' | 'complete'>(() => (arDetected ? 'ar' : 'prep'))
  const [prepChecks, setPrepChecks] = useState<Record<number, boolean>>({})
  const [activeStep, setActiveStep] = useState(0)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const cameraPreviewRef = useRef<HTMLVideoElement | null>(null)

  const teacherLessons = storage.getAll().lessons
  const mergedLessons: Lesson[] = [...LESSONS, ...teacherLessons.map(mapTeacherLessonToLesson)]

  const activeLesson = mergedLessons.find((l) => l.id === activeLessonId) ?? null
  const subject = activeLesson?.subject ?? (activeARPayload ? SUBJECT_ORDER[Math.min(activeARPayload.modelIndex, SUBJECT_ORDER.length - 1)] : null)
  const voiceList = VOICE_SCRIPTS[voiceLang]

  const experiment =
    (activeLabExperimentId ? EXPERIMENTS.find((e) => e.id === activeLabExperimentId) : null) ??
    (subject ? EXPERIMENTS.find((e) => e.subject === subject) ?? null : null)

  useEffect(() => {
    setPhase(arDetected ? 'ar' : 'prep')
    setPrepChecks({})
    setActiveStep(0)
  }, [activeLessonId, activeLabExperimentId])

  useEffect(() => {
    const stream = getCameraStream()
    const video = cameraPreviewRef.current
    if (!video || !stream) return
    video.srcObject = stream
    void video.play().catch(() => {})
  }, [phase, arDetected, getCameraStream])

  const tutorialSteps = activeARPayload?.lessonSteps ?? ['Open camera', 'Scan target', 'Inspect model']
  const subjectStyle = subject ? SUBJECT_STYLES[subject] : null
  const canStartAR = experiment != null && activeARPayload != null
  const procedure = experiment?.procedure ?? []
  const prepProgress = procedure.length > 0 ? procedure.filter((_, idx) => prepChecks[idx]).length / procedure.length : 0
  const experimentDetails = experiment ? LAB_EXPERIMENT_DESCRIPTIONS[experiment.id] : null
  const hasCameraStream = !!getCameraStream()

  const voiceOver = useVoiceOver({ lines: voiceList, language: voiceLang })

  const completeLabAndStartQuiz = async () => {
    if (!currentStudentId || !experiment || !activeLesson) return
    storage.saveStudentLessonCompletion(currentStudentId, activeLesson.id)
    storage.saveStudentLabCompletion(currentStudentId, experiment.id)
    const quizQuestions = QUIZ_QUESTIONS.filter((q) => q.subject === activeLesson.subject)
    setActiveQuizSubject(activeLesson.subject)
    initQuiz(quizQuestions)
    clearDetection()
    stopCamera()
    setScreen('quiz')
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <button
        onClick={() => {
          stopCamera()
          setScreen('learn')
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        Back to Learn
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Camera size={20} className={subjectStyle?.text ?? 'text-subject-physics'} /> AR + Lab Session
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {phase === 'prep' && 'Lab preparation first (materials + checklist), then move to AR.'}
            {phase === 'ar' && 'AR run: camera, scan/detection, and guided exploration steps.'}
            {phase === 'complete' && 'Lab completed. Reflect and continue to quiz practice.'}
          </p>
        </div>
        {subject && (
          <span className={cn('px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize shrink-0', subjectStyle?.badge ?? '')}>
            {subject}
          </span>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-3">Session Flow</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={cn('px-2.5 py-1 rounded-full border text-[11px] font-semibold', hasCameraStream ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border')}>
            Camera: {hasCameraStream ? 'Ready' : 'Idle'}
          </span>
          <span className={cn('px-2.5 py-1 rounded-full border text-[11px] font-semibold', arDetected ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border')}>
            Detection: {arDetected ? 'Detected' : 'Waiting'}
          </span>
          {cameraError && (
            <span className="px-2.5 py-1 rounded-full border text-[11px] font-semibold bg-destructive/10 text-destructive border-destructive/30">
              Camera permission needed
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { key: 'prep', label: '1) Lab Prep', note: 'Materials + checklist' },
            { key: 'ar', label: '2) AR Scan', note: 'Camera + detection + guidance' },
            { key: 'complete', label: '3) Complete', note: 'Reflect + proceed to quiz' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setPhase(item.key as 'prep' | 'ar' | 'complete')}
              className={cn(
                'text-left px-3 py-2 rounded-xl border text-sm transition-colors',
                phase === item.key ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/30'
              )}
            >
              <p className="font-semibold">{item.label}</p>
              <p className="text-xs mt-0.5">{item.note}</p>
            </button>
          ))}
        </div>
      </div>

      {!experiment || !activeLesson || !activeARPayload ? (
        <div className="bg-card border border-border rounded-2xl p-6 text-sm text-muted-foreground">
          Start this screen from a lesson in <span className="font-semibold text-foreground">Learn</span>.
        </div>
      ) : (
        <>
          {phase === 'prep' && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-2">Lab Objective</p>
                <h3 className="font-semibold text-foreground text-base">{experiment.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{experiment.objective}</p>
              </div>

              {experimentDetails && (
                <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                  <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Experiment Description</p>
                  <div className="space-y-2">
                    <p className="text-sm text-foreground"><span className="font-semibold">Context:</span> {experimentDetails.context}</p>
                    <p className="text-sm text-foreground"><span className="font-semibold">Expected Observation:</span> {experimentDetails.expectedObservation}</p>
                    <p className="text-sm text-foreground"><span className="font-semibold">Real-life Link:</span> {experimentDetails.realLifeLink}</p>
                  </div>
                </div>
              )}

              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Materials</p>
                <div className="flex flex-wrap gap-2">
                  {experiment.materials.map((m) => (
                    <span key={m} className="px-2 py-0.5 rounded-lg bg-muted text-xs text-muted-foreground">{m}</span>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Procedure Checklist</p>
                  <p className="text-xs text-muted-foreground">{Math.round(prepProgress * 100)}% ready</p>
                </div>
                <div className="space-y-2">
                  {procedure.map((step, idx) => (
                    <label key={step} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card/40 hover:bg-muted/20 transition-colors cursor-pointer">
                      <input type="checkbox" checked={!!prepChecks[idx]} onChange={(e) => setPrepChecks((prev) => ({ ...prev, [idx]: e.target.checked }))} className="mt-1" />
                      <span className="text-sm text-foreground">{step}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Camera Requirements</p>
                <p className="text-sm text-muted-foreground">Use a secure context (HTTPS or localhost), allow camera permission, and use a mobile browser with camera support.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    if (!activeARPayload) return
                    try {
                      setCameraError(null)
                      await startLessonAR(activeARPayload)
                      setPhase('ar')
                    } catch (error) {
                      const message = error instanceof Error ? error.message : 'Unable to access camera.'
                      setCameraError(message)
                      setPhase('ar')
                    }
                  }}
                  disabled={!canStartAR}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                    canStartAR ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  Start AR & Detection
                </button>
                <button onClick={() => { stopCamera(); setScreen('learn') }} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
                  Back to Learn
                </button>
              </div>
            </div>
          )}

          {phase === 'ar' && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-3">
                <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-2">Camera Preview</p>
                <div className="rounded-xl overflow-hidden bg-black/90 border border-border aspect-video flex items-center justify-center">
                  {getCameraStream() ? (
                    <video ref={cameraPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  ) : (
                    <p className="text-sm text-muted-foreground px-4 text-center">Tap Start Detection to open the device camera preview.</p>
                  )}
                </div>
                {cameraError && <p className="text-xs text-destructive mt-2">{cameraError}</p>}
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">AR Guidance Steps</p>
                  <p className="text-sm text-muted-foreground">Anchor hint: <span className="font-semibold text-foreground">{activeARPayload.anchorHint}</span></p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {tutorialSteps.map((step, idx) => (
                    <button
                      key={`${step}-${idx}`}
                      onClick={() => setActiveStep(idx)}
                      className={cn(
                        'text-left px-3 py-2 rounded-xl border text-sm transition-colors',
                        idx === activeStep ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/40'
                      )}
                    >
                      {idx + 1}. {step}
                    </button>
                  ))}
                </div>

                {!arDetected ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => {
                        if (!activeARPayload) return
                        void (async () => {
                          try {
                            setCameraError(null)
                            await activateCamera()
                            await startSpatialDetection(activeARPayload)
                          } catch (error) {
                            const message = error instanceof Error ? error.message : 'Unable to access camera.'
                            setCameraError(message)
                          }
                        })()
                      }}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Start Detection
                    </button>
                    <button onClick={() => { stopCamera(); setScreen('learn') }} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button onClick={() => setPhase('complete')} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                      Detection Complete → Lab Complete
                    </button>
                    <button onClick={() => { stopCamera(); setScreen('learn') }} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
                      Back to Learn
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-2">Tutorial Voice (VO)</p>
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
                <p className="text-sm text-muted-foreground mt-2">{voiceList[Math.min(voiceOver.currentIndex, voiceList.length - 1)]}</p>
                <p className="text-xs text-muted-foreground mt-2">VO content source: voice scripts mapped per language for this AR lesson flow.</p>
              </div>
            </div>
          )}

          {phase === 'complete' && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Reflection</p>
                <h3 className="font-semibold text-foreground text-base">You completed: {experiment.name}</h3>
                <p className="text-sm text-muted-foreground">Great job. Now take the practice quiz to lock in what you learned.</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button onClick={() => void completeLabAndStartQuiz()} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                    Start Practice Quiz
                  </button>
                  <button onClick={() => setScreen('progress')} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
                    View Progress
                  </button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 text-sm text-muted-foreground">
                Tip: If you want to re-scan, go back to <button className="underline text-foreground hover:text-primary" onClick={() => setPhase('ar')}>AR Run</button>.
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
