// Quarter 3 Quiz Templates - 10 questions per lesson
// Generated from official MATATAG curriculum materials for Physics Q3

import type { TeacherQuizQuestion } from '@/types'

export const Q3W1_QUIZ_TEMPLATES: TeacherQuizQuestion[] = [
  {
    question: 'What is the key difference between distance and displacement?',
    options: [
      'Distance is how far an object travels; displacement includes the direction from start to end',
      'Distance is measured in meters; displacement is measured in kilometers',
      'Distance is used for curves; displacement is used for straight lines only',
      'There is no difference between distance and displacement',
    ],
    correctIndex: 0,
    hint: 'Distance is a scalar (magnitude only); displacement is a vector (magnitude and direction).',
  },
  {
    question: 'A student walks 5m east, then 5m west. What is the displacement?',
    options: [
      '10 m',
      '5 m',
      '0 m',
      '2.5 m',
    ],
    correctIndex: 2,
    hint: 'Displacement measures the straight-line distance from start to finish position.',
  },
  {
    question: 'What does the slope of a distance-time graph represent?',
    options: [
      'Acceleration',
      'Speed',
      'Velocity',
      'Force',
    ],
    correctIndex: 1,
    hint: 'Slope = rise/run = change in distance / change in time',
  },
  {
    question: 'What does the slope of a displacement-time graph represent?',
    options: [
      'Speed',
      'Distance',
      'Velocity',
      'Acceleration',
    ],
    correctIndex: 2,
    hint: 'A displacement-time graph shows position changes, and its slope indicates velocity.',
  },
  {
    question: 'What is the difference between speed and velocity?',
    options: [
      'Speed is faster than velocity',
      'Speed includes direction; velocity does not',
      'Velocity includes direction; speed does not',
      'Speed is measured in km/h; velocity is measured in m/s',
    ],
    correctIndex: 2,
    hint: 'Speed is a scalar quantity; velocity is a vector quantity.',
  },
  {
    question: 'What does a horizontal line on a distance-time graph indicate?',
    options: [
      'The object is speeding up',
      'The object is slowing down',
      'The object is at rest (not moving)',
      'The object is moving backward',
    ],
    correctIndex: 2,
    hint: 'A horizontal line means distance is not changing over time.',
  },
  {
    question: 'A car travels 100 meters in 5 seconds at constant speed. What is its speed?',
    options: [
      '20 m/s',
      '50 m/s',
      '100 m/s',
      '5 m/s',
    ],
    correctIndex: 0,
    hint: 'Speed = distance / time = 100 m / 5 s',
  },
  {
    question: 'On a displacement-time graph, what does a negative slope indicate?',
    options: [
      'The object is moving forward at increasing speed',
      'The object is moving in the negative direction (backward)',
      'The object has stopped moving',
      'The object is accelerating in the positive direction',
    ],
    correctIndex: 1,
    hint: 'Negative slope means displacement is decreasing over time (moving backward).',
  },
  {
    question: 'What is "uniform motion"?',
    options: [
      'When an object moves at the same speed in all directions',
      'When an object moves at constant velocity (same speed and direction)',
      'When an object changes speed and direction randomly',
      'When an object is accelerating uniformly',
    ],
    correctIndex: 1,
    hint: 'On a displacement-time graph, uniform motion appears as a straight line with constant slope.',
  },
  {
    question: 'How can you determine if an object is moving at constant velocity by looking at a displacement-time graph?',
    options: [
      'The line is curved',
      'The line is horizontal',
      'The line is straight with constant slope',
      'The line is vertical',
    ],
    correctIndex: 2,
    hint: 'A straight line (non-horizontal, non-vertical) indicates constant velocity.',
  },
]

export const Q3W2_QUIZ_TEMPLATES: TeacherQuizQuestion[] = [
  {
    question: 'What is a vector in physics?',
    options: [
      'A quantity that has only magnitude',
      'A quantity that has both magnitude and direction',
      'A quantity that measures time',
      'A quantity that is always measured in meters',
    ],
    correctIndex: 1,
    hint: 'Vectors need both size and direction to fully describe them.',
  },
  {
    question: 'In a force diagram, what does the length of an arrow represent?',
    options: [
      'The direction of the force',
      'The point where the force is applied',
      'The magnitude (strength) of the force',
      'The type of force (push or pull)',
    ],
    correctIndex: 2,
    hint: 'Longer arrows represent stronger forces.',
  },
  {
    question: 'A box has a 100 N force pushing it east and a 100 N force pulling it west. What is the net force?',
    options: [
      '200 N',
      '100 N',
      '0 N',
      '50 N',
    ],
    correctIndex: 2,
    hint: 'When equal and opposite forces act on an object, they cancel out (balanced forces).',
  },
  {
    question: 'What are balanced forces?',
    options: [
      'Forces that have equal mass',
      'Forces that sum to zero, resulting in no net force',
      'Forces that act on different objects',
      'Forces that are in the same direction',
    ],
    correctIndex: 1,
    hint: 'Balanced forces do not cause acceleration.',
  },
  {
    question: 'What are unbalanced forces?',
    options: [
      'Forces that do not equal each other in magnitude',
      'Forces whose net sum is zero',
      'Forces that result in a net force causing acceleration',
      'Forces that only act on moving objects',
    ],
    correctIndex: 2,
    hint: 'Unbalanced forces cause objects to accelerate, change direction, or change speed.',
  },
  {
    question: 'What is the primary purpose of a free-body diagram?',
    options: [
      'To show the position of an object',
      'To illustrate all forces acting on a single object',
      'To calculate the speed of an object',
      'To determine the path an object will travel',
    ],
    correctIndex: 1,
    hint: 'FBDs isolate one object and show all external forces acting on it.',
  },
  {
    question: 'An elevator at rest has an upward normal force of 700 N and a downward weight of 700 N. What is the net force?',
    options: [
      '700 N upward',
      '700 N downward',
      '0 N (balanced forces)',
      '1400 N',
    ],
    correctIndex: 2,
    hint: 'When forces are equal and opposite, the net force is zero.',
  },
  {
    question: 'A car moving at constant velocity experiences forces. What must be true about these forces?',
    options: [
      'All forces must be in the same direction',
      'There can be only one force acting on the car',
      'The net force on the car is zero (balanced forces)',
      'The forces are all pointing upward',
    ],
    correctIndex: 2,
    hint: 'This is Newton\'s First Law - constant velocity means no net force (acceleration = 0).',
  },
  {
    question: 'What do free-body diagrams typically not include?',
    options: [
      'Normal force',
      'Weight (gravitational force)',
      'Applied force',
      'Friction force on objects inside the system',
    ],
    correctIndex: 3,
    hint: 'FBDs show only external forces acting on the object, not internal forces.',
  },
  {
    question: 'If a student draws a free-body diagram with two forces pointing in the same direction, what can we conclude?',
    options: [
      'The forces are balanced',
      'The forces are unbalanced, and there is a net force in that direction',
      'The object is at rest',
      'The object is moving at constant velocity',
    ],
    correctIndex: 1,
    hint: 'Forces in the same direction add together to create a net force.',
  },
]

export const Q3W3_QUIZ_TEMPLATES: TeacherQuizQuestion[] = [
  {
    question: 'What does a free-body diagram primarily show?',
    options: [
      'The motion path of an object',
      'All external forces acting on a single isolated object',
      'The internal structure of the object',
      'The weight distribution of the object',
    ],
    correctIndex: 1,
    hint: 'FBDs represent forces using arrows; they isolate one object.',
  },
  {
    question: 'A 50 N force pulls right and a 30 N force pulls left on an object. What is the net force?',
    options: [
      '80 N to the left',
      '20 N to the right',
      '80 N to the right',
      '0 N (balanced)',
    ],
    correctIndex: 1,
    hint: 'Net force = 50 N - 30 N = 20 N in the direction of the larger force.',
  },
  {
    question: 'A chandelier hangs from the ceiling. The weight pulls down with 100 N. The tension in the rope is 100 N upward. What is the state of motion?',
    options: [
      'Accelerating downward',
      'Accelerating upward',
      'At rest or moving at constant velocity (net force = 0)',
      'Oscillating back and forth',
    ],
    correctIndex: 2,
    hint: 'Equal and opposite forces balance out, resulting in zero net force.',
  },
  {
    question: 'Which of these CORRECTLY describes balanced forces?',
    options: [
      'Any two forces of the same magnitude',
      'Forces that result in zero net force and no change in motion',
      'Forces that are in the same direction',
      'Forces that always prevent motion',
    ],
    correctIndex: 1,
    hint: 'Balanced forces must be equal in magnitude and opposite in direction.',
  },
  {
    question: 'A car accelerates from 0 to 60 m/s. What can you conclude about the forces?',
    options: [
      'The forces are balanced',
      'The forces are unbalanced (net force in direction of motion)',
      'There are no forces acting',
      'All forces are in the same direction',
    ],
    correctIndex: 1,
    hint: 'Acceleration means net force is nonzero and in the direction of acceleration.',
  },
  {
    question: 'In a tug-of-war, Team A pulls with 500 N and Team B pulls with 500 N in opposite directions. What happens?',
    options: [
      'Team A moves forward',
      'Team B moves forward',
      'Rope stays stationary (net force = 0, balanced forces)',
      'The rope snaps immediately',
    ],
    correctIndex: 2,
    hint: 'Equal forces in opposite directions create zero net force.',
  },
  {
    question: 'Which free-body diagram correctly represents a ball in free fall?',
    options: [
      'Two arrows pointing up (balanced)',
      'One arrow pointing down (gravity) - no upward force',
      'Two arrows pointing down',
      'No arrows (no forces)',
    ],
    correctIndex: 1,
    hint: 'A falling ball only experiences gravity (downward); no upward force.',
  },
  {
    question: 'A box rests on an inclined plane at 30°. Which statement is true?',
    options: [
      'Only gravity acts on the box',
      'The net force must equal the weight',
      'The normal force balances the component of gravity perpendicular to the plane',
      'The box is accelerating down the plane',
    ],
    correctIndex: 2,
    hint: 'At rest means balanced forces; normal force prevents motion perpendicular to surface.',
  },
  {
    question: 'A person pushes a box with 100 N, and friction opposes with 60 N. What is the direction and magnitude of the net force?',
    options: [
      '160 N in direction of push',
      '40 N in direction of push',
      '60 N against the push',
      '100 N in direction of push',
    ],
    correctIndex: 1,
    hint: 'Net force = 100 N - 60 N = 40 N in the direction of the push.',
  },
  {
    question: 'What is the relationship between net force and acceleration?',
    options: [
      'Larger net force causes smaller acceleration',
      'Net force and acceleration are independent',
      'Larger net force causes larger acceleration in the same direction',
      'Only balanced forces cause acceleration',
    ],
    correctIndex: 2,
    hint: 'Newton\'s Second Law: F_net = ma; they are directly proportional.',
  },
]

export const Q3W5_QUIZ_TEMPLATES: TeacherQuizQuestion[] = [
  {
    question: 'A motorcycle travels 150 km in 2.5 hours. What is its average speed?',
    options: [
      '50 km/hr',
      '60 km/hr',
      '75 km/hr',
      '100 km/hr',
    ],
    correctIndex: 1,
    hint: 'Average speed = total distance / total time = 150 km / 2.5 hr = 60 km/hr.',
  },
  {
    question: 'Which is an example of a vector quantity?',
    options: [
      '50 kilometers',
      '30 seconds',
      '20 meters per second north',
      '100 joules',
    ],
    correctIndex: 2,
    hint: 'Vectors must include both magnitude and direction.',
  },
  {
    question: 'A sprinter runs 100 meters in 10 seconds. What is their average speed?',
    options: [
      '5 m/s',
      '10 m/s',
      '15 m/s',
      '20 m/s',
    ],
    correctIndex: 1,
    hint: 'Average speed = 100 m / 10 s = 10 m/s.',
  },
  {
    question: 'If displacement is 50 km North and time is 2 hours, what is the velocity?',
    options: [
      '25 km/hr South',
      '25 km/hr North',
      '50 km/hr',
      'Cannot be determined',
    ],
    correctIndex: 1,
    hint: 'Velocity = displacement / time = 50 km North / 2 hr = 25 km/hr North.',
  },
  {
    question: 'What does instantaneous speed measure?',
    options: [
      'Average speed for the entire trip',
      'The speed at a specific moment in time',
      'Total distance divided by total time',
      'Maximum speed ever reached',
    ],
    correctIndex: 1,
    hint: 'Instantaneous speed is what the speedometer shows at any given moment.',
  },
  {
    question: 'A car travels 500 km in 5 hours. Its average speed is 100 km/hr. Is this scalar or vector?',
    options: [
      'Scalar (magnitude only)',
      'Vector (magnitude + direction)',
      'Both scalar and vector',
      'Neither scalar nor vector',
    ],
    correctIndex: 0,
    hint: 'Average speed is scalar because it has only magnitude, no direction.',
  },
  {
    question: 'How far will a vehicle travel at 80 km/hr for 4.5 hours?',
    options: [
      '160 km',
      '240 km',
      '320 km',
      '360 km',
    ],
    correctIndex: 3,
    hint: 'Distance = speed × time = 80 km/hr × 4.5 hr = 360 km.',
  },
  {
    question: 'Can two objects have the same speed but different velocities?',
    options: [
      'No, speed and velocity are always the same',
      'Yes, if they move in different directions',
      'Only if one is faster than the other',
      'No, this is physically impossible',
    ],
    correctIndex: 1,
    hint: '50 km/hr East vs 50 km/hr North have the same speed but different velocities.',
  },
  {
    question: 'A train travels 240 miles and takes 6 hours. What is the average speed?',
    options: [
      '30 mi/hr',
      '40 mi/hr',
      '50 mi/hr',
      '60 mi/hr',
    ],
    correctIndex: 1,
    hint: 'Average speed = 240 mi / 6 hr = 40 mi/hr.',
  },
  {
    question: 'Which formula is used to calculate average velocity?',
    options: [
      'v = d/t (distance over time)',
      'v = distance traveled / time',
      'v = displacement / time',
      'v = total distance / number of stops',
    ],
    correctIndex: 2,
    hint: 'Velocity uses displacement (which includes direction), not total distance.',
  },
]

export const Q3W6_QUIZ_TEMPLATES: TeacherQuizQuestion[] = [
  {
    question: 'In a distance-time graph, what does the slope represent?',
    options: [
      'Distance traveled',
      'Speed of the object',
      'Direction of motion',
      'Time elapsed',
    ],
    correctIndex: 1,
    hint: 'Slope = rise/run = change in distance / change in time = speed.',
  },
  {
    question: 'What does a horizontal line on a distance-time graph indicate?',
    options: [
      'Fast motion',
      'Backward motion',
      'Object at rest (stationary)',
      'Changing speed',
    ],
    correctIndex: 2,
    hint: 'Horizontal means distance is not changing over time.',
  },
  {
    question: 'What is the slope of a displacement-time graph from point (0,0) to (10s, 50m)?',
    options: [
      '0.2 m/s',
      '5 m/s',
      '10 m/s',
      '50 m/s',
    ],
    correctIndex: 1,
    hint: 'Slope = 50 m / 10 s = 5 m/s.',
  },
  {
    question: 'Which of these graph characteristics indicates uniform (constant) motion?',
    options: [
      'A curved line',
      'A straight line with constant slope',
      'A horizontal line',
      'A vertical line',
    ],
    correctIndex: 1,
    hint: 'Constant motion = constant velocity = straight line slope on graph.',
  },
  {
    question: 'What does a negative slope on a displacement-time graph mean?',
    options: [
      'The object is not moving',
      'The object is moving in the negative direction',
      'The object is at rest',
      'The graph is incorrect',
    ],
    correctIndex: 1,
    hint: 'Negative slope = displacement is decreasing = moving in negative direction.',
  },
  {
    question: 'If a distance-time graph has a steep slope, what does this indicate?',
    options: [
      'The object is moving slowly',
      'The object is at rest',
      'The object is moving quickly (high speed)',
      'The time is increasing rapidly',
    ],
    correctIndex: 2,
    hint: 'Steeper slope = larger change in distance / change in time = faster speed.',
  },
  {
    question: 'On a displacement-time graph, what is the difference between a curved line and a straight line?',
    options: [
      'They represent the same motion',
      'Straight = uniform motion; Curved = non-uniform (changing) motion',
      'Curved line = no motion',
      'They show different time intervals',
    ],
    correctIndex: 1,
    hint: 'Curved line indicates velocity is changing (acceleration); straight = constant velocity.',
  },
  {
    question: 'Calculate the velocity from a displacement-time graph where the object travels 100m in 20 seconds.',
    options: [
      '2 m/s',
      '5 m/s',
      '10 m/s',
      '20 m/s',
    ],
    correctIndex: 1,
    hint: 'Velocity = displacement / time = 100 m / 20 s = 5 m/s.',
  },
  {
    question: 'What does the area under a velocity-time graph represent?',
    options: [
      'Speed',
      'Time',
      'Displacement or distance traveled',
      'Acceleration',
    ],
    correctIndex: 2,
    hint: 'Area under v-t graph = velocity × time = displacement.',
  },
  {
    question: 'If a displacement-time graph shows three segments: first going up, then horizontal, then going down, what motion does this represent?',
    options: [
      'Constant motion throughout',
      'Moving forward, then stopped, then moving backward',
      'Accelerating then decelerating',
      'No motion occurred',
    ],
    correctIndex: 1,
    hint: 'Going up = positive velocity; horizontal = no motion (v=0); going down = negative velocity.',
  },
]

export const Q3W4_QUIZ_TEMPLATES: TeacherQuizQuestion[] = [
  {
    question: 'Which of the following is a vector quantity?',
    options: [
      '50 kilograms',
      '30 seconds',
      '20 meters per second north',
      '100 joules',
    ],
    correctIndex: 2,
    hint: 'Vector quantities include both magnitude and direction.',
  },
  {
    question: 'A person jogs around a circular track with a perimeter of 400 meters and returns to the starting point. What is the displacement?',
    options: [
      '400 meters',
      '200 meters',
      '0 meters',
      '800 meters',
    ],
    correctIndex: 2,
    hint: 'Displacement = change in position. Start point = end point means displacement = 0.',
  },
  {
    question: 'What is the difference between distance and displacement?',
    options: [
      'Distance is faster; displacement is slower',
      'Distance = total path; displacement = shortest path with direction',
      'Distance uses vectors; displacement uses scalars',
      'They are the same thing with different names',
    ],
    correctIndex: 1,
    hint: 'Distance is always ≥ displacement.',
  },
  {
    question: 'A car travels 5 km north, then 3 km south. What is the total distance traveled?',
    options: [
      '2 km',
      '3 km',
      '5 km',
      '8 km',
    ],
    correctIndex: 3,
    hint: 'Distance = total path = 5 km + 3 km = 8 km.',
  },
  {
    question: 'How is displacement different from distance on a displacement-time graph?',
    options: [
      'They are the same on all graphs',
      'Displacement includes direction and is the straight-line distance from start to finish',
      'Distance is always shown; displacement is never shown',
      'Displacement is scalar; distance is vector',
    ],
    correctIndex: 1,
    hint: 'Displacement graphs show net change in position with direction.',
  },
  {
    question: 'A student walks 40 m east and then 30 m west from a reference point. What is the net displacement?',
    options: [
      '70 m',
      '10 m east',
      '30 m west',
      '40 m east',
    ],
    correctIndex: 1,
    hint: 'Net displacement = 40 m - 30 m = 10 m in the east direction.',
  },
  {
    question: 'Which statement correctly describes motion using a reference point?',
    options: [
      'An object is always in motion',
      'An object is in motion only if its position changes relative to a reference point',
      'A reference point does not affect motion description',
      'Motion requires constant velocity',
    ],
    correctIndex: 1,
    hint: 'Motion is relative; it depends on the reference frame chosen.',
  },
  {
    question: 'A person travels from point A to point B via two different paths: Path 1 = 500 m, Path 2 = 700 m. Both paths end at the same point. What can you conclude?',
    options: [
      'The displacement is different for both paths',
      'The displacement is the same; only distance differs',
      'Path 1 is wrong',
      'No displacement occurs',
    ],
    correctIndex: 1,
    hint: 'Displacement depends on initial and final positions, not the path taken.',
  },
  {
    question: 'Is it possible for distance to equal displacement?',
    options: [
      'No, displacement is always less than distance',
      'Yes, when motion is along a straight line in one direction',
      'Only when no motion occurs',
      'No, they are always different',
    ],
    correctIndex: 1,
    hint: 'If you travel in a straight line without backtracking, distance = displacement.',
  },
  {
    question: 'On a displacement-time graph, what does a steep slope indicate?',
    options: [
      'The object is moving slowly',
      'The object is at rest',
      'The object is moving quickly (high velocity)',
      'The object is accelerating',
    ],
    correctIndex: 2,
    hint: 'Slope = change in displacement / change in time = velocity.',
  },
]

export const Q3W7_QUIZ_TEMPLATES: TeacherQuizQuestion[] = [
  {
    question: 'What is the SI unit of heat?',
    options: [
      'Calorie',
      'Joule',
      'Watt',
      'Kelvin',
    ],
    correctIndex: 1,
    hint: 'Heat energy is measured in Joules in the International System.',
  },
  {
    question: 'What does temperature measure?',
    options: [
      'The total heat energy in an object',
      'The average kinetic energy of particles in a substance',
      'The rate of heat transfer',
      'The amount of thermal insulation',
    ],
    correctIndex: 1,
    hint: 'Temperature indicates how fast particles are moving on average.',
  },
  {
    question: 'Which of the following is a thermal conductor?',
    options: [
      'Rubber',
      'Copper',
      'Wood',
      'Glass',
    ],
    correctIndex: 1,
    hint: 'Metals like copper conduct heat very efficiently.',
  },
  {
    question: 'Why do we use wooden handles on cooking pots?',
    options: [
      'Wood conducts heat quickly',
      'Wood is a thermal insulator that protects hands from heat',
      'Wood looks better than metal',
      'Wood is more durable',
    ],
    correctIndex: 1,
    hint: 'Insulators like wood reduce heat transfer to your hands.',
  },
  {
    question: 'In which direction does heat flow?',
    options: [
      'From cold to hot regions',
      'From hot to cold regions',
      'Heat does not flow',
      'In all directions equally',
    ],
    correctIndex: 1,
    hint: 'Heat always spontaneously flows from higher to lower temperature.',
  },
  {
    question: 'What is the difference between heat and temperature?',
    options: [
      'Heat is temperature measured in Celsius',
      'Heat is the transfer of energy; temperature is a measure of particle kinetic energy',
      'They are the same thing',
      'Heat only occurs in solids; temperature in liquids',
    ],
    correctIndex: 1,
    hint: 'Heat is energy transfer; temperature is a measure of thermal energy.',
  },
  {
    question: 'Which material would be best for insulating a house?',
    options: [
      'Aluminum',
      'Copper',
      'Fiberglass or foam',
      'Steel',
    ],
    correctIndex: 2,
    hint: 'Insulators like fiberglass and foam reduce heat transfer.',
  },
  {
    question: 'What is thermal conductivity?',
    options: [
      'The temperature of a material',
      'The ability of a material to conduct heat',
      'The insulating power of a material',
      'The color of a material',
    ],
    correctIndex: 1,
    hint: 'Thermal conductivity measures how well a material transfers heat.',
  },
  {
    question: 'Which is an example of a material that is a poor thermal conductor (insulator)?',
    options: [
      'Iron',
      'Aluminum',
      'Wool or cotton',
      'Copper',
    ],
    correctIndex: 2,
    hint: 'Natural fibers like wool and cotton insulate by trapping air.',
  },
  {
    question: 'How many temperature scales are commonly used?',
    options: [
      'One: Celsius only',
      'Two: Celsius and Fahrenheit',
      'Three: Celsius, Fahrenheit, and Kelvin',
      'Four or more',
    ],
    correctIndex: 2,
    hint: 'The three common scales are Celsius, Fahrenheit, and Kelvin.',
  },
]

export const Q3W8_QUIZ_TEMPLATES: TeacherQuizQuestion[] = [
  {
    question: 'What is conduction in heat transfer?',
    options: [
      'Heat transfer through fluid movement',
      'Heat transfer through electromagnetic waves',
      'Heat transfer through direct contact between materials',
      'Heat transfer through air currents',
    ],
    correctIndex: 2,
    hint: 'Conduction happens when heat travels through touching objects.',
  },
  {
    question: 'Which is the best example of convection?',
    options: [
      'Touching a hot pan handle',
      'Warm air rising and cool air sinking in a room',
      'The sun warming the Earth from space',
      'A metal spoon heating up in hot water',
    ],
    correctIndex: 1,
    hint: 'Convection involves movement of fluids (air or liquid).',
  },
  {
    question: 'How does radiation transfer heat?',
    options: [
      'Through direct contact',
      'Through moving fluids',
      'Through electromagnetic waves without requiring a medium',
      'Through metal conductors',
    ],
    correctIndex: 2,
    hint: 'Radiation can travel through empty space.',
  },
  {
    question: 'When you hold your hand near (but not touching) a hot stove, which method of heat transfer are you experiencing?',
    options: [
      'Conduction',
      'Convection',
      'Radiation',
      'All three equally',
    ],
    correctIndex: 2,
    hint: 'Heat from the stove reaches your hand without touching it.',
  },
  {
    question: 'Why are copper pots used in cooking?',
    options: [
      'Copper looks shiny',
      'Copper conducts heat very well, distributing it evenly',
      'Copper is cheap',
      'Copper insulates heat inside',
    ],
    correctIndex: 1,
    hint: 'Copper\'s high thermal conductivity makes cooking more efficient.',
  },
  {
    question: 'Which type of heat transfer occurs in a microwave oven?',
    options: [
      'Conduction only',
      'Convection only',
      'Radiation through electromagnetic waves',
      'No heat transfer occurs',
    ],
    correctIndex: 2,
    hint: 'Microwaves use electromagnetic radiation to heat food.',
  },
  {
    question: 'Why do fans help cool a room during hot weather?',
    options: [
      'Fans conduct heat out of the room',
      'Fans create radiation that cools air',
      'Fans move air through convection, circulating cool and warm air',
      'Fans lower the temperature without transferring heat',
    ],
    correctIndex: 2,
    hint: 'Fans facilitate convection by moving air currents.',
  },
  {
    question: 'Which color surface is best for absorbing heat from the sun?',
    options: [
      'White or light colors',
      'Silver or reflective colors',
      'Black or dark colors',
      'All colors absorb heat equally',
    ],
    correctIndex: 2,
    hint: 'Dark colors absorb radiation more effectively than light colors.',
  },
  {
    question: 'What happens to hot water when it is in contact with cold water in the same container?',
    options: [
      'Both remain at their original temperatures',
      'Heat is conducted from hot to cold water until thermal equilibrium is reached',
      'Only radiation occurs; no conduction',
      'The cold water becomes hotter than the hot water',
    ],
    correctIndex: 1,
    hint: 'Heat flows from hot to cold until temperatures equalize.',
  },
  {
    question: 'Which is an example of energy conservation through heat transfer understanding?',
    options: [
      'Using black pots to absorb more heat',
      'Installing insulation in walls and attics to reduce heating/cooling costs',
      'Using metal handles on all cookware',
      'Placing fans in windows',
    ],
    correctIndex: 1,
    hint: 'Insulation reduces heat transfer, conserving energy and reducing costs.',
  },
]
