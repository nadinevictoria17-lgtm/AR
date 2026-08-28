# AR Science Explorer — Complete Flow, Data Model & Requirements for the New Flutter Project

**Purpose of this document:** the complete handoff context for a brand-new Flutter/Dart project — a full functional specification, real data schemas, and every confirmed decision from the client, written so a fresh agent session in a new folder can start building immediately without re-deriving anything from scratch or re-asking questions that have already been answered.

## How to use this document

This is a single new Flutter project with **two build targets from one codebase**:

- **Flutter Web** — the teacher/admin experience, used on a PC.
- **Flutter Android** — the student experience, mobile, with real AR.

The **current `ar-science-explorer` React/TypeScript web repository is being fully retired**. The client wants to move away from it entirely — it is not kept running as a fallback, and it will not be extended further. Every reference to "the current web app" or "the old app" in this document means that repository, cited purely as a source of already-proven business logic and real content to port — never as a visual reference, and never as something that keeps running in production.

Read this document fully before writing any code. Where it says "replicate exactly," that is a business-logic requirement, not a suggestion — teachers and students both read/write the same Firestore data, and any drift between what one target allows and what the other expects will show up as real bugs (a code that "works" on one target but is silently rejected by rules the other target enforces).

---

## PART 1 — PRODUCT CONTEXT

### 1.1 What this product is

AR Science Explorer delivers the Philippine DepEd Junior High School science curriculum (Grade 7, based on the lesson content) across three quarters — **Quarter 1: Chemistry**, **Quarter 2: Biology**, **Quarter 3: Physics** — through **printed AR marker sheets**. A teacher prints a marker sheet per lesson week; a student scans it with a device camera to trigger a 3D model relevant to that week's topic. This is paired with written lesson content, pre-test/post-test quizzes per lesson, and progress tracking.

### 1.2 Who uses it

- **Students**: Junior High learners, working through one subject per quarter, one lesson per week, 8 weeks per quarter, 24 lessons total across the full curriculum. Assume normal early-teen digital literacy, not prior AR/tech-product experience — the first-run experience must explain the marker-scanning mechanic before assuming it's understood.
- **Teachers**: create/manage lesson content, create/manage quiz questions, manage the student roster, generate access codes that gate content, and review class-wide performance.

### 1.3 The core mechanism (what makes this product specific, not generic)

Physical, printed, quarter/week-specific AR markers that trigger 3D visualizations, directly tied to the curriculum's own quarter/week structure — not a generic "scan any image" AR toy, and not a screen-only lesson viewer. This is the product's actual differentiator and should be treated as the centerpiece of the student experience, not one tab among several.

---

## PART 2 — PROJECT STRUCTURE (the new Flutter project)

### 2.1 Repo/target split

| Concern | Target | Notes |
|---|---|---|
| Student experience (login, lessons, AR scan, quizzes, progress) | **Flutter Android build** | AR scan screen embeds the existing Unity/Vuforia project (see Part 6.0) — not a native ARCore rebuild |
| Teacher/admin experience (lesson CRUD, quiz CRUD, students, analytics, access codes, item analysis) | **Flutter Web build** | Desktop-oriented UI, not a shrunk mobile layout |
| Shared business logic, Dart data models, Firebase wiring | **Shared Dart code**, imported by both targets | One source of truth for validation rules |
| Backend | **Firebase** (Firestore + Auth) — same project, same collections, used by both targets | No new backend. No sync layer between targets — there is only one database. |

Use Flutter's platform-detection (`kIsWeb`, `Theme.of(context).platform`, or a simple app-level "which build am I" flag set at the entry point) to branch UI where the two targets genuinely diverge. Do not build two disconnected app shells that happen to share a `pubspec.yaml` — share models, services, and Firebase repositories; diverge only on screens/widgets.

### 2.2 Known, accepted trade-off

Flutter Web is less naturally suited to dense, data-heavy admin screens (tables, forms, keyboard-centric CRUD workflows) than a web-native framework (like the React app being retired) is. This was weighed against the value of one repo/one language for a team under deadline pressure, and one repo won. Build the teacher target with real desktop-appropriate layouts (data tables, not stacked cards; keyboard-friendly forms; no oversized touch targets meant for fingers) — don't let it default to looking like a stretched phone screen.

### 2.3 Platforms explicitly out of scope

- **iOS**: not being built right now. The Unity/Vuforia project embedded for AR (Part 6.0) is being targeted at Android specifically; an iOS build would need its own separate integration path. Revisit later if needed.

---

## PART 3 — ACCOUNTS, ROLES, AND AUTH

### 3.1 Role determination

There is **no explicit role field** — role is inferred purely from the email pattern used to sign in:

- **Student email pattern**: `{6-digit-id}@arscience.school` — e.g. `123456@arscience.school`. Regex used by the current app: `/^\d+@arscience\.school$/`
- **Teacher email pattern**: anything else.

Replicate this exact inference rule in the new Firebase Auth-backed login, on whichever target is authenticating (student → Android, teacher → Web). Do not add a separate "role" Firestore field as the source of truth unless the email-pattern check is also kept as the actual security boundary — Firestore security rules on the existing project are written against this same pattern-based assumption.

### 3.2 Student ID input handling

On the student login screen (Android), the ID input field must accept **either**:
- A raw numeric student ID, auto-formatted as `00-0000` while typing (strip non-digits, format as `NN-NNNN` — the first two digits, a dash, then up to four more digits), or
- A full email address (if the input contains `@`, treat it as a literal email, no auto-formatting).

The actual Firebase Auth email constructed from a raw ID follows the pattern in 3.1 — confirm the exact concatenation logic (is the dash included in the email local-part, or stripped?) against the current app's `src/lib/auth.ts` and `src/lib/firebaseAuthContext.tsx` before assuming; the auto-formatted *display* string and the *actual auth email* may differ (dashes are a UI-only formatting aid, the underlying email likely uses the plain 6 digits with no dash).

### 3.3 Auth backend

Firebase Auth, email/password. Use `firebase_auth` (FlutterFire) against the **same Firebase project** the current web app uses — same user pool, same accounts, no migration needed. A student or teacher who already has an account continues to work unchanged.

### 3.4 Session → Firestore record

On successful login, the app needs the student's Firestore record at `/students/{studentId}`. This single document is the source of truth for everything that follows in this document: which lessons are unlocked, which are completed, every quiz attempt, per-subject scores.

---

## PART 4 — DATA MODEL (verbatim reference — do not redesign these shapes)

The current web app's TypeScript types are the authoritative schema. Translate directly into Dart classes/freezed models with the same fields; do not add, remove, or rename fields without checking whether the Firestore documents already in production use the original names (renaming a field in code without a migration silently orphans existing data).

### 4.1 Core types (from `src/types/index.ts`, current repo)

```typescript
type SubjectKey = 'chemistry' | 'biology' | 'physics';

interface CurriculumContent {
  standards?: string;
  performanceStandards?: string;
  learningCompetencies?: string[];
  objectives?: string[];
  contentDetails?: string;
  integration?: { qualities?: string[]; description?: string };
}

interface ARPayload {
  modelIndex: number;
  detectionMode: 'marker' | 'surface';
  anchorHint: string;
  lessonSteps: string[];
  markerImage?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  keyIdeas?: string[];
  historicalImpact?: string[];
}

interface Lesson {
  id: string;                    // e.g. 'q1w1'
  title: string;
  subject: SubjectKey;
  topicId?: string;
  summary: string;
  steps: string[];
  labExperimentId?: string;
  arPayload?: ARPayload;
  hasAR?: boolean;                // false only for q1w5 currently
  pdfUrl?: string;                 // see Part 8 re: PPT replacement
  isUnlockedByDefault?: boolean;   // true only for q1w1 currently
  curriculum?: CurriculumContent;
  week?: number;                   // 1-8
  quarter?: number;                // 1-3
}

interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  attemptNumber: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  answers: number[];               // selected option index per question, in order
  timestamp: string;                // ISO string
  timeSpentSeconds?: number;
  locked: boolean;
}

interface QuizUnlockCode {
  id: string;
  quizId: string;
  studentId: string;
  code: string;
  generatedAt: string;
  usedAt?: string;
  expiresAt?: string;
  isUsed: boolean;
  isArchived?: boolean;
}

interface StudentRecord {
  id: string;
  uid?: string;
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
  isArchived?: boolean;
}

/**
 * Absent type is treated as 'mc' everywhere (back-compat with existing data).
 * For 'tf': True = index 0, False = index 1, options stored as
 * ['True', 'False', '-', '-'] so correctIndex === optionIndex scoring
 * keeps working unchanged for both question types.
 */
type QuestionType = 'mc' | 'tf';

interface TeacherQuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  hint: string;
  type?: QuestionType;
}

/** Which test a quiz belongs to. Absent ⇒ treated as 'post' for legacy quizzes. */
type QuizPhase = 'pre' | 'post';

interface TeacherQuiz {
  id: string;
  title: string;
  subject: SubjectKey;
  topicId?: string;
  questions: TeacherQuizQuestion[];
  createdAt: string;
  phase?: QuizPhase;
}

interface TeacherLesson {
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
  quarter?: number;
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

interface BuiltInQuestion {
  id: string;
  subject: SubjectKey;
  topicId?: string;
  lessonId?: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  hint: string;
  type?: QuestionType;
}
```

### 4.2 Firestore collection map

```
/students/{studentId}                          — StudentRecord (see 4.1)
/students/{studentId}/quizAttempts/{attemptId}  — individual QuizAttempt documents
                                                   (in addition to the quizAttempts[]
                                                   array embedded in the student doc —
                                                   check the current repo's storage.ts
                                                   for exactly which one is the write
                                                   source of truth vs. a denormalized
                                                   read copy before assuming both need
                                                   writing on every attempt)
/quizzes/{quizId}                               — TeacherQuiz (teacher-authored quizzes)
/lessons/{lessonId}                             — TeacherLesson (teacher-authored lessons)
/quizUnlockCodes/{codeId}                       — QuizUnlockCode
```

**Important distinction**: the 24 built-in curriculum lessons (Section 5 below) and their associated pre/post-test question banks are **not** Firestore documents — they ship as static Dart data compiled into the app itself, mirroring `src/data/curriculum.ts`, `src/data/lessons.ts`, and the `q{N}QuizTemplates.ts` files in the current repo. Only **teacher-created** lessons/quizzes (made via the Teacher Web CRUD) live in Firestore. Both sources need to be merged at read time (built-in + Firestore) wherever the app lists lessons or quizzes — replicate the current app's merge behavior (`mergedLessons` pattern in `ARLabScreen.tsx`/`LearnScreen.tsx`): built-ins first, then Firestore-authored ones, de-duplicated by id.

### 4.3 Example real StudentRecord document (illustrative shape, not real student data)

```json
{
  "id": "123456",
  "studentId": "123456",
  "name": "Juan Dela Cruz",
  "grade": "7",
  "section": "Rizal",
  "scores": { "chemistry": 85, "biology": null, "physics": null },
  "completedLessonIds": ["q1w1", "q1w2"],
  "completedLabExperimentIds": [],
  "completedQuizIds": ["builtin-q1w1-pre", "builtin-q1w1-post"],
  "unlockedLessonIds": ["q1w1", "q1w2", "q1w3"],
  "unlockedQuizIds": ["builtin-q1w1-post"],
  "quizAttempts": [
    {
      "id": "attempt-abc123",
      "quizId": "builtin-q1w1-post",
      "studentId": "123456",
      "attemptNumber": 1,
      "score": 80,
      "totalQuestions": 5,
      "correctAnswers": 4,
      "answers": [2, 0, 1, 3, 0],
      "timestamp": "2026-08-20T09:15:00.000Z",
      "timeSpentSeconds": 340,
      "locked": true
    }
  ],
  "isArchived": false
}
```

---

## PART 5 — THE FULL CURRICULUM (all 24 lessons, real titles)

Quarter/subject/week structure, exactly as it exists in the current app's `src/data/curriculum.ts`. Every lesson id follows the pattern `q{quarter}w{week}`.

### Quarter 1 — Chemistry

| ID | Week | Title | Unlocked by default | Has AR |
|---|---|---|---|---|
| q1w1 | 1 | Scientific Models and the Particle Model of Matter | **Yes** | Yes |
| q1w2 | 2 | Pure Substances and Kinetic Molecular Theory of Matter | No | Yes |
| q1w3 | 3 | States of Matter and Particle Arrangement | No | Yes |
| q1w4 | 4 | Designing a Scientific Investigation | No | Yes |
| q1w5 | 5 | Planning and Recording Scientific Investigations | No | **No** (intentionally no marker/model) |
| q1w6 | 6 | Standard Units and Measuring Physical Quantities | No | Yes |
| q1w7 | 7 | Properties of Solutions: Solubility and Concentration | No | Yes |
| q1w8 | 8 | Factors Affecting Solubility and Proper Lab Handling | No | Yes |

### Quarter 2 — Biology

| ID | Week | Title | Unlocked by default | Has AR |
|---|---|---|---|---|
| q2w1 | 1 | The Compound Microscope | No | Yes |
| q2w2 | 2 | Plant and Animal Cells | No | Yes |
| q2w3 | 3 | Unicellular and Multicellular Organisms | No | Yes |
| q2w4 | 4 | Two Types of Cell Division: Mitosis and Meiosis | No | Yes |
| q2w5 | 5 | Process of Meiosis and Fertilization | No | Yes — **see the flagged marker-quality issue in Part 6.4** |
| q2w6 | 6 | Sexual and Asexual Reproduction | No | Yes |
| q2w7 | 7 | Unity in Diversity: Levels of Biological Organization | No | Yes |
| q2w8 | 8 | The Ecosystem: Food Chains and Food Webs | No | Yes |

### Quarter 3 — Physics

| ID | Week | Title | Unlocked by default | Has AR |
|---|---|---|---|---|
| q3w1 | 1 | Motion: Distance, Displacement, and Velocity | **Yes** | Yes |
| q3w2 | 2 | Balanced and Unbalanced Forces – Force Diagrams | No | Yes |
| q3w3 | 3 | Free-Body Diagrams and Force Analysis | No | Yes |
| q3w4 | 4 | Motion: Distance, Displacement, and Scalar vs Vector Quantities | No | Yes |
| q3w5 | 5 | Speed and Velocity: Calculations and Concepts | No | Yes |
| q3w6 | 6 | Motion Graphs: Distance-Time and Displacement-Time Analysis | No | Yes |
| q3w7 | 7 | Heat and Temperature: Thermal Conductors and Insulators | No | Yes |
| q3w8 | 8 | Methods of Heat Transfer: Conduction, Convection, and Radiation | No | Yes |

Every lesson beyond the two marked "Unlocked by default" requires an access code (Part 9) the first time a student reaches it.

Every lesson (except q1w5) has: full curriculum content (standards, performance standards, learning competencies, objectives), a pre-test (taken before the lesson), an AR marker + 3D model, and a post-test (taken after the Read phase). Port the actual curriculum text content verbatim from `src/data/curriculum.ts` — it is real DepEd-aligned material, not filler, and must not be paraphrased or shortened during the port.

---

## PART 6 — THE AR EXPERIENCE (full detail)

### 6.0 Confirmed architecture decision: embed the existing Unity/Vuforia project, do not rebuild AR natively

**This supersedes any earlier assumption of a from-scratch ARCore rebuild.** The client already has a working, trained Vuforia AR scanner built in Unity (the original project this whole system started from). Rather than throwing that away and re-training marker detection from scratch against ARCore, the AR piece specifically is built by **embedding the existing Unity project inside the Flutter app** using Unity-as-a-Library, via the `flutter_embed_unity` (or `flutter_unity_widget`) package.

**What this means concretely:**

- **Still one app, one APK.** Unity is not launched as a separate app via an Android Intent — it runs as an embedded view/widget inside a Flutter screen, in the same process, same session. There is no re-login, no app-switching, no separate install. From the student's perspective it's one continuous app.
- **Strict division of labor** — this is the part to hold to strictly when building either side:
  - **Unity owns exactly one thing: the camera feed, marker tracking, and 3D model rendering.** Nothing else. Unity does not draw its own buttons, its own back arrow, its own instructional text, or its own description panels.
  - **Flutter owns everything else.** The back button, the loading state, the "point your camera at the marker" instruction, the short description shown once a marker locks on, the rotate/zoom interaction hints — all of it is built as ordinary Flutter widgets, styled consistently with the rest of the app.
- **Layering, technically**: a Flutter `Stack` widget, with the embedded Unity view as the bottom layer and all Flutter UI chrome (back button, description overlay, etc.) as widgets layered on top of it. This is the standard pattern for this kind of embed, not something bespoke to this project.
- **The only signal that needs to cross from Unity into Flutter is marker detection state** — a simple `"marker found"` / `"marker lost"` message via the plugin's message-passing bridge. Flutter reacts to that one signal by showing/hiding whatever overlay is appropriate (the description panel, the rotate/zoom hint chips). Unity does not need to know or send anything about *what* the description text says — Flutter already has that from its own lesson data (Firestore/static curriculum) the moment the student opened this lesson, before the Unity view even appears.
- **One Unity instance per app lifetime, not one per scan.** These embedding plugins generally support a single Unity instance that gets *shown and hidden* repeatedly, not destroyed and recreated on every AR entry/exit — destroying and recreating it is the unreliable part. The correct pattern: initialize Unity once, then each time a student enters a lesson's Scan phase, tell the already-running Unity instance (via the message bridge) which marker/model set to load for *this* lesson, show the view; on back-navigation, hide the view again rather than tearing it down.
- **Known fragility risk, accepted deliberately, worth testing early, not the night before a demo**: Unity-as-a-Library was designed to run fullscreen; embedding it into a widget is a supported but "delicate" use of the plugin (its own documentation's word), relying on some undocumented Unity internals and workarounds. It can behave differently across Unity/Flutter version bumps. This is a real, documented trade-off accepted in exchange for reusing already-working, already-trained AR scanning logic instead of rebuilding and retraining it from zero.

### 6.0.1 Worked example — Democritus Atom (Q1W1), using real existing content

This is not a hypothetical — this is the actual data already in the current app's schema for this lesson (`arPayload` on lesson `q1w1`), which the Flutter description overlay should display verbatim once Unity reports `"marker found"` for this lesson:

```json
{
  "title": "Democritus Atom",
  "subtitle": "Ancient Greek Atomic Theory (c. 400 BCE)",
  "description": "Democritus proposed that all matter consists of tiny, indivisible particles called \"atomos\".",
  "keyIdeas": [
    "Smallest, indestructible building blocks of matter",
    "Particles in constant, random motion",
    "Differ in shape and size",
    "Form all materials in the universe"
  ]
}
```

So, concretely, on the Scan screen for this specific lesson: the Unity view underneath is just rendering the live camera feed and, once the Q1W1 marker is recognized, the 3D Democritus/atom model anchored to it. The instant Unity reports that detection, the Flutter overlay on top fades in showing **"Democritus Atom" / "Ancient Greek Atomic Theory (c. 400 BCE)"** as a title/subtitle pair, the one-sentence description beneath it, and the `keyIdeas` list available (either always visible alongside, or behind a small "Learn more" expand — either is fine, this document doesn't mandate the exact layout, only that this real content is what populates it, not placeholder text).

Note `historicalImpact` also exists as an optional field on the `ARPayload` type (Part 4.1) but is **not populated** for Q1W1 specifically in the current data — some lessons may use it, some may not; treat it as available-if-present, not guaranteed.

### 6.1 Marker → 3D model mapping (all 23 AR-enabled lessons)

Every marker image is a `.jpg` (already exist as `assets/markers/*.jpg`). Since the AR scan itself is the embedded Unity/Vuforia project (Part 6.0), these markers are **already trained in Vuforia's own format** inside that existing Unity project — no retraining step is needed the way it would be for a from-scratch ARCore build. The `.jpg` files here are the reference source images (for display/printing purposes, and for the Flutter side to know what a marker looks like), not something that needs re-processing into a new tracking format. Every 3D model is a `.glb` (`assets/models/*.glb`) — these are the same models already used inside the existing Unity project.

| Lesson | Marker | 3D Model file |
|---|---|---|
| Q1W1 | Q1W1.jpg | democritus_atom.glb |
| Q1W2 | Q1W2.jpg | waterpolarity.glb |
| Q1W3 | Q1W3.jpg | solid_liquid_gas.glb |
| Q1W4 | Q1W4.jpg | particle_motion_temperature.glb |
| Q1W5 | — (no AR) | — |
| Q1W6 | Q1W6.jpg | beakers.glb |
| Q1W7 | Q1W7.jpg | saturated_unsaturated.glb |
| Q1W8 | Q1W8.jpg | salt_dissolving_in_water.glb |
| Q2W1 | Q2W1.jpg | Microscope.glb |
| Q2W2 | Q2W2.jpg | plant_cell.glb |
| Q2W3 | Q2W3.jpg | prokaryoticCell.glb |
| Q2W4 | Q2W4.jpg | mitosis_phases.glb |
| Q2W5 | Q2W5.jpg | Fertilization_Model_Light.glb |
| Q2W6 | Q2W6.jpg | amoeba_binary_fission.glb |
| Q2W7 | Q2W7.jpg | biological_organization.glb |
| Q2W8 | Q2W8.jpg | food_web.glb |
| Q3W1 | Q3W1.jpg | spring.glb |
| Q3W2 | Q3W2.jpg | inclined_plane_slide_playground.glb |
| Q3W3 | Q3W3.jpg | seesaw.glb |
| Q3W4 | Q3W4.jpg | compass.glb |
| Q3W5 | Q3W5.jpg | car.glb |
| Q3W6 | Q3W6.jpg | jeepney.glb |
| Q3W7 | Q3W7.jpg | thermometer.glb |
| Q3W8 | Q3W8.jpg | spoon.glb |

The mapping key is always `Q{quarter}W{week}` — derive it programmatically from the lesson's `quarter`/`week` fields rather than hardcoding per-lesson, mirroring the current app's `getARConfig(quarter, week)` function. A lesson's `arPayload.markerImage` can override the derived marker path if explicitly set; otherwise derive it.

### 6.2 The three-phase lesson flow (Scan / Read / Review)

This is a single lesson screen with an internal tab bar, not three separate screens/routes:

**Phase 1 — Scan**
1. Show instructions for the physical marker sheet (a "print this marker" flow, sized correctly for a standard page).
2. This live camera view is the **embedded Unity/Vuforia view** described in Part 6.0 — shown as a Flutter widget via `flutter_embed_unity`/`flutter_unity_widget`, with Flutter UI chrome layered on top of it in a `Stack`. Unity handles camera + tracking + model rendering only; it reports detection state to Flutter via a simple message bridge.
3. On marker detection: Unity anchors the 3D model to the marker's live tracked position and orientation, continuing to track as the physical marker or camera moves — this is continuous tracking, not a one-shot snapshot. Unity sends a `"marker found"` message across the bridge; Flutter reacts by showing its description overlay (Part 6.0.1) and rotate/zoom hints.
4. On marker loss (marker leaves frame or gets occluded): Unity sends a `"marker lost"` message; Flutter reacts by hiding those overlays and showing a "point your camera at the marker" instruction again.
5. Voice narration: the retired web app has a scripted TTS voice-over feature per lesson, togglable language (English/Filipino). Carry this over — check `src/data/voiceScripts.ts` and `src/hooks/useVoiceOver.ts` in the current repo for the exact script content and structure.

**Phase 2 — Read**
1. Full written curriculum content: standards, performance standards, learning competencies, objectives — verbatim from Part 5's source data.
2. A "Mark as Read" / "Mark Complete" action button, which updates `completedLessonIds` on the student's Firestore record.

**Phase 3 — Review**
1. A completion summary for the lesson (e.g. "Lesson Complete").
2. Two actions: **Start Post-Test** (see Part 7 for exact eligibility rules — this must check real-time Firestore eligibility, not a cached/stale unlock state, since a teacher may have just issued a code), or **Go to Progress**.

### 6.3 AR interaction requirements (from direct client notes — build these deliberately, they are not incidental)

- **Readable, appropriately-sized text on screen during AR.** Any label/instruction shown during the live camera view must use fonts sized for a phone held at arm's length and legible to a range of ages (a teacher, panel member, or parent may be looking at the same screen as the student during a demo, not just the student themselves). Do not reuse the retired web app's smallest caption sizes (9–11px equivalents) here.
- **A short description visible alongside the model** the moment it locks on — a 1–2 sentence label of what the student is looking at, shown concurrently with the AR view, not hidden behind a separate tap.
- **Drag-to-rotate, pinch-to-zoom on the model itself**, independent of the physical marker's position — lets a student inspect the model closely without needing to physically move the camera or the printed sheet. This exact interaction pattern was already built and confirmed working in the retired web app (`public/ar-viewer.html`, mouse-drag → rotation, wheel/pinch → scale), and the client's own handwritten notes label this feature directly on a sketch of the original Vuforia scanner ("NavOrotate" / "ScanAble"), which strongly suggests **the existing Unity/Vuforia scene already implements this natively** — since Unity owns the 3D rendering under the embedding architecture (Part 6.0), rotate/zoom on the model is Unity's own touch-handling on its embedded view, not something Flutter needs to rebuild or bridge. **Verify this against the existing Unity project directly before assuming it needs rebuilding** — if it already works there, it comes along for free with the embed; if it doesn't yet exist in the Unity scene, it needs to be added on the Unity/C# side, not the Flutter side.
- **Models should read as colorful and interactive**, not flat/monochrome geometry — this is partly an asset-authoring concern (how the `.glb` files are textured) and partly a viewer concern (don't strip/override texture or vertex-color data the model already carries).
- **Play any animation the model already has.** Some `.glb` files may carry baked-in animation clips (the retired web app used an `animation-mixer`-style component to play these automatically on load) — detect and autoplay these rather than only ever rendering a static mesh with manual rotation as the only motion.
- **Complex multi-part models need an in-app guide.** The client's example is a heart model: for any model with multiple distinct, individually-meaningful parts, add a lightweight in-app legend or tappable-hotspot overlay labeling those parts, rather than leaving the student to guess. Decide which specific models need this case by case (not literally all 23) — a simple single-object model (e.g. a spring, a compass) likely doesn't need it; a multi-chambered heart or a labeled cell diagram likely does.

### 6.4 Known content gap — flag, do not silently "fix" by recompiling

**Q2W5's marker image** ("Process of Meiosis and Fertilization") is a flat, low-detail, multi-color diagram-style image. Under automated image-tracking verification on the retired web build (a script that fed each marker's own image into a simulated camera and confirmed detection), 22 of 23 markers detected reliably — **Q2W5 was the one exception there**, and it was not a compile bug: the image itself has too few distinctive visual features (mostly flat color regions and repetitive line patterns) for MindAR's feature-based tracking to lock onto confidently.

**This does not carry over to the new build.** Confirmed directly by the client: **the existing Unity/Vuforia project already handles Q2W5's marker (and all the other models) well.** Vuforia's tracking is more robust than MindAR's was for this specific image — since the AR scan screen embeds that existing, already-working Vuforia project (Part 6.0), this is a non-issue for the new build. No marker redesign is needed for Q2W5. This is left documented here only as project history (why this looked like a problem earlier, and why it isn't one now), not as an open risk.

---

## PART 7 — QUIZZES: PRE-TEST, POST-TEST, AND THE RETAKE RULE

This is called out by the client as the single most important behavior to get exactly right.

### 7.1 The rule, stated precisely

- **Pre-Test**: taken *before* a lesson. **Always retakeable, with no access code required, ever** — not just on the first attempt. A student can retry a pre-test as many times as they want, immediately, with zero gating.
- **Post-Test**: taken *after* the lesson's Read phase is marked complete. **The first attempt requires no access code.** Only a **retake** (a second or later attempt) requires a teacher-issued access code.

Do not conflate these two rules — a pre-test needing no code *ever* and a post-test needing no code *only on attempt one* are different rules, and mixing them up (e.g. accidentally gating first-attempt post-tests, or accidentally requiring a code for pre-test retakes) is exactly the kind of regression this document exists to prevent.

### 7.2 Quiz identity and phase

Quizzes are keyed by `builtinQuizId(lessonId, phase)` in the current app (check `src/lib/quizId.ts` for the exact string format — likely something like `builtin-{lessonId}-{phase}`). Each lesson has up to two quizzes: one `phase: 'pre'`, one `phase: 'post'`. A legacy quiz with no `phase` field is treated as `'post'`.

### 7.3 Quiz player mechanics

- One question at a time, either multiple-choice (4 options, A–D) or true/false (2 options, using slots 0/1 of the same 4-slot options array — see the `QuestionType` convention in Part 4.1).
- A hint system: **3 hints per quiz attempt**, tracked per-question (a question already hinted cannot be hinted again in the same attempt).
- Immediate right/wrong feedback per question before advancing.
- A "back"/exit action mid-quiz must ask for confirmation — leaving mid-quiz submits whatever's currently answered as the final attempt, it does not silently discard progress.
- Scoring: `score = round((correctAnswers / totalQuestions) * 100)`. Pass threshold: **50%**.

### 7.4 Results screen behavior

- **Pass**: positive framing. An auto-continue to the Progress screen after a few seconds, **but it must be visibly cancelable** — show a countdown the student can tap to cancel and stay on the results screen. Do not force-navigate away without giving the student a way to stop it; this was an explicit usability fix made in the retired web app (it originally force-redirected regardless of pass/fail, which was identified as a real problem and fixed — do not reintroduce it).
- **Fail**: **no auto-redirect at all.** Let the student read and sit with the result. State the actual retry rule plainly and specifically (pre-tests: retry anytime, no code needed; post-tests: ask your teacher for a retake code) rather than a vague "ask your teacher" dead end that doesn't explain what's actually possible.

### 7.5 Item analysis — NEW requirement, belongs on the Teacher Web target

The client has requested **item analysis** for pre-test/post-test results. This is a standard educational-assessment concept, computed per question, across all students who attempted a given quiz:

- **Difficulty index (p-value)**: `(number of students who answered this question correctly) / (total students who attempted this quiz)`. Ranges 0–1; conventionally, a value near 0.3–0.7 is considered well-balanced, very high (~0.9+) means "too easy," very low (~0.1 or below) means "too hard" (or the question itself may be flawed).
- **Discrimination index**: sort students by their total quiz score, split into a top group (commonly top ~27%) and a bottom group (bottom ~27%), then compute `(top group's correct rate on this question) - (bottom group's correct rate on this question)`. A well-functioning question should be answered correctly more often by high scorers than low scorers (a positive discrimination value); a negative value flags a genuinely bad question (low scorers doing *better* on it than high scorers is a red flag that the question or its key answer may be wrong).
- **Distractor analysis** (optional, multiple-choice only): for each wrong option, what fraction of students chose it — useful for spotting an option that's accidentally ambiguous or that nobody ever picks (a "dead" distractor not doing useful work).

**This is a teacher-facing reporting feature, computed across many students' attempts on one quiz — it belongs on the Flutter Web (teacher) target**, most likely surfaced somewhere in a Quizzes or Analytics section there. It is not something an individual student's Android app needs to display. The underlying data needed to compute it (`quizAttempts[]`, each with a full `answers[]` array recording exactly which option every student picked per question) already exists in the current schema (Part 4.1) — this is a reporting feature built on existing data, not a new data-collection requirement.

**Confirm this scope placement with the client/panel before building** — it is flagged here as the correct default read of the requirement, not as something already double-confirmed.

---

## PART 8 — LESSON CONTENT FORMAT: PDF → PPT (new requirement)

### 8.1 Current behavior (being replaced)

The retired web app lets a teacher upload one PDF per lesson, currently stored as a base64 data URL directly in the browser's `localStorage` (referenced via a `local:{lessonId}` pseudo-URL scheme in the lesson's `pdfUrl` field). This was already a known technical limitation of the old app (no real file storage, doesn't sync across devices, browser storage size limits) — do not carry this storage approach forward into the new project regardless of file format.

### 8.2 New requirement

Client rationale, direct quote (paraphrased from Filipino): *students find PDFs boring and don't want to read them.* Requested change:

- **Teachers (Web target) should be able to import a PowerPoint file (PPT/PPTX)** as a lesson's content, instead of (or in addition to) a PDF.
- **Students (Android target) should be able to view/export that same content.**

### 8.3 Implementation guidance

- **Move lesson content storage to Firebase Storage**, not `localStorage` — this is a good opportunity to fix the underlying storage approach at the same time as the format change, regardless of which file format ends up supported.
- **Viewing a raw PPTX file natively on Android is a much harder problem than viewing a PDF** — there is no universal built-in PPTX renderer the way PDF viewing is comparatively well-supported. The realistic, buildable approach: **convert the PPTX to a sequence of slide images (or a single PDF) at import time**, on the teacher/Web side, then have the student app simply display those images/pages — this avoids needing a full PowerPoint-rendering engine on-device. **Confirm this conversion-based approach with the client before committing to it as the plan** — "students view the raw .pptx file natively" is a substantially larger undertaking than "students view slide images exported from a .pptx at upload time," and the client's actual requirement (make it feel more like slides, less boring than a PDF) is fully satisfiable by the image-based approach without needing native PPTX rendering at all.

---

## PART 9 — THE ACCESS-CODE SYSTEM (replicate exactly, do not redesign)

One access-code entry flow, reused everywhere a code is needed: locked lesson cards, locked post-test retakes, a standalone "enter code" screen, and a code-entry box on the Home screen.

### 9.1 Three code types

1. **Subject/lesson-wide code** — unlocks either an entire subject or a specific list of lessons, for **any** student who enters it (not targeted to one student).
2. **Lesson-specific code** — unlocks one lesson (or first-time test access for one quiz) for **one specific, targeted student** (`QuizUnlockCode.studentId` / an equivalent targeting field on the lesson-unlock variant).
3. **Quiz-retake code** — one-time-use, targeted to one specific student, **only issuable by a teacher after that student has already completed the relevant post-test once**. This is the mechanism that satisfies the Part 7.1 rule: post-test retakes need a code, and that code can only exist once a first attempt is on record.

### 9.2 Validation order (replicate exactly)

When a code is submitted, check in this order, stopping at the first match:

1. Quiz-retake codes (auto-generated, stored separately from general unlock codes)
2. Subject codes with an explicit lesson-ID list
3. Full-subject codes (no lesson list — unlocks the whole subject)
4. First-time test-unlock codes (type `'lesson'`, but being redeemed against a quiz)
5. Manually-created quiz-retake codes (type `'quiz'` in the general unlock-codes store, distinct from #1's auto-generated ones)
6. Single specific-lesson codes

A student-targeted code must check the entering student's ID matches the code's target before applying. A one-time-use code must check it hasn't already been used by this student before applying.

### 9.3 Error messaging (a real UX fix worth preserving)

When a code is rejected for any reason, the error message must **echo back the exact code the student typed** — e.g. `Code "XYZ123" isn't valid. Check with your teacher.` — rather than a generic "invalid code" message that doesn't confirm what was actually entered. This was identified as a real usability gap in the retired web app and fixed there; carry the fix forward rather than reintroducing the generic version.

### 9.4 Success feedback

On a successful unlock, show a clear, positive confirmation — this is a genuine "unlocked something" moment for a student and deserves a real acknowledgment beat, not just a form field silently closing.

---

## PART 10 — HOME, LEARN, AND PROGRESS SCREENS (Android/student target)

### 10.1 Home screen
- Current quarter/week (derived from the first lesson in curriculum order the student hasn't completed yet).
- Greeting using the student's first name (fall back to their student ID if no name is on record).
- Overall percent complete: `completedLessonIds.length / 24`.
- **"Continue where you left off"**: the next incomplete lesson in strict curriculum order (q1w1 → q1w2 → ... → q3w8). Tapping it should jump straight into that lesson's AR Lab screen (Part 6), not the lesson list.
- Two stat tiles: lessons completed, quizzes/tests taken.
- Last 3 quiz attempts, most recent first, with score % and color-coded pass/fail (≥80% good/green, 50–79% caution/amber, <50% needs-work/red — use these exact thresholds, they encode the actual pass line from Part 7.3).
- An access-code entry box (Part 9).

### 10.2 Learn (lesson browser)
- A subject tab switcher: Chemistry / Biology / Physics, always in that fixed order (matching Quarter 1/2/3).
- A list/grid of lesson cards for the active subject (8 per subject).
- **Unlocked card**: shows title, week, one-line summary; tapping enters the AR Lab. If the lesson has a pre-test, a "Pre-Test" quick-launch affordance should be visible on the card itself (skip straight to quiz mode without entering the lesson first).
- **Locked card**: **do not fully hide or gray out the title/summary.** A student should be able to read what a locked lesson is about before deciding whether to go ask a teacher for a code. Tapping a locked card opens the access-code modal scoped to that lesson. Label the locked state as "not yet available," with a clear "Unlock with your teacher's code" call to action — not a dead-end "locked" wall with no next step. (This exact framing — punitive-looking locked cards — was flagged and fixed in the retired web app; don't reintroduce the punitive version.)
- A lesson counts as unlocked if `lesson.isUnlockedByDefault === true` OR the student's `unlockedLessonIds` (Firestore) contains that lesson's id.

### 10.3 Progress screen
- Every lesson's completion status, grouped by subject.
- Every quiz attempt (best score, latest score, per-question correct/incorrect breakdown), grouped by subject.
- Per-question correctness indicators need a genuinely accessible visual + text label (not color-only, not hover-only/tooltip-only) — this was a real accessibility gap in the retired web app (relied on browser tooltips that don't reach touch/screen-reader users); build it correctly from the start here rather than porting that gap.

---

## PART 11 — WHAT MUST BE 1:1 (do not deviate without confirming with the client)

- Every rule in Parts 3, 7, and 9 — the auth email-pattern inference, the pre-test/post-test access rules, and the access-code validation order/types. These are business logic enforced against shared Firestore data used by both targets; drifting from them on one target silently breaks the other.
- The curriculum content itself (Part 5's titles, and the full standards/competencies/objectives text in the source repo) — real, already-written, DepEd-aligned material. Port it verbatim, do not paraphrase or trim it during the port.
- The quarter → subject mapping (Q1 = Chemistry, Q2 = Biology, Q3 = Physics) and the fixed 8-week structure per quarter.
- The scoring formula and 50% pass threshold (Part 7.3).

## PART 12 — WHAT IS EXPLICITLY FREE TO REDESIGN

- All visual design on both targets — colors, typography, layout, component style, iconography, motion. Neither target is a visual port of the retired web app.
- Navigation structure and screen composition, as long as every flow documented above remains reachable and every rule above still holds.
- The specific animation/motion language, as long as the underlying state transitions (e.g. Part 7.4's pass/fail behavior) are preserved.

---

## PART 13 — OPEN QUESTIONS TO CONFIRM BEFORE BUILDING (do not silently assume either answer)

1. **Item analysis (Part 7.5)** — confirm it belongs on the Flutter Web (teacher) target, not the Android (student) target.
2. **PPT support (Part 8)** — confirm the "students export/view" requirement can be satisfied by slide-images-rendered-from-pptx at import time, rather than a true native in-app PPTX renderer, since the latter is a substantially larger undertaking on Android with no clear off-the-shelf solution.
3. **iOS** — confirmed out of scope for now (Android-only). Written down here so it isn't re-litigated later from a verbal-only understanding.
4. **Flutter Web for the teacher target** — accepted as a deliberate one-repo trade-off (Part 2.2). Flagged here as a documented decision, not a surprise, if that build needs real design effort to feel like a proper desktop tool rather than a stretched phone screen.
5. **Exact auth email construction from a raw student ID** (Part 3.2) — confirm against the current repo's actual auth code before assuming the dash-formatted display string is or isn't part of the real backing email address.
6. **Which Firestore write is the source of truth for a quiz attempt** (Part 4.2's callout) — the embedded `quizAttempts[]` array on the student document, the `/students/{id}/quizAttempts/{attemptId}` subcollection, or both — confirm against `src/lib/storage.ts` in the current repo before building write logic that might create a divergence between the two.
7. **Does the existing Unity/Vuforia scene already implement rotate/zoom on the model** (Part 6.3's callout)? Verify directly rather than assuming either way — determines whether that interaction is inherited for free from the embed or needs adding on the Unity/C# side.

**Confirmed, not open — recorded here for traceability:**
- The AR scan screen embeds the existing Unity/Vuforia project via Unity-as-a-Library (`flutter_embed_unity`/`flutter_unity_widget`), rather than rebuilding tracking natively against ARCore. See Part 6.0 for the full architecture and the accepted fragility trade-off.
- **Vuforia already tracks all 23 models well, including Q2W5** — the marker-quality concern flagged from the web build's MindAR testing does not apply to the new build. See Part 6.4.
