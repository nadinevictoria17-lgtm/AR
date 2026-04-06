import type { ARModel } from '../types'

export const AR_MODELS: ARModel[] = [
  {
    id: 0,
    name: 'Atomic Structure',
    subject: 'chemistry',
    parts: ['Nucleus', 'Electrons', 'Electron Orbitals', 'Quarks'],
    facts: [
      'The nucleus contains protons and neutrons',
      'Electrons orbit the nucleus in electron shells',
      'Electrons are 2000x lighter than protons',
      'Atoms are 99.9% empty space',
      'The nucleus holds 99.9% of the atom\'s mass',
    ],
  },
  {
    id: 1,
    name: 'Plant Cell Structure',
    subject: 'biology',
    parts: ['Cell Membrane', 'Nucleus', 'Chloroplast', 'Mitochondria', 'Cell Wall', 'Vacuole'],
    facts: [
      'Plant cells have a rigid cell wall made of cellulose',
      'Chloroplasts are the site of photosynthesis',
      'The large central vacuole stores water and nutrients',
      'Cell walls provide structural support',
      'Plant cells are typically larger than animal cells',
    ],
  },
  {
    id: 2,
    name: 'Molecular Structure of Water',
    subject: 'chemistry',
    parts: ['Oxygen Atom', 'Hydrogen Atoms', 'Covalent Bonds', 'Hydrogen Bonds'],
    facts: [
      'Water is made of one oxygen and two hydrogen atoms',
      'The bonds between atoms are covalent',
      'Water is a polar molecule',
      'Hydrogen bonding makes water unique',
      'This polarity allows water to dissolve many substances',
    ],
  },

  {
    id: 4,
    name: 'DNA Double Helix',
    subject: 'biology',
    parts: ['Sugar-Phosphate Backbone', 'Base Pairs', 'Nucleotides', 'Adenine', 'Thymine', 'Guanine', 'Cytosine'],
    facts: [
      'DNA is a twisted double helix structure',
      'It contains the genetic instructions for life',
      'Base pairs follow Chargaff\'s rules (A-T, G-C)',
      'DNA replication creates exact copies',
      'Mutations can change the sequence of bases',
    ],
  },
]
