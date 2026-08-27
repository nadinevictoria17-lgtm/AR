/**
 * AR.js Configuration and Lesson-to-Asset Mapping
 * Maps lesson quarter/week to GLB model path
 * Marker images are stored at /public/markers/Q{quarter}W{week}.jpg
 */

export interface ARLessonConfig {
  glbPath: string       // URL to GLB model (e.g. '/glb/democritus_atom.glb')
}

/**
 * Mapping of lesson quarter/week to AR assets
 * Key format: `Q${quarter}W${week}` (e.g. 'Q1W1', 'Q2W5')
 * Q1W5 is intentionally omitted - it has hasAR: false
 * Marker images are automatically resolved from /markers/Q{quarter}W{week}.jpg
 */
const AR_LESSON_MAP: Record<string, ARLessonConfig> = {
  'Q1W1': { glbPath: '/glb/democritus_atom.glb' },
  'Q1W2': { glbPath: '/glb/waterpolarity.glb' },
  'Q1W3': { glbPath: '/glb/solid_liquid_gas.glb' },
  'Q1W4': { glbPath: '/glb/particle_motion_temperature.glb' },
  // Q1W5 intentionally omitted - hasAR: false, no marker
  'Q1W6': { glbPath: '/glb/beakers.glb' },
  'Q1W7': { glbPath: '/glb/saturated_unsaturated.glb' },
  'Q1W8': { glbPath: '/glb/salt_dissolving_in_water.glb' },
  'Q2W1': { glbPath: '/glb/Microscope.glb' },
  'Q2W2': { glbPath: '/glb/plant_cell.glb' },
  'Q2W3': { glbPath: '/glb/prokaryoticCell.glb' },
  'Q2W4': { glbPath: '/glb/mitosis_phases.glb' },
  'Q2W5': { glbPath: '/glb/Fertilization_Model_Light.glb' },
  'Q2W6': { glbPath: '/glb/amoeba_binary_fission.glb' },
  'Q2W7': { glbPath: '/glb/biological_organization.glb' },
  'Q2W8': { glbPath: '/glb/food_web.glb' },
  // Real physics models (pulled from the Vuforia/Unity project's
  // Assets/Models folder — these previously reused Q1's chemistry models
  // as placeholders, which didn't match the actual Q3 physics lessons).
  'Q3W1': { glbPath: '/glb/spring.glb' },
  'Q3W2': { glbPath: '/glb/inclined_plane_slide_playground.glb' },
  'Q3W3': { glbPath: '/glb/seesaw.glb' },
  'Q3W4': { glbPath: '/glb/compass.glb' },
  'Q3W5': { glbPath: '/glb/car.glb' },
  'Q3W6': { glbPath: '/glb/jeepney.glb' },
  'Q3W7': { glbPath: '/glb/thermometer.glb' },
  'Q3W8': { glbPath: '/glb/spoon.glb' },
}

/**
 * Get AR configuration for a specific lesson by quarter and week
 * Returns null if the lesson has no AR (like Q1W5) or invalid quarter/week
 */
export function getARConfig(quarter: number, week: number): ARLessonConfig | null {
  const key = `Q${quarter}W${week}`
  return AR_LESSON_MAP[key] ?? null
}
