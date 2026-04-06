/**
 * Utility functions for AR marker validation and loading
 */

/**
 * Check if a marker image can be loaded
 * Returns the path if valid, fallback if not
 */
export async function validateMarkerImage(
  markerPath: string | null | undefined,
  fallbackModelIndex: number
): Promise<string> {
  if (!markerPath) {
    return getFallbackMarkerPath(fallbackModelIndex)
  }

  try {
    // Try to load the image to verify it exists
    const response = await fetch(markerPath, { method: 'HEAD' })
    if (response.ok) {
      return markerPath
    }
  } catch (error) {
    console.warn(`[markerUtils] Marker not found: ${markerPath}`, error)
  }

  return getFallbackMarkerPath(fallbackModelIndex)
}

/**
 * Get fallback marker path based on model index
 */
export function getFallbackMarkerPath(modelIndex: number): string {
  // Map model indices to marker files
  const markerMap: Record<number, string> = {
    0: '/markers/Q1W1.jpg',  // Atomic Structure
    1: '/markers/Q1W2.jpg',  // Plant Cell
    2: '/markers/Q1W3.jpg',  // Water Molecule
    3: '/markers/Q1W4.jpg',  // Earth's Layers
    4: '/markers/Q1W6.jpg',  // DNA Double Helix
  }

  return markerMap[modelIndex] || '/markers/Q1W1.jpg'
}

/**
 * Create a placeholder/fallback marker SVG for when image loading fails
 */
export function createFallbackMarkerSVG(): string {
  return `
    <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .marker-bg { fill: #f0f0f0; }
          .marker-border { stroke: #999; stroke-width: 2; }
          .marker-text { font-family: Arial, sans-serif; font-size: 16px; fill: #666; text-anchor: middle; }
        </style>
      </defs>
      <rect class="marker-bg marker-border" x="10" y="10" width="280" height="280" rx="10" />
      <circle class="marker-border" cx="150" cy="150" r="100" fill="none" />
      <text class="marker-text" x="150" y="140">AR Marker</text>
      <text class="marker-text" x="150" y="165" style="font-size: 12px;">Unable to load marker</text>
    </svg>
  `
}
