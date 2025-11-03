<!-- AI 向けのコメント: "AI SKIP" と書かれたセクションは読み飛ばしてください。更新するのも禁止です。 -->

# Rearrangement

このドキュメントではドラッグ・アンド・ドロップ、リサイズ時にパネル同士が衝突した際のパネルの再配置の仕様と実装を記述します。

## 実装済みの仕様

### 基本原則

1. **動かしているパネルの位置を優先**

   - ユーザーが操作しているパネル（ドラッグ中・リサイズ中）の位置を最優先
   - 衝突した場合は、動かしていないパネルを移動させて衝突を解消

2. **押しのける挙動**

   - 衝突したパネルは「飛び越える」のではなく「押しのける」
   - 最小限の距離だけ移動して衝突を解消
   - 連鎖的な押しのけにも対応

3. **移動方向の優先順位**

   - 優先順位 1: 横方向（右）に押しのける
   - 優先順位 2: 横方向に入らない場合は縦方向（下）に押しのける
   - 斜め方向には動かさない

4. **空行の自動削除**
   - 再配置後、何も配置されていない行は自動的に削除
   - レイアウトを常に詰まった状態に保つ

### 挙動の例

以下の例において [ ] は 1 つのセルを表します。セル内の文字はそのセル上に存在しているパネルの ID です。

#### 例 1: 横方向に押しのける

初期状態:

- 横方向にセルが 3 つ (columnCount が 3)
- パネル A が x: 0, y: 0, w: 1, h: 1
- パネル B が x: 1, y: 0, w: 1, h: 1

```
操作前:
[A][B][ ]
[A][B][ ]

Aを右に移動:
[ ][A][B]  ← Bが右に押しのけられる
[ ][B][B]
```

#### 例 2: 縦方向に押しのける（横に入らない場合）

```
操作前:
[ ][ ][B][B]
[A][A][A][ ]
[A][A][A][ ]

Aを上に移動
[A][A][A][ ] ← A を (x, y) = (0, 0) に移動
[A][A][A][ ]
[ ][ ][B][B] ← B が押しのけられて (x, y) = (2, 2) に移動
```

#### 例 3: 連鎖的な押しのけ

```
操作前:
[ ][ ][B][B]
[ ][ ][C][C]
[A][A][A][ ]
[A][A][A][ ]

Aを上に移動
[A][A][A][ ] ← A を (x, y) = (0, 0) に移動
[A][A][A][ ]
[ ][ ][B][B] ← B が押しのけられて (x, y) = (2, 2) に移動
[ ][ ][C][C] ← C が連鎖的に押しのけられて (x, y) = (2, 3) に移動
```

#### 例 4: 空行の自動削除

```
[ ][ ][ ][C]
[A][A][A][ ]
[A][A][A][ ]
[ ][ ][B][B]

Aを上に移動
[A][A][A][C]
[A][A][A][ ]
[ ][ ][ ][ ] ← 一時的に空行ができてしまうが、これを削除
[ ][ ][B][B]

[A][A][A][C]
[A][A][A][ ]
[ ][ ][B][B]
```

## アルゴリズム設計

### データ構造

#### 1. GridMap (グリッドマップ)

パネルの占有状態を管理する 2 次元配列。

```typescript
type GridMap = (PanelId | null)[][];
```

- 各セルには、そのセルを占有しているパネルの ID または null が格納される
- columnCount × 行数の配列
- 例: `gridMap[y][x]` でグリッド座標 (x, y) の占有状態を取得

#### 2. SpaceMap (空きスペースマップ)

各座標から見た利用可能なスペースを管理する 2 次元配列。

```typescript
interface SpaceInfo {
  rightSpace: number; // 右方向の連続空きスペース数
  downSpace: number; // 下方向の連続空きスペース数
}

type SpaceMap = SpaceInfo[][];
```

### 主要なアルゴリズム

#### 1. GridMap と SpaceMap の構築

```
function buildGridMap(panels: PanelCoordinate[], columnCount: number): GridMap
  1. 全パネルの最大Y座標を計算して必要な行数を決定
  2. columnCount × rowCount の2次元配列を null で初期化
  3. 各パネルについて:
     - パネルが占有する範囲 (x ~ x+w-1, y ~ y+h-1) の全セルに panel.id を設定
  4. GridMap を返す

function buildSpaceMap(gridMap: GridMap, columnCount: number): SpaceMap
  1. gridMap と同じサイズの SpaceMap を初期化
  2. 右下から左上に向かってループ (逆順):
     for y = rowCount-1 to 0:
       for x = columnCount-1 to 0:
         if gridMap[y][x] が null:
           // 右方向のスペースを計算
           if x == columnCount-1:
             rightSpace = 1
           else:
             rightSpace = spaceMap[y][x+1].rightSpace + 1

           // 下方向のスペースを計算
           if y == rowCount-1:
             downSpace = 1
           else:
             downSpace = spaceMap[y+1][x].downSpace + 1
         else:
           rightSpace = 0
           downSpace = 0

         spaceMap[y][x] = { rightSpace, downSpace }
  3. SpaceMap を返す
```

#### 2. 衝突検出

```
function detectCollisions(
  movingPanel: PanelCoordinate,
  gridMap: GridMap,
  columnCount: number
): PanelId[]
  1. 衝突したパネルIDを格納するSet を作成
  2. movingPanel が占有する範囲をループ:
     for y = movingPanel.y to movingPanel.y + movingPanel.h - 1:
       for x = movingPanel.x to movingPanel.x + movingPanel.w - 1:
         if x >= columnCount or y < 0:
           continue  // グリッド外は無視

         occupyingPanelId = gridMap[y][x]
         if occupyingPanelId != null and occupyingPanelId != movingPanel.id:
           Set に occupyingPanelId を追加
  3. Set を配列に変換して返す
```

#### 3. パネルの再配置（衝突回避）

```
function rearrangePanels(
  movingPanel: PanelCoordinate,
  allPanels: PanelCoordinate[],
  columnCount: number
): PanelCoordinate[]
  1. gridMap = buildGridMap(allPanels without movingPanel, columnCount)
  2. 処理待ちキュー: queue = [movingPanel]
  3. 処理済みパネルID: processed = new Set()
  4. 新しいパネル配置: newPanels = [...allPanels]

  5. while queue が空でない:
       currentPanel = queue.shift()

       if processed.has(currentPanel.id):
         continue
       processed.add(currentPanel.id)

       // currentPanel が占有したい領域に衝突があるか確認
       collidingIds = detectCollisions(currentPanel, gridMap, columnCount)

       if collidingIds が空:
         // 衝突なし: currentPanel の位置を gridMap に反映
         updateGridMap(gridMap, currentPanel)
         newPanels で currentPanel を更新
         continue

       // 衝突あり: 衝突したパネルを移動
       for each collidingId in collidingIds:
         collidingPanel = newPanels.find(p => p.id == collidingId)

         // gridMap から collidingPanel を削除
         removeFromGridMap(gridMap, collidingPanel)

         // 移動先を探す
         newPosition = findNewPosition(
           collidingPanel,
           currentPanel,
           gridMap,
           columnCount
         )

         // collidingPanel の位置を更新
         collidingPanel の座標を newPosition に更新
         newPanels で collidingPanel を更新

         // 移動したパネルをキューに追加（再度衝突チェックが必要）
         queue.push(collidingPanel)

       // currentPanel の位置を gridMap に反映
       updateGridMap(gridMap, currentPanel)
       newPanels で currentPanel を更新

  6. newPanels を返す
```

#### 4. 新しい位置の探索

```
function findNewPosition(
  panel: PanelCoordinate,
  pusher: PanelCoordinate,
  columnCount: number
): {x: number, y: number}
  1. spaceMap = buildSpaceMap(gridMap, columnCount)

  2. 優先順位1: 横方向（右方向）に空きスペースを探す
     for x = panel.x + 1 to columnCount - panel.w:
       y = panel.y
       if canPlacePanel(panel, x, y, spaceMap):
         return {x, y}

  3. 優先順位2: 縦方向（下方向）に空きスペースを探す
     for y = panel.y + 1 to infinity:
       x = panel.x
       if canPlacePanel(panel, x, y, spaceMap):
         return {x, y}

       // 行が存在しない場合はグリッドを拡張
       if y >= spaceMap.length:
         return {x, y}

  4. 見つからない場合のフォールバック:
     // グリッドの最下部に配置
     return {x: panel.x, y: gridMap.length}

function canPlacePanel(
  panel: PanelCoordinate,
  x: number,
  y: number,
  spaceMap: SpaceMap
): boolean
  // 座標 (x, y) にサイズ (panel.w, panel.h) のパネルを配置できるか

  1. if x + panel.w > columnCount:
       return false  // 横幅オーバー

  2. if y >= spaceMap.length:
       return true  // グリッド拡張が必要だが配置可能

  3. パネルの占有範囲をチェック:
     for py = y to y + panel.h - 1:
       for px = x to x + panel.w - 1:
         if py >= spaceMap.length:
           continue  // この行は存在しないが拡張可能

         if spaceMap[py][px].rightSpace == 0:
           return false  // このセルは既に占有されている

     return true  // すべてのセルが空いている
```

### アルゴリズムの特徴

1. **段階的な衝突解決**: キューを使用して、移動によって発生する連鎖的な衝突を順次解決
2. **横優先の移動**: 仕様通り、まず横方向に空きスペースを探し、なければ縦方向に移動
3. **グリッドの動的拡張**: 縦方向にスペースが足りない場合は、グリッドを下方向に拡張
4. **効率的な空きスペース判定**: SpaceMap により、各座標から利用可能なスペースを O(1) で参照可能

### 計算量

- GridMap 構築: O(N × W × H) (N: パネル数, W/H: 平均幅/高さ)
- SpaceMap 構築: O(R × C) (R: 行数, C: 列数)
- 衝突検出: O(W × H) (移動パネルのサイズ)
- 再配置全体: O(N² × W × H) (最悪ケース: 全パネルが連鎖的に移動)

---

## 代替アプローチと比較分析 <!-- AI SKIP -->

### 1. Compaction (圧縮) アルゴリズム

多くのグリッドレイアウトライブラリ（react-grid-layout, gridster.js など）で採用されている手法。

#### 基本的な考え方

- パネルを常に「上に詰める」（compact upward）方向で配置
- 衝突が発生した場合、衝突したパネルを下方向に押し出す
- 全パネルを Y 座標でソートし、上から順に配置を確定していく

#### アルゴリズム（簡略版）

```
function compactLayout(panels: PanelCoordinate[], columnCount: number): PanelCoordinate[]
  1. パネルをY座標でソート（同じYならX座標でソート）
  2. sorted = sortPanels(panels, 'y', 'x')
  3. 占有マップ: occupied = new Map<string, PanelId>()  // "x,y" -> panelId
  4. 結果: result = []

  5. for each panel in sorted:
       // このパネルを配置できる最も上の位置を探す
       targetY = 0
       while true:
         if canPlace(panel, panel.x, targetY, occupied, columnCount):
           // 配置可能
           panel.y = targetY
           markOccupied(occupied, panel)
           result.push(panel)
           break
         targetY++

  6. return result

function canPlace(panel, x, y, occupied, columnCount): boolean
  for py = y to y + panel.h - 1:
    for px = x to x + panel.w - 1:
      if px >= columnCount or occupied.has(`${px},${py}`):
        return false
  return true
```

#### 計算量

- ソート: O(N log N)
- 各パネルの配置判定: O(N × R × W × H) (R: 最大行数)
- **全体: O(N log N + N × R × W × H) = O(N × R × W × H)**

#### メリット

- シンプルで理解しやすい
- 常に「詰まった」レイアウトが得られる
- GridMap 全体の再構築が不要（占有マップだけで済む）

#### デメリット

- 横方向の移動ができない（常に縦方向に押し出される）
- 今回の仕様（横優先）には合わない
- パネルの元位置から大きく離れる可能性がある

---

### 2. パネル座標リストベースのアプローチ（提案アルゴリズムの改善版）

提案したアルゴリズムから SpaceMap を削除し、より直接的に衝突判定を行う方法。

#### 改善のポイント

SpaceMap は各移動ごとに O(R × C) で再構築が必要だが、実際には以下の理由で非効率：

- 衝突判定自体は O(W × H) で可能
- SpaceMap 全体を構築するより、必要な座標だけチェックする方が効率的

#### 最適化されたアルゴリズム

```
function rearrangePanelsOptimized(
  movingPanel: PanelCoordinate,
  allPanels: PanelCoordinate[],
  columnCount: number
): PanelCoordinate[]
  1. panelMap = new Map<PanelId, PanelCoordinate>()  // パネルIDから座標への高速マップ
     for each panel in allPanels:
       panelMap.set(panel.id, {...panel})

  2. queue = [movingPanel]
  3. processed = new Set<PanelId>()

  4. while queue が空でない:
       current = queue.shift()
       if processed.has(current.id): continue
       processed.add(current.id)

       // 衝突検出（GridMapを使わず直接判定）
       collidingIds = detectCollisionsDirect(current, panelMap, columnCount)

       if collidingIds が空:
         panelMap.set(current.id, current)
         continue

       // 衝突解決
       for each collidingId in collidingIds:
         colliding = panelMap.get(collidingId)

         // 新しい位置を探索（SpaceMapなし）
         newPos = findNewPositionDirect(colliding, current, panelMap, columnCount)

         // 位置更新
         updated = {...colliding, x: newPos.x, y: newPos.y}
         panelMap.set(collidingId, updated)
         queue.push(updated)

       panelMap.set(current.id, current)

  5. return Array.from(panelMap.values())

function detectCollisionsDirect(
  panel: PanelCoordinate,
  panelMap: Map<PanelId, PanelCoordinate>,
  columnCount: number
): PanelId[]
  collisions = new Set<PanelId>()

  for each [id, other] of panelMap:
    if id == panel.id: continue

    // 矩形の重なり判定（AABBテスト）
    if rectanglesOverlap(panel, other):
      collisions.add(id)

  return Array.from(collisions)

function rectanglesOverlap(a, b): boolean
  return !(
    a.x + a.w <= b.x ||  // a が b の左側
    b.x + b.w <= a.x ||  // b が a の左側
    a.y + a.h <= b.y ||  // a が b の上側
    b.y + b.h <= a.y     // b が a の上側
  )

function findNewPositionDirect(
  panel: PanelCoordinate,
  pusher: PanelCoordinate,
  columnCount: number
): {x: number, y: number}
  // pusher によって panel が押される距離を計算
  pushInfo = calculatePushDistance(pusher, panel, columnCount)

  if !pushInfo:
    // フォールバック: 下に1つ移動
    return {x: panel.x, y: panel.y + 1}

  if pushInfo.direction == "right":
    // 横方向（右）に押す
    newX = panel.x + pushInfo.distance
    if newX + panel.w <= columnCount:
      return {x: newX, y: panel.y}
    // 横方向に入らない場合は下に押す

  // 縦方向（下）に押す
  return {x: panel.x, y: panel.y + pushInfo.distance}

function hasCollisionDirect(
  candidate: {x, y, w, h},
  excludeId: PanelId,
  panelMap: Map<PanelId, PanelCoordinate>
): boolean
  for each [id, panel] of panelMap:
    if id == excludeId: continue
    if rectanglesOverlap(candidate, panel):
      return true
  return false
```

#### 計算量

- 衝突検出: O(N) （全パネルとの矩形判定）
- 位置探索: O(C × N + R × N) = O((C + R) × N)
- 再配置全体: **O(N² × (C + R))** または O(N² × max(C, R))

#### 比較: 提案アルゴリズム vs 最適化版

| 項目           | 提案アルゴリズム (GridMap + SpaceMap) | 最適化版 (パネルリスト) |
| -------------- | ------------------------------------- | ----------------------- |
| **空間計算量** | O(R × C)                              | O(N)                    |
| **衝突検出**   | O(W × H)                              | O(N)                    |
| **位置探索**   | O(C + R + W×H)                        | O((C + R) × N)          |
| **全体**       | O(N² × W × H)                         | O(N² × max(C, R))       |

#### どちらが効率的か？

パネル数 N、グリッドサイズ R×C、平均パネルサイズ W×H として：

- **パネルが少ない場合 (N < 20 程度)**: 最適化版が有利

  - メモリ使用量が少ない
  - GridMap/SpaceMap の構築コストが削減される

- **パネルが多い場合 (N > 50)**: 提案アルゴリズムが有利

  - GridMap による衝突検出が O(W×H) と高速
  - SpaceMap による空きスペース判定が O(1)

- **グリッドが大きい場合 (R×C > 1000)**: 最適化版が有利
  - GridMap/SpaceMap のメモリコストが高い

#### 実用的な推奨

**典型的なダッシュボード用途**（6× 無制限グリッド、パネル数 5-20 個）では：

- **最適化版（パネルリストベース）を推奨**
- メモリ効率が良い
- コードがシンプル
- 実行速度も十分

---

### 3. インクリメンタルアップデート（差分更新）

#### 基本的な考え方

GridMap を毎回再構築するのではなく、変更があった部分だけを更新する。

#### アルゴリズム

```
class GridLayoutManager:
  gridMap: GridMap
  panels: Map<PanelId, PanelCoordinate>

  constructor(panels, columnCount):
    this.panels = new Map(panels.map(p => [p.id, p]))
    this.gridMap = buildGridMap(panels, columnCount)

  movePanel(panelId, newX, newY):
    oldPanel = this.panels.get(panelId)

    // 1. GridMapから古い位置を削除
    removeFromGridMap(this.gridMap, oldPanel)

    // 2. 新しい位置で衝突チェック
    newPanel = {...oldPanel, x: newX, y: newY}
    collisions = detectCollisions(newPanel, this.gridMap, this.columnCount)

    // 3. 衝突解決（最適化版のロジックを利用）
    if collisions.length > 0:
      this.resolveCollisions(newPanel, collisions)

    // 4. GridMapに新しい位置を追加
    addToGridMap(this.gridMap, newPanel)
    this.panels.set(panelId, newPanel)
```

#### 計算量

- 削除/追加: O(W × H)
- 衝突検出: O(W × H) (GridMap 使用時)
- **全体: O(N × W × H)** (N 個のパネルが連鎖移動する場合)

#### メリット

- GridMap の全再構築が不要
- 状態を保持するため、連続的な操作に有利

#### デメリット

- 状態管理が複雑
- React の不変性原則に反する（Reducer で使いにくい）
- デバッグが困難

---

## 結論と推奨アルゴリズム <!-- AI SKIP-->

### 本プロジェクトへの推奨: **最適化版（パネルリストベース）**

#### 理由

1. **プロジェクト規模に最適**

   - columnCount: 4-6 程度
   - 想定パネル数: 5-20 個
   - この規模では O(N²) でも十分高速

2. **メモリ効率**

   - GridMap/SpaceMap の構築コスト（O(R×C)）を回避
   - パネルリストだけで O(N) のメモリ

3. **コードの保守性**

   - GridMap/SpaceMap の管理が不要
   - 矩形の重なり判定は直感的で理解しやすい

4. **React との親和性**
   - 状態を持たない純粋関数
   - Reducer で使いやすい

### 実装の優先順位

**Phase 1**: 最適化版（パネルリストベース）を実装

- シンプルで効率的
- 十分な性能

**Phase 2** (パフォーマンス問題が発生した場合のみ):

- パネル数が 50 を超える場合 → GridMap ベースに移行
- プロファイリングで実測してから判断

### 注意点

どのアルゴリズムを選択する場合でも：

- **無限ループ対策**: 連鎖移動の上限を設定（例: 100 回）
- **境界チェック**: グリッド外への移動を防ぐ
- **パフォーマンス測定**: 実装後に実際のユースケースで測定

---

## 実装詳細

### 採用したアルゴリズム

**最適化版（パネルリストベース）+ 押しのける挙動 + 空行削除**

### 主要な関数

#### 1. `rectanglesOverlap()` - 矩形の重なり判定

AABB（Axis-Aligned Bounding Box）テストによる高速な衝突判定。

```typescript
export function rectanglesOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean;
```

#### 2. `detectCollisions()` - 衝突パネルの検出

指定されたパネルと衝突する全てのパネル ID を返す。

```typescript
export function detectCollisions(
  panel: PanelCoordinate,
  panelMap: Map<PanelId, PanelCoordinate>
): PanelId[];
```

#### 3. `calculatePushDistance()` - 押しのける距離の計算

衝突したパネルを押しのけるための最小距離と方向を計算。

```typescript
function calculatePushDistance(
  pusher: PanelCoordinate,
  pushed: PanelCoordinate,
  columnCount: number
): { direction: "right" | "down"; distance: number } | null;
```

**ロジック:**

- 横方向の押し距離: `pusher.x + pusher.w - pushed.x`
- 縦方向の押し距離: `pusher.y + pusher.h - pushed.y`
- 横方向に入る場合は横を優先、入らない場合は縦に切り替え

#### 4. `findNewPosition()` - 新しい位置の決定

押しのけられるパネルの新しい位置を計算。

```typescript
export function findNewPosition(
  panel: PanelCoordinate,
  pusher: PanelCoordinate,
  panelMap: Map<PanelId, PanelCoordinate>,
  columnCount: number
): { x: number; y: number };
```

**特徴:**

- `calculatePushDistance()` で計算された押しのける距離だけ移動
- 最小限の移動で衝突を解消
- 横方向に入らない場合は自動的に縦方向に切り替え

#### 5. `rearrangePanels()` - パネルの再配置

メイン関数。衝突解決と空行削除を実行。

```typescript
export function rearrangePanels(
  movingPanel: PanelCoordinate,
  allPanels: PanelCoordinate[],
  columnCount: number
): PanelCoordinate[];
```

**処理フロー:**

1. パネルマップを作成（O(N)）
2. 移動パネルをキューに追加
3. キューが空になるまで処理:
   - 衝突検出
   - 衝突したパネルを押しのける
   - 押しのけられたパネルをキューに追加（連鎖対応）
4. 空行削除（compactLayout）
5. 結果を返す

#### 6. `compactLayout()` - 空行の削除

レイアウトから空行を削除してパネルを上に詰める。

```typescript
export function compactLayout(panels: PanelCoordinate[]): PanelCoordinate[];
```

**アルゴリズム:**

1. 各行の占有状態をチェック（O(N × H)）
2. 各行の上にある空行数を計算（O(R)）
3. 各パネルをオフセット分だけ上に移動（O(N)）
4. **全体: O(N × H + R)**

### 統合ポイント

#### PanelistProvider の Reducer

`MOVE_PANEL` と `RESIZE_PANEL` アクションで `rearrangePanels()` を呼び出し。

**src/PanelistProvider.tsx:127 (RESIZE_PANEL)**

```typescript
case "RESIZE_PANEL": {
  const resizedPanel = {
    ...state.panels[index],
    w: action.w,
    h: action.h,
  };

  const rearrangedPanels = rearrangePanels(
    resizedPanel,
    state.panels,
    state.columnCount
  );

  return {
    ...state,
    panels: rearrangedPanels,
    ghostPanel: null,
  };
}
```

**src/PanelistProvider.tsx:151 (MOVE_PANEL)**

```typescript
case "MOVE_PANEL": {
  const movedPanel = {
    ...state.panels[index],
    x: action.x,
    y: action.y,
  };

  const rearrangedPanels = rearrangePanels(
    movedPanel,
    state.panels,
    state.columnCount
  );

  return {
    ...state,
    panels: rearrangedPanels,
    ghostPanel: null,
  };
}
```

### テスト <!-- AI SKIP -->

**78 個のテストケース** (src/helpers/rearrangement.test.ts)

主要なテスト項目：

- 矩形の重なり判定 (`rectanglesOverlap`): 5 テスト
- 衝突検出 (`detectCollisions`): 3 テスト
- 衝突判定 (`hasCollision`): 3 テスト
- 押しのける位置計算 (`findNewPosition`): 3 テスト
- パネル再配置 (`rearrangePanels`): 5 テスト
- 空行削除 (`compactLayout`): 6 テスト

その他、統合テストやエッジケースのテストを含む

### パフォーマンス特性

#### 計算量

- **空間計算量**: O(N) - パネルリストのみ
- **時間計算量**: O(N² × max(C, R)) - パネル数が少ない場合に最適

#### 実測値（想定）

- パネル数 10 個、グリッド 6 列の場合:
  - 1 回の再配置: < 1ms
  - メモリ使用量: ~1KB

### 今後の改善案

1. **パフォーマンス最適化**

   - パネル数が 50 を超える場合は GridMap ベースへの切り替えを検討
   - 連鎖の深さに上限を設定（現在: 無制限）

2. **機能拡張**

   - 左方向・上方向への押しのけにも対応
   - パネルの最小サイズ制約
   - グリッドの境界でのリサイズ制限

3. **UX 改善**
   - 押しのけられるパネルのアニメーション表示
   - 衝突プレビュー（ゴーストパネルでの表示）
