/**
 * Converts a pixel value to grid units by dividing by the cell size (baseSize + gap)
 * and rounding up with Math.ceil
 *
 * ピクセル値をグリッド単位に変換します。セルサイズ (baseSize + gap) で割り、小数点は切り上げて整数にします。
 */
export function pixelsToGridSize(pixels: number, baseSize: number, gap: number): number {
  return Math.ceil(pixels / (baseSize + gap));
}

/**
 * Converts a pixel coordinate to grid coordinate by dividing by the cell size
 * and rounding down with Math.floor, ensuring the result is not negative
 *
 * ピクセル座標をグリッド座標に変換します。セルサイズで割り、小数点は切り捨てて整数にします。
 * 結果が負にならないようにします。
 */
export function pixelsToGridPosition(pixels: number, baseSize: number, gap: number): number {
  return Math.max(0, Math.floor(pixels / (baseSize + gap)));
}

/**
 * Converts grid units to pixels
 * Formula: gridUnits * baseSize + max(0, gridUnits - 1) * gap
 * This accounts for gaps between grid cells but not after the last cell
 *
 * グリッド単位をピクセルに変換します。
 * 計算式: gridUnits * baseSize + max(0, gridUnits - 1) * gap
 * グリッドセル間の gap を考慮しますが、最後のセルの後には gap を含めません。
 */
export function gridToPixels(gridUnits: number, baseSize: number, gap: number): number {
  return gridUnits * baseSize + Math.max(0, gridUnits - 1) * gap;
}

/**
 * Converts grid coordinate to pixel coordinate for positioning
 * Formula: max(0, gridCoord * (baseSize + gap))
 * This includes the gap after each cell for proper positioning in the grid
 *
 * グリッド座標をピクセル座標に変換します（位置計算用）。
 * 計算式: max(0, gridCoord * (baseSize + gap))
 * 各セルの後に gap を含めて、グリッド内での適切な位置決めを行います。
 */
export function gridPositionToPixels(gridCoord: number, baseSize: number, gap: number): number {
  return Math.max(0, gridCoord * (baseSize + gap));
}

/**
 * Snaps a pixel value to the nearest grid position
 * Useful for aligning elements to the grid after drag/resize operations
 *
 * ピクセル値を最も近いグリッド位置にスナップします。
 * ドラッグ・リサイズ操作後に要素をグリッドに整列させる際に利用する。
 */
export function snapToGrid(pixels: number, baseSize: number, gap: number): number {
  const gridPosition = pixelsToGridPosition(pixels, baseSize, gap);
  return gridPositionToPixels(gridPosition, baseSize, gap);
}
