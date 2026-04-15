# Quiz Unlock System - Complete Flow Audit

## Architecture Overview

The quiz unlock system has 3 main parts:
1. **Teacher generates codes** → QuizUnlockGenerator
2. **Student enters codes** → AccessCodeModal or QuizUnlockDialog  
3. **Quiz availability logic** → QuizScreen checks `unlockedQuizIds`

---

## Complete Flow: Quiz Lifecycle

### Initial State
- Quiz is **NOT** in `unlockedQuizIds` 
- Quiz shows as **LOCKED** in QuizScreen
- Student cannot click to take quiz

### Teacher Generates Retake Code

**Location:** `src/components/teacher/tabs/StudentsTab.tsx`
- Teacher views student record
- Clicks "Generate Retake Code" button for a completed quiz
- Opens `QuizUnlockGenerator` component

**QuizUnlockGenerator** (`src/components/teacher/QuizUnlockGenerator.tsx`)
- Calls: `quizAttempt.unlockForRetake(studentId, quizId)`
- This calls: `storage.unlockQuizForRetake()` in `src/lib/storage.ts:286`
- Creates a `QuizUnlockCode` document in Firestore `quizUnlockCodes` collection
- Returns generated code (e.g., "ABC123DEF456")
- Teacher copies and shares with student

### Student Enters Unlock Code

**Two possible paths:**

#### Path A: Via QuizUnlockDialog (from QuizScreen)
**Location:** `src/components/quiz/QuizUnlockDialog.tsx`
1. Student tries to take a locked quiz
2. QuizScreen's `handleStartQuiz()` checks: `!unlockedQuizIds.has(quizId)`
3. Opens `QuizUnlockDialog` modal
4. Student enters code
5. Calls: `quizAttempt.applyUnlockCode(studentId, quizId, code)`
6. This calls: `storage.applyQuizUnlockCode()` in `src/lib/storage.ts:383`
7. **[FIXED]** Now also calls: `storage.unlockContent(studentId, quizId, 'quiz')`
8. Code validated in Firestore `quizUnlockCodes` collection
9. If valid:
   - Code marked as `isUsed: true`
   - Latest quiz attempt marked as `locked: false` 
   - **Quiz added to `unlockedQuizIds`** ← KEY FIX!
10. Dialog closes, quiz now shows as UNLOCKED

#### Path B: Via AccessCodeModal (from Home/Learn screens)
**Location:** `src/components/shared/AccessCodeModal.tsx`
- Similar flow but more generalized
- Tries multiple code types before getting to quiz codes
- Same fixes applied at lines 44 and 111

### Quiz Becomes Available
**Location:** `src/components/student/screens/QuizScreen.tsx`

After code is applied:
- Quiz is now in student's `unlockedQuizIds`
- QuizScreen re-renders (via `useStorageData` hook)
- Quiz lock logic: `isLocked: !unlockedQuizIds.has(quizId) || completedQuizIds.has(quizId)`
- Result: `isLocked: false` ✓
- Quiz shows as **UNLOCKED** in quiz list
- Student can click and take quiz

### Student Takes Quiz
**Location:** `src/components/student/screens/QuizScreen.tsx:170-195` (handleStartQuiz)

1. Student clicks quiz
2. Checks: `!unlockedQuizIds.has(quizId)` → False (it IS unlocked)
3. Checks: `validateQuizEligibility()` → True (no locked attempts)
4. Quiz starts

**After answering all questions:** `src/components/student/screens/QuizScreen.tsx:201-255`

1. Calls: `quizAttemptHook.saveAttempt()`
2. This creates a `QuizAttempt` with **`locked: true`** (line 46 of `useQuizAttempt.ts`)
3. Calls: `storage.saveStudentQuizCompletion()`
4. Adds quiz to `completedQuizIds`
5. Score saved to student record

### Quiz Locks Again

**Automatic lock logic in QuizScreen:**
```tsx
isLocked: !unlockedQuizIds.has(quizId) || completedQuizIds.has(quizId)
```

After quiz is completed:
- Quiz still in `unlockedQuizIds` (one-time unlock)
- Quiz now in `completedQuizIds` (just completed)
- Result: `isLocked: true` ✓
- Quiz shows as **LOCKED AGAIN** in quiz list

### For Retake
Teacher generates **NEW** code (same process as before)
- Marks latest attempt as `locked: false`
- Adds quiz to `unlockedQuizIds` again
- Student can retake quiz

---

## Key Fixes Applied

### Fix #1: AccessCodeModal - Auto-generated retake codes
**File:** `src/components/shared/AccessCodeModal.tsx:44`
**Problem:** Code was applied but quiz not added to `unlockedQuizIds`
**Solution:** Added `await storage.unlockContent(currentStudentId, quizId, 'quiz')`

### Fix #2: AccessCodeModal - Manual retake codes  
**File:** `src/components/shared/AccessCodeModal.tsx:111`
**Problem:** Same issue as Fix #1
**Solution:** Added same `unlockContent()` call

### Fix #3: QuizUnlockDialog
**File:** `src/components/quiz/QuizUnlockDialog.tsx:37`
**Problem:** Code applied but quiz not added to `unlockedQuizIds`
**Solution:** Added `await storage.unlockContent(studentId, quizId, 'quiz')`

### Fix #4: QuizScreen lock logic
**File:** `src/components/student/screens/QuizScreen.tsx:123, 137`
**Problem:** Used `&&` which was wrong logic
**Solution:** Changed to `||` so quiz locks if NOT unlocked OR already completed

---

## Data Flow: Student Record

```
StudentRecord {
  unlockedQuizIds: [
    "builtin-q1w1",    // Can take
    "builtin-q1w2",    // Can take
  ],
  completedQuizIds: [
    "builtin-q1w1",    // Just completed, now locked
  ]
}
```

**Quiz Availability Calculation:**
```tsx
const unlockedQuizIds = new Set(studentRecord?.unlockedQuizIds ?? [])
const completedQuizIds = new Set(studentRecord?.completedQuizIds ?? [])

const quizzes = [
  {
    id: "builtin-q1w1",
    isLocked: !unlockedQuizIds.has(id) || completedQuizIds.has(id)
    // = !true || true = false || true = true ✓ (LOCKED)
  },
  {
    id: "builtin-q1w2", 
    isLocked: !unlockedQuizIds.has(id) || completedQuizIds.has(id)
    // = !true || false = false || false = false ✓ (UNLOCKED)
  },
  {
    id: "builtin-q1w3",
    isLocked: !unlockedQuizIds.has(id) || completedQuizIds.has(id)
    // = !false || false = true || false = true ✓ (LOCKED)
  }
]
```

---

## Firestore Collections

### `quizUnlockCodes`
```json
{
  "id": "code-abc123",
  "quizId": "builtin-q1w1",
  "studentId": "student123",
  "code": "ABC123DEF456",
  "generatedAt": "2024-01-15T10:00:00Z",
  "expiresAt": "2024-01-22T10:00:00Z",
  "isUsed": false
}
```

### `students/{studentId}`
```json
{
  "studentId": "student123",
  "name": "John Doe",
  "unlockedQuizIds": ["builtin-q1w1", "builtin-q1w2"],
  "completedQuizIds": ["builtin-q1w1"],
  "quizAttempts": [
    {
      "id": "attempt-...",
      "quizId": "builtin-q1w1",
      "score": 85,
      "locked": true,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Testing Checklist

- [ ] Login as student
- [ ] Go to Quiz tab → see quiz locked
- [ ] Try to click locked quiz → unlock dialog appears
- [ ] Enter invalid code → error message
- [ ] Login as teacher
- [ ] Go to Students tab → select student
- [ ] Find completed quiz → "Generate Retake Code" button
- [ ] Copy generated code
- [ ] Login back as student
- [ ] Enter code in unlock dialog → success
- [ ] Quiz now shows as UNLOCKED
- [ ] Take quiz → answer all questions
- [ ] See results → quiz now LOCKED again
- [ ] Try to take again → unlock dialog appears again
- [ ] Repeat code generation & unlock process

---

## Debugging

If quiz still shows as locked after entering code:

1. **Check Firestore:**
   - `students/{studentId}/unlockedQuizIds` contains quiz ID?
   
2. **Check Browser Console:**
   - Any error in QuizUnlockDialog or AccessCodeModal?
   
3. **Check Quiz ID Format:**
   - Must be `builtin-q{quarter}w{week}`
   - Teacher codes must match exactly
   
4. **Check Data Refresh:**
   - `useStorageData` might be cached
   - Hard refresh page (Ctrl+Shift+R)
   
5. **Check Firestore Rules:**
   - Ensure students can write to `unlockedQuizIds` array

