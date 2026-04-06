import type { Subject } from '../types'

export const SUBJECTS: Subject[] = [
  {
    id: 'chemistry',
    name: 'Chemistry Q1',
    shortName: 'Chemistry',
    color: 'text-subject-chemistry',
    topics: [
      {
        id: 'c1',
        name: 'Scientific Inquiry',
        subtitle: 'Models and the Scientific Method',
        icon: '🔬',
        overview: 'Learn how scientists investigate the world using models and systematic processes.',
        keyPoints: ['Scientific Models', 'The Particle Model', 'Scientific Investigation'],
      },
      {
        id: 'c2',
        name: 'The Particle Model',
        subtitle: 'Nature and States of Matter',
        icon: '⚛️',
        overview: 'Explore how tiny particles make up everything and how they behave in different states.',
        keyPoints: ['Atoms & Molecules', 'Kinetic Molecular Theory', 'Phase Changes'],
      },
      {
        id: 'c3',
        name: 'Solutions & Mixtures',
        subtitle: 'Homogeneous and Heterogeneous',
        icon: '🧪',
        overview: 'Understand how substances combine and dissolve to form solutions.',
        keyPoints: ['Solutes & Solvents', 'Saturation Levels', 'Concentration Formulas'],
      },
      {
        id: 'c4',
        name: 'Substances & Properties',
        subtitle: 'Elements, Compounds, and Acids',
        icon: '📊',
        overview: 'Identify pure substances and their chemical properties like pH.',
        keyPoints: ['Elements & Compounds', 'Acids, Bases & Salts', 'Lab Equipment Safety'],
      },
    ],
  },
  {
    id: 'biology',
    name: 'Biology Q2',
    shortName: 'Biology',
    color: 'text-subject-biology',
    topics: [
      {
        id: 'b1',
        name: 'Microscopy & Cells',
        subtitle: 'The Basic Unit of Life',
        icon: '🧬',
        overview: 'Discover the hidden world of cells using advanced magnifying tools.',
        keyPoints: ['Microscope Operation', 'Plant & Animal Cells', 'Selectively Permeable Membrane'],
      },
      {
        id: 'b2',
        name: 'Cell Reproduction',
        subtitle: 'Mitosis and Meiosis',
        icon: '🔄',
        overview: 'Learn how cells duplicate and divide to maintain life and create variation.',
        keyPoints: ['The Cell Cycle', 'Mitotic Stages', 'Gamete Formation'],
      },
      {
        id: 'b3',
        name: 'Genetics & Life',
        subtitle: 'Heredity and Energy Flow',
        icon: '🌱',
        overview: 'Explore how traits are inherited and how life processes sustain organisms.',
        keyPoints: ['DNA Structure', 'Mendelian Genetics', 'Photosynthesis'],
      },
      {
        id: 'b4',
        name: 'Bio-Systems',
        subtitle: 'Respiration and Ecology',
        icon: '🌍',
        overview: 'Understand how energy is released in cells and flows through the environment.',
        keyPoints: ['Cellular Respiration', 'Energy Flow', 'Nutrient Cycling'],
      },
    ],
  },
]
