import type { StudentRecord, TeacherQuiz, TeacherLesson } from '../types'

const STORAGE_KEY = 'arscience_shared'

interface StorageData {
  students: StudentRecord[]
  quizzes: TeacherQuiz[]
  lessons: TeacherLesson[]
}

function getDefaultData(): StorageData {
  return {
    students: [],
    quizzes: [],
    lessons: [],
  }
}

export const storage = {
  getAll(): StorageData {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : getDefaultData()
    } catch {
      return getDefaultData()
    }
  },

  saveStudent(student: StudentRecord) {
    const data = this.getAll()
    const idx = data.students.findIndex((s) => s.id === student.id)
    if (idx >= 0) {
      data.students[idx] = student
    } else {
      data.students.push(student)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },

  deleteStudent(id: string) {
    const data = this.getAll()
    data.students = data.students.filter((s) => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },

  saveQuiz(quiz: TeacherQuiz) {
    const data = this.getAll()
    const idx = data.quizzes.findIndex((q) => q.id === quiz.id)
    if (idx >= 0) {
      data.quizzes[idx] = quiz
    } else {
      data.quizzes.push(quiz)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },

  deleteQuiz(id: string) {
    const data = this.getAll()
    data.quizzes = data.quizzes.filter((q) => q.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },

  saveLesson(lesson: TeacherLesson) {
    const data = this.getAll()
    const idx = data.lessons.findIndex((l) => l.id === lesson.id)
    if (idx >= 0) {
      data.lessons[idx] = lesson
    } else {
      data.lessons.push(lesson)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },

  deleteLesson(id: string) {
    const data = this.getAll()
    data.lessons = data.lessons.filter((l) => l.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },

  saveStudentScore(studentId: string, subject: keyof StudentRecord['scores'], score: number) {
    const data = this.getAll()
    const idx = data.students.findIndex((s) => s.studentId === studentId)
    if (idx < 0) return false
    data.students[idx] = {
      ...data.students[idx],
      scores: {
        ...data.students[idx].scores,
        [subject]: score,
      },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  },

  saveStudentLessonCompletion(studentStudentId: string, lessonId: string) {
    const data = this.getAll()
    const idx = data.students.findIndex((s) => s.studentId === studentStudentId)
    if (idx < 0) return false
    const prev = data.students[idx]
    const list = Array.isArray(prev.completedLessonIds) ? prev.completedLessonIds : []
    if (!list.includes(lessonId)) list.push(lessonId)
    data.students[idx] = { ...prev, completedLessonIds: list }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  },

  saveStudentLabCompletion(studentStudentId: string, experimentId: string) {
    const data = this.getAll()
    const idx = data.students.findIndex((s) => s.studentId === studentStudentId)
    if (idx < 0) return false
    const prev = data.students[idx]
    const list = Array.isArray(prev.completedLabExperimentIds) ? prev.completedLabExperimentIds : []
    if (!list.includes(experimentId)) list.push(experimentId)
    data.students[idx] = { ...prev, completedLabExperimentIds: list }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  },

  saveStudentQuizCompletion(studentStudentId: string, quizId: string) {
    const data = this.getAll()
    const idx = data.students.findIndex((s) => s.studentId === studentStudentId)
    if (idx < 0) return false
    const prev = data.students[idx]
    const list = Array.isArray(prev.completedQuizIds) ? prev.completedQuizIds : []
    if (!list.includes(quizId)) list.push(quizId)
    data.students[idx] = { ...prev, completedQuizIds: list }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  },

  ensureStudentRecord(studentId: string) {
    const normalized = studentId.trim()
    if (!normalized) return false
    const data = this.getAll()
    const exists = data.students.some((s) => s.studentId === normalized)
    if (exists) return true
    data.students.push({
      id: `student-${normalized}`,
      name: `Student ${normalized}`,
      studentId: normalized,
      grade: '7',
      section: 'A',
      scores: {
        physics: null,
        biology: null,
        chemistry: null,
        earth: null,
      },
      completedLessonIds: [],
      completedLabExperimentIds: [],
      completedQuizIds: [],
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  },
}
