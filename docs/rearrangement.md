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
