# Quiz Unlock Flow - FINAL COMPLETE GUIDE

## The Correct Flow (As User Specified)

### 1. Initial State
- Quiz is **LOCKED by default**
- Not in `unlockedQuizIds`
- Not in `completedQuizIds`
- Shows as 🔒 "Locked (No Code)" in Progress tab
- Student cannot click to take quiz

### 2. Lesson is Unlocked & Completed
- Student gets lesson unlock code
- Student enters code in Learn screen
- Lesson is added to `unlockedLessonIds`
- Lesson shows as completed in Progress tab
- **Quiz is STILL LOCKED** (independent from lesson!)

### 3. Teacher Creates Quiz Unlock Code
- **AFTER** student completes the lesson (or anytime)
- Teacher goes to: StudentTab → Student Record → Quiz Section
- Clicks "Generate Retake Code" button on the quiz
- Code is generated and valid for 7 days
- Teacher shares code with student (in classroom, email, etc)

### 4. Student Enters Quiz Unlock Code
**Flow:**
1. Student sees quiz in Quiz Screen, shows as 🔒 LOCKED
2. Student tries to click quiz
3. Unlock Dialog appears
4. Student enters the code teacher provided
5. Code validated against `quizUnlockCodes` in Firestore
6. **Quiz is added to `unlockedQuizIds`** ← KEY!
7. Data syncs via real-time Firestore listener (onSnapshot)
8. Quiz list refreshes and shows quiz as ✓ "Unlocked - Ready"
9. Student can now click and take quiz

**Important:** If student **refreshes page** after entering code:
- Quiz remains in `unlockedQuizIds` (persisted in Firestore)
- Quiz still shows as ✓ "Unlocked - Ready"
- Student can still take the quiz

### 5. Student Takes Quiz
1. Student clicks unlocked quiz
2. `handleStartQuiz()` checks: `unlockedQuizIds.has(quizId)` → TRUE ✓
3. Quiz starts, student answers all questions
4. Submits answers
5. **Quiz attempt created with `locked: true`**
6. Quiz added to `completedQuizIds`
7. Results shown to student

### 6. Quiz Auto-Locks After Completion
**Lock Logic:**
```typescript
isLocked: !unlockedQuizIds.has(quizId) || completedQuizIds.has(quizId)
```

After taking quiz:
- Quiz is in `unlockedQuizIds` (still unlocked from code)
- Quiz is in `completedQuizIds` (just completed)
- Result: `isLocked = true` ✓ LOCKED AGAIN

**If student refreshes:**
- Quiz still shows as LOCKED
- Shows in Progress tab as "Attempted" with score

### 7. For Retake (Repeat Process)
- Student wants to retake
- Teacher generates **NEW** code (same process as step 3)
- Student enters new code (same process as step 4)
- Quiz unlocks again
- Student retakes quiz
- Repeats...

---

## Firestore Data Structure

### Students Collection
```json
{
  "studentId": "student123",
  "unlockedLessonIds": ["q1w1", "q1w2"],           // Lessons unlocked
  "completedLessonIds": ["q1w1"],                   // Lessons done
  "unlockedQuizIds": ["builtin-q1w1"],             // Quizzes unlocked  
  "completedQuizIds": ["builtin-q1w1"],            // Quizzes done
  "quizAttempts": [
    {
      "quizId": "builtin-q1w1",
      "score": 85,
      "locked": true,                               // Attempt locked
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Quiz Unlock Codes Collection
```json
{
  "id": "code-abc123def456",
  "quizId": "builtin-q1w1",
  "studentId": "student123",                        // Optional, can be null for class code
  "code": "ABC123DEF456",
  "generatedAt": "2024-01-15T10:00:00Z",
  "expiresAt": "2024-01-22T10:00:00Z",
  "isUsed": false
}
```

---

## Key Components & Their Responsibilities

### QuizScreen (`src/components/student/screens/QuizScreen.tsx`)
- ✅ Displays quiz list with lock status
- ✅ Lock logic: `!unlockedQuizIds.has(quizId) || completedQuizIds.has(quizId)`
- ✅ Shows unlock dialog when student tries locked quiz
- ✅ Waits 500ms after unlock for Firestore sync

### QuizUnlockDialog (`src/components/quiz/QuizUnlockDialog.tsx`)
- ✅ Shows modal when quiz is locked
- ✅ Student enters code
- ✅ Calls `storage.applyQuizUnlockCode()` to validate
- ✅ **[FIXED]** Calls `storage.unlockContent()` to add to `unlockedQuizIds`
- ✅ Closes dialog on success

### AccessCodeModal (`src/components/shared/AccessCodeModal.tsx`)
- ✅ General unlock modal from Home/Learn screens
- ✅ Handles multiple code types
- ✅ **[FIXED]** Calls `storage.unlockContent()` for quiz codes

### ProgressScreen (`src/components/student/screens/ProgressScreen.tsx`)
- ✅ Shows all lessons grouped by subject
- ✅ For each lesson, shows quiz status:
  - 🔒 "Locked (No Code)" - needs unlock
  - ✓ "Unlocked - Ready" - can take
  - ✓ "Attempted" - completed
- ✅ Shows quiz attempts with scores below

### StudentsTab (`src/components/teacher/tabs/StudentsTab.tsx`)
- ✅ Teacher selects student
- ✅ Shows quiz completion status
- ✅ "Generate Retake Code" button
- ✅ Opens QuizUnlockGenerator

### QuizUnlockGenerator (`src/components/teacher/QuizUnlockGenerator.tsx`)
- ✅ Generates random code
- ✅ Saves to `quizUnlockCodes` collection
- ✅ Valid for 7 days
- ✅ Teacher can copy & share

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│ INITIAL: Quiz LOCKED                                 │
│ - NOT in unlockedQuizIds                            │
│ - NOT in completedQuizIds                           │
│ - Shows: 🔒 "Locked (No Code)"                      │
└─────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────┐
│ TEACHER: Generate Code                              │
│ - Teacher clicks "Generate Retake Code"             │
│ - Creates entry in quizUnlockCodes collection       │
│ - Code expires in 7 days                            │
└─────────────────────────────────────────────────────┘
                        │
                        ↓ (Teacher shares code)
┌─────────────────────────────────────────────────────┐
│ STUDENT: Enter Code                                 │
│ - Opens Unlock Dialog                               │
│ - Types code: ABC123DEF456                          │
│ - Validates against quizUnlockCodes                 │
│ - ✅ Added to unlockedQuizIds in Firestore          │
│ - ✅ Dialog closes                                  │
│ - ✅ Quiz list refreshes (onSnapshot)               │
└─────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────┐
│ UNLOCKED: Quiz AVAILABLE                            │
│ - IN unlockedQuizIds ✓                              │
│ - NOT in completedQuizIds                           │
│ - Shows: ✓ "Unlocked - Ready"                       │
│ - Student can click to start                        │
│ - Persists on refresh ✓                             │
└─────────────────────────────────────────────────────┘
                        │
                        ↓ (Student takes quiz)
┌─────────────────────────────────────────────────────┐
│ COMPLETED: Quiz TAKEN                               │
│ - IN unlockedQuizIds ✓                              │
│ - IN completedQuizIds ✓                             │
│ - Attempt created with locked:true                  │
│ - Shows: ✓ "Attempted" + score                      │
└─────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────┐
│ LOCKED AGAIN: Quiz LOCKED FOR RETAKE                │
│ - IN unlockedQuizIds (from old code)                │
│ - IN completedQuizIds (just completed)              │
│ - Lock logic: !unlocked || completed = true ✓       │
│ - Shows: 🔒 "Locked (Needs Retake Code)"           │
│ - Shows attempt + score in Progress                 │
└─────────────────────────────────────────────────────┘
                        │
                        ↓ (Teacher generates NEW code)
            (Repeats from TEACHER step)
```

---

## Critical Fixes Applied

### Fix #1: AccessCodeModal Quiz Unlock (2 places)
```typescript
// Before: Code applied but quiz never added to unlockedQuizIds
const applied = await storage.applyQuizUnlockCode(...)
if (applied) { ... return } // ❌ Quiz still locked!

// After: Quiz added to unlockedQuizIds
const applied = await storage.applyQuizUnlockCode(...)
if (applied) {
  await storage.unlockContent(studentId, quizId, 'quiz') // ✅
  ...
}
```

### Fix #2: QuizUnlockDialog
```typescript
// Added storage import
import { storage } from '../../lib/storage'

// After code validation, add to unlockedQuizIds
if (success) {
  await storage.unlockContent(studentId, quizId, 'quiz') // ✅
  ...
}
```

### Fix #3: QuizScreen handleUnlockSuccess
```typescript
// Before: Auto-started quiz before data synced
const handleUnlockSuccess = async () => {
  setShowUnlockDialog(false)
  if (pendingUnlockQuiz) {
    await handleStartQuiz(pendingUnlockQuiz.id) // ❌ Too fast!
  }
}

// After: Wait for Firestore to sync
const handleUnlockSuccess = async () => {
  setShowUnlockDialog(false)
  setPendingUnlockQuiz(null)
  // Wait for Firestore sync via onSnapshot listener
  await new Promise(resolve => setTimeout(resolve, 500)) // ✅
}
```

### Fix #4: QuizScreen Lock Logic
```typescript
// Before: Wrong boolean logic
isLocked: !unlockedQuizIds.has(quizId) && !completedQuizIds.has(quizId)
// This only locks if BOTH are false (wrong!)

// After: Correct logic
isLocked: !unlockedQuizIds.has(quizId) || completedQuizIds.has(quizId)
// Locks if NOT unlocked OR already completed ✓
```

---

## Testing Checklist

- [ ] Login as student (Student View)
- [ ] Go to Quiz tab → See all quizzes as 🔒 LOCKED
- [ ] Logout, Login as teacher
- [ ] Go to Students tab → Select student
- [ ] Find a quiz → Click "Generate Retake Code"
- [ ] Copy code (e.g., ABC123DEF456)
- [ ] Logout, Login as student
- [ ] Go to Quiz tab → Click locked quiz
- [ ] Unlock Dialog appears
- [ ] Enter code ABC123DEF456
- [ ] ✅ "Code accepted!" message
- [ ] Quiz now shows as ✓ "Unlocked - Ready"
- [ ] **REFRESH PAGE** (Ctrl+Shift+R)
- [ ] ✅ Quiz still shows as unlocked!
- [ ] Click quiz to start
- [ ] Answer all questions
- [ ] Submit quiz → See results
- [ ] Quiz now shows as 🔒 LOCKED again
- [ ] Go to Progress tab
- [ ] ✅ Lesson shows completion status
- [ ] ✅ Quiz shows "Attempted" + score
- [ ] **REFRESH PAGE**
- [ ] ✅ Quiz still shows as LOCKED
- [ ] ✅ Progress still shows attempt

---

## Debugging

### Quiz still shows locked after entering code:
1. Check Firestore: `students/{studentId}/unlockedQuizIds` contains quiz ID?
2. Check Browser Console for errors in QuizUnlockDialog
3. Hard refresh: Ctrl+Shift+R
4. Check quiz ID format: Must be `builtin-q{quarter}w{week}`

### Unlock persists but shouldn't:
1. Check Firestore: Student record should have quiz in `unlockedQuizIds`
2. If not there, the unlock didn't save - check network/console errors

### Progress tab shows wrong data:
1. ProgressScreen uses real-time listener to student document
2. Should update automatically when `unlockedQuizIds`/`completedQuizIds` change
3. If not updating, hard refresh or check Firestore rules
