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

実装では以下のデータ構造を使用しています：

#### PanelMap (パネルマップ)

パネルIDからパネル座標への高速マッピング。

```typescript
type PanelMap = Map<PanelId, PanelCoordinate>;
```

- キー: パネルID
- 値: パネルの座標情報 (x, y, w, h)
- O(1) でパネルの検索・更新が可能

### 主要なアルゴリズム

#### 1. 矩形の重なり判定 (`rectanglesOverlap`)

AABB (Axis-Aligned Bounding Box) テストを使用して2つのパネルが重なっているか判定します。

```typescript
function rectanglesOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean;
// 2つの矩形が重ならない条件（以下のいずれか）:
// - a が b の左側にある: a.x + a.w <= b.x
// - b が a の左側にある: b.x + b.w <= a.x
// - a が b の上側にある: a.y + a.h <= b.y
// - b が a の上側にある: b.y + b.h <= a.y
// これらの条件がすべて false なら重なっている
return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
```

#### 2. 衝突検出 (`detectCollisions`)

指定されたパネルと衝突する全てのパネルIDを返します。

```typescript
function detectCollisions(
  panel: PanelCoordinate,
  panelMap: Map<PanelId, PanelCoordinate>
): PanelId[]
  1. 衝突したパネルIDを格納する Set を作成
  2. panelMap 内の全パネルをループ:
     for each [id, other] of panelMap:
       if id == panel.id:
         continue  // 自分自身はスキップ

       if rectanglesOverlap(panel, other):
         Set に id を追加

  3. Set を配列に変換して返す
```

#### 3. 押しのける距離の計算 (`calculatePushDistance`)

衝突したパネルを押しのけるための最小距離と方向を計算します。

```typescript
function calculatePushDistance(
  pusher: PanelCoordinate,
  pushed: PanelCoordinate,
  columnCount: number
): { direction: "right" | "down"; distance: number } | null
  1. 横方向の押し距離を計算:
     pushRight = pusher.x + pusher.w - pushed.x
     canPushRight = pushed.x + pushed.w + pushRight <= columnCount

  2. 縦方向の押し距離を計算:
     pushDown = pusher.y + pusher.h - pushed.y

  3. 優先順位1: 横方向に押せる場合は横を選択
     if canPushRight and pushRight > 0:
       return { direction: "right", distance: pushRight }

  4. 優先順位2: 縦方向に押す
     if pushDown > 0:
       return { direction: "down", distance: pushDown }

  5. 押す必要がない場合:
     return null
```

#### 4. 新しい位置の決定 (`findNewPosition`)

押しのけられるパネルの新しい位置を計算します。

```typescript
function findNewPosition(
  panel: PanelCoordinate,
  pusher: PanelCoordinate,
  columnCount: number
): { x: number; y: number }
  1. pushInfo = calculatePushDistance(pusher, panel, columnCount)

  2. pushInfo が null の場合（押す必要がない場合のフォールバック）:
     return { x: panel.x, y: panel.y + 1 }

  3. 横方向に押す場合:
     if pushInfo.direction == "right":
       newX = panel.x + pushInfo.distance
       if newX + panel.w <= columnCount:
         return { x: newX, y: panel.y }
       // 横方向に入らない場合は次のステップへ

  4. 縦方向に押す:
     return { x: panel.x, y: panel.y + pushInfo.distance }
```

#### 5. パネルの再配置 (`rearrangePanels`)

パネルの移動・リサイズ時に衝突を解決するようにパネルを再配置します。

```typescript
function rearrangePanels(
  movingPanel: PanelCoordinate,
  allPanels: PanelCoordinate[],
  columnCount: number
): PanelCoordinate[]
  1. パネルIDから座標への高速マップを作成:
     panelMap = new Map<PanelId, PanelCoordinate>()
     for each panel in allPanels:
       panelMap.set(panel.id, {...panel})

  2. 移動中のパネルの位置をマップに反映:
     panelMap.set(movingPanel.id, {...movingPanel})

  3. 処理待ちキュー: queue = [movingPanel]
     処理済みパネルID: processed = new Set()

  4. 衝突がなくなるまでパネルを処理:
     while queue.length > 0:
       current = queue.shift()

       if processed.has(current.id):
         continue
       processed.add(current.id)

       // 現在のパネル位置での衝突を検出
       collidingIds = detectCollisions(current, panelMap)

       if collidingIds が空:
         // 衝突なし、現在の位置を維持
         panelMap.set(current.id, current)
         continue

       // 衝突解決: 衝突したパネルを押しのける
       for each collidingId in collidingIds:
         colliding = panelMap.get(collidingId)
         if !colliding: continue

         // 衝突したパネルを押しのける方向に移動
         newPos = findNewPosition(colliding, current, columnCount)

         // パネルの位置を更新
         updated = {...colliding, x: newPos.x, y: newPos.y}
         panelMap.set(collidingId, updated)

         // 再度衝突チェックのためキューに追加
         queue.push(updated)

       // 現在のパネルの位置を確定
       panelMap.set(current.id, current)

  5. 空行を削除してレイアウトを詰める:
     compactedPanels = compactLayout(Array.from(panelMap.values()))

  6. 再配置と圧縮後のパネルを返す:
     return compactedPanels
```

#### 6. 空行の削除 (`compactLayout`)

レイアウトから空行を削除してパネルを上に詰めます。

```typescript
function compactLayout(panels: PanelCoordinate[]): PanelCoordinate[]
  1. パネルが空の場合は空配列を返す:
     if panels.length == 0: return []

  2. 最大Y座標を見つけてグリッドの高さを決定:
     maxY = Math.max(...panels.map(p => p.y + p.h))

  3. どの行にパネルがあるかのマップを構築:
     rowOccupancy = new Array(maxY).fill(false)
     for each panel in panels:
       for y = panel.y to panel.y + panel.h - 1:
         rowOccupancy[y] = true

  4. 各行のオフセット（その上にある空行の数）を計算:
     rowOffsets = new Array(maxY).fill(0)
     emptyRowCount = 0
     for y = 0 to maxY - 1:
       rowOffsets[y] = emptyRowCount
       if !rowOccupancy[y]:
         emptyRowCount++

  5. パネルを行オフセット分だけ上に移動:
     return panels.map(panel => ({
       ...panel,
       y: panel.y - rowOffsets[panel.y]
     }))
```

### アルゴリズムの特徴

1. **段階的な衝突解決**: キューを使用して、移動によって発生する連鎖的な衝突を順次解決
2. **押しのける挙動**: `calculatePushDistance` により最小限の距離だけパネルを移動
3. **横優先の移動**: 横方向に入る場合は横を優先、入らない場合は縦方向に切り替え
4. **空行の自動削除**: `compactLayout` により、再配置後の空行を自動的に削除

### 計算量

- **矩形の重なり判定**: O(1)
- **衝突検出**: O(N) (全パネルとの判定)
- **押しのける距離計算**: O(1)
- **パネル再配置**: O(N²) (最悪ケース: 全パネルが連鎖的に移動)
- **空行削除**: O(N × H + R) (H: 平均パネル高さ, R: 行数)
- **全体**: O(N²) (パネル数が少ない場合に最適)
