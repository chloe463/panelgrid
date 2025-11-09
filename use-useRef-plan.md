# パフォーマンス最適化リファクタリング計画

## 目的

現在の実装では React の state を使って位置管理をしているため、ドラッグ&リサイズ中に不要なレンダリングが発生しています。`useRef` を使って状態管理を最適化し、レンダリング回数を削減することが目標です。

## 参考記事の要点

[React useRef を使ったドラッグ&ドロップ実装](https://zenn.dev/uttk/articles/b90454baec68c8)

**主要なポイント:**

- `useRef` は再レンダリングをトリガーせずに可変な値を保持できる
- ドラッグ中の頻繁な更新では state ではなく ref を使うことで大量の再レンダリングを防ぐ
- `requestAnimationFrame()` でスムーズなアニメーションを実現
- イベントリスナーは window レベルで管理することでより堅牢な実装になる
- 必要な時のみ DOM を選択的に更新する

## 現状の問題点

### 1. DragStateContext の state による再レンダリング

**ファイル:** `src/contexts/DragStateContext.tsx`

```typescript
const [ghostPanel, setGhostPanelState] = useState<GhostPanel | null>(null);
const [activePanelId, setActivePanelId] = useState<PanelId | null>(null);
```

**問題:**

- `movingPanel` および `resizingPanel` が呼ばれるたびに state が更新される
- state 更新により Ghost コンポーネントと、Context を購読している全コンポーネントが再レンダリングされる
- ドラッグ中に `throttledMovingPanel` が頻繁に呼ばれるため、パフォーマンスに影響

### 2. Ghost コンポーネントの頻繁な再レンダリング

**ファイル:** `src/Ghost.tsx`

```typescript
const { ghostPanel } = useDragState();
```

**問題:**

- `ghostPanel` state が更新されるたびに Ghost コンポーネントが再レンダリングされる
- ドラッグ中の位置更新のたびに React の再レンダリングサイクルが実行される

### 3. useDnd と useResize での throttle の限界

**ファイル:** `src/useDnd.ts`, `src/useResize.ts`

**現状:**

- `throttleRAF` で再レンダリングを抑制しているが、根本的な解決にはなっていない
- 最終的には state 更新が発生するため、React の再レンダリングは避けられない

## リファクタリング戦略

### フェーズ 1: Ghost の ref ベース実装への移行

**対象ファイル:**

- `src/contexts/DragStateContext.tsx`
- `src/Ghost.tsx`

**変更内容:**

1. `DragStateContext` で `useState` の代わりに `useRef` を使用
2. Ghost パネルの位置更新を直接 DOM 操作で行う（state を経由しない）
3. Ghost コンポーネントを ref 経由で更新するヘルパー関数を作成

**実装方針:**

```typescript
// DragStateContext.tsx の変更案
const ghostPanelRef = useRef<GhostPanel | null>(null);
const ghostElementRef = useRef<HTMLDivElement | null>(null);
const activePanelIdRef = useRef<PanelId | null>(null);

const updateGhostPanel = (panelId: PanelId, x: number, y: number, w: number, h: number) => {
  activePanelIdRef.current = panelId;
  ghostPanelRef.current = { x, y, w, h };

  // DOM を直接更新（state を介さない）
  if (ghostElementRef.current) {
    const left = gridPositionToPixels(x, baseSize, gap);
    const top = gridPositionToPixels(y, baseSize, gap);
    const width = gridToPixels(w, baseSize, gap);
    const height = gridToPixels(h, baseSize, gap);

    ghostElementRef.current.style.left = `${left}px`;
    ghostElementRef.current.style.top = `${top}px`;
    ghostElementRef.current.style.width = `${width}px`;
    ghostElementRef.current.style.height = `${height}px`;
    ghostElementRef.current.style.display = "block";
  }
};
```

**期待される効果:**

- Ghost パネルの位置更新時に React の再レンダリングが発生しなくなる
- ドラッグ中のパフォーマンスが大幅に向上

### フェーズ 2: useDnd の最適化

**対象ファイル:**

- `src/useDnd.ts`

**変更内容:**

1. ドラッグ中の位置情報を ref で管理
2. `movingPanel` の代わりに直接 Ghost の DOM を更新する関数を使用
3. 最終的な位置確定時のみ state を更新

**実装方針:**

```typescript
// ドラッグ中は ref で状態管理
const dragStateRef = useRef({
  isDragging: false,
  initialX: 0,
  initialY: 0,
  offsetX: 0,
  offsetY: 0,
});

// mousemove では DOM を直接更新
function onMouseMove(e: MouseEvent) {
  if (!dragStateRef.current.isDragging) return;

  const deltaX = e.clientX - dragStateRef.current.initialX;
  const deltaY = e.clientY - dragStateRef.current.initialY;

  // ドラッグ中のパネルの DOM を直接更新
  draggable.style.left = dragStateRef.current.offsetX + deltaX + "px";
  draggable.style.top = dragStateRef.current.offsetY + deltaY + "px";

  // Ghost の更新（ref ベース、state 更新なし）
  const nextX = pixelsToGridPosition(dragStateRef.current.offsetX + deltaX, baseSize, gap);
  const nextY = pixelsToGridPosition(dragStateRef.current.offsetY + deltaY, baseSize, gap);
  updateGhostPanel(id, nextX, nextY, w, h);
}

// mouseup でのみ state 更新
function onMouseUp() {
  // ... 最終位置の計算
  movePanel(id, nextX, nextY); // これが唯一の state 更新
  clearGhostPanel(); // Ghost を非表示
}
```

**期待される効果:**

- ドラッグ中の Context 更新が不要になる
- Panel コンポーネントの不要な再レンダリングが削減される
- `throttledMovingPanel` が不要になる

### フェーズ 3: useResize の最適化

**対象ファイル:**

- `src/useResize.ts`

**変更内容:**

1. リサイズ中のサイズ情報を ref で管理
2. `resizingPanel` の代わりに直接 Ghost の DOM を更新する関数を使用
3. 最終的なサイズ確定時のみ state を更新

**実装方針:**

```typescript
// リサイズ中は ref で状態管理
const resizeStateRef = useRef({
  isResizing: false,
  startX: 0,
  startY: 0,
  initialWidth: 0,
  initialHeight: 0,
});

// mousemove では DOM を直接更新
function onMouseMove(e: MouseEvent) {
  if (!resizeStateRef.current.isResizing) return;

  const deltaX = e.clientX - resizeStateRef.current.startX;
  const deltaY = e.clientY - resizeStateRef.current.startY;

  // リサイズ中のパネルの DOM を直接更新
  ref.current.style.width = `${resizeStateRef.current.initialWidth + deltaX}px`;
  ref.current.style.height = `${resizeStateRef.current.initialHeight + deltaY}px`;

  // Ghost の更新（ref ベース、state 更新なし）
  const nextW = pixelsToGridSize(resizeStateRef.current.initialWidth + deltaX, baseSize, gap);
  const nextH = pixelsToGridSize(resizeStateRef.current.initialHeight + deltaY, baseSize, gap);
  updateGhostPanel(id, x, y, nextW, nextH);
}

// mouseup でのみ state 更新
function onMouseUp() {
  // ... 最終サイズの計算
  resizePanel(id, nextW, nextH); // これが唯一の state 更新
  clearGhostPanel(); // Ghost を非表示
}
```

**期待される効果:**

- リサイズ中の Context 更新が不要になる
- Panel コンポーネントの不要な再レンダリングが削減される
- `throttledResizingPanel` が不要になる

### フェーズ 4: PanelistProvider の最適化とクリーンアップ

**対象ファイル:**

- `src/PanelistProvider.tsx`

**変更内容:**

1. `movingPanel` と `resizingPanel` を Context から削除（Ghost の更新が ref ベースになるため不要）
2. Context API の見直しと簡素化

**実装方針:**

```typescript
// PanelistControlContext から削除
interface PanelistControls {
  addPanel: () => void;
  resizePanel: (id: PanelId, w: number, h: number) => void;
  movePanel: (id: PanelId, x: number, y: number) => void;
  removePanel: (id: PanelId) => void;
  // movingPanel と resizingPanel は削除
}
```

**期待される効果:**

- Context の責務が明確になる
- コードがシンプルになり保守性が向上

## 実装順序

1. **フェーズ 1**: DragStateContext と Ghost の ref ベース実装（最も効果が高い）
2. **フェーズ 2**: useDnd の最適化
3. **フェーズ 3**: useResize の最適化
4. **フェーズ 4**: PanelistProvider のクリーンアップ

各フェーズ後にテストを実行し、既存機能が正しく動作することを確認します。

## 実装の詳細ポイント

### Ghost 要素の ref 管理

Ghost コンポーネントに ref を渡す方法:

```typescript
// Ghost.tsx
export const Ghost = forwardRef<HTMLDivElement>((props, ref) => {
  return <div ref={ref} className="panel-ghost"></div>;
});

// DragStateProvider 内
const ghostElementRef = useRef<HTMLDivElement | null>(null);

return (
  <DragStateContext.Provider value={...}>
    <DragStateControlContext.Provider value={...}>
      {props.children}
      <Ghost ref={ghostElementRef} />
    </DragStateControlContext.Provider>
  </DragStateContext.Provider>
);
```

### GridConfig へのアクセス

`updateGhostPanel` 関数内で `baseSize` と `gap` が必要なため、Context からこれらの値を取得する必要があります:

```typescript
export function DragStateProvider(props: DragStateProviderProps) {
  const { baseSize, gap } = useGridConfig();
  const ghostElementRef = useRef<HTMLDivElement | null>(null);

  const updateGhostPanel = useCallback(
    (panelId: PanelId, x: number, y: number, w: number, h: number) => {
      // baseSize と gap を使用
    },
    [baseSize, gap]
  );
}
```

### throttleRAF の削除

ref ベースの実装では、state 更新が発生しないため `throttleRAF` は不要になります。ただし、DOM 操作の頻度を制限したい場合は `requestAnimationFrame` で制御することも可能です。

## テスト戦略

### 既存テストの実行

```bash
yarn test
```

以下のテストが全てパスすることを確認:

- `src/useDnd.test.tsx`
- `src/useResize.test.tsx`
- `src/helpers/rearrangement.test.ts`
- `src/helpers/gridCalculations.test.ts`
- `src/helpers/throttle.test.ts`

### 手動テスト項目

- [ ] ドラッグ&ドロップの動作確認
- [ ] リサイズの動作確認
- [ ] Ghost パネルの表示/非表示の確認
- [ ] Ghost パネルの位置とサイズが正確に追従するか
- [ ] パネルの衝突解決が正常に動作するか
- [ ] アニメーションがスムーズか
- [ ] 複数パネルを連続して操作した際の動作

## パフォーマンス測定

### リファクタリング前の測定

1. React DevTools Profiler を使用
   - ドラッグ中のレンダリング回数を記録
   - 各コンポーネントのレンダリング時間を記録

2. Chrome DevTools Performance
   - ドラッグ操作を記録
   - フレームレートを確認
   - JavaScript 実行時間を測定

### リファクタリング後の測定

同じ操作を行い、以下を比較:

- レンダリング回数の削減率
- フレームレートの改善
- JavaScript 実行時間の削減

### 期待される改善値

- ドラッグ中のレンダリング回数: **90%以上削減**
  - 現状: mousemove ごとに全 Panel が再レンダリング
  - 改善後: ドラッグ中は再レンダリングなし、mouseup 時のみ1回

- フレームレート: **安定した 60fps**
  - DOM 直接操作により、React の reconciliation がスキップされる

## 注意点とリスク

### 注意点

1. **GridConfig への依存**
   - `updateGhostPanel` 関数は `baseSize` と `gap` に依存
   - これらの値が変更された場合、Ghost の位置計算が正しく行われるよう注意

2. **メモリリーク防止**
   - ref の適切なクリーンアップ
   - イベントリスナーの AbortController による管理は継続

3. **React のパラダイムからの逸脱**
   - DOM 直接操作は React の宣言的な UI 記述から外れる
   - デバッグが難しくなる可能性があるため、コメントを充実させる

### リスク

1. **テストの修正が必要な可能性**
   - state ベースのテストが ref ベースに対応できない場合、テストの書き直しが必要

2. **エッジケースの見落とし**
   - Ghost が表示されたままになる
   - ref の参照が null になる
   - これらは十分な手動テストでカバー

## 期待される成果

### パフォーマンス面

- ドラッグ&リサイズ中の再レンダリングが **ほぼゼロ** になる
- UI の応答性が向上し、よりスムーズな操作感を実現
- メモリ使用量の削減（不要な再レンダリングによるメモリ割り当てが減少）

### コード品質面

- 状態管理の責務が明確になる
- Context の肥大化を防ぐ
- コードがシンプルになり、保守性が向上

### ユーザー体験面

- フレームドロップのない滑らかなドラッグ操作
- 多数のパネルがある場合でもパフォーマンスが維持される
- レスポンシブな操作感

## 実装後の確認事項

- [ ] 全テストがパスする
- [ ] React DevTools Profiler でレンダリング回数を確認
- [ ] Chrome DevTools Performance でフレームレートを確認
- [ ] 手動テスト項目を全てクリア
- [ ] コードレビュー（特に ref の使い方とメモリリーク）
- [ ] ドキュメントの更新（実装の変更点を記録）
