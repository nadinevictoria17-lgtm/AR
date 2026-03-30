import type { Lesson } from '../types'

export const LESSONS: Lesson[] = [
  {
    id: 'lesson-ph-motion',
    title: 'Motion and Force Basics',
    subject: 'physics',
    summary: 'Learn how balanced and unbalanced forces affect moving objects.',
    labExperimentId: 'ph-exp1',
    steps: [
      'Observe the object at rest and in motion.',
      'Compare applied force against friction.',
      'Predict movement changes using Newtons laws.',
    ],
    arPayload: {
      modelIndex: 0,
      detectionMode: 'marker',
      anchorHint: 'Aim at cyan worksheet marker.',
      lessonSteps: ['Scan marker', 'Lock model', 'Rotate to inspect force vectors'],
    },
  },
  {
    id: 'lesson-bio-cells',
    title: 'Inside the Plant Cell',
    subject: 'biology',
    summary: 'Explore cell parts and connect each organelle to its function.',
    labExperimentId: 'b-exp1',
    steps: [
      'Identify cell wall and membrane.',
      'Trace chloroplast role in photosynthesis.',
      'Compare vacuole size with animal cells.',
    ],
    arPayload: {
      modelIndex: 1,
      detectionMode: 'surface',
      anchorHint: 'Place model on a flat desk surface.',
      lessonSteps: ['Detect surface', 'Place cell model', 'Tap organelles for labels'],
    },
  },
  {
    id: 'lesson-chem-molecule',
    title: 'Water Molecule Structure',
    subject: 'chemistry',
    summary: 'Understand atom bonds and molecular polarity in H2O.',
    labExperimentId: 'c-exp1',
    steps: [
      'Locate oxygen and hydrogen atoms.',
      'Observe bond angles and polarity.',
      'Relate polarity to dissolving behavior.',
    ],
    arPayload: {
      modelIndex: 2,
      detectionMode: 'marker',
      anchorHint: 'Scan pink chemistry card.',
      lessonSteps: ['Scan card', 'Show molecule', 'Toggle bond simulation'],
    },
  },
]
