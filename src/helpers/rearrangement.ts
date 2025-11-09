import type { PanelId, PanelCoordinate } from "../types";

/**
 * Check if two rectangles overlap using AABB (Axis-Aligned Bounding Box) test
 * 2つの矩形が重なっているかをAABBテストで判定
 */
export function rectanglesOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return !(
    (
      a.x + a.w <= b.x || // a is to the left of b
      b.x + b.w <= a.x || // b is to the left of a
      a.y + a.h <= b.y || // a is above b
      b.y + b.h <= a.y
    ) // b is above a
  );
}

/**
 * Detect all panels that collide with the given panel
 * 指定されたパネルと衝突する全てのパネルを検出
 */
export function detectCollisions(panel: PanelCoordinate, panelMap: Map<PanelId, PanelCoordinate>): PanelId[] {
  const collisions = new Set<PanelId>();

  for (const [id, other] of panelMap) {
    if (id === panel.id) continue;

    if (rectanglesOverlap(panel, other)) {
      collisions.add(id);
    }
  }

  return Array.from(collisions);
}

/**
 * Check if a panel at the given position would collide with any existing panels
 * 指定された位置にパネルを配置した場合に衝突があるかをチェック
 */
export function hasCollision(
  candidate: { x: number; y: number; w: number; h: number },
  excludeId: PanelId,
  panelMap: Map<PanelId, PanelCoordinate>
): boolean {
  for (const [id, panel] of panelMap) {
    if (id === excludeId) continue;
    if (rectanglesOverlap(candidate, panel)) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate the minimum distance to push a panel to avoid collision
 * パネルを押しのけるための最小距離を計算
 */
function calculatePushDistance(
  pusher: PanelCoordinate,
  pushed: PanelCoordinate,
  columnCount: number
): { direction: "right" | "down"; distance: number } | null {
  // Calculate how far to push horizontally (to the right)
  // 横方向（右）にどれだけ押すか計算
  const pushRight = pusher.x + pusher.w - pushed.x;
  const canPushRight = pushed.x + pushed.w + pushRight <= columnCount;

  // Calculate how far to push vertically (down)
  // 縦方向（下）にどれだけ押すか計算
  const pushDown = pusher.y + pusher.h - pushed.y;

  // Priority 1: Horizontal push if possible
  // 優先順位1: 可能なら横方向に押す
  if (canPushRight && pushRight > 0) {
    return { direction: "right", distance: pushRight };
  }

  // Priority 2: Vertical push
  // 優先順位2: 縦方向に押す
  if (pushDown > 0) {
    return { direction: "down", distance: pushDown };
  }

  return null;
}

/**
 * Find a new position for a panel by pushing it away from the colliding panel
 * Priority: horizontal (right) first, then vertical (down)
 * 衝突したパネルを押しのける方向に移動させる
 * 優先順位: 横方向（右）→縦方向（下）
 */
export function findNewPosition(
  panel: PanelCoordinate,
  pusher: PanelCoordinate,
  columnCount: number
): { x: number; y: number } {
  const pushInfo = calculatePushDistance(pusher, panel, columnCount);

  if (!pushInfo) {
    // No push needed or can't determine direction
    // Fallback: move down
    return { x: panel.x, y: panel.y + 1 };
  }

  if (pushInfo.direction === "right") {
    // Push horizontally to the right
    // 横方向（右）に押す
    const newX = panel.x + pushInfo.distance;
    if (newX + panel.w <= columnCount) {
      return { x: newX, y: panel.y };
    }
    // Can't fit horizontally, push down instead
    // 横方向に入らない場合は下に押す
  }

  // Push vertically down
  // 縦方向（下）に押す
  return { x: panel.x, y: panel.y + pushInfo.distance };
}

/**
 * Rearrange panels to resolve collisions when a panel is moved or resized
 * Panels are moved horizontally first, then vertically if needed
 * パネルの移動・リサイズ時に衝突を解決するようにパネルを再配置
 * 横方向を優先し、必要に応じて縦方向に移動
 */
export function rearrangePanels(
  movingPanel: PanelCoordinate,
  allPanels: PanelCoordinate[],
  columnCount: number
): PanelCoordinate[] {
  // Create a map for fast panel lookup
  // パネルIDから座標への高速マップを作成
  const panelMap = new Map<PanelId, PanelCoordinate>();
  for (const panel of allPanels) {
    panelMap.set(panel.id, { ...panel });
  }

  // Update the moving panel's position in the map
  // 移動中のパネルの位置をマップに反映
  panelMap.set(movingPanel.id, { ...movingPanel });

  // Queue for processing panels that need to be repositioned
  // 再配置が必要なパネルの処理キュー
  const queue: PanelCoordinate[] = [{ ...movingPanel }];
  const processed = new Set<PanelId>();

  // Process panels until no more collisions
  // 衝突がなくなるまでパネルを処理
  while (queue.length > 0) {
    const current = queue.shift()!;

    // Skip if already processed
    if (processed.has(current.id)) {
      continue;
    }
    processed.add(current.id);

    // Detect collisions with current panel position
    // 現在のパネル位置での衝突を検出
    const collidingIds = detectCollisions(current, panelMap);

    if (collidingIds.length === 0) {
      // No collisions, keep current position
      // 衝突なし、現在の位置を維持
      panelMap.set(current.id, current);
      continue;
    }

    // Resolve collisions by pushing colliding panels
    // 衝突したパネルを押しのけて衝突を解決
    for (const collidingId of collidingIds) {
      const colliding = panelMap.get(collidingId);
      if (!colliding) continue;

      // Find new position by pushing the colliding panel away
      // 衝突したパネルを押しのける方向に移動
      const newPos = findNewPosition(colliding, current, columnCount);

      // Update the panel's position
      // パネルの位置を更新
      const updated = { ...colliding, x: newPos.x, y: newPos.y };
      panelMap.set(collidingId, updated);

      // Add to queue for further collision checking
      // 再度衝突チェックのためキューに追加
      queue.push(updated);
    }

    // Confirm current panel's position
    // 現在のパネルの位置を確定
    panelMap.set(current.id, current);
  }

  // Return the rearranged panels
  // 再配置後のパネルを返す
  return Array.from(panelMap.values());
}

/**
 * Find a new position for a panel to be added
 * 追加するパネルの新しい位置を見つける
 */
export function findNewPositionToAddPanel(
  panelToAdd: Partial<PanelCoordinate>,
  allPanels: PanelCoordinate[],
  columnCount: number
): { x: number; y: number } {
  const id = panelToAdd.id || Math.random().toString(36).substring(2, 15);
  const w = panelToAdd.w || 1;
  const h = panelToAdd.h || 1;

  // Create a map for fast panel lookup
  const panelMap = new Map<PanelId, PanelCoordinate>();
  for (const panel of allPanels) {
    panelMap.set(panel.id, panel);
  }

  // Calculate maximum row based on existing panels
  // Add some buffer rows to ensure we can find a position
  const maxExistingY = allPanels.length > 0 ? Math.max(...allPanels.map((p) => p.y + p.h)) : 0;
  const MAX_ROWS = Math.max(maxExistingY + 100, 1000);

  // Try to find a position starting from top-left
  for (let y = 0; y < MAX_ROWS; y++) {
    for (let x = 0; x <= columnCount - w; x++) {
      const candidate: PanelCoordinate = {
        id,
        x,
        y,
        w,
        h,
      };

      // Check if this position has any collisions
      if (!hasCollision(candidate, candidate.id, panelMap)) {
        return { x, y };
      }
    }
  }

  // Fallback: if no position found, place at the bottom
  return { x: 0, y: maxExistingY };
}
