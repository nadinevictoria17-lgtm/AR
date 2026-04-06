/**
 * AR.js Configuration and Lesson-to-Asset Mapping
 * Maps lesson quarter/week to barcode marker ID and GLB model path
 */

export interface ARLessonConfig {
  barcodeValue: number  // Barcode marker ID (0-1023)
  glbPath: string       // URL to GLB model (e.g. '/glb/democritus_atom.glb')
}

/**
 * Mapping of lesson quarter/week to AR assets
 * Key format: `Q${quarter}W${week}` (e.g. 'Q1W1', 'Q2W5')
 * Q1W5 is intentionally omitted - it has hasAR: false
 * Q2W7 and Q2W8 share the same marker image file
 */
const AR_LESSON_MAP: Record<string, ARLessonConfig> = {
  'Q1W1': { barcodeValue: 0, glbPath: '/glb/democritus_atom.glb' },
  'Q1W2': { barcodeValue: 1, glbPath: '/glb/waterpolarity.glb' },
  'Q1W3': { barcodeValue: 2, glbPath: '/glb/solid_liquid_gas.glb' },
  'Q1W4': { barcodeValue: 3, glbPath: '/glb/particle_motion_temperature.glb' },
  // Q1W5 intentionally omitted - hasAR: false, no marker
  'Q1W6': { barcodeValue: 4, glbPath: '/glb/beakers.glb' },
  'Q1W7': { barcodeValue: 5, glbPath: '/glb/saturated_unsaturated.glb' },
  'Q1W8': { barcodeValue: 6, glbPath: '/glb/salt_dissolving_in_water.glb' },
  'Q2W1': { barcodeValue: 7, glbPath: '/glb/Microscope.glb' },
  'Q2W2': { barcodeValue: 8, glbPath: '/glb/plant_cell.glb' },
  'Q2W3': { barcodeValue: 9, glbPath: '/glb/prokaryoticCell.glb' },
  'Q2W4': { barcodeValue: 10, glbPath: '/glb/mitosis_phases.glb' },
  'Q2W5': { barcodeValue: 11, glbPath: '/glb/Fertilization_Model_Light.glb' },
  'Q2W6': { barcodeValue: 12, glbPath: '/glb/amoeba_binary_fission.glb' },
  'Q2W7': { barcodeValue: 13, glbPath: '/glb/biological_organization.glb' },
  'Q2W8': { barcodeValue: 14, glbPath: '/glb/food_web.glb' },
}

/**
 * Get AR configuration for a specific lesson by quarter and week
 * Returns null if the lesson has no AR (like Q1W5) or invalid quarter/week
 */
export function getARConfig(quarter: number, week: number): ARLessonConfig | null {
  const key = `Q${quarter}W${week}`
  return AR_LESSON_MAP[key] ?? null
}
