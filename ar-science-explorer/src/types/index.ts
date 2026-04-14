export type SubjectKey = 'chemistry' | 'biology' | 'physics';

export interface CurriculumContent {
  standards?: string;
  performanceStandards?: string;
  learningCompetencies?: string[];
  objectives?: string[];
  contentDetails?: string;
  integration?: {
    qualities: string[];
    description: string;
  }
}

export interface Subject {
  id: SubjectKey;
  name: string;
  shortName: string;
  color: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  overview: string;
  keyPoints: string[];
}

export interface ARPayload {
  modelIndex: number;
  detectionMode: 'marker' | 'surface';
  anchorHint: string;
  lessonSteps: string[];
  // New Fields for Visual-First AR
  markerImage?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  keyIdeas?: string[];
  historicalImpact?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  subject: SubjectKey;
  topicId?: string;
  summary: string;
  steps: string[];
  labExperimentId?: string;
  arPayload?: ARPayload;
  hasAR?: boolean;
  pdfUrl?: string;
  isUnlockedByDefault?: boolean;
  curriculum?: CurriculumContent;
  week?: number;
  quarter?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  attemptNumber: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  answers: number[];
  timestamp: string;
  timeSpentSeconds?: number;
  locked: boolean;
}

export interface QuizUnlockCode {
  id: string;
  quizId: string;
  studentId: string;
  code: string;
  generatedAt: string;
  usedAt?: string;
  expiresAt?: string;
  isUsed: boolean;
}

export interface StudentRecord {
  id: string;
  name: string;
  studentId: string;
  grade: string;
  section: string;
  scores: Record<SubjectKey, number | null>;
  completedLessonIds: string[];
  completedLabExperimentIds: string[];
  completedQuizIds: string[];
  unlockedLessonIds: string[];
  unlockedQuizIds: string[];
  quizAttempts: QuizAttempt[];
}

export interface TeacherQuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  hint: string;
}

export interface TeacherQuiz {
  id: string;
  title: string;
  subject: SubjectKey;
  // Quiz module assignment (topic inside the subject).
  // If older saved quizzes are missing this, the app will default them to the first topic.
  topicId?: string;
  questions: TeacherQuizQuestion[];
  createdAt: string;
}

export interface TeacherLesson {
  id: string;
  title: string;
  subject: SubjectKey;
  content?: string;
  createdAt?: string;
  linkedQuizId?: string;
  summary?: string;
  steps?: string[];
  labExperimentId?: string;
  arPayload?: ARPayload;
  isPredefined?: boolean;
  quarter?: string;
  week?: number;
  pdfUrl?: string;
  learningObjectives?: string[];
  keyLearningSteps?: string[];
  keyVocabulary?: string[];
  arModelIndex?: number;
  arContext?: string;
  hasAR?: boolean;
  curriculum?: CurriculumContent;
}

export interface BuiltInQuestion {
  id: string;
  subject: SubjectKey;
  topicId?: string;
  lessonId?: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  hint: string;
}

export interface Experiment {
  id: string;
  name: string;
  subject: SubjectKey;
  objective: string;
  materials: string[];
  procedure: string[];
}

export interface ARModel {
  id: number;
  name: string;
  subject: SubjectKey;
  parts: string[];
  facts: string[];
}

export interface ScanTarget {
  modelIndex: number;
  hueMin: number;
  hueMax: number;
}

export interface AuthIdentity {
  role: 'student' | 'teacher';
  identifier: string;
  passwordHint?: string;
}
