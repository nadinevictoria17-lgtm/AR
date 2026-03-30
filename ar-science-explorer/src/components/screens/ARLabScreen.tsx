import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Smartphone } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/utils'
import { QUIZ_QUESTIONS } from '../../data/quiz'
import { EXPERIMENTS } from '../../data/experiments'
import { LESSONS } from '../../data/lessons'
import { storage } from '../../lib/storage'
import type { Lesson, SubjectKey, TeacherLesson } from '../../types'
import { useVoiceOver } from '../../hooks/useVoiceOver'
import { ARLearningControls } from '../ar/ARLearningControls'
import { VOICE_SCRIPTS } from '../../data/voiceScripts'
import { LAB_EXPERIMENT_DESCRIPTIONS } from '../../data/labDescriptions'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

const SUBJECT_ORDER: SubjectKey[] = ['physics', 'biology', 'chemistry', 'earth']
const SUBJECT_STYLES: Record<SubjectKey, { text: string; badge: string }> = {
  physics:   { text: 'text-subject-physics', badge: 'bg-subject-physics/15 text-subject-physics border-subject-physics/30' },
  biology:   { text: 'text-subject-biology', badge: 'bg-subject-biology/15 text-subject-biology border-subject-biology/30' },
  chemistry: { text: 'text-subject-chemistry', badge: 'bg-subject-chemistry/15 text-subject-chemistry border-subject-chemistry/30' },
  earth:     { text: 'text-subject-earth', badge: 'bg-subject-earth/15 text-subject-earth border-subject-earth/30' },
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
      anchorHint: `Scan this marker with the AR app to view the ${lesson.subject} model.`,
      lessonSteps: ['Open the AR Science app', 'Aim camera at this marker', 'Interact with the 3D model', 'Learn about the structure'],
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
    voiceLang,
    setVoiceLang,
  } = useAppStore()

  const [phase, setPhase] = useState<'prep' | 'ar' | 'complete'>('prep')
  const [prepChecks, setPrepChecks] = useState<Record<number, boolean>>({})
  const [activeStep, setActiveStep] = useState(0)
  const [arMarked, setArMarked] = useState(false)

  const teacherLessons = storage.getAll().lessons
  const mergedLessons: Lesson[] = [...LESSONS, ...teacherLessons.map(mapTeacherLessonToLesson)]

  const activeLesson = mergedLessons.find((l) => l.id === activeLessonId) ?? null
  const subject = activeLesson?.subject ?? (activeARPayload ? SUBJECT_ORDER[Math.min(activeARPayload.modelIndex, SUBJECT_ORDER.length - 1)] : null)
  const voiceList = VOICE_SCRIPTS[voiceLang]

  const experiment =
    (activeLabExperimentId ? EXPERIMENTS.find((e) => e.id === activeLabExperimentId) : null) ??
    (subject ? EXPERIMENTS.find((e) => e.subject === subject) ?? null : null)

  useEffect(() => {
    setPhase('prep')
    setPrepChecks({})
    setActiveStep(0)
    setArMarked(false)
  }, [activeLessonId, activeLabExperimentId])

  const tutorialSteps = activeARPayload?.lessonSteps ?? ['Open the AR app', 'Scan marker', 'View model', 'Learn']
  const subjectStyle = subject ? SUBJECT_STYLES[subject] : null
  const canStartAR = experiment != null && activeARPayload != null
  const procedure = experiment?.procedure ?? []
  const prepProgress = procedure.length > 0 ? procedure.filter((_, idx) => prepChecks[idx]).length / procedure.length : 0
  const experimentDetails = experiment ? LAB_EXPERIMENT_DESCRIPTIONS[experiment.id] : null
  const markerImage = activeARPayload ? `/markers/marker-${activeARPayload.modelIndex}.svg` : null

  const voiceOver = useVoiceOver({ lines: voiceList, language: voiceLang })

  const completeLabAndStartQuiz = async () => {
    if (!currentStudentId || !experiment || !activeLesson) return
    storage.saveStudentLessonCompletion(currentStudentId, activeLesson.id)
    storage.saveStudentLabCompletion(currentStudentId, experiment.id)
    const quizQuestions = QUIZ_QUESTIONS.filter((q) => q.subject === activeLesson.subject)
    setActiveQuizSubject(activeLesson.subject)
    initQuiz(quizQuestions)
    setScreen('quiz')
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <button
        onClick={() => setScreen('learn')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        Back to Learn
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Smartphone size={20} className={subjectStyle?.text ?? 'text-subject-physics'} /> AR + Lab Session
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {phase === 'prep' && 'Lab preparation first (materials + checklist), then scan the marker with the AR app.'}
            {phase === 'ar' && 'Display the marker on screen and use the AR Science app to scan and view the 3D model.'}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          {[
            { key: 'prep', label: '1) Lab Prep', note: 'Materials + checklist' },
            { key: 'ar', label: '2) Scan AR', note: 'Display marker & scan with app' },
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

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPhase('ar')}
                  disabled={!canStartAR}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                    canStartAR ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  Continue to AR Scan
                </button>
                <button onClick={() => setScreen('learn')} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
                  Back to Learn
                </button>
              </div>
            </div>
          )}

          {phase === 'ar' && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">AR Scan Target</p>
                  <p className="text-sm text-muted-foreground">Display this marker on your screen and use the <span className="font-semibold text-foreground">AR Science app</span> on your mobile device to scan it.</p>
                </div>

                {markerImage && (
                  <div className="rounded-xl overflow-hidden bg-card border border-border aspect-square flex items-center justify-center">
                    <img src={markerImage} alt={`AR Marker ${activeARPayload.modelIndex}`} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="rounded-xl border border-border/50 bg-primary/5 p-3 space-y-1">
                  <p className="text-xs font-semibold text-primary uppercase">Anchor Hint</p>
                  <p className="text-sm text-foreground">{activeARPayload.anchorHint}</p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">AR Guidance Steps</p>
                  <p className="text-sm text-muted-foreground">Follow these steps in the AR app:</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
              </div>

              <div className="flex flex-wrap gap-2">
                {!arMarked ? (
                  <button
                    onClick={() => setArMarked(true)}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Mark AR Scanning Complete
                  </button>
                ) : (
                  <button
                    onClick={() => setPhase('complete')}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Move to Lab Complete
                  </button>
                )}
                <button onClick={() => setPhase('prep')} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
                  Back to Prep
                </button>
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
                Tip: If you want to re-scan, go back to <button className="underline text-foreground hover:text-primary" onClick={() => { setArMarked(false); setPhase('ar') }}>AR Scan</button>.
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
