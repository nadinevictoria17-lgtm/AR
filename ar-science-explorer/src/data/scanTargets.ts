import type { ScanTarget } from '../types'

export const SCAN_TARGETS: ScanTarget[] = [
  { modelIndex: 0, hueMin: 170, hueMax: 200 },  // Cyan for Physics
  { modelIndex: 1, hueMin: 120, hueMax: 150 },  // Green for Biology
  { modelIndex: 2, hueMin: 320, hueMax: 360 },  // Pink/Red for Chemistry
  { modelIndex: 3, hueMin: 30, hueMax: 60 },    // Yellow/Orange for Earth
  { modelIndex: 4, hueMin: 200, hueMax: 240 },  // Blue for DNA
]
