import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Printer, Box, Target, ChevronRight, FileText, Lock, BookOpen, Star, CheckCircle2, Zap } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { useQuizStore } from '../../../store/useQuizStore'
import { cn } from '../../../lib/utils'
import { QUIZ_QUESTIONS } from '../../../data/quiz'
import { LESSONS } from '../../../data/lessons'
import type { Lesson, SubjectKey, TeacherLesson } from '../../../types'
import { useVoiceOver } from '../../../hooks/useVoiceOver'
import { useStorageData } from '../../../hooks/useStorageData'
import { ARLearningControls } from '../../ar/ARLearningControls'
import { VOICE_SCRIPTS } from '../../../data/voiceScripts'
import { storage } from '../../../lib/storage'
import { db } from '../../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { validateMarkerImage, getFallbackMarkerPath } from '../../../lib/markerUtils'
import { useNavigate } from 'react-router-dom'
import { AccessCodeModal } from '../../shared/AccessCodeModal'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

const SUBJECT_ORDER: SubjectKey[] = ['chemistry', 'biology']

function parseStepsFromContent(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 5)
}

function mapTeacherLessonToLesson(lesson: TeacherLesson): Lesson {
  const fallbackModelIdx = lesson.arModelIndex ?? Math.max(SUBJECT_ORDER.indexOf(lesson.subject), 0)
  const content = lesson.content ?? ''
  return {
    id: `teacher-${lesson.id}`,
    title: lesson.title,
    subject: lesson.subject,
    summary: lesson.summary ?? (content.slice(0, 120) || 'Teacher-provided lesson content.'),
    steps: lesson.steps?.length ? lesson.steps : (content ? parseStepsFromContent(content) : []),
    labExperimentId: lesson.labExperimentId,
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
    activeARPayload,
    activeLabExperimentId,
    setScreen,
    voiceLang,
    setVoiceLang,
  } = useAppStore()

  const {
    setActiveQuizSubject,
    initQuiz,
  } = useQuizStore()

  const [phase, setPhase] = useState<'visual' | 'curriculum' | 'reflection'>('visual')
  const [activeStep, setActiveStep] = useState(0)
  const [arMarked, setArMarked] = useState(false)
  const [isQuizUnlocked, setIsQuizUnlocked] = useState(false)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [_quizUnlockError, setQuizUnlockError] = useState<string | null>(null)
  const [_isCheckingQuiz, setIsCheckingQuiz] = useState(false)
  const [_validatedMarkerPath, setValidatedMarkerPath] = useState<string | null>(null)
  const [_markerLoadError, setMarkerLoadError] = useState(false)
  const [_isValidatingMarker, setIsValidatingMarker] = useState(false)

  const { data } = useStorageData()
  const navigate = useNavigate()

  const teacherLessons = data.lessons
  const mergedLessons: Lesson[] = [...LESSONS, ...teacherLessons.map(mapTeacherLessonToLesson)]

  const activeLesson = mergedLessons.find((l) => l.id === activeLessonId) ?? null
  const voiceList = VOICE_SCRIPTS[voiceLang || 'en'] || VOICE_SCRIPTS['en']

  useEffect(() => {
    setPhase('visual')
    setActiveStep(0)
    setArMarked(false)
    setQuizUnlockError(null)
    setMarkerLoadError(false)
    setValidatedMarkerPath(null)

    if (activeLessonId && currentStudentId) {
      checkQuizUnlock()
    }

    // Validate marker image exists and can be loaded
    if (activeARPayload) {
      validateMarker()
    }
  }, [activeLessonId, currentStudentId, activeARPayload])

  const validateMarker = async () => {
    try {
      setIsValidatingMarker(true)
      setMarkerLoadError(false)

      const markerPath = activeARPayload?.markerImage ||
        getFallbackMarkerPath(activeARPayload?.modelIndex ?? 0)

      const validPath = await validateMarkerImage(markerPath, activeARPayload?.modelIndex ?? 0)
      setValidatedMarkerPath(validPath)
    } catch (error) {
      console.error('[ARLabScreen] Marker validation failed:', error)
      setMarkerLoadError(true)
      setValidatedMarkerPath(getFallbackMarkerPath(activeARPayload?.modelIndex ?? 0))
    } finally {
      setIsValidatingMarker(false)
    }
  }

  const checkQuizUnlock = async () => {
    if (!currentStudentId || !activeLessonId) return
    try {
      setIsCheckingQuiz(true)
      setQuizUnlockError(null)

      // First attempt: students can always take the quiz after lesson completion
      // Retake: requires unlock code
      // Check if student has already attempted this quiz
      const studentRef = doc(db, 'students', currentStudentId)
      const docSnap = await getDoc(studentRef)
      if (!docSnap.exists()) {
        setIsQuizUnlocked(true) // Allow first attempt
        return
      }

      const student = docSnap.data()
      const hasAttempted = student?.quizAttempts?.some((a: any) => a.quizId === activeLessonId || a.quizId === `builtin-${activeLessonId}`)

      if (!hasAttempted) {
        // First attempt: automatically allowed
        setIsQuizUnlocked(true)
      } else {
        // Retake: check if explicitly unlocked
        const unlocked = await storage.isQuizUnlocked(currentStudentId, activeLessonId)
        setIsQuizUnlocked(unlocked)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check quiz unlock status'
      setQuizUnlockError(message)
      console.error('[ARLabScreen] Quiz unlock check failed:', error)
      setIsQuizUnlocked(true) // Allow first attempt on error
    } finally {
      setIsCheckingQuiz(false)
    }
  }

  const tutorialSteps = activeLesson?.arPayload?.lessonSteps ?? ['Open AR App', 'Scan Marker', 'View Model']
  
  // Custom marker image logic
  const markerImage = activeLesson?.arPayload?.markerImage || (activeARPayload ? `/markers/marker-${activeARPayload.modelIndex}.svg` : null)

  const voiceOver = useVoiceOver({ lines: voiceList, language: voiceLang })

  const handleStartQuizClick = () => {
    if (!isQuizUnlocked) {
      setShowUnlockModal(true)
    } else {
      void completeLabAndStartQuiz()
    }
  }

  const completeLabAndStartQuiz = async () => {
    if (!currentStudentId || !activeLesson) return
    try {
      setQuizUnlockError(null)
      await storage.saveStudentLessonCompletion(currentStudentId, activeLesson.id)
      if (activeLabExperimentId) {
        await storage.saveStudentLabCompletion(currentStudentId, activeLabExperimentId)
      }
      // Filter quiz questions by lesson ID (5 questions per lesson)
      const quizQuestions = QUIZ_QUESTIONS.filter((q) => q.lessonId === activeLesson.id)
      setActiveQuizSubject(activeLesson.subject)
      initQuiz(quizQuestions)
      setScreen('quiz')
      navigate('/app/quiz')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete lab and start quiz'
      setQuizUnlockError(message)
      console.error('[ARLabScreen] Complete lab failed:', error)
    }
  }

  const handleBack = () => {
    setScreen('learn')
    navigate('/app/learn')
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="max-w-5xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all shadow-sm"
        >
          <ChevronRight size={14} className="rotate-180" />
          Back to AR + Learn
        </button>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-primary border-primary/20 rounded-full font-bold">
            Quarter {activeLesson?.quarter || 1} · Week {activeLesson?.week || 1}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-border pb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
            Science ({activeLesson?.subject}) / Quarter {activeLesson?.quarter || 1} / Grade 7
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            {activeLesson?.title}
          </h2>
        </div>

        <div className="flex p-1.5 bg-muted/50 border border-border rounded-[1.5rem] backdrop-blur-sm shadow-inner group">
          {[
            { key: 'visual', icon: Target, label: '1. AR Lab' },
            { key: 'curriculum', icon: BookOpen, label: '2. Study Hub' },
            { key: 'reflection', icon: Star, label: '3. Finish' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setPhase(item.key as any)}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 uppercase tracking-wider',
                phase === item.key 
                  ? 'bg-foreground text-background shadow-xl scale-[1.02]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
              )}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'curriculum' && (
          <motion.div 
            key="curriculum"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-8 space-y-8">
              {/* Main Curriculum Content */}
              <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
                
                <div className="space-y-8 relative z-10">
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary" /> I. Curriculum Content & Standards
                    </h4>
                    <div className="p-6 rounded-[2rem] bg-muted/30 border border-border/50">
                      <p className="text-sm font-bold text-foreground opacity-40 uppercase tracking-widest mb-2">Content Standards</p>
                      <p className="text-base text-foreground leading-relaxed">
                        {activeLesson?.curriculum?.standards || "Standard content for this module is being processed."}
                      </p>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary" /> II. Performance Standards
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-primary/5 p-6 rounded-[2rem] border border-primary/10 italic">
                      {activeLesson?.curriculum?.performanceStandards}
                    </p>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Learning Competencies
                      </h4>
                      <ul className="space-y-3">
                        {activeLesson?.curriculum?.learningCompetencies?.map((lc, i) => (
                          <li key={i} className="flex gap-3 text-sm text-foreground/80 font-medium leading-normal">
                             <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5"><CheckCircle2 size={12} /></div>
                             {lc}
                          </li>
                        ))}
                      </ul>
                    </section>
                    <section className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Lesson Objectives
                      </h4>
                      <ul className="space-y-3">
                        {activeLesson?.curriculum?.objectives?.map((obj, i) => (
                          <li key={i} className="flex gap-3 text-sm text-foreground/80 font-medium leading-normal">
                             <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5 font-black text-[9px]">{i+1}</div>
                             {obj}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-foreground text-background p-6 rounded-[2rem] shadow-xl">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Scientific Quality</p>
                    <p className="text-sm font-bold flex items-center gap-2 mt-1">
                       <Zap size={16} className="text-primary" /> {activeLesson?.curriculum?.integration?.qualities.join(' & ')}
                    </p>
                 </div>
                 <Button className="rounded-xl px-6 bg-primary text-primary-foreground font-black text-xs uppercase" onClick={() => setPhase('reflection')}>
                    Mark as Read
                 </Button>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6 rounded-[2rem] border-border bg-card">
                 <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Reading Progress</h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                       <span>Content Depth</span>
                       <span className="text-primary">100%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                       <div className="h-full w-full bg-primary rounded-full" />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                      "Perseverance: Grasping the abstract concept of the Particle Model might take some effort."
                    </p>
                 </div>
              </Card>

              {activeLesson?.pdfUrl && (
                <Button 
                  variant="outline" 
                  className="w-full h-16 rounded-[1.5rem] border-border bg-card hover:bg-primary/5 hover:border-primary/20 transition-all font-bold gap-3"
                  onClick={() => window.open(activeLesson.pdfUrl, '_blank')}
                >
                  <FileText size={20} className="text-primary" />
                  Download PDF Module
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'visual' && (
          <motion.div 
            key="visual"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6">
                  <Target className="text-primary/5 w-24 h-24" />
                </div>
                
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">AR Target Marker</h4>
                
                {markerImage && (
                  <div className="bg-white rounded-3xl overflow-hidden aspect-square flex items-center justify-center p-10 border border-border mb-6 shadow-inner ring-8 ring-muted/30">
                    <img 
                      src={markerImage} 
                      alt="AR Target" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="p-5 rounded-2xl bg-muted/30 border border-border flex items-start gap-3">
                  <Smartphone className="text-primary mt-1 shrink-0" size={18} />
                  <div>
                    <p className="text-xs font-black text-foreground uppercase tracking-wider">How to scan?</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 font-medium">
                      Ensure this marker is visible. Use your phone's AR Science app to aim at it.
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => window.print()}
                  className="w-full mt-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  <Printer size={14} className="mr-2" /> Print Target Image
                </Button>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <Card className="p-8 rounded-[2.5rem] border-border bg-card shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">Execution Steps</h4>
                <div className="grid gap-4">
                  {tutorialSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center gap-5 p-5 rounded-[1.5rem] border-2 transition-all",
                        idx === activeStep 
                          ? "bg-primary/5 border-primary shadow-lg scale-[1.02]" 
                          : "bg-muted/10 border-transparent opacity-40"
                      )}
                    >
                      <span className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black",
                        idx === activeStep ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
                      )}>
                        {idx + 1}
                      </span>
                      <p className="text-sm font-bold">{step}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="bg-card border border-border rounded-[2.5rem] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expert Voice Assistance</h4>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black">AI GUIDE READY</Badge>
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
              </div>

              <div className="flex gap-4">
                {!arMarked ? (
                  <Button
                    onClick={() => setArMarked(true)}
                    className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20"
                  >
                    Mark Scan Complete
                  </Button>
                ) : (
                  <Button
                    onClick={() => setPhase('curriculum')}
                    className="flex-1 h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20"
                  >
                    Study Full Curriculum
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'reflection' && (
          <motion.div 
            key="reflection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-card border border-border rounded-[2.5rem] p-10 text-center shadow-xl">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-primary shadow-inner">
                <Box size={40} />
              </div>
              <h2 className="text-3xl font-extrabold mb-3">Lesson Complete</h2>
              <p className="text-muted-foreground text-lg mb-8">
                {arMarked
                  ? <>You've explored the structural visual and studied the content for <span className="text-foreground font-bold">{activeLesson?.title}</span>. Ready to test your knowledge?</>
                  : <>You've studied the content for <span className="text-foreground font-bold">{activeLesson?.title}</span>. Ready to test your knowledge?</>
                }
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleStartQuizClick}
                  className="py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  {isQuizUnlocked ? (
                    <>Start Quiz <ChevronRight size={18} /></>
                  ) : (
                    <><Lock size={16} /> Unlock Quiz</>
                  )}
                </button>
                <button
                  onClick={() => {
                    setScreen('progress')
                    navigate('/app/progress')
                  }}
                  className="py-4 bg-background border border-border rounded-2xl font-bold text-muted-foreground text-sm hover:text-foreground transition-all"
                >
                  View My Progress
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AccessCodeModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        targetId={activeLessonId || ''}
        type="quiz"
        title={`${activeLesson?.title || ''} Quiz`}
        onSuccess={() => {
          setIsQuizUnlocked(true)
          void completeLabAndStartQuiz()
        }}
      />
    </motion.div>
  )
}
