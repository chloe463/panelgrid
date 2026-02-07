import type { PanelCoordinate, PanelId } from "../types";

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
 * Constrain a panel to stay within grid boundaries
 * パネルをグリッド境界内に制約
 */
function constrainToGrid(panel: PanelCoordinate, columnCount: number): PanelCoordinate {
  // Ensure x + w doesn't exceed columnCount
  // x + w が columnCount を超えないようにする
  const maxX = Math.max(0, columnCount - panel.w);
  const constrainedX = Math.max(0, Math.min(panel.x, maxX));

  // Ensure y is non-negative
  // y が負にならないようにする
  const constrainedY = Math.max(0, panel.y);

  return {
    ...panel,
    x: constrainedX,
    y: constrainedY,
  };
}

/**
 * Rearrange panels to resolve collisions when a panel is moved or resized
 * Panels are moved horizontally first, then vertically if needed
 * For compound resizes (both width and height change), uses two-phase processing
 * パネルの移動・リサイズ時に衝突を解決するようにパネルを再配置
 * 横方向を優先し、必要に応じて縦方向に移動
 * 幅と高さが同時に変更される場合は、二段階処理を使用
 */
export function rearrangePanels(
  movingPanel: PanelCoordinate,
  allPanels: PanelCoordinate[],
  columnCount: number
): PanelCoordinate[] {
  // Constrain the moving panel to grid boundaries
  // 移動中のパネルをグリッド境界内に制約
  const constrainedMovingPanel = constrainToGrid(movingPanel, columnCount);

  // Check if this is a compound resize (both width and height changed)
  // 幅と高さの両方が変更されたかチェック
  const originalPanel = allPanels.find((p) => p.id === movingPanel.id);
  if (originalPanel) {
    const widthChanged = originalPanel.w !== constrainedMovingPanel.w;
    const heightChanged = originalPanel.h !== constrainedMovingPanel.h;

    if (widthChanged && heightChanged) {
      // Two-phase processing: width first, then height
      // 二段階処理: 幅を先に、次に高さ

      // Phase 1: Apply width change only
      // フェーズ1: 幅の変更のみを適用
      const widthOnlyPanel = {
        ...constrainedMovingPanel,
        h: originalPanel.h, // Keep original height
      };
      const afterWidthChange = rearrangePanelsInternal(widthOnlyPanel, allPanels, columnCount);

      // Phase 2: Apply height change to the result
      // フェーズ2: 結果に高さの変更を適用
      const heightChangedPanel = {
        ...constrainedMovingPanel,
        // Use the new position if panel-1 was moved during width phase
        x: afterWidthChange.find((p) => p.id === movingPanel.id)?.x ?? constrainedMovingPanel.x,
        y: afterWidthChange.find((p) => p.id === movingPanel.id)?.y ?? constrainedMovingPanel.y,
      };
      return rearrangePanelsInternal(heightChangedPanel, afterWidthChange, columnCount);
    }
  }

  // Single dimension change or move - use normal processing
  // 単一次元の変更または移動 - 通常の処理を使用
  return rearrangePanelsInternal(constrainedMovingPanel, allPanels, columnCount);
}

/**
 * Internal implementation of panel rearrangement
 * パネル再配置の内部実装
 */
function rearrangePanelsInternal(
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

  // Track processed panels to avoid reprocessing unnecessarily
  // 不要な再処理を避けるため処理済みパネルを追跡
  const processed = new Set<PanelId>();

  // Track all panels that have been repositioned across all queue iterations
  // 全キュー反復を通じて再配置されたパネルを追跡
  const repositioned = new Set<PanelId>();

  // Track processing count to prevent infinite loops
  // 無限ループを防ぐため処理回数を追跡
  const processCount = new Map<PanelId, number>();
  const MAX_PROCESS_COUNT = 10;

  // Process panels until no more collisions
  // 衝突がなくなるまでパネルを処理
  while (queue.length > 0) {
    const current = queue.shift()!;

    // Safety check: prevent infinite loops
    // 安全チェック: 無限ループを防止
    const count = processCount.get(current.id) || 0;
    if (count >= MAX_PROCESS_COUNT) continue;
    processCount.set(current.id, count + 1);

    // Skip if the position in queue doesn't match current position in map (outdated entry)
    // キューの位置がマップの現在位置と一致しない場合はスキップ（古いエントリ）
    const currentInMap = panelMap.get(current.id);
    if (currentInMap && (currentInMap.x !== current.x || currentInMap.y !== current.y)) {
      continue;
    }

    // Skip if already processed at this position
    // この位置で既に処理済みの場合はスキップ
    if (processed.has(current.id)) {
      continue;
    }

    // Detect collisions with current panel position
    // 現在のパネル位置での衝突を検出
    const collidingIds = detectCollisions(current, panelMap);

    if (collidingIds.length === 0) {
      panelMap.set(current.id, current);
      processed.add(current.id);
      continue;
    }

    // Sort colliding panels by position (top-left to bottom-right) for consistent processing
    // 一貫した処理のため、衝突パネルを位置順（左上から右下）にソート
    const sortedCollidingIds = collidingIds.sort((a, b) => {
      const panelA = panelMap.get(a)!;
      const panelB = panelMap.get(b)!;
      if (panelA.y !== panelB.y) return panelA.y - panelB.y;
      return panelA.x - panelB.x;
    });

    // Resolve collisions by pushing colliding panels
    // 衝突したパネルを押しのけて衝突を解決
    for (const collidingId of sortedCollidingIds) {
      const colliding = panelMap.get(collidingId);
      if (!colliding) continue;

      // Calculate new position for the colliding panel
      // 衝突パネルの新しい位置を計算
      const newPos = findNewPosition(colliding, current, columnCount);
      let candidate = { ...colliding, x: newPos.x, y: newPos.y };

      // Check if candidate overlaps with any previously repositioned panel
      // Try pushing further right past it; fall back to pushing down
      // 候補位置が既に再配置されたパネルと重なる場合、さらに右に押す。無理なら下に押す
      let needsPushDown = false;
      for (const repoId of repositioned) {
        const repoPanel = panelMap.get(repoId);
        if (!repoPanel || repoId === collidingId) continue;
        if (!rectanglesOverlap(candidate, repoPanel)) continue;

        const furtherX = repoPanel.x + repoPanel.w;
        if (furtherX + candidate.w <= columnCount) {
          candidate = { ...candidate, x: furtherX };
        } else {
          needsPushDown = true;
          break;
        }
      }

      if (needsPushDown) {
        const pushDown = current.y + current.h - colliding.y;
        candidate = { ...candidate, x: colliding.x, y: colliding.y + (pushDown > 0 ? pushDown : 1) };
      }

      // Update panel map and add to queue for further processing
      // パネルマップを更新し、さらなる処理のためキューに追加
      panelMap.set(collidingId, candidate);
      queue.push(candidate);
      repositioned.add(collidingId);
    }

    panelMap.set(current.id, current);
    processed.add(current.id);
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
