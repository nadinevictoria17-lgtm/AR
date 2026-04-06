import type { BuiltInQuestion } from '../types'

export const QUIZ_QUESTIONS: BuiltInQuestion[] = [
  // --- LESSON Q1W1: Scientific Models and Particle Model ---
  { id: 'q1w1-q1', subject: 'chemistry', lessonId: 'q1w1', topicId: 'c1', question: 'Why do scientists use models to study matter?', options: ['Because atoms are too small to see', 'To make learning harder', 'Because they prefer theory to reality', 'It is always more accurate'], correctIndex: 0, hint: 'Think about scale' },
  { id: 'q1w1-q2', subject: 'chemistry', lessonId: 'q1w1', topicId: 'c1', question: 'What is the particle model of matter?', options: ['All matter is solid', 'All matter is made of tiny particles', 'Matter has no particles', 'Particles are only in gases'], correctIndex: 1, hint: 'Read the lesson title' },
  { id: 'q1w1-q3', subject: 'chemistry', lessonId: 'q1w1', topicId: 'c1', question: 'Who first proposed the concept of atoms?', options: ['Democritus', 'Newton', 'Einstein', 'Curie'], correctIndex: 0, hint: 'Ancient Greek philosopher' },
  { id: 'q1w1-q4', subject: 'chemistry', lessonId: 'q1w1', topicId: 'c1', question: 'What property distinguishes solids, liquids, and gases?', options: ['Color', 'Particle arrangement and motion', 'Weight', 'Temperature'], correctIndex: 1, hint: 'Think about particle spacing' },
  { id: 'q1w1-q5', subject: 'chemistry', lessonId: 'q1w1', topicId: 'c1', question: 'In the particle model, what happens during a change of state?', options: ['Particles disappear', 'Particle arrangement changes', 'New particles form', 'Nothing changes'], correctIndex: 1, hint: 'Think about melting or boiling' },

  // --- LESSON Q1W2: Particle Nature of Water ---
  { id: 'q1w2-q1', subject: 'chemistry', lessonId: 'q1w2', topicId: 'c1', question: 'What makes a water molecule polar?', options: ['It is always moving', 'Unequal electron distribution', 'It has three atoms', 'It contains oxygen'], correctIndex: 1, hint: 'Think about charge distribution' },
  { id: 'q1w2-q2', subject: 'chemistry', lessonId: 'q1w2', topicId: 'c1', question: 'How do water molecules interact in liquid state?', options: ['No interaction', 'Hydrogen bonding', 'Repulsion only', 'They ignore each other'], correctIndex: 1, hint: 'Strong attractions between water molecules' },
  { id: 'q1w2-q3', subject: 'chemistry', lessonId: 'q1w2', topicId: 'c1', question: 'What happens to particle motion when water freezes?', options: ['Motion increases', 'Motion decreases significantly', 'Motion stops completely', 'Motion becomes random'], correctIndex: 1, hint: 'Particles become more ordered' },
  { id: 'q1w2-q4', subject: 'chemistry', lessonId: 'q1w2', topicId: 'c1', question: 'Why is water denser in liquid state than solid?', options: ['Particles are heavier', 'Particles are closer together', 'Ice is not really water', 'Temperature affects density'], correctIndex: 1, hint: 'Pack them tighter' },
  { id: 'q1w2-q5', subject: 'chemistry', lessonId: 'q1w2', topicId: 'c1', question: 'What role do hydrogen bonds play in water properties?', options: ['They cause evaporation only', 'They give water unique properties', 'They are not important', 'They only exist in ice'], correctIndex: 1, hint: 'Think about high boiling point' },

  // --- LESSON Q1W3: States of Matter ---
  { id: 'q1w3-q1', subject: 'chemistry', lessonId: 'q1w3', topicId: 'c1', question: 'What defines a solid?', options: ['Has no volume', 'Has definite shape and volume', 'Always transparent', 'Can be compressed easily'], correctIndex: 1, hint: 'Fixed structure' },
  { id: 'q1w3-q2', subject: 'chemistry', lessonId: 'q1w3', topicId: 'c1', question: 'What property of gases allows them to fill containers?', options: ['Light particles', 'Far-apart particles with lots of movement', 'Small size only', 'Low density only'], correctIndex: 1, hint: 'Think about space between particles' },
  { id: 'q1w3-q3', subject: 'chemistry', lessonId: 'q1w3', topicId: 'c1', question: 'In which state are particles closest together?', options: ['Gas', 'Liquid', 'Solid', 'All equally spaced'], correctIndex: 2, hint: 'Highest density' },
  { id: 'q1w3-q4', subject: 'chemistry', lessonId: 'q1w3', topicId: 'c1', question: 'What happens during sublimation?', options: ['Liquid to gas', 'Solid to gas directly', 'Gas to solid', 'Solid to liquid'], correctIndex: 1, hint: 'Think about dry ice' },
  { id: 'q1w3-q5', subject: 'chemistry', lessonId: 'q1w3', topicId: 'c1', question: 'Which state has the highest average kinetic energy?', options: ['Solid', 'Liquid', 'Gas', 'All the same'], correctIndex: 2, hint: 'Most movement' },

  // --- LESSON Q1W4: Changes of State ---
  { id: 'q1w4-q1', subject: 'chemistry', lessonId: 'q1w4', topicId: 'c1', question: 'What happens to temperature during melting?', options: ['Increases', 'Stays constant', 'Decreases', 'Varies'], correctIndex: 1, hint: 'Energy goes to breaking bonds' },
  { id: 'q1w4-q2', subject: 'chemistry', lessonId: 'q1w4', topicId: 'c1', question: 'What is the reverse of evaporation called?', options: ['Melting', 'Condensation', 'Freezing', 'Sublimation'], correctIndex: 1, hint: 'Gas back to liquid' },
  { id: 'q1w4-q3', subject: 'chemistry', lessonId: 'q1w4', topicId: 'c1', question: 'How do particles move differently between boiling and evaporation?', options: ['No difference', 'Boiling involves all particles, evaporation only surface', 'Evaporation is faster', 'Boiling is slower'], correctIndex: 1, hint: 'Think about temperature' },
  { id: 'q1w4-q4', subject: 'chemistry', lessonId: 'q1w4', topicId: 'c1', question: 'What energy is required for phase changes?', options: ['Kinetic only', 'Potential energy to break bonds', 'No energy needed', 'Heat energy'], correctIndex: 1, hint: 'Breaking bonds takes energy' },
  { id: 'q1w4-q5', subject: 'chemistry', lessonId: 'q1w4', topicId: 'c1', question: 'Why does ice melt at higher pressure?', options: ['Pressure adds heat', 'Pressure decreases melting point', 'Pressure increases particle spacing', 'It does not'], correctIndex: 1, hint: 'Physical pressure affects state' },

  // --- LESSON Q1W6: Solutions and Solvents ---
  { id: 'q1w6-q1', subject: 'chemistry', lessonId: 'q1w6', topicId: 'c1', question: 'What is a solvent?', options: ['A solution', 'The substance that dissolves others', 'The dissolved substance', 'A chemical reaction'], correctIndex: 1, hint: 'Water is a common one' },
  { id: 'q1w6-q2', subject: 'chemistry', lessonId: 'q1w6', topicId: 'c1', question: 'What is a solute?', options: ['The dissolving liquid', 'The substance being dissolved', 'A mixture', 'A chemical compound'], correctIndex: 1, hint: 'Sugar in water' },
  { id: 'q1w6-q3', subject: 'chemistry', lessonId: 'q1w6', topicId: 'c1', question: 'What does solubility measure?', options: ['Mixture rate', 'How much solute can dissolve in solvent', 'Boiling point', 'Density'], correctIndex: 1, hint: 'How much dissolves' },
  { id: 'q1w6-q4', subject: 'chemistry', lessonId: 'q1w6', topicId: 'c1', question: 'How does temperature affect most solubilities?', options: ['Decreases', 'No effect', 'Increases', 'Varies randomly'], correctIndex: 2, hint: 'Heating usually helps dissolve' },
  { id: 'q1w6-q5', subject: 'chemistry', lessonId: 'q1w6', topicId: 'c1', question: 'What happens at the molecular level during dissolution?', options: ['Molecules disappear', 'Solute particles separate and disperse in solvent', 'New substance forms', 'Reaction occurs'], correctIndex: 1, hint: 'Mixing at particle level' },

  // --- LESSON Q1W7: Concentration ---
  { id: 'q1w7-q1', subject: 'chemistry', lessonId: 'q1w7', topicId: 'c1', question: 'What is concentration?', options: ['How dark a solution is', 'How much solute is in a solution', 'How quickly something dissolves', 'Temperature of mixture'], correctIndex: 1, hint: 'Strength of solution' },
  { id: 'q1w7-q2', subject: 'chemistry', lessonId: 'q1w7', topicId: 'c1', question: 'How can you increase concentration of a solution?', options: ['Add more solvent', 'Add more solute', 'Decrease temperature', 'Stir faster'], correctIndex: 1, hint: 'More dissolved substance' },
  { id: 'q1w7-q3', subject: 'chemistry', lessonId: 'q1w7', topicId: 'c1', question: 'What describes a dilute solution?', options: ['High concentration', 'Low concentration', 'Saturated', 'Unsaturated'], correctIndex: 1, hint: 'Weak solution' },
  { id: 'q1w7-q4', subject: 'chemistry', lessonId: 'q1w7', topicId: 'c1', question: 'When is a solution saturated?', options: ['When it is very hot', 'When no more solute can dissolve', 'When it is cold', 'When diluted'], correctIndex: 1, hint: 'Maximum dissolved' },
  { id: 'q1w7-q5', subject: 'chemistry', lessonId: 'q1w7', topicId: 'c1', question: 'What is a supersaturated solution?', options: ['A normal solution', 'Contains more solute than normally possible', 'Contains very little solute', 'A suspension'], correctIndex: 1, hint: 'Unstable state' },

  // --- LESSON Q1W8: Acids, Bases, pH ---
  { id: 'q1w8-q1', subject: 'chemistry', lessonId: 'q1w8', topicId: 'c1', question: 'What is pH a measure of?', options: ['Temperature', 'Acidity or alkalinity', 'Concentration', 'Purity'], correctIndex: 1, hint: 'Hydrogen ion concentration' },
  { id: 'q1w8-q2', subject: 'chemistry', lessonId: 'q1w8', topicId: 'c1', question: 'What is the pH of neutral solution?', options: ['0', '7', '14', '10'], correctIndex: 1, hint: 'Pure water' },
  { id: 'q1w8-q3', subject: 'chemistry', lessonId: 'q1w8', topicId: 'c1', question: 'What pH range indicates an acid?', options: ['0-7', '7-14', 'Below 0', 'Above 14'], correctIndex: 0, hint: 'Less than 7' },
  { id: 'q1w8-q4', subject: 'chemistry', lessonId: 'q1w8', topicId: 'c1', question: 'What do bases do in solution?', options: ['Accept H+ ions', 'Release H+ ions', 'Decrease pH', 'Form acids'], correctIndex: 0, hint: 'Opposite of acids' },
  { id: 'q1w8-q5', subject: 'chemistry', lessonId: 'q1w8', topicId: 'c1', question: 'What happens when acid and base react?', options: ['Explosion', 'Neutralization forms salt and water', 'More acid forms', 'More base forms'], correctIndex: 1, hint: 'Neutralization' },

  // --- LESSON Q2W1: Cell Structure ---
  { id: 'q2w1-q1', subject: 'biology', lessonId: 'q2w1', topicId: 'b1', question: 'What is the basic unit of life?', options: ['Atom', 'Molecule', 'Cell', 'Tissue'], correctIndex: 2, hint: 'Smallest living unit' },
  { id: 'q2w1-q2', subject: 'biology', lessonId: 'q2w1', topicId: 'b1', question: 'Which organelle is the control center of the cell?', options: ['Ribosome', 'Nucleus', 'Mitochondria', 'Golgi'], correctIndex: 1, hint: 'Contains DNA' },
  { id: 'q2w1-q3', subject: 'biology', lessonId: 'q2w1', topicId: 'b1', question: 'What is the function of mitochondria?', options: ['Protein synthesis', 'Energy production', 'Storage', 'Transport'], correctIndex: 1, hint: 'Powerhouse of cell' },
  { id: 'q2w1-q4', subject: 'biology', lessonId: 'q2w1', topicId: 'b1', question: 'What structures surround the cell?', options: ['Cytoplasm only', 'Cell membrane only', 'Cell wall and cell membrane', 'Nucleus'], correctIndex: 2, hint: 'Plant and animal cells' },
  { id: 'q2w1-q5', subject: 'biology', lessonId: 'q2w1', topicId: 'b1', question: 'Where is DNA located in the cell?', options: ['Cytoplasm', 'Cell membrane', 'Nucleus', 'Ribosome'], correctIndex: 2, hint: 'Genetic material location' },

  // --- LESSON Q2W2: Cell Division ---
  { id: 'q2w2-q1', subject: 'biology', lessonId: 'q2w2', topicId: 'b1', question: 'What is mitosis?', options: ['Cell death', 'Asexual reproduction', 'Sexual reproduction', 'Protein synthesis'], correctIndex: 1, hint: 'Body cell division' },
  { id: 'q2w2-q2', subject: 'biology', lessonId: 'q2w2', topicId: 'b1', question: 'How many daughter cells result from mitosis?', options: ['1', '2', '4', '8'], correctIndex: 1, hint: 'Identical copies' },
  { id: 'q2w2-q3', subject: 'biology', lessonId: 'q2w2', topicId: 'b1', question: 'What is meiosis?', options: ['Body cell division', 'Sexual reproduction division', 'Tissue growth', 'Healing'], correctIndex: 1, hint: 'Sex cell formation' },
  { id: 'q2w2-q4', subject: 'biology', lessonId: 'q2w2', topicId: 'b1', question: 'How many chromosomes are in human daughter cells after mitosis?', options: ['23', '46', '92', '12'], correctIndex: 1, hint: 'Same as parent' },
  { id: 'q2w2-q5', subject: 'biology', lessonId: 'q2w2', topicId: 'b1', question: 'What is the spindle used for in cell division?', options: ['Protection', 'Moving chromosomes', 'Energy', 'Storage'], correctIndex: 1, hint: 'Organelle that pulls' },

  // --- LESSON Q2W3: Photosynthesis ---
  { id: 'q2w3-q1', subject: 'biology', lessonId: 'q2w3', topicId: 'b1', question: 'What is the primary purpose of photosynthesis?', options: ['Respiration', 'Converting light energy to chemical energy', 'Breakdown of glucose', 'Protein synthesis'], correctIndex: 1, hint: 'Plants make food' },
  { id: 'q2w3-q2', subject: 'biology', lessonId: 'q2w3', topicId: 'b1', question: 'Where does photosynthesis occur in plant cells?', options: ['Nucleus', 'Mitochondria', 'Chloroplast', 'Ribosome'], correctIndex: 2, hint: 'Green organelle' },
  { id: 'q2w3-q3', subject: 'biology', lessonId: 'q2w3', topicId: 'b1', question: 'What are the reactants in photosynthesis?', options: ['Glucose and oxygen', 'Carbon dioxide and water', 'Proteins and lipids', 'Nucleotides'], correctIndex: 1, hint: 'What plants take in' },
  { id: 'q2w3-q4', subject: 'biology', lessonId: 'q2w3', topicId: 'b1', question: 'What is the main product of photosynthesis?', options: ['Oxygen only', 'Glucose only', 'Glucose and oxygen', 'Water and carbon dioxide'], correctIndex: 2, hint: 'Plant food and oxygen' },
  { id: 'q2w3-q5', subject: 'biology', lessonId: 'q2w3', topicId: 'b1', question: 'Why is photosynthesis important?', options: ['Produces water', 'Provides oxygen and food for life', 'Creates soil', 'Stores heat'], correctIndex: 1, hint: 'Supports all life' },

  // --- LESSON Q2W4: Cellular Respiration ---
  { id: 'q2w4-q1', subject: 'biology', lessonId: 'q2w4', topicId: 'b2', question: 'What is cellular respiration?', options: ['Photosynthesis', 'Breaking down glucose for energy', 'Protein synthesis', 'Cell division'], correctIndex: 1, hint: 'Energy release' },
  { id: 'q2w4-q2', subject: 'biology', lessonId: 'q2w4', topicId: 'b2', question: 'Where does most ATP production occur?', options: ['Ribosome', 'Nucleus', 'Mitochondria', 'Chloroplast'], correctIndex: 2, hint: 'Energy powerhouse' },
  { id: 'q2w4-q3', subject: 'biology', lessonId: 'q2w4', topicId: 'b2', question: 'What is ATP used for?', options: ['Storage', 'Energy currency of cells', 'Structure', 'Catalysis'], correctIndex: 1, hint: 'Energy molecule' },
  { id: 'q2w4-q4', subject: 'biology', lessonId: 'q2w4', topicId: 'b2', question: 'What are the products of aerobic respiration?', options: ['Glucose and oxygen', 'Carbon dioxide and water', 'Protein and lipids', 'Nucleotides'], correctIndex: 1, hint: 'What cells release' },
  { id: 'q2w4-q5', subject: 'biology', lessonId: 'q2w4', topicId: 'b2', question: 'Why is aerobic respiration more efficient than anaerobic?', options: ['Faster', 'Produces more ATP', 'Requires less energy', 'Easier to regulate'], correctIndex: 1, hint: 'Oxygen allows more energy' },

  // --- LESSON Q2W5: Genetics ---
  { id: 'q2w5-q1', subject: 'biology', lessonId: 'q2w5', topicId: 'b2', question: 'What is a gene?', options: ['A cell', 'A protein', 'A segment of DNA coding for protein', 'A tissue'], correctIndex: 2, hint: 'Hereditary unit' },
  { id: 'q2w5-q2', subject: 'biology', lessonId: 'q2w5', topicId: 'b2', question: 'What is a dominant trait?', options: ['The weaker trait', 'The stronger trait that masks recessive', 'A mutation', 'Random trait'], correctIndex: 1, hint: 'Expressed when present' },
  { id: 'q2w5-q3', subject: 'biology', lessonId: 'q2w5', topicId: 'b2', question: 'What ratio do Mendel\'s law of segregation predict?', options: ['1:1', '2:2', '3:1', '4:4'], correctIndex: 2, hint: 'Monohybrid cross' },
  { id: 'q2w5-q4', subject: 'biology', lessonId: 'q2w5', topicId: 'b2', question: 'What is a genotype?', options: ['Physical appearance', 'Genetic composition', 'Behavior', 'Phenotype'], correctIndex: 1, hint: 'Genetic makeup' },
  { id: 'q2w5-q5', subject: 'biology', lessonId: 'q2w5', topicId: 'b2', question: 'What determines an organism\'s phenotype?', options: ['Genotype only', 'Environment only', 'Genotype and environment', 'Random chance'], correctIndex: 2, hint: 'Nature and nurture' },

  // --- LESSON Q2W6: Evolution ---
  { id: 'q2w6-q1', subject: 'biology', lessonId: 'q2w6', topicId: 'b2', question: 'What is natural selection?', options: ['Human choice', 'Survival of fittest in nature', 'Random change', 'Inheritance'], correctIndex: 1, hint: 'Darwin\'s theory' },
  { id: 'q2w6-q2', subject: 'biology', lessonId: 'q2w6', topicId: 'b2', question: 'What is adaptation?', options: ['Change during lifetime', 'Inherited trait helping survival', 'Mutation', 'Variation'], correctIndex: 1, hint: 'Beneficial trait' },
  { id: 'q2w6-q3', subject: 'biology', lessonId: 'q2w6', topicId: 'b2', question: 'What is the source of variation in populations?', options: ['Environment only', 'Mutation and sexual reproduction', 'Selection only', 'Food supply'], correctIndex: 1, hint: 'Genetic differences' },
  { id: 'q2w6-q4', subject: 'biology', lessonId: 'q2w6', topicId: 'b2', question: 'What is a species?', options: ['Population of organisms', 'Organisms that can breed and produce fertile offspring', 'Group with same genes', 'Community'], correctIndex: 1, hint: 'Reproductive isolation' },
  { id: 'q2w6-q5', subject: 'biology', lessonId: 'q2w6', topicId: 'b2', question: 'What does fossil record evidence support?', options: ['Lamarckism', 'Evolution over time', 'Creation instantly', 'No change'], correctIndex: 1, hint: 'Ancient life shows change' },

  // --- LESSON Q2W7AND8: Ecology ---
  { id: 'q2w7-q1', subject: 'biology', lessonId: 'q2w7', topicId: 'b4', question: 'What is an ecosystem?', options: ['Only animals', 'Community and physical environment', 'Only plants', 'Soil only'], correctIndex: 1, hint: 'Living and nonliving' },
  { id: 'q2w7-q2', subject: 'biology', lessonId: 'q2w7', topicId: 'b4', question: 'What are producers in an ecosystem?', options: ['Herbivores', 'Carnivores', 'Plants making food', 'Decomposers'], correctIndex: 2, hint: 'Convert light energy' },
  { id: 'q2w7-q3', subject: 'biology', lessonId: 'q2w7', topicId: 'b4', question: 'What is the role of decomposers?', options: ['Hunt prey', 'Eat plants', 'Break down dead matter', 'Produce energy'], correctIndex: 2, hint: 'Recyclers' },
  { id: 'q2w7-q4', subject: 'biology', lessonId: 'q2w7', topicId: 'b4', question: 'What is a food chain?', options: ['Feeding relationship', 'Restaurant chain', 'Evolution sequence', 'Genetic link'], correctIndex: 0, hint: 'Sequential feeding' },
  { id: 'q2w7-q5', subject: 'biology', lessonId: 'q2w7', topicId: 'b4', question: 'What happens to energy through food chain?', options: ['Increases', 'Stays same', 'Decreases at each level', 'Disappears'], correctIndex: 2, hint: 'Energy loss' },
]
