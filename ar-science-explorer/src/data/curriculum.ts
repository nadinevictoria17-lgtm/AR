/**
 * Single source of truth: every lesson with its 5 quiz questions embedded.
 * lessons.ts and quiz.ts both re-export from here so existing imports are untouched.
 */
import type { Lesson, BuiltInQuestion } from '../types'

interface LessonWithQuiz extends Lesson {
  questions: Omit<BuiltInQuestion, 'subject' | 'lessonId' | 'topicId'>[]
}

const CURRICULUM: LessonWithQuiz[] = [
  // ═══════════════════════════════════════════════════════════════════
  // QUARTER 1 — CHEMISTRY
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'q1w1',
    title: 'Scientific Models and the Particle Model of Matter',
    subject: 'chemistry',
    summary: 'Discover how scientists use models to explain properties of matter and changes of state.',
    topicId: 'c1',
    steps: ['Understand Scientific Models', 'Explore the Particle Model', 'Identify properties of S, L, G'],
    isUnlockedByDefault: true,
    quarter: 1,
    week: 1,
    pdfUrl: '/lessons/Q1W1.pdf',
    curriculum: {
      standards: 'Learners learn that the particle model explains the properties of solids, liquids, and gases and the processes involved in changes of state.',
      performanceStandards: 'By the end of the Quarter, learners recognize that scientists use models to describe the particle model of matter. They use diagrams and illustrations to explain the motion and arrangement of particles during changes of state.',
      learningCompetencies: [
        'Recognize that scientists use models to explain phenomena that cannot be easily seen or detected',
        'Describe the Particle Model of Matter as "All matter is made up of tiny particles with each pure substance having its own kind of particles."'
      ],
      objectives: [
        'Describe and explain the different models used by the scientist to explain phenomena that cannot be easily seen or detected',
        'Describe particle model of matter',
        'Recognize that matter consists of tiny particles'
      ],
      contentDetails: 'Scientific Models and the Particle Model of Matter',
      integration: {
        qualities: ['Critical Thinking', 'Perseverance'],
        description: 'Students question and analyze the nature of matter and how models represent it.'
      }
    },
    arPayload: {
      modelIndex: 0, detectionMode: 'marker', markerImage: '/markers/Q1W1.jpg',
      anchorHint: 'Scan the Democritus worksheet marker.',
      lessonSteps: ['Aim at Q1W1 marker', 'View the 3D atom model', 'Discover its structure'],
      title: 'Democritus Atom', subtitle: 'Ancient Greek Atomic Theory (c. 400 BCE)',
      description: 'Democritus proposed that all matter consists of tiny, indivisible particles called "atomos".',
      keyIdeas: ['Smallest, indestructible building blocks of matter', 'Particles in constant, random motion', 'Differ in shape and size', 'Form all materials in the universe']
    },
    questions: [
      { id: 'q1w1-q1', question: 'Why do scientists use models to study matter?', options: ['Because atoms are too small to see directly', 'To make learning harder', 'Because they prefer theory over reality', 'Models are always perfectly accurate'], correctIndex: 0, hint: 'Think about the scale of atoms' },
      { id: 'q1w1-q2', question: 'What does the Particle Model of Matter state?', options: ['All matter is solid', 'All matter is made of tiny particles', 'Matter has no particles', 'Particles are only found in gases'], correctIndex: 1, hint: 'Read the lesson title' },
      { id: 'q1w1-q3', question: 'Who first proposed the concept of atoms?', options: ['Democritus', 'Newton', 'Einstein', 'Curie'], correctIndex: 0, hint: 'Ancient Greek philosopher' },
      { id: 'q1w1-q4', question: 'What property distinguishes solids, liquids, and gases in the particle model?', options: ['Color', 'Particle arrangement and motion', 'Weight alone', 'Temperature alone'], correctIndex: 1, hint: 'Think about how closely packed particles are' },
      { id: 'q1w1-q5', question: 'What happens to particle arrangement during a change of state?', options: ['Particles disappear', 'Particle arrangement and energy change', 'New particles are created', 'Nothing changes'], correctIndex: 1, hint: 'Think about melting or boiling' },
    ],
  },

  {
    id: 'q1w2',
    title: 'Pure Substances and Kinetic Molecular Theory of Matter',
    subject: 'chemistry',
    summary: 'Understand the properties of pure substances and the kinetic behavior of particles.',
    topicId: 'c1',
    steps: ['Compare Elements & Compounds', 'Analyze Particle Motion', 'Study Temperature Effects'],
    isUnlockedByDefault: false,
    quarter: 1, week: 2,
    pdfUrl: '/lessons/Q1W2.pdf',
    curriculum: {
      standards: 'The learners shall learn that there are specific processes for planning, conducting, and recording scientific investigations.',
      performanceStandards: 'By the end of the quarter, the learners shall recognize that scientists use models to describe the particle model of matter.',
      learningCompetencies: [
        'Describe the Particle Model of Matter as "All matter is made up of tiny particles with each pure substance having its own kind of particles."',
        'Describe that particles are constantly in motion, have spaces between them, attract each other, and move faster as the temperature increases.'
      ],
      objectives: [
        'Differentiate elements and compounds based on particle composition',
        'Explain how the Kinetic Molecular Theory describes particle behavior in terms of constant motion and temperature.'
      ],
      contentDetails: 'Pure Substances and Kinetic Molecular Theory of Matter',
      integration: { qualities: ['Curiosity', 'Scientific Literacy', 'Critical Thinking'], description: 'Exploring the nature of matter fosters curiosity and scientific literacy.' }
    },
    arPayload: {
      modelIndex: 1, detectionMode: 'marker', markerImage: '/markers/Q1W2.jpg',
      anchorHint: 'Scan the Water Polarity card.',
      lessonSteps: ['Aim at Q1W2 marker', 'See positive and negative ends', 'Rotate to inspect bonds'],
      title: 'Water Polarity', subtitle: 'The Polar Molecule - H₂O',
      description: 'Water is a polar molecule with unequal distribution of electric charge.',
      keyIdeas: ['Oxygen pulls electrons toward itself', 'Creates negative charge near oxygen', 'Creates positive charge near hydrogens', 'Results in a bent molecular shape']
    },
    questions: [
      { id: 'q1w2-q1', question: 'What makes a substance a pure substance?', options: ['It is colourless', 'It contains only one type of particle', 'It is always a liquid', 'It has no smell'], correctIndex: 1, hint: 'Think about what "pure" means in chemistry' },
      { id: 'q1w2-q2', question: 'According to the Kinetic Molecular Theory, what are particles always doing?', options: ['Standing still', 'Moving constantly', 'Splitting apart', 'Combining together'], correctIndex: 1, hint: '"Kinetic" relates to motion' },
      { id: 'q1w2-q3', question: 'How does an increase in temperature affect particle motion?', options: ['Particles slow down', 'Particles stop', 'Particles move faster', 'Particles change shape'], correctIndex: 2, hint: 'More heat = more energy' },
      { id: 'q1w2-q4', question: 'What is the difference between an element and a compound?', options: ['No difference', 'Elements have one type of atom; compounds have two or more', 'Compounds are always liquid', 'Elements are always gas'], correctIndex: 1, hint: 'Think about the number of different atoms' },
      { id: 'q1w2-q5', question: 'Which of the following best describes particles in the Kinetic Molecular Theory?', options: ['Particles are stationary', 'Particles have no spaces between them', 'Particles attract each other', 'Particles repel all the time'], correctIndex: 2, hint: 'Particles do interact with each other' },
    ],
  },

  {
    id: 'q1w3',
    title: 'States of Matter and Particle Arrangement',
    subject: 'chemistry',
    summary: 'Compare particle arrangement, spacing, and relative motion in Solids, Liquids, and Gases.',
    topicId: 'c1',
    steps: ['Analyze particle packaging', 'Observe molecular motion', 'Explain State Changes'],
    isUnlockedByDefault: false,
    quarter: 1, week: 3,
    pdfUrl: '/lessons/Q1W3.pdf',
    curriculum: {
      standards: 'The learners shall learn that diagrams and flowcharts are useful in demonstrating and explaining the motion and arrangement of particles during changes of state.',
      performanceStandards: 'By the end of the Quarter, learners use diagrams and illustrations to explain the motion and arrangement of particles during changes of state.',
      learningCompetencies: [
        'Use diagrams and illustrations to describe the arrangement, spacing, and relative motion of the particles in each of the three states of matter.',
        'Explain the changes of state in terms of particle arrangement and energy changes.'
      ],
      objectives: [
        'Develop a deeper understanding of particle arrangement and movement in different states of matter through various ways of expression.',
        'Explain how a substance changes its state from solid to liquid to gas by analyzing particle behavior and the influence of temperature.',
        'Demonstrate understanding of changes of state: solid → liquid → vapor, and vice versa.'
      ],
      contentDetails: 'States of Matter and Particle Arrangement and Phase Changes',
      integration: { qualities: ['Analytical Thinking', 'Visualization'], description: 'Building mental models through diagrams enhances spatial reasoning.' }
    },
    arPayload: {
      modelIndex: 2, detectionMode: 'marker', markerImage: '/markers/Q1W3.jpg',
      anchorHint: 'Scan the States of Matter worksheet.',
      lessonSteps: ['Aim at Q1W3 marker', 'Toggle between S, L, G', 'Observe vibration vs flow'],
      title: 'States of Matter', subtitle: 'Solid, Liquid, and Gas',
      description: 'Matter exists in three main states, each with different particle arrangements.',
      keyIdeas: ['Solid: Particles tightly packed & vibrate', 'Liquid: Moderate forces & flow freely', 'Gas: Weak forces & spread far apart', 'Kinetic Energy determines the state']
    },
    questions: [
      { id: 'q1w3-q1', question: 'What best describes the particle arrangement in a solid?', options: ['Particles move freely', 'Particles are tightly packed in fixed positions', 'Particles have no order', 'Particles are very far apart'], correctIndex: 1, hint: 'Solids hold their shape' },
      { id: 'q1w3-q2', question: 'In which state of matter do particles have the most freedom of movement?', options: ['Solid', 'Liquid', 'Gas', 'All are equal'], correctIndex: 2, hint: 'Think about which state fills any container' },
      { id: 'q1w3-q3', question: 'What is sublimation?', options: ['Liquid to gas', 'Solid to gas directly', 'Gas to solid', 'Solid to liquid'], correctIndex: 1, hint: 'Think about dry ice' },
      { id: 'q1w3-q4', question: 'What happens to particle spacing when a liquid becomes a gas?', options: ['Particles get closer', 'Spacing stays the same', 'Spacing increases greatly', 'Particles merge'], correctIndex: 2, hint: 'Gases expand to fill their container' },
      { id: 'q1w3-q5', question: 'Which state of matter has both a definite volume but no definite shape?', options: ['Solid', 'Liquid', 'Gas', 'Plasma'], correctIndex: 1, hint: 'Think about water in a cup' },
    ],
  },

  {
    id: 'q1w4',
    title: 'Designing a Scientific Investigation',
    subject: 'chemistry',
    summary: 'Master the formal steps of scientific inquiry from problem identification to conclusion.',
    topicId: 'c1',
    steps: ['Identify the Aim', 'List Materials', 'Outline Procedures'],
    isUnlockedByDefault: false,
    quarter: 1, week: 4,
    pdfUrl: '/lessons/Q1W4.pdf',
    curriculum: {
      standards: 'Learners learn that there are specific processes for planning, conducting, and recording scientific investigations.',
      performanceStandards: 'By the end of the Quarter, learners demonstrate skills to plan and conduct a scientific investigation making accurate measurements and using standard units.',
      learningCompetencies: ['The learners follow the appropriate steps of a scientific investigation which include: Aim, Materials and equipment, Method or procedures, Results, and Conclusions.'],
      objectives: ['Identify the core components of a scientific investigation', 'Demonstrate how to structure a method for a simple experiment', 'Understand the importance of documenting results accurately'],
      contentDetails: 'Designing a Scientific Investigation',
      integration: { qualities: ['Scientific Literacy', 'Innovation & Technology', 'Ethical Considerations'], description: 'Fostering scientific qualities and ethical considerations ensures that innovation is balanced with responsibility.' }
    },
    arPayload: {
      modelIndex: 3, detectionMode: 'marker', markerImage: '/markers/Q1W4.jpg',
      anchorHint: 'Scan the Kinetic Theory card.',
      lessonSteps: ['Aim at Q1W4 marker', 'Increase temperature', 'Watch particles speed up'],
      title: 'Particle Motion & Temperature', subtitle: 'How Heat Affects Particle Movement',
      description: 'All particles are in constant, random motion. Temperature measures how fast particles move.',
      keyIdeas: ['Higher temperature = Faster particle motion', 'Absolute zero (−273°C) = Particles stop moving', 'Motion never stops in normal conditions', 'KE depends on particle mass and speed']
    },
    questions: [
      { id: 'q1w4-q1', question: 'What is the first step in designing a scientific investigation?', options: ['Recording results', 'Identifying the aim or problem', 'Listing materials', 'Drawing conclusions'], correctIndex: 1, hint: 'You need to know what you are investigating first' },
      { id: 'q1w4-q2', question: 'What is a hypothesis?', options: ['A final conclusion', 'A testable prediction or educated guess', 'A list of materials', 'A method for recording data'], correctIndex: 1, hint: 'It comes before you conduct the experiment' },
      { id: 'q1w4-q3', question: 'Which section of a scientific investigation describes exactly how the experiment will be done?', options: ['Aim', 'Results', 'Method or Procedures', 'Conclusion'], correctIndex: 2, hint: 'Step-by-step instructions' },
      { id: 'q1w4-q4', question: 'Why is it important to record results accurately?', options: ['It is not important', 'For analysis, conclusions, and peer review', 'Only to fill in the report', 'To make the experiment look better'], correctIndex: 1, hint: 'Science relies on accurate data' },
      { id: 'q1w4-q5', question: 'What should a scientific conclusion include?', options: ['A new hypothesis only', 'Whether the hypothesis was supported and key findings', 'Only raw data', 'A list of materials used'], correctIndex: 1, hint: 'Link back to your original prediction' },
    ],
  },

  {
    id: 'q1w5',
    title: 'Planning and Recording Scientific Investigations',
    subject: 'chemistry',
    summary: 'Deep dive into variables, hypotheses, and the logic of experimental results.',
    topicId: 'c1',
    steps: ['Identify Variables', 'Formulate Hypothesis', 'Draw Conclusions'],
    isUnlockedByDefault: false,
    quarter: 1, week: 5,
    pdfUrl: '/lessons/Q1W5.pdf',
    curriculum: {
      standards: 'Learners learn that there are specific processes for planning, conducting, and recording scientific investigations.',
      performanceStandards: 'By the end of the Quarter, learners demonstrate skills to plan and conduct a scientific investigation making accurate measurements and using standard units.',
      learningCompetencies: ['The learners follow the appropriate steps of a scientific investigation which include: aim, materials and equipment, method or procedures, results including data, and conclusions'],
      objectives: ['Identify the different types of variables', 'Make hypotheses based on the given scientific problem', 'Conduct an experiment to prove hypothesis', 'Draw conclusions from given scientific scenarios', 'Apply the scientific method in investigating certain scenarios'],
      contentDetails: 'Planning, following, and recording scientific investigations: Steps in Scientific Method, Identifying problem, Gathering Data, Hypothesis',
      integration: { qualities: ['Research Design', 'Data Analysis', 'Peer Review'], description: 'Developing skills in data collection and ethical application ensures robust scientific outcomes.' }
    },
    hasAR: false,
    questions: [
      { id: 'q1w5-q1', question: 'What is the independent variable in an experiment?', options: ['The variable that is measured', 'The variable the investigator deliberately changes', 'A variable kept constant', 'The final result'], correctIndex: 1, hint: 'The one you choose to change' },
      { id: 'q1w5-q2', question: 'What is the dependent variable?', options: ['The variable the investigator changes', 'The variable that is measured or observed', 'A variable kept constant', 'The hypothesis'], correctIndex: 1, hint: 'It "depends" on the independent variable' },
      { id: 'q1w5-q3', question: 'What is a controlled variable?', options: ['The variable that changes', 'The variable that is measured', 'A variable kept constant throughout the experiment', 'The final result'], correctIndex: 2, hint: 'Kept the same to ensure a fair test' },
      { id: 'q1w5-q4', question: 'Why must variables be identified before starting an experiment?', options: ['It is not necessary', 'To ensure the experiment is fair and results are valid', 'Only to fill in the form', 'To make the test harder'], correctIndex: 1, hint: 'A fair test controls all other variables' },
      { id: 'q1w5-q5', question: 'What does it mean if experimental results do NOT support the hypothesis?', options: ['The experiment failed completely', 'The hypothesis was wrong and should be revised', 'Results must be changed', 'The hypothesis was never needed'], correctIndex: 1, hint: 'Science advances even from disproving ideas' },
    ],
  },

  {
    id: 'q1w6',
    title: 'Standard Units and Measuring Physical Quantities',
    subject: 'chemistry',
    summary: 'Master the art of accurate measurement and organized data collection in scientific investigations.',
    topicId: 'c1',
    steps: ['Use Standard Units', 'Measure Volume & Mass', 'Identify Solute & Solvent'],
    isUnlockedByDefault: false,
    quarter: 1, week: 6,
    pdfUrl: '/lessons/Q1W6.pdf',
    curriculum: {
      standards: 'The learners shall learn different standard units of measurement, organize collected data and identify the components of a solution.',
      performanceStandards: 'By the end of the quarter, the learners shall perform accurate measurements and organize collected data.',
      learningCompetencies: ['The learners shall make accurate measurements using standard units for physical quantity, and organize the collected data when carrying out a scientific investigation.'],
      objectives: ['Use the standard units of physical quantities', 'Make accurate measurements of physical quantities using measuring instruments', 'Organize data collected from investigation', 'Identify the components of a solution'],
      contentDetails: 'Standard Units of Physical Quantities; Measuring Physical Quantities; Organizing data; Components of a Solution',
      integration: { qualities: ['Accuracy', 'Interdisciplinary Skills', 'Organization'], description: 'Measurement skills are foundational across mathematics, social studies, and health.' }
    },
    arPayload: {
      modelIndex: 5, detectionMode: 'marker', markerImage: '/markers/Q1W6.jpg',
      anchorHint: 'Scan the Equipment Safety marker.',
      lessonSteps: ['Aim at Q1W6 marker', 'See 100ml, 250ml, 500ml', 'Inspect the pour spout'],
      title: 'Laboratory Beakers', subtitle: 'Essential Lab Glassware',
      description: 'Beakers are fundamental laboratory containers used for mixing, heating, and measuring liquids.',
      keyIdeas: ['Cylindrical shape with flat bottom', 'Pouring spout for easier transfer', 'Graduated marks for volume estimation', 'Heat-resistant borosilicate glass']
    },
    questions: [
      { id: 'q1w6-q1', question: 'What is the SI standard unit for mass?', options: ['Gram (g)', 'Kilogram (kg)', 'Pound (lb)', 'Milligram (mg)'], correctIndex: 1, hint: 'The base SI unit for mass' },
      { id: 'q1w6-q2', question: 'What is the SI standard unit for length?', options: ['Centimetre (cm)', 'Kilometre (km)', 'Metre (m)', 'Inch (in)'], correctIndex: 2, hint: 'The base SI unit for length' },
      { id: 'q1w6-q3', question: 'Which instrument is most accurate for measuring the volume of a liquid in a lab?', options: ['Beaker', 'Graduated cylinder', 'Test tube', 'Funnel'], correctIndex: 1, hint: 'It has precise markings' },
      { id: 'q1w6-q4', question: 'In a salt-water solution, what is the solute?', options: ['Water', 'Salt', 'The solution itself', 'Air'], correctIndex: 1, hint: 'The solute is the substance that dissolves' },
      { id: 'q1w6-q5', question: 'Why is it important to use standard units in science?', options: ['It is only a formality', 'To allow scientists worldwide to understand and compare results', 'Only for lab reports', 'It makes calculations harder'], correctIndex: 1, hint: 'Think about international communication in science' },
    ],
  },

  {
    id: 'q1w7',
    title: 'Properties of Solutions: Solubility and Concentration',
    subject: 'chemistry',
    summary: 'Analyze saturation levels and calculate concentrations quantitatively.',
    topicId: 'c1',
    steps: ['Saturated vs Unsaturated', 'Calculate Percent by Mass', 'Calculate Percent by Volume'],
    isUnlockedByDefault: false,
    quarter: 1, week: 7,
    pdfUrl: '/lessons/Q1W7.pdf',
    curriculum: {
      standards: 'The learners shall learn the properties of solutions such as solubility and reaction to litmus determine their use.',
      performanceStandards: 'By the end of the Quarter, learners demonstrate an understanding of the role of solute and solvent in solutions and the factors that affect solubility.',
      learningCompetencies: ['The learners shall be able to identify the role of the solute and solvent in a solution and to express quantitatively the amount of solute present in a given volume of solution.'],
      objectives: ['Identify the properties of a solution', 'Differentiate saturated from unsaturated solutions', 'Calculate the amount of solute in a given mass of solution (percent by mass)', 'Calculate the amount of solute in a given volume of solution (percent by volume)'],
      contentDetails: 'Properties of Solutions: Saturated and Unsaturated Solutions; Solutions, solubility, and concentration',
      integration: { qualities: ['Quantitative Reasoning', 'Environmental Awareness', 'Pharmaceutical Practice'], description: 'Understanding solutions is essential in environmental science and pharmacy.' }
    },
    arPayload: {
      modelIndex: 6, detectionMode: 'marker', markerImage: '/markers/Q1W7.jpg',
      anchorHint: 'Scan the Solubility card.',
      lessonSteps: ['Aim at Q1W7 marker', 'Add solute to reach saturation', 'Observe crystal growth'],
      title: 'Crystal Saturation', subtitle: 'Saturated vs. Unsaturated Solutions',
      description: 'Saturation describes how much dissolved substance a solution can hold.',
      keyIdeas: ['Unsaturated can dissolve more solute', 'Saturated reached its maximum limit', 'Crystal formation occurs at saturation', 'Solubility varies with temperature']
    },
    questions: [
      { id: 'q1w7-q1', question: 'What is solubility?', options: ['The colour of a solution', 'The maximum amount of solute that can dissolve in a solvent at a given temperature', 'How quickly a substance dissolves', 'The temperature of a solution'], correctIndex: 1, hint: 'It is a maximum limit at a given temperature' },
      { id: 'q1w7-q2', question: 'What is a saturated solution?', options: ['A solution with very little solute', 'A solution that cannot dissolve any more solute', 'A solution that is boiling', 'A very colourful solution'], correctIndex: 1, hint: 'It has reached its maximum capacity' },
      { id: 'q1w7-q3', question: 'How is percent by mass calculated?', options: ['(volume of solute ÷ volume of solution) × 100', '(mass of solute ÷ mass of solution) × 100', '(mass of solvent ÷ mass of solute) × 100', '(density × volume) × 100'], correctIndex: 1, hint: 'Solute mass over total solution mass' },
      { id: 'q1w7-q4', question: 'How does increasing temperature affect the solubility of most solid solutes?', options: ['Solubility decreases', 'Solubility stays the same', 'Solubility increases', 'Solubility becomes zero'], correctIndex: 2, hint: 'Heating usually helps things dissolve' },
      { id: 'q1w7-q5', question: 'What does a concentrated solution mean?', options: ['A very hot solution', 'A solution with a large amount of solute per unit volume of solvent', 'A solution with very little solute', 'A saturated solution only'], correctIndex: 1, hint: 'Lots of solute packed in' },
    ],
  },

  {
    id: 'q1w8',
    title: 'Factors Affecting Solubility and Proper Lab Handling',
    subject: 'chemistry',
    summary: 'Investigate how temperature and particle size impact solubility, and master science equipment safety.',
    topicId: 'c1',
    steps: ['Effect of Temperature', 'Particle Size & Solubility', 'Lab Equipment Handling'],
    isUnlockedByDefault: false,
    quarter: 1, week: 8,
    pdfUrl: '/lessons/Q1W8.pdf',
    curriculum: {
      standards: 'The learners shall learn the properties of solutions such as solubility and reaction to litmus paper and other indicators.',
      performanceStandards: 'By the end of the quarter, the learners shall demonstrate an understanding of the role of solute and solvent in solutions and the factors that affect solubility.',
      learningCompetencies: ['The learners shall demonstrate how different factors affect the solubility of a solute in each solvent; identify solutions such as acids, bases, and salts; and demonstrate proper use and handling of science equipment.'],
      objectives: ['Explain how temperature affects the solubility of solid material', 'Explain how the nature of solute/particle size and solvent affect the rate of solubility', 'Identify solutions such as acids, bases, and salts which react with litmus paper', 'Identify different science equipment and demonstrate proper handling'],
      contentDetails: 'Factors Affecting Solubility; Types of Solutions; Proper Use and Handling of Science Equipment',
      integration: { qualities: ['Lab Proficiency', 'Analytical Logic', 'Chemical Safety'], description: 'Mastering solubility factors is key for biochemistry, medicine, and food science.' }
    },
    arPayload: {
      modelIndex: 7, detectionMode: 'marker', markerImage: '/markers/Q1W8.jpg',
      anchorHint: 'Scan the Ionic Dissolution marker.',
      lessonSteps: ['Aim at Q1W8 marker', 'Zoom in on the crystal lattice', 'Observe water molecules pulling ions'],
      title: 'Salt Dissolving in Water', subtitle: 'Ionic Dissolution - NaCl in H₂O',
      description: 'Salt dissolves in water through a process where water molecules separate ionic bonds.',
      keyIdeas: ['Sodium (Na+) and Chloride (Cl-) ions', 'Water polar ends attract opposite charges', 'Hydration coats the crystal surface', 'Ionic bonds break to form saline']
    },
    questions: [
      { id: 'q1w8-q1', question: 'How does increasing temperature generally affect the solubility of a solid solute?', options: ['Solubility decreases', 'Solubility is unaffected', 'Solubility increases', 'Solubility becomes zero'], correctIndex: 2, hint: 'More heat helps break bonds between solute particles' },
      { id: 'q1w8-q2', question: 'How does reducing particle size affect the rate at which a solid dissolves?', options: ['It slows dissolving down', 'It has no effect', 'It speeds up dissolving (greater surface area)', 'It prevents dissolving'], correctIndex: 2, hint: 'More exposed surface area = more contact with solvent' },
      { id: 'q1w8-q3', question: 'Which type of solution turns blue litmus paper red?', options: ['Basic solution', 'Neutral solution', 'Acidic solution', 'Salt solution only'], correctIndex: 2, hint: 'Acids turn blue litmus red' },
      { id: 'q1w8-q4', question: 'Which type of solution turns red litmus paper blue?', options: ['Acidic solution', 'Basic (alkaline) solution', 'Neutral solution', 'Salt water only'], correctIndex: 1, hint: 'Bases turn red litmus blue' },
      { id: 'q1w8-q5', question: 'What is the safest way to handle hot glassware in the laboratory?', options: ['Grab it quickly with bare hands', 'Use insulated gloves or tongs', 'Pour cold water over it first', 'Leave it on the bench and wait'], correctIndex: 1, hint: 'Protective equipment is essential for safety' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // QUARTER 2 — BIOLOGY
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'q2w1',
    title: 'The Compound Microscope',
    subject: 'biology',
    summary: 'Master the parts and proper handling techniques of a compound microscope for cellular observation.',
    topicId: 'b1',
    steps: ['Identify Microscope Parts', 'Practice Proper Handling', 'Learn Storage Protocol'],
    isUnlockedByDefault: false,
    quarter: 2, week: 1,
    pdfUrl: '/lessons/Q2W1.pdf',
    curriculum: {
      standards: 'Familiarity and proper use of a compound microscope are essential to observe cells.',
      performanceStandards: 'By the end of the Quarter, learners will be able to create a visual representation explaining the trophic level in a chosen ecosystem.',
      learningCompetencies: ['Identify the parts and functions, and demonstrate proper handling and storing of a compound microscope'],
      objectives: ['Identify the parts of a compound microscope and the function of each part', 'Demonstrate the proper handling and storing of a compound microscope'],
      contentDetails: 'Science equipment: The Compound Microscope (Parts and Functions, Using of Microscope)',
      integration: { qualities: ['Scientific Inquiry', 'Microscopic Literacy', 'Digital Illustration'], description: 'Utilization of a microscope in investigating microorganisms.' }
    },
    arPayload: {
      modelIndex: 0, detectionMode: 'marker', markerImage: '/markers/Q2W1.jpg',
      anchorHint: 'Scan the Microscopy worksheet.',
      lessonSteps: ['Aim at Q2W1 marker', 'Interact with knobs', 'Zoom into the objective lens'],
      title: 'Compound Light Microscope', subtitle: 'Lab Microscope for Observation',
      description: 'An optical instrument that magnifies tiny objects invisible to the naked eye.',
      keyIdeas: ['Eyepiece and Objective lenses', 'Coarse and Fine adjustment knobs', 'Magnification = Obj × Ocular', 'Stage holds the glass slides']
    },
    questions: [
      { id: 'q2w1-q1', question: 'What is the function of the eyepiece (ocular lens) on a microscope?', options: ['To hold the slide', 'To magnify the image produced by the objective lens', 'To focus the light source', 'To adjust the stage height'], correctIndex: 1, hint: 'It is the lens you look through' },
      { id: 'q2w1-q2', question: 'How is the total magnification of a microscope calculated?', options: ['Eyepiece magnification + objective magnification', 'Eyepiece magnification × objective magnification', 'Objective magnification ÷ eyepiece magnification', 'Eyepiece magnification − objective magnification'], correctIndex: 1, hint: 'Multiply the two lens values together' },
      { id: 'q2w1-q3', question: 'What is the correct way to carry a compound microscope?', options: ['Carry it by the stage', 'Hold it by the arm and support the base', 'Hold only the base with both hands', 'Carry it by the eyepiece tube'], correctIndex: 1, hint: 'Two points of support are needed' },
      { id: 'q2w1-q4', question: 'Which objective lens should you start with when viewing a new slide?', options: ['The highest power objective', 'The medium power objective', 'The lowest power objective', 'The oil immersion objective'], correctIndex: 2, hint: 'Always start low and work up' },
      { id: 'q2w1-q5', question: 'What do the coarse and fine adjustment knobs do?', options: ['Change the magnification', 'Control the light intensity', 'Focus the image by adjusting the stage height', 'Move the slide left and right'], correctIndex: 2, hint: 'They bring the specimen into focus' },
    ],
  },

  {
    id: 'q2w2',
    title: 'Plant and Animal Cells',
    subject: 'biology',
    summary: 'Observe and identify organelles in plant and animal cells, and compare their unique structures.',
    topicId: 'b1',
    steps: ['Observing Cell Parts', 'Comparing Plant vs Animal', 'Identifying Organelles'],
    isUnlockedByDefault: false,
    quarter: 2, week: 2,
    pdfUrl: '/lessons/Q2W2.pdf',
    curriculum: {
      standards: 'The organelles of plant and animal cells can be identified using a compound microscope.',
      performanceStandards: 'By the end of the Quarter, learners will be able to create a visual representation explaining the trophic level in a chosen ecosystem.',
      learningCompetencies: ['Use proper techniques in observing and identifying the parts of a cell with a microscope', 'Differentiate plant and animal cells based on their organelles'],
      objectives: ['Use proper techniques when observing the parts of a cell under a microscope', 'Identify parts of a cell with a microscope', 'Compare and contrast plant and animal cells based on their organelles'],
      contentDetails: 'Plant and animal cells (Parts and Functions, Similarities and Differences)',
      integration: { qualities: ['Biodiversity Patterns', 'Analytical Comparison', 'Scientific Illustration'], description: 'Distribution of plant and animal cells relating to global diversity patterns.' }
    },
    arPayload: {
      modelIndex: 1, detectionMode: 'marker', markerImage: '/markers/Q2W2.jpg',
      anchorHint: 'Scan the Cell Structure card.',
      lessonSteps: ['Aim at Q2W2 marker', 'Tap organelles for info', 'Observe the green chloroplasts'],
      title: 'Plant Cell', subtitle: 'Structure and Organelles',
      description: 'A plant cell is the basic unit of life in plants with rigid walls and green energy makers.',
      keyIdeas: ['Rigid Cell Wall for support', 'Chloroplasts for photosynthesis', 'Large Central Vacuole for storage', 'Rectangular shape vs Animal cells']
    },
    questions: [
      { id: 'q2w2-q1', question: 'Which organelle is found in plant cells but NOT in animal cells?', options: ['Nucleus', 'Cell membrane', 'Chloroplast', 'Mitochondria'], correctIndex: 2, hint: 'It is green and responsible for photosynthesis' },
      { id: 'q2w2-q2', question: 'What is the function of the cell membrane?', options: ['To produce energy', 'To control what enters and exits the cell', 'To store genetic information', 'To manufacture proteins'], correctIndex: 1, hint: 'Think about a gatekeeper' },
      { id: 'q2w2-q3', question: 'What is the main function of the mitochondria?', options: ['Protein synthesis', 'Photosynthesis', 'Energy production (ATP synthesis)', 'Cell division'], correctIndex: 2, hint: '"Powerhouse of the cell"' },
      { id: 'q2w2-q4', question: 'What structural feature gives plant cells a rigid shape that animal cells lack?', options: ['Nucleus', 'Cell wall', 'Cytoplasm', 'Ribosome'], correctIndex: 1, hint: 'It is made of cellulose' },
      { id: 'q2w2-q5', question: 'Where is the genetic information (DNA) stored in the cell?', options: ['Ribosome', 'Cell membrane', 'Mitochondria', 'Nucleus'], correctIndex: 3, hint: 'The control center of the cell' },
    ],
  },

  {
    id: 'q2w3',
    title: 'Unicellular and Multicellular Organisms',
    subject: 'biology',
    summary: 'Discover the scale and complexity of life by comparing single-celled and multi-celled organisms.',
    topicId: 'b1',
    steps: ['Describe Organism Types', 'Identify Bacteria (Unicellular)', 'Identify Human (Multicellular)'],
    isUnlockedByDefault: false,
    quarter: 2, week: 3,
    pdfUrl: '/lessons/Q2W3.pdf',
    curriculum: {
      standards: 'Cells are the basic unit of life.',
      performanceStandards: 'By the end of the Quarter, learners will be able to create a visual representation explaining the trophic level in a chosen ecosystem.',
      learningCompetencies: ['Recognize that some organisms consist of a single cell (unicellular) like in bacteria and some consist of many cells (multicellular) like in a human'],
      objectives: ['Describe unicellular and multicellular organisms', 'Identify examples of unicellular and multicellular organisms'],
      contentDetails: 'Plant and animal cells: Unicellular and Multicellular organisms',
      integration: { qualities: ['Ecological Awareness', 'Global Diversity'], description: 'Observation of microorganisms and their roles in the ecosystem.' }
    },
    arPayload: {
      modelIndex: 2, detectionMode: 'marker', markerImage: '/markers/Q2W3.jpg',
      anchorHint: 'Scan the Bacteria card.',
      lessonSteps: ['Aim at Q2W3 marker', 'Rotate to see flagella', 'Inspect the circular DNA'],
      title: 'Prokaryotic Cell', subtitle: 'Bacterial Cell Structure',
      description: 'Simple, single-celled organisms that lack a nucleus but perform all life functions.',
      keyIdeas: ['No nucleus (DNA floats freely)', 'Have Cell Wall and Cell Membrane', 'Flagella used for movement', 'Reproduce quickly by binary fission']
    },
    questions: [
      { id: 'q2w3-q1', question: 'What is a unicellular organism?', options: ['An organism made of many cells', 'An organism made of a single cell', 'An organism with no cells', 'A plant or animal only'], correctIndex: 1, hint: '"Uni" means one' },
      { id: 'q2w3-q2', question: 'Which of the following is an example of a unicellular organism?', options: ['Dog', 'Bacteria', 'Tree', 'Mushroom'], correctIndex: 1, hint: 'It is microscopic and consists of just one cell' },
      { id: 'q2w3-q3', question: 'What advantage does being multicellular provide to an organism?', options: ['Smaller body size', 'Cell specialization allowing complex functions', 'Faster reproduction', 'No advantages'], correctIndex: 1, hint: 'Different cells can perform different jobs' },
      { id: 'q2w3-q4', question: 'What is a prokaryote?', options: ['A multicellular organism', 'A cell with a nucleus', 'A unicellular organism without a true nucleus', 'A type of plant cell'], correctIndex: 2, hint: 'Bacteria are prokaryotes — "pro" = before, "karyon" = nucleus' },
      { id: 'q2w3-q5', question: 'Which of the following is a multicellular organism?', options: ['Amoeba', 'Paramecium', 'Human being', 'Bacteria'], correctIndex: 2, hint: 'Trillions of specialized cells work together' },
    ],
  },

  {
    id: 'q2w4',
    title: 'Two Types of Cell Division: Mitosis and Meiosis',
    subject: 'biology',
    summary: 'Distinguish between mitosis and meiosis, and understand mitosis as the process for growth and repair.',
    topicId: 'b2',
    steps: ['Identify Cell Division Types', 'Define Mitosis vs Meiosis', 'Describe Stages of Mitosis'],
    isUnlockedByDefault: false,
    quarter: 2, week: 4,
    pdfUrl: '/lessons/Q2W4.pdf',
    curriculum: {
      standards: 'Cells are the basic unit of life and mitosis, and meiosis are the basic forms of cell division.',
      performanceStandards: 'By the end of the Quarter, learners explain that there are two types of cell division, and that reproduction can occur through sexual or asexual processes.',
      learningCompetencies: ['Recognize that cells reproduce through two types of cell division, mitosis and meiosis, and describe mitosis as cell division for growth and repair'],
      objectives: ['Identify the types of cell division', 'Define mitosis and meiosis', 'Differentiate mitosis and meiosis', 'Describe the different stages of mitosis', 'Illustrate the stages of mitosis'],
      contentDetails: 'Two types of cell division; Stages of Mitosis and Meiosis; Mitosis as cell division for growth and repair',
      integration: { qualities: ['Good Health & Well-Being', 'Scientific Literacy', 'Logical Sequencing'], description: 'Cellular reproduction as fundamental to human health.' }
    },
    arPayload: {
      modelIndex: 3, detectionMode: 'marker', markerImage: '/markers/Q2W4.jpg',
      anchorHint: 'Scan the Cell Division card.',
      lessonSteps: ['Aim at Q2W4 marker', 'Watch Prophase to Telophase', 'Observe two daughter cells'],
      title: 'Mitosis Phases', subtitle: 'Cell Division and Separation',
      description: 'Mitosis is where a parent cell divides into two identical daughter cells.',
      keyIdeas: ['Prophase, Metaphase, Anaphase, Telophase', 'Produces two identical clones', 'Essential for growth and tissue repair', 'Occurs in somatic (body) cells']
    },
    questions: [
      { id: 'q2w4-q1', question: 'What is the main purpose of mitosis?', options: ['To produce sex cells', 'Growth and repair of body cells', 'To create genetic variation', 'To reduce chromosome number'], correctIndex: 1, hint: 'Think about how your body heals wounds' },
      { id: 'q2w4-q2', question: 'How many identical daughter cells result from one mitotic division?', options: ['1', '2', '4', '8'], correctIndex: 1, hint: 'Identical copies of the parent cell' },
      { id: 'q2w4-q3', question: 'What are the correct stages of mitosis in order?', options: ['Metaphase, Prophase, Anaphase, Telophase', 'Prophase, Metaphase, Anaphase, Telophase', 'Anaphase, Telophase, Prophase, Metaphase', 'Telophase, Anaphase, Metaphase, Prophase'], correctIndex: 1, hint: 'Remember: PMAT' },
      { id: 'q2w4-q4', question: 'How does meiosis differ from mitosis?', options: ['Meiosis produces 2 cells; mitosis produces 4', 'Meiosis produces 4 cells with half the chromosomes; mitosis produces 2 identical cells', 'They are the same process', 'Meiosis is for body cells; mitosis is for sex cells'], correctIndex: 1, hint: 'Meiosis is for reproduction' },
      { id: 'q2w4-q5', question: 'What type of cells does meiosis produce?', options: ['Body (somatic) cells', 'Gametes (sex cells)', 'Stem cells', 'Nerve cells'], correctIndex: 1, hint: 'Used in sexual reproduction' },
    ],
  },

  {
    id: 'q2w5',
    title: 'Process of Meiosis and Fertilization',
    subject: 'biology',
    summary: 'Explore how genetic information is shuffled and passed to offspring through gamete formation.',
    topicId: 'b2',
    steps: ['Meiosis & Fertilization', 'Genetic Variation Study', 'Sexual Reproduction in Plants'],
    isUnlockedByDefault: false,
    quarter: 2, week: 5,
    pdfUrl: '/lessons/Q2W5.pdf',
    curriculum: {
      standards: 'Fertilization occurs when a male reproductive cell fuses with a female reproductive cell.',
      performanceStandards: 'By the end of the Quarter, learners explain that there are two types of cell division, and that reproduction can occur through sexual or asexual processes.',
      learningCompetencies: ['Explain that genetic information is passed on to offspring from both parents by the process of meiosis and fertilization'],
      objectives: ['Relate crossing-over, independent assortment, and random fertilization to genetic variation', 'Compare spermatogenesis and oogenesis', 'Explain why meiosis is needed for sexual reproduction', 'Describe how plants reproduce sexually'],
      contentDetails: 'Process of meiosis and fertilization; Process of sexual reproduction; Passing of genetic information through Genetic Diversity and Evolution',
      integration: { qualities: ['Analytical Thinking', 'Hereditary Logic'], description: 'Cellular reproduction and genetics for biology education and research.' }
    },
    arPayload: {
      modelIndex: 4, detectionMode: 'marker', markerImage: '/markers/Q2W5.jpg',
      anchorHint: 'Scan the Fertilization card.',
      lessonSteps: ['Aim at Q2W5 marker', 'Watch sperm enter the egg', 'Observe nuclei merging'],
      title: 'Sexual Fertilization', subtitle: 'Sperm and Egg Union',
      description: 'Fusion of an egg and sperm cell to create a new organism with mixed DNA.',
      keyIdeas: ['Egg (23 chrms) + Sperm (23 chrms)', 'Forms a Zygote (46 chromosomes)', 'Determines hair, eye, and skin traits', 'Creates evolutionary genetic diversity']
    },
    questions: [
      { id: 'q2w5-q1', question: 'What is fertilization?', options: ['The splitting of one cell into two', 'The fusion of a sperm and an egg cell', 'A type of cell repair', 'The growth of a new organism without a partner'], correctIndex: 1, hint: 'Two sex cells join together' },
      { id: 'q2w5-q2', question: 'What is the cell called immediately after fertilization?', options: ['Embryo', 'Gamete', 'Zygote', 'Fetus'], correctIndex: 2, hint: 'The very first cell of a new organism' },
      { id: 'q2w5-q3', question: 'How many chromosomes do human gametes (sperm and egg) each contain?', options: ['46', '23', '92', '12'], correctIndex: 1, hint: 'Half the normal human chromosome number' },
      { id: 'q2w5-q4', question: 'What is crossing-over and why is it significant?', options: ['Cell membranes merging; creates bigger cells', 'Exchange of genetic material between chromosomes during meiosis; creates genetic variation', 'The fusion of two nuclei; creates a zygote', 'Cell wall breaking down; allows fertilization'], correctIndex: 1, hint: 'Occurs in prophase I of meiosis' },
      { id: 'q2w5-q5', question: 'What is the difference between spermatogenesis and oogenesis?', options: ['They are the same process', 'Spermatogenesis produces sperm; oogenesis produces eggs', 'Spermatogenesis produces eggs; oogenesis produces sperm', 'Both produce body cells'], correctIndex: 1, hint: '"Spermato" = sperm, "Oo" = egg' },
    ],
  },

  {
    id: 'q2w6',
    title: 'Sexual and Asexual Reproduction',
    subject: 'biology',
    summary: 'Analyze the advantages and differences between sexual and asexual reproductive strategies.',
    topicId: 'b2',
    steps: ['Differentiate Reproduction Types', 'Asexual Advantages/Disadvantages', 'Offspring Similarity Analysis'],
    isUnlockedByDefault: false,
    quarter: 2, week: 6,
    pdfUrl: '/lessons/Q2W6.pdf',
    curriculum: {
      standards: 'Cells are the basic unit of life; reproduction can occur through sexual or asexual processes.',
      performanceStandards: 'By the end of the Quarter, learners demonstrate understanding and use diagrams to make connections between organisms and their environment.',
      learningCompetencies: ['Differentiate sexual from asexual reproduction in terms of: a) number of parents involved, and b) similarities of offspring to parents'],
      objectives: ['Differentiate asexual reproduction and sexual reproduction', 'Identify the advantages and disadvantages of asexual reproduction', 'Enumerate the types of asexual reproduction'],
      contentDetails: 'Sexual Reproduction; Asexual Reproduction; Comparison between Sexual and Asexual Reproduction',
      integration: { qualities: ['Agricultural Literacy', 'Conservation Awareness'], description: 'Cellular reproduction in agriculture and conservation of terrestrial ecosystems.' }
    },
    arPayload: {
      modelIndex: 5, detectionMode: 'marker', markerImage: '/markers/Q2W6.jpg',
      anchorHint: 'Scan the Amoeba card.',
      lessonSteps: ['Aim at Q2W6 marker', 'Watch the nucleus elongate', 'Observe separation'],
      title: 'Amoeba Binary Fission', subtitle: 'Asexual Reproduction',
      description: 'A form of asexual reproduction where an amoeba divides into two identical cells.',
      keyIdeas: ['Single parent division (cloning)', 'Simple, fast, and energy efficient', 'No mate required for population growth', 'Offspring are genetically identical']
    },
    questions: [
      { id: 'q2w6-q1', question: 'How many parents are involved in sexual reproduction?', options: ['One', 'Two', 'Three', 'None'], correctIndex: 1, hint: 'Two sex cells must unite' },
      { id: 'q2w6-q2', question: 'How many parents are involved in asexual reproduction?', options: ['Two', 'Three', 'One', 'None'], correctIndex: 2, hint: 'No partner is needed' },
      { id: 'q2w6-q3', question: 'What is binary fission?', options: ['Sexual reproduction in bacteria', 'A type of asexual reproduction where an organism splits into two identical cells', 'The fusion of two gametes', 'A stage of mitosis'], correctIndex: 1, hint: 'Common in bacteria and amoeba' },
      { id: 'q2w6-q4', question: 'Are offspring produced by asexual reproduction genetically identical or different to the parent?', options: ['Genetically different', 'Genetically identical', 'Partially different', 'Completely new organisms'], correctIndex: 1, hint: 'No mixing of genetic material occurs' },
      { id: 'q2w6-q5', question: 'What is one key advantage of sexual reproduction over asexual reproduction?', options: ['It is faster', 'It requires only one parent', 'It produces genetic variation in offspring', 'Offspring are always identical'], correctIndex: 2, hint: 'Variation helps species adapt to changing environments' },
    ],
  },

  {
    id: 'q2w7',
    title: 'Unity in Diversity: Levels of Biological Organization',
    subject: 'biology',
    summary: 'Use diagrams to describe the connections between levels of organization, from cells to the biosphere.',
    topicId: 'b4',
    steps: ['Map Biological Hierarchy', 'Cells to Biosphere Connections', 'Ecological Research Intro'],
    isUnlockedByDefault: false,
    quarter: 2, week: 7,
    pdfUrl: '/lessons/Q2W7.pdf',
    curriculum: {
      standards: 'The level of biological organization provides a simple way of connecting the simplest part of the living world to the most complex.',
      performanceStandards: 'By the end of the quarter, learners will explain and use diagrams to make connections between organisms and their environment at various levels of organization.',
      learningCompetencies: ['Use a labelled diagram to describe the connections between the levels of biological organization from cells to the biosphere.', 'Describe the trophic levels of an organism as levels of energy in a food pyramid.'],
      objectives: ['Use labelled diagrams to trace levels of biological organization', 'Analyze the interdependence of cells, tissues, organs, and systems', 'Relate biological organization to biodiversity conservation'],
      contentDetails: 'Unity in Diversity: Levels of Biological and Ecological Organization',
      integration: { qualities: ['Ecological Preservation', 'Holistic Thinking', 'Climate Action'], description: 'Conservation of Ecosystem and Biodiversity.' }
    },
    arPayload: {
      modelIndex: 6, detectionMode: 'marker', markerImage: '/markers/Q2W7and8.jpg',
      anchorHint: 'Scan the Ecosystem worksheet.',
      lessonSteps: ['Aim at Q2W7 marker', 'Zoom into atoms', 'Expand to view the Biosphere'],
      title: 'Biological Organization', subtitle: 'From Atoms to Biosphere',
      description: 'A hierarchical system where each level builds upon the previous one.',
      keyIdeas: ['Cells → Tissues → Organs → Systems', 'Population → Community → Ecosystem', 'All levels are interconnected', 'Each level has unique emergent traits']
    },
    questions: [
      { id: 'q2w7-q1', question: 'What is the smallest level of biological organization that is considered alive?', options: ['Atom', 'Molecule', 'Cell', 'Tissue'], correctIndex: 2, hint: 'The basic unit of life' },
      { id: 'q2w7-q2', question: 'Which level of organization comes directly after tissues?', options: ['Cells', 'Organs', 'Organ systems', 'Organism'], correctIndex: 1, hint: 'Groups of tissues working together form this level' },
      { id: 'q2w7-q3', question: 'What is a population in biology?', options: ['All species in an area', 'All members of the same species living in a specific area', 'All living organisms on Earth', 'A group of organs'], correctIndex: 1, hint: 'Same species, same location' },
      { id: 'q2w7-q4', question: 'What is an ecosystem?', options: ['Only the living organisms in an area', 'Only the non-living factors of an environment', 'A community of organisms interacting with their physical environment', 'A group of cells'], correctIndex: 2, hint: 'Both biotic and abiotic factors are included' },
      { id: 'q2w7-q5', question: 'What is the biosphere?', options: ['A single ecosystem', 'The atmosphere only', 'All living organisms on Earth and all environments they inhabit', 'The ocean only'], correctIndex: 2, hint: 'The largest level of biological organization' },
    ],
  },

  {
    id: 'q2w8',
    title: 'The Ecosystem: Food Chains and Food Webs',
    subject: 'biology',
    summary: 'Understand the transfer of energy through trophic levels in a food pyramid.',
    topicId: 'b4',
    steps: ['Energy Flow Exploration', 'Food Chain vs Food Web', 'Trophic Level Analysis'],
    isUnlockedByDefault: false,
    quarter: 2, week: 8,
    pdfUrl: '/lessons/Q2W8.pdf',
    curriculum: {
      standards: 'Identifying trophic levels helps understand the transfer of energy from one organism to another, as shown in a food pyramid.',
      performanceStandards: 'By the end of the Quarter, learners will explain the process of energy transfer through trophic levels in food chains.',
      learningCompetencies: ['Describe the trophic levels of an organism as levels of energy in a food pyramid.'],
      objectives: ['Identify producers, consumers, and decomposers in a food web', 'Describe the transfer of energy between trophic levels', 'Explain the significance of the food pyramid in energy intake'],
      contentDetails: 'The Ecosystem: Feel the Energy Flow; Food Chain and Food Web',
      integration: { qualities: ['Sustainable Energy Logic', 'Biological Research'], description: 'Food pyramid as a guide to energy intake and phytoplankton roles.' }
    },
    arPayload: {
      modelIndex: 7, detectionMode: 'marker', markerImage: '/markers/Q2W7and8.jpg',
      anchorHint: 'Scan the Ecosystem worksheet (shared marker).',
      lessonSteps: ['Aim at Q2W8 marker', 'Trace arrows from grass to hawk', 'Observe decomposer role'],
      title: 'Food Web & Energy Flow', subtitle: 'Trophic Levels and Transfer',
      description: 'Shows how energy flows through an ecosystem as organisms eat each other.',
      keyIdeas: ['Producers gain 100% of energy', '10% transfers between trophic levels', '90% lost to heat and metabolism', 'Decomposers recycle nutrients to soil']
    },
    questions: [
      { id: 'q2w8-q1', question: 'Who are the producers in a food chain?', options: ['Herbivores', 'Carnivores', 'Plants and other photosynthetic organisms', 'Decomposers'], correctIndex: 2, hint: 'They make their own food from sunlight' },
      { id: 'q2w8-q2', question: 'What do primary consumers feed on?', options: ['Other animals', 'Producers (plants)', 'Decomposers', 'Secondary consumers'], correctIndex: 1, hint: 'First level of consumer; eats plants' },
      { id: 'q2w8-q3', question: 'Approximately what percentage of energy is transferred from one trophic level to the next?', options: ['100%', '50%', '25%', '10%'], correctIndex: 3, hint: 'Most energy is lost as heat' },
      { id: 'q2w8-q4', question: 'What is the role of decomposers in an ecosystem?', options: ['To hunt prey', 'To carry out photosynthesis', 'To break down dead matter and recycle nutrients', 'To compete with producers for sunlight'], correctIndex: 2, hint: 'Think of fungi and bacteria in the soil' },
      { id: 'q2w8-q5', question: 'What is a food web?', options: ['A single straight-line feeding relationship', 'A complex network of interconnected food chains showing all feeding relationships', 'A diagram of plant roots', 'A method of classifying organisms'], correctIndex: 1, hint: 'More complex and realistic than a single food chain' },
    ],
  },
]

// ─── Derived exports (same shape as before — all imports remain unchanged) ────

export const LESSONS: Lesson[] = CURRICULUM.map(({ questions: _q, ...lesson }) => lesson as Lesson)

export const QUIZ_QUESTIONS: BuiltInQuestion[] = CURRICULUM.flatMap(lesson =>
  lesson.questions.map(q => ({
    ...q,
    subject: lesson.subject,
    lessonId: lesson.id,
    topicId: lesson.topicId,
  }))
)
