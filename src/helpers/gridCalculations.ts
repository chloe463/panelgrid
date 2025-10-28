/**
 * Converts a pixel value to grid units by dividing by the cell size (baseSize + gap)
 * and rounding up with Math.ceil
 */
export function pixelsToGridSize(pixels: number, baseSize: number, gap: number): number {
  return Math.ceil(pixels / (baseSize + gap));
}

/**
 * Converts a pixel coordinate to grid coordinate by dividing by the cell size
 * and rounding down with Math.floor, ensuring the result is not negative
 */
export function pixelsToGridPosition(pixels: number, baseSize: number, gap: number): number {
  return Math.max(0, Math.floor(pixels / (baseSize + gap)));
}

/**
 * Converts grid units to pixels
 * Formula: gridUnits * baseSize + max(0, gridUnits - 1) * gap
 * This accounts for gaps between grid cells but not after the last cell
 */
export function gridToPixels(gridUnits: number, baseSize: number, gap: number): number {
  return gridUnits * baseSize + Math.max(0, gridUnits - 1) * gap;
}

/**
 * Converts grid coordinate to pixel coordinate for positioning
 * Formula: max(0, gridCoord * (baseSize + gap))
 * This includes the gap after each cell for proper positioning in the grid
 */
export function gridPositionToPixels(gridCoord: number, baseSize: number, gap: number): number {
  return Math.max(0, gridCoord * (baseSize + gap));
}

/**
 * Snaps a pixel value to the nearest grid position
 * Useful for aligning elements to the grid after drag/resize operations
 */
export function snapToGrid(pixels: number, baseSize: number, gap: number): number {
  const gridPosition = pixelsToGridPosition(pixels, baseSize, gap);
  return gridPositionToPixels(gridPosition, baseSize, gap);
}