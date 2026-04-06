import type { Lesson } from '../types'

export const LESSONS: Lesson[] = [
  // --- QUARTER 1: CHEMISTRY ---
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
      performanceStandards: 'By the end of the Quarter, learners recognize that scientists use models to describe the particle model of matter. They use diagrams and illustrations to explain the motion and arrangement of particles during changes of state. They demonstrate an understanding of the role of solute and solvent in solutions and the factors that affect solubility. They demonstrate skills to plan and conduct a scientific investigation making accurate measurements and using standard units.',
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
        description: 'Students question and analyze the nature of matter and how models represent it. Grasping the abstract concept of the Particle Model might take some effort.'
      }
    },
    arPayload: {
      modelIndex: 0,
      detectionMode: 'marker',
      markerImage: '/markers/Q1W1.jpg',
      anchorHint: 'Scan the Democritus worksheet marker.',
      lessonSteps: ['Aim at Q1W1 marker', 'View the 3D atom model', 'Discover its structure'],
      title: 'Democritus Atom',
      subtitle: 'Ancient Greek Atomic Theory (c. 400 BCE)',
      description: 'Democritus proposed that all matter consists of tiny, indivisible particles called "atomos" (uncuttable).',
      keyIdeas: [
        'Smallest, indestructible building blocks of matter',
        'Particles in constant, random motion',
        'Differ in shape and size',
        'Form all materials in the universe'
      ]
    }
  },
  {
    id: 'q1w2',
    title: 'Pure Substances and Kinetic Molecular Theory of Matter',
    subject: 'chemistry',
    summary: 'Understand the properties of pure substances and the kinetic behavior of particles.',
    topicId: 'c1',
    steps: ['Compare Elements & Compounds', 'Analyze Particle Motion', 'Study Temperature Effects'],
    isUnlockedByDefault: false,
    quarter: 1,
    week: 2,
    pdfUrl: '/lessons/Q1W2.pdf',
    curriculum: {
      standards: 'The learners shall learn that there are specific processes for planning, conducting, and recording scientific investigations.',
      performanceStandards: 'By the end of the quarter, the learners shall recognize that scientists use models to describe the particle model of matter. They use diagrams and illustrations to explain the motion and arrangement of particles during changes of state. They demonstrate an understanding of the role of solute and solvent in solutions and the factors that affect solubility. They demonstrate skills to plan and conduct a scientific investigation making accurate measurements and using standard units.',
      learningCompetencies: [
        'describe the Particle Model of Matter as “All matter is made up of tiny particles with each pure substance having its own kind of particles.”',
        'describe that particles are constantly in motion, have spaces between them, attract each other, and move faster as the temperature increases (or with the addition of heat).'
      ],
      objectives: [
        'differentiate elements and compounds based on particle composition',
        'explain how the Kinetic Molecular Theory describes the behavior of particles in terms of constant motion, spacing between particles, and the relationship between temperature and particle speed.'
      ],
      contentDetails: 'Pure Substances and Kinetic Molecular Theory of Matter',
      integration: {
        qualities: ['Curiosity', 'Scientific Literacy', 'Critical Thinking'],
        description: 'Exploring the nature of matter fosters curiosity. KMT contributes to scientific literacy, allowing individuals to make informed decisions about their environment.'
      }
    },
    arPayload: {
      modelIndex: 1,
      detectionMode: 'marker',
      markerImage: '/markers/Q1W2.jpg',
      anchorHint: 'Scan the Water Polarity card.',
      lessonSteps: ['Aim at Q1W2 marker', 'See positive and negative ends', 'Rotate to inspect bonds'],
      title: 'Water Polarity',
      subtitle: 'The Polar Molecule - H₂O',
      description: 'Water is a polar molecule, meaning it has unequal distribution of electric charge.',
      keyIdeas: [
        'Oxygen atom pulls electrons toward itself',
        'Creates negative charge near oxygen',
        'Creates positive charge near hydrogens',
        'Results in a bent molecular shape'
      ]
    }
  },
  {
    id: 'q1w3',
    title: 'States of Matter and Particle Arrangement',
    subject: 'chemistry',
    summary: 'Compare particle arrangement, spacing, and relative motion in Solids, Liquids, and Gases.',
    topicId: 'c1',
    steps: ['Analyze particle packaging', 'Observe molecular motion', 'Explain State Changes'],
    isUnlockedByDefault: false,
    quarter: 1,
    week: 3,
    pdfUrl: '/lessons/Q1W3.pdf',
    curriculum: {
      standards: 'The learners shall learn that diagrams and flowcharts are very useful in demonstrating and explaining the motion and arrangement of particles during changes of state.',
      performanceStandards: 'By the end of the Quarter, learners recognize that scientists use models to describe the particle model of matter. They use diagrams and illustrations to explain the motion and arrangement of particles during changes of state. They demonstrate an understanding of the role of solute and solvent in solutions and the factors that affect solubility. They demonstrate skills to plan and conduct a scientific investigation making accurate measurements and using standard units.',
      learningCompetencies: [
        'use diagrams and illustrations to describe the arrangement, spacing, and relative motion of the particles in each of the three states (phases) of matter.',
        'explain the changes of state in terms of particle arrangement and energy changes: solid → liquid → vapor, and vapor → liquid → solid.'
      ],
      objectives: [
        'develop a deeper understanding of particle arrangement and movement in different states of matter (solid, liquid, gas) through various ways of expression.',
        'explain how a substance changes its state from solid to liquid to gas by analyzing particle behavior and the influence of temperature.',
        'demonstrate understanding of changes of state: solid → liquid → vapor, and vice versa.'
      ],
      contentDetails: 'States of Matter and Particle Arrangement and Phase Changes',
      integration: {
        qualities: ['Analytical Thinking', 'Visualization'],
        description: 'Building mental models through diagrams enhances spatial reasoning. Understanding phase changes is critical for both lab science and daily observations.'
      }
    },
    arPayload: {
      modelIndex: 2,
      detectionMode: 'marker',
      markerImage: '/markers/Q1W3.jpg',
      anchorHint: 'Scan the States of Matter worksheet.',
      lessonSteps: ['Aim at Q1W3 marker', 'Toggle between S, L, G', 'Observe vibration vs flow'],
      title: 'States of Matter',
      subtitle: 'Solid, Liquid, and Gas',
      description: 'Matter exists in three main states, each with different particle arrangements and energy levels.',
      keyIdeas: [
        'Solid: Particles tightly packed & vibrate',
        'Liquid: Moderate forces & flow freely',
        'Gas: Weak forces & spread far apart',
        'Kinetic Energy determines the state'
      ]
    }
  },
  {
    id: 'q1w4',
    title: 'Designing a Scientific Investigation',
    subject: 'chemistry',
    summary: 'Master the formal steps of scientific inquiry from problem identification to conclusion.',
    topicId: 'c1',
    steps: ['Identify the Aim', 'List Materials', 'Outline Procedures'],
    isUnlockedByDefault: false,
    quarter: 1,
    week: 4,
    pdfUrl: '/lessons/Q1W4.pdf',
    curriculum: {
      standards: 'Learners learn that there are specific processes for planning, conducting, and recording scientific investigations.',
      performanceStandards: 'By the end of the Quarter, learners recognize that scientists use models to describe the particle model of matter. They use diagrams and illustrations to explain the motion and arrangement of particles during changes of state. They demonstrate an understanding of the role of solute and solvent in solutions and the factors that affect solubility. They demonstrate skills to plan and conduct a scientific investigation making accurate measurements and using standard units.',
      learningCompetencies: [
        'The learners follow the appropriate steps of a scientific investigation which include: (a) Aim or problem, (b) Materials and equipment, (c) Method or procedures, (d) Results including data, and (e) Conclusions.'
      ],
      objectives: [
        'Identify the core components of a scientific investigation',
        'Demonstrate how to structure a method for a simple experiment',
        'Understand the importance of documenting results accurately'
      ],
      contentDetails: 'Designing a Scientific Investigation',
      integration: {
        qualities: ['Scientific Literacy', 'Innovation & Technology', 'Ethical Considerations'],
        description: 'Fostering scientific qualities and ethical considerations ensures that innovation is balanced with responsibility.'
      }
    },
    arPayload: {
      modelIndex: 3,
      detectionMode: 'marker',
      markerImage: '/markers/Q1W4.jpg',
      anchorHint: 'Scan the Kinetic Theory card.',
      lessonSteps: ['Aim at Q1W4 marker', 'Increase temperature', 'Watch particles speed up'],
      title: 'Particle Motion & Temperature',
      subtitle: 'How Heat Affects Particle Movement',
      description: 'All particles are in constant, random motion. Temperature measures how fast particles move.',
      keyIdeas: [
        'Higher temperature = Faster particle motion',
        'Absolute zero (−273°C) = Particles stop moving',
        'Motion never stops in normal conditions',
        'KE depends on particle mass and speed'
      ]
    }
  },
  {
    id: 'q1w5',
    title: 'Planning and Recording Scientific Investigations',
    subject: 'chemistry',
    summary: 'Deep dive into variables, hypotheses, and the logic of experimental results.',
    topicId: 'c1',
    steps: ['Identify Variables', 'Formulate Hypothesis', 'Draw Conclusions'],
    isUnlockedByDefault: false,
    quarter: 1,
    week: 5,
    pdfUrl: '/lessons/Q1W5.pdf',
    curriculum: {
      standards: 'Learners learn that there are specific processes for planning, conducting, and recording scientific investigations.',
      performanceStandards: 'By the end of the Quarter, learners recognize that scientists use models to describe the particle model of matter. They use diagrams and illustrations to explain the motion and arrangement of particles during changes of state. They demonstrate an understanding of the role of solute and solvent in solutions and the factors that affect solubility. They demonstrate skills to plan and conduct a scientific investigation making accurate measurements and using standard units.',
      learningCompetencies: [
        'The learners follow the appropriate steps of a scientific investigation which include: (a) aim or problem, (b) materials and equipment, (c) method or procedures, (d) results including data, and (e) conclusions'
      ],
      objectives: [
        'Identify the different types of variables',
        'Make hypotheses based on the given scientific problem',
        'Conduct an experiment to prove hypothesis',
        'Draw conclusions from given scientific scenarios',
        'Apply the scientific method in investigating certain scenarios'
      ],
      contentDetails: 'Planning, following, and recording scientific investigations: Steps in Scientific Method, Identifying problem, Gathering Data, Hypothesis',
      integration: {
        qualities: ['Research Design', 'Data Analysis', 'Peer Review'],
        description: 'Developing skills in data collection and ethical application ensures robust scientific outcomes and responsible decision making.'
      }
    },
    hasAR: false
  },
  {
    id: 'q1w6',
    title: 'Standard Units and Measuring Physical Quantities',
    subject: 'chemistry',
    summary: 'Master the art of accurate measurement and organized data collection in scientific investigations.',
    topicId: 'c1',
    steps: ['Use Standard Units', 'Measure Volume & Mass', 'Identify Solute & Solvent'],
    isUnlockedByDefault: false,
    quarter: 1,
    week: 6,
    pdfUrl: '/lessons/Q1W6.pdf',
    curriculum: {
      standards: 'The learners shall learn different standard units of measurement, organize collected data and identify the components of a solution.',
      performanceStandards: 'By the end of the quarter, the learners shall perform accurate measurements and organize collected data. They can also demonstrate an understanding of the role of solute and solvent in solutions and predict whether a given solute will dissolve in a given solvent.',
      learningCompetencies: [
        'The learners shall make accurate measurements using standard units for physical quantity, and organize the collected data when carrying out a scientific investigation and be able to identify the role of the solute and solvent in a solution.'
      ],
      objectives: [
        'Use the standard units of physical quantities',
        'Make accurate measurements of physical quantities using measuring instruments',
        'Organize data collected from investigation',
        'Identify the components of a solution'
      ],
      contentDetails: 'Standard Units of Physical Quantities; Measuring Physical Quantities; Organizing data; Components of a Solution',
      integration: {
        qualities: ['Accuracy', 'Interdisciplinary Skills', 'Organization'],
        description: 'Measurement skills are foundational across mathematics, social studies, and health. Organizing data effectively is a universal life skill.'
      }
    },
    arPayload: {
      modelIndex: 5,
      detectionMode: 'marker',
      markerImage: '/markers/Q1W6.jpg',
      anchorHint: 'Scan the Equipment Safety marker.',
      lessonSteps: ['Aim at Q1W6 marker', 'See 100ml, 250ml, 500ml', 'Inspect the pour spout'],
      title: 'Laboratory Beakers',
      subtitle: 'Essential Lab Glassware',
      description: 'Beakers are fundamental laboratory containers used for mixing, heating, and measuring liquids.',
      keyIdeas: [
        'Cylindrical shape with flat bottom',
        'Pouring spout for easier transfer',
        'Graduated marks for volume estimation',
        'Heat-resistant borosilicate glass'
      ]
    }
  },
  {
    id: 'q1w7',
    title: 'Properties of Solutions: Solubility and Concentration',
    subject: 'chemistry',
    summary: 'Analyze saturation levels and calculate concentrations quantitatively.',
    topicId: 'c1',
    steps: ['Saturated vs Unsaturated', 'Calculate Percent by Mass', 'Calculate Percent by Volume'],
    isUnlockedByDefault: false,
    quarter: 1,
    week: 7,
    pdfUrl: '/lessons/Q1W7.pdf',
    curriculum: {
      standards: 'The learners shall learn the properties of solutions such as solubility and reaction to litmus determine their use.',
      performanceStandards: 'By the end of the Quarter, learners recognize that scientists use models to describe the particle model of matter. They use diagrams and illustrations to explain the motion and arrangement of particles during changes of state. They demonstrate an understanding of the role of solute and solvent in solutions and the factors that affect solubility. They demonstrate skills to plan and conduct a scientific investigation making accurate measurements and using standard units.',
      learningCompetencies: [
        'The learners shall be able to identify the role of the solute and solvent in a solution and to express quantitatively the amount of solute present in a given volume of solution.'
      ],
      objectives: [
        'Identify the properties of a solution',
        'Differentiate saturated from unsaturated solutions',
        'Calculate the amount of solute in a given mass of solution (percent by mass)',
        'Calculate the amount of solute in a given volume of solution (percent by volume)'
      ],
      contentDetails: 'Properties of Solutions: Saturated and Unsaturated Solutions; Solutions, solubility, and concentration',
      integration: {
        qualities: ['Quantitative Reasoning', 'Environmental Awareness', 'Pharmaceutical Practice'],
        description: 'Understanding solutions is essential in environmental science for mitigation and pharmacy for healthcare practice.'
      }
    },
    arPayload: {
      modelIndex: 6,
      detectionMode: 'marker',
      markerImage: '/markers/Q1W7.jpg',
      anchorHint: 'Scan the Solubility card.',
      lessonSteps: ['Aim at Q1W7 marker', 'Add solute to reach saturation', 'Observe crystal growth'],
      title: 'Crystal Saturation',
      subtitle: 'Saturated vs. Unsaturated Solutions',
      description: 'Saturation describes how much dissolved substance a solution can hold.',
      keyIdeas: [
        'Unsaturated can dissolve more solute',
        'Saturated reached its maximum limit',
        'Crystal formation occurs at saturation',
        'Solubility varies with temperature'
      ]
    }
  },
  {
    id: 'q1w8',
    title: 'Factors Affecting Solubility and Proper Lab Handling',
    subject: 'chemistry',
    summary: 'Investigate how temperature and particle size impact solubility, and master science equipment safety.',
    topicId: 'c1',
    quarter: 1,
    week: 8,
    steps: ['Effect of Temperature', 'Particle Size & Solubility', 'Lab Equipment Handling'],
    isUnlockedByDefault: false,
    pdfUrl: '/lessons/Q1W8.pdf',
    curriculum: {
      standards: 'The learners shall learn the properties of solutions such as solubility and reaction to litmus paper and other indicators.',
      performanceStandards: 'By the end of the quarter, the learners shall demonstrate an understanding of the role of solute and solvent in solutions and the factors that affect solubility.',
      learningCompetencies: [
        'The learners shall be able demonstrate how different factors affect the solubility of a solute in each solvent; identify solutions such as acids, bases, and salts which can be found at home, and in school that react with litmus paper; and demonstrate proper use and handling of science equipment.'
      ],
      objectives: [
        'Explain how temperature affects the solubility of solid material',
        'Explain how the nature of solute/particle size and solvent affect the rate of solubility',
        'Identify solutions such as acids, bases, and salts which react with litmus paper',
        'Identify different science equipment and demonstrate proper handling'
      ],
      contentDetails: 'Factors Affecting Solubility; Types of Solutions; Proper Use and Handling of Science Equipment',
      integration: {
        qualities: ['Lab Proficiency', 'Analytical Logic', 'Chemical Safety'],
        description: 'Mastering solubility factors is key for biochemistry, medicine, and food science. Proper equipment handling is critical for safety.'
      }
    },
    arPayload: {
      modelIndex: 7,
      detectionMode: 'marker',
      markerImage: '/markers/Q1W8.jpg',
      anchorHint: 'Scan the Ionic Dissolution marker.',
      lessonSteps: ['Aim at Q1W8 marker', 'Zoom in on the crystal lattice', 'Observe water molecules pulling ions'],
      title: 'Salt Dissolving in Water',
      subtitle: 'Ionic Dissolution - NaCl in H₂O',
      description: 'Salt dissolves in water through a process where water molecules surround and separate ionic bonds.',
      keyIdeas: [
        'Sodium (Na+) and Chloride (Cl-) ions',
        'Water polar ends attract opposite charges',
        'Hydration coats the crystal surface',
        'Ionic bonds break to form saline'
      ]
    }
  },

  // --- QUARTER 2: BIOLOGY ---
  {
    id: 'q2w1',
    title: 'The Compound Microscope',
    subject: 'biology',
    summary: 'Master the parts and proper handling techniques of a compound microscope for cellular observation.',
    topicId: 'b1',
    steps: ['Identify Microscope Parts', 'Practice Proper Handling', 'Learn Storage Protocol'],
    isUnlockedByDefault: false,
    quarter: 2,
    week: 1,
    pdfUrl: '/lessons/Q2W1.pdf',
    curriculum: {
      standards: 'Familiarity and proper use of a compound microscope are essential to observe cells. The organelles of plant and animal cells can be identified using a compound microscope. Cells are the basic unit of life and mitosis, and meiosis are the basic forms of cell division.',
      performanceStandards: 'By the end of the Quarter, learners will be able to create a visual representation, such as poster, model, or e-poster, explaining the trophic level in a chosen ecosystem.',
      learningCompetencies: [
        'Identify the parts and functions, and demonstrate proper handling and storing of a compound microscope'
      ],
      objectives: [
        'Identify the parts of a compound microscope and the function of each part',
        'Demonstrate the proper handling and storing of a compound microscope'
      ],
      contentDetails: 'Science equipment: The Compound Microscope (Parts and Functions, Using of Microscope)',
      integration: {
        qualities: ['Scientific Inquiry', 'Microscopic Literacy', 'Digital Illustration'],
        description: 'Utilization of a microscope in investigating microorganisms; mapping the intricate patterns of cells for artistic inspiration.'
      }
    },
    arPayload: {
      modelIndex: 0,
      detectionMode: 'marker',
      markerImage: '/markers/Q2W1.jpg',
      anchorHint: 'Scan the Microscopy worksheet.',
      lessonSteps: ['Aim at Q2W1 marker', 'Interact with knobs', 'Zoom into the objective lens'],
      title: 'Compound Light Microscope',
      subtitle: 'Lab Microscope for Observation',
      description: 'An optical instrument that magnifies tiny objects invisible to the naked eye.',
      keyIdeas: [
        'Eyepiece and Objective lenses',
        'Course and Fine adjustment knobs',
        'Magnification = Obj × Ocular',
        'Stage holds the glass slides'
      ]
    }
  },
  {
    id: 'q2w2',
    title: 'Plant and Animal Cells',
    subject: 'biology',
    summary: 'Observe and identify organelles in plant and animal cells, and compare their unique structures.',
    topicId: 'b1',
    steps: ['Observing Cell Parts', 'Comparing Plant vs Animal', 'Identifying Organelles'],
    isUnlockedByDefault: false,
    quarter: 2,
    week: 2,
    pdfUrl: '/lessons/Q2W2.pdf',
    curriculum: {
      standards: 'Familiarity and proper use of a compound microscope are essential to observe cells. The organelles of plant and animal cells can be identified using a compound microscope. Cells are the basic unit of life and mitosis, and meiosis are the basic forms of cell division.',
      performanceStandards: 'By the end of the Quarter, learners will be able to create a visual representation, such as poster, model, or e-poster, explaining the trophic level in a chosen ecosystem.',
      learningCompetencies: [
        'Use proper techniques in observing and identifying the parts of a cell with a microscope such as the cell membrane, nucleus, cytoplasm, mitochondria, chloroplasts, and ribosomes',
        'Differentiate plant and animal cells based on their organelles'
      ],
      objectives: [
        'Use proper techniques when observing the parts of a cell under a microscope',
        'Identify parts of a cell (membrane, nucleus, cytoplasm) with a microscope',
        'Identify the parts of a plant cell and the function of each',
        'Identify the parts of an animal cell and the function of each',
        'Compare and contrast plant and animal cells based on their organelles'
      ],
      contentDetails: 'Plant and animal cells (Parts and Functions, Similarities and Differences)',
      integration: {
        qualities: ['Biodiversity Patterns', 'Analytical Comparison', 'Scientific Illustration'],
        description: 'Distribution of plant and animal cells relating to global diversity patterns and cellular patterns as inspiration for art.'
      }
    },
    arPayload: {
      modelIndex: 1,
      detectionMode: 'marker',
      markerImage: '/markers/Q2W2.jpg',
      anchorHint: 'Scan the Cell Structure card.',
      lessonSteps: ['Aim at Q2W2 marker', 'Tap organelles for info', 'Observe the green chloroplasts'],
      title: 'Plant Cell',
      subtitle: 'Structure and Organelles',
      description: 'A plant cell is the basic unit of life in plants with rigid walls and green energy makers.',
      keyIdeas: [
        'Rigid Cell Wall for support',
        'Chloroplasts for photosynthesis',
        'Large Central Vacuole for storage',
        'Rectangular shape vs Animal cells'
      ]
    }
  },
  {
    id: 'q2w3',
    title: 'Unicellular and Multicellular Organisms',
    subject: 'biology',
    summary: 'Discover the scale and complexity of life by comparing single-celled and multi-celled organisms.',
    topicId: 'b1',
    steps: ['Describe Organism Types', 'Identify Bacteria (Unicellular)', 'Identify Human (Multicellular)'],
    isUnlockedByDefault: false,
    quarter: 2,
    week: 3,
    pdfUrl: '/lessons/Q2W3.pdf',
    curriculum: {
      standards: 'Familiarity and proper use of a compound microscope are essential to observe cells. The organelles of plant and animal cells can be identified using a compound microscope. Cells are the basic unit of life and mitosis, and meiosis are the basic forms of cell division.',
      performanceStandards: 'By the end of the Quarter, learners will be able to create a visual representation, such as poster, model, or e-poster, explaining the trophic level in a chosen ecosystem.',
      learningCompetencies: [
        'Recognize that some organisms consist of a single cell (unicellular) like in bacteria and some consist of many cells (multicellular) like in a human'
      ],
      objectives: [
        'Describe unicellular and multicellular organisms',
        'Identify examples of unicellular and multicellular organisms'
      ],
      contentDetails: 'Plant and animal cells: Unicellular and Multicellular organisms',
      integration: {
        qualities: ['Ecological Awareness', 'Global Diversity'],
        description: 'Observation of microorganisms and their roles in the ecosystem; relating plant and animal diversity pattern to global patterns.'
      }
    },
    arPayload: {
      modelIndex: 2,
      detectionMode: 'marker',
      markerImage: '/markers/Q2W3.jpg',
      anchorHint: 'Scan the Bacteria card.',
      lessonSteps: ['Aim at Q2W3 marker', 'Rotate to see flagella', 'Inspect the circular DNA'],
      title: 'Prokaryotic Cell',
      subtitle: 'Bacterial Cell Structure',
      description: 'Simple, single-celled organisms that lack a nucleus but perform all life functions.',
      keyIdeas: [
        'No nucleus (DNA floats freely)',
        'Have Cell Wall and Cell Membrane',
        'Flagella used for movement',
        'Reproduce quickly by binary fission'
      ]
    }
  },
  {
    id: 'q2w4',
    title: 'Two Types of Cell Division: Mitosis and Meiosis',
    subject: 'biology',
    summary: 'Distinguish between mitosis and meiosis, and understand mitosis as the process for growth and repair.',
    topicId: 'b2',
    steps: ['Identify Cell Division Types', 'Define Mitosis vs Meiosis', 'Describe Stages of Mitosis'],
    isUnlockedByDefault: false,
    quarter: 2,
    week: 4,
    pdfUrl: '/lessons/Q2W4.pdf',
    curriculum: {
      standards: 'Cells are the basic unit of life and mitosis, and meiosis are the basic forms of cell division. Fertilization occurs when a male reproductive cell fuses with a female reproductive cell.',
      performanceStandards: 'By the end of the Quarter, learners demonstrate understanding of the parts and function of a compound microscope and use this to identify cell structure... They explain that there are two types of cell division, and that reproduction can occur through sexual or asexual processes.',
      learningCompetencies: [
        'recognize that cells reproduce through two types of cell division, mitosis and meiosis, and describe mitosis as cell division for growth and repair'
      ],
      objectives: [
        'Identify the types of cell division',
        'Define mitosis and meiosis',
        'Differentiate mitosis and meiosis',
        'Enumerate the significance of mitosis',
        'Describe the different stages of mitosis',
        'Illustrate the stages of mitosis',
        'Summarize the stages that occur during meiosis'
      ],
      contentDetails: 'Two types of cell division; Stages of Mitosis and Meiosis; Mitosis as cell division for growth and repair',
      integration: {
        qualities: ['Good Health & Well-Being', 'Scientific Literacy', 'Logical Sequencing'],
        description: 'SDG 3 (Health): Cellular reproduction as fundamental to human health. SDG 15 (Life on Land): Mitosis contributes to biodiversity and species conservation.'
      }
    },
    arPayload: {
      modelIndex: 3,
      detectionMode: 'marker',
      markerImage: '/markers/Q2W4.jpg',
      anchorHint: 'Scan the Cell Division card.',
      lessonSteps: ['Aim at Q2W4 marker', 'Watch Prophase to Telophase', 'Observe two daughter cells'],
      title: 'Mitosis Phases',
      subtitle: 'Cell Division and Separation',
      description: 'Mitosis is where a parent cell divides into two identical daughter cells.',
      keyIdeas: [
        'Prophase, Metaphase, Anaphase, Telophase',
        'Produces two identical clones',
        'Essential for growth and tissue repair',
        'Occurs in somatic (body) cells'
      ]
    }
  },
  {
    id: 'q2w5',
    title: 'Process of Meiosis and Fertilization',
    subject: 'biology',
    summary: 'Explore how genetic information is shuffled and passed to offspring through gamete formation.',
    topicId: 'b2',
    steps: ['Meiosis & Fertilization', 'Genetic Variation Study', 'Sexual Reproduction in Plants'],
    isUnlockedByDefault: false,
    quarter: 2,
    week: 5,
    pdfUrl: '/lessons/Q2W5.pdf',
    curriculum: {
      standards: 'Fertilization occurs when a male reproductive cell fuses with a female reproductive cell. Sexual reproduction is the basis of heredity.',
      performanceStandards: 'By the end of the Quarter, learners demonstrate understanding... They explain that there are two types of cell division, and that reproduction can occur through sexual or asexual processes.',
      learningCompetencies: [
        'explain that genetic information is passed on to offspring from both parents by the process of meiosis and fertilization'
      ],
      objectives: [
        'Relate crossing-over, independent assortment, and random fertilization to genetic variation',
        'Compare spermatogenesis and oogenesis',
        'Explain why meiosis is needed for sexual reproduction',
        'Describe how plants reproduce sexually',
        'Describe how the male and female gametophytes are formed'
      ],
      contentDetails: 'Process of meiosis and fertilization; Process of sexual reproduction; Passing of genetic information through Genetic Diversity and Evolution',
      integration: {
        qualities: ['Analytical Thinking', 'Hereditary Logic'],
        description: 'SDG 4 (Quality Education): Cellular reproduction and genetics for biology education and research.'
      }
    },
    arPayload: {
      modelIndex: 4,
      detectionMode: 'marker',
      markerImage: '/markers/Q2W5.jpg',
      anchorHint: 'Scan the Fertilization card.',
      lessonSteps: ['Aim at Q2W5 marker', 'Watch sperm enter the egg', 'Observe nuclei merging'],
      title: 'Sexual Fertilization',
      subtitle: 'Sperm and Egg Union',
      description: 'Fusion of an egg and sperm cell to create a new organism with mixed DNA.',
      keyIdeas: [
        'Egg (23 chrms) + Sperm (23 chrms)',
        'Forms a Zygote (46 chromosomes)',
        'Determines hair, eye, and skin traits',
        'Creates evolutionary genetic diversity'
      ]
    }
  },
  {
    id: 'q2w6',
    title: 'Sexual and Asexual Reproduction',
    subject: 'biology',
    summary: 'Analyze the advantages and differences between sexual and asexual reproductive strategies.',
    topicId: 'b2',
    steps: ['Differentiate Reproduction Types', 'Asexual Advantages/Disadvantages', 'Offspring Similarity Analysis'],
    isUnlockedByDefault: false,
    quarter: 2,
    week: 6,
    pdfUrl: '/lessons/Q2W6.pdf',
    curriculum: {
      standards: 'Cells are the basic unit of life... reproduction can occur through sexual or asexual processes.',
      performanceStandards: 'By the end of the Quarter, learners demonstrate understanding... use diagrams to make connections between organisms and their environment at various levels of organization.',
      learningCompetencies: [
        'differentiate sexual from asexual reproduction in terms of: a) number of parents involved, and b) similarities of offspring to parents'
      ],
      objectives: [
        'Differentiate asexual reproduction and sexual reproduction',
        'Identify the advantages and disadvantages of asexual reproduction',
        'Enumerate the types of asexual reproduction'
      ],
      contentDetails: 'Sexual Reproduction; Asexual Reproduction; Comparison between Sexual and Asexual Reproduction',
      integration: {
        qualities: ['Agricultural Literacy', 'Conservation Awareness'],
        description: 'SDG 2 (Zero Hunger): Cellular reproduction in agriculture. SDG 15 (Life on Land): Conservation and management of terrestrial ecosystems.'
      }
    },
    arPayload: {
      modelIndex: 5,
      detectionMode: 'marker',
      markerImage: '/markers/Q2W6.jpg',
      anchorHint: 'Scan the Amoeba card.',
      lessonSteps: ['Aim at Q2W6 marker', 'Watch the nucleus elongate', 'Observe separation'],
      title: 'Amoeba Binary Fission',
      subtitle: 'Asexual Reproduction',
      description: 'A form of asexual reproduction where an amoeba divides into two identical cells.',
      keyIdeas: [
        'Single parent division (cloning)',
        'Simple, fast, and energy efficient',
        'No mate required for population growth',
        'Offspring are genetically identical'
      ]
    }
  },
  {
    id: 'q2w7',
    title: 'Unity in Diversity: Levels of Biological Organization',
    subject: 'biology',
    summary: 'Use diagrams to describe the connections between levels of organization, from cells to the biosphere.',
    topicId: 'b4',
    steps: ['Map Biological Hierarchy', 'Cells to Biosphere Connections', 'Ecological Research Intro'],
    isUnlockedByDefault: false,
    quarter: 2,
    week: 7,
    pdfUrl: '/lessons/Q2W7.pdf',
    curriculum: {
      standards: 'The level of biological organization provides a simple way of connecting the simplest part of the living world to the most complex.',
      performanceStandards: 'By the end of the quarter, learners will explain and use diagrams to make connections between organisms and their environment at various levels of organization.',
      learningCompetencies: [
        'The student will use a labelled diagram to describe the connections between the levels of biological organization to one another from cells to the biosphere.',
        'Describe the trophic levels of an organism as levels of energy in a food pyramid.'
      ],
      objectives: [
        'Use labelled diagrams to trace levels of biological organization',
        'Analyze the interdependence of cells, tissues, organs, and systems',
        'Relate biological organization to biodiversity conservation'
      ],
      contentDetails: 'Unity in Diversity: Levels of Biological and Ecological Organization',
      integration: {
        qualities: ['Ecological Preservation', 'Holistic Thinking', 'Climate Action'],
        description: 'SDG-13 Climate Action: Conservation of Ecosystem. SDG-15 Life on Land: Biodiversity conservation and understanding ecosystems.'
      }
    },
    arPayload: {
      modelIndex: 6,
      detectionMode: 'marker',
      markerImage: '/markers/Q2W7and8.jpg',
      anchorHint: 'Scan the Ecosystem worksheet.',
      lessonSteps: ['Aim at Q2W7 marker', 'Zoom into atoms', 'Expand to view the Biosphere'],
      title: 'Biological Organization',
      subtitle: 'From Atoms to Biosphere',
      description: 'A hierarchical system where each level builds upon the previous one.',
      keyIdeas: [
        'Cells → Tissues → Organs → Systems',
        'Population → Community → Ecosystem',
        'All levels are interconnected',
        'Each level has unique emergent traits'
      ]
    }
  },
  {
    id: 'q2w8',
    title: 'The Ecosystem: Food Chains and Food Webs',
    subject: 'biology',
    summary: 'Understand the transfer of energy through trophic levels in a food pyramid.',
    topicId: 'b4',
    steps: ['Energy Flow Exploration', 'Food Chain vs Food Web', 'Trophic Level Analysis'],
    isUnlockedByDefault: false,
    quarter: 2,
    week: 8,
    pdfUrl: '/lessons/Q2W8.pdf',
    curriculum: {
      standards: 'Identifying trophic levels helps understand the transfer of energy from one organism to another, as shown in a food pyramid.',
      performanceStandards: 'By the end of the Quarter, learners will explain the process of energy transfer through trophic levels in food chains.',
      learningCompetencies: [
        'Describe the trophic levels of an organism as levels of energy in a food pyramid.'
      ],
      objectives: [
        'Identify producers, consumers, and decomposers in a food web',
        'Describe the transfer of energy between trophic levels',
        'Explain the significance of the food pyramid in energy intake'
      ],
      contentDetails: 'The Ecosystem: Feel the Energy Flow; Food Chain and Food Web',
      integration: {
        qualities: ['Sustainable Energy Logic', 'Biological Research'],
        description: 'SDG-3 Good Health and Well-being: Food pyramid as a guide to energy intake. SDG-14 Life Below Water: Phytoplankton roles.'
      }
    },
    arPayload: {
      modelIndex: 7,
      detectionMode: 'marker',
      markerImage: '/markers/Q2W7and8.jpg',
      anchorHint: 'Scan the Ecosystem worksheet (shared marker).',
      lessonSteps: ['Aim at Q2W8 marker', 'Trace arrows from grass to hawk', 'Observe decomposer role'],
      title: 'Food Web & Energy Flow',
      subtitle: 'Trophic Levels and Transfer',
      description: 'Shows how energy flows through an ecosystem as organisms eat each other.',
      keyIdeas: [
        'Producers gain 100% of energy',
        '10% transfers between trophic levels',
        '90% lost to heat and metabolism',
        'Decomposers recycle nutrients to soil'
      ]
    }
  }
]
