# Re-render 最適化プラン

## 🔍 現在の問題

### 1. Context の再レンダリング連鎖

- `PanelistStateContext` が変更されると、`usePanelState()` を使用している**すべてのコンポーネント**が再レンダリングされる
- `movingPanel()` や `resizingPanel()` が呼ばれるたびに `ghostPanel` が更新され、state 全体が変わる
- マウス移動中、毎フレーム全パネルが再レンダリングされる

### 2. 不要な依存関係

- `Panel` コンポーネントは `usePanel()` → `usePanelState()` で `baseSize` と `gap` を取得
- ドラッグ/リサイズ中でなくても、他のパネルの操作で state が変わると再レンダリング
- `useDnd` と `useResize` も `usePanelState()` を呼んでいる

### 3. Ghost Panel の影響範囲が広すぎる

- ghost panel の座標変更が、実際のパネルの再レンダリングを引き起こす

---

## 💡 改善アイデア

### アイデア 1: Context の分離

現在は state が1つの Context にまとまっているため、部分的な変更でも全体が再レンダリングされます。

**提案:**

```typescript
// 分離案
-PanelistConfigContext(columnCount, gap, baseSize) -
  ほぼ不変 -
  PanelCoordinatesContext(panels) -
  パネル位置・サイズ -
  GhostPanelContext(ghostPanel) -
  ドラッグ / リサイズ中のみ使用;
```

**効果:**

- Ghost panel の更新時、実際のパネルは再レンダリングされない
- `baseSize` だけが必要なコンポーネントは、panels の変更で再レンダリングされない

**実装の影響:**

- Context を3つに分割
- Provider のネスト構造
- hooks の分離 (`usePanelConfig`, `usePanelCoordinates`, `useGhostPanel`)

---

### アイデア 2: Throttle/Debounce の導入

`mousemove` イベントで毎フレーム dispatch するのはコスト高です。

**提案:**

```typescript
// useDnd.ts と useResize.ts 内で
- movingPanel() と resizingPanel() を throttle (16ms - 60fps 相当)
- または requestAnimationFrame でバッチ処理
```

**効果:**

- 秒間 60 回の state 更新が 16〜30 回程度に削減
- Ghost panel の描画頻度を制御できる

**実装の影響:**

- throttle ユーティリティ関数の追加 (または lodash.throttle の導入)
- `src/throttle.ts` が既にあるので活用可能
- useDnd.ts と useResize.ts の修正のみ

---

### アイデア 3: 個別パネル State の分離

Context 経由ではなく、各パネルが独自に state を持つ。

**提案:**

```typescript
// Panel コンポーネント内で独自の座標 state を持つ
- ドラッグ中は自分の state だけを更新（他のパネルに影響なし）
- mouseup 時のみ Context に反映
```

**効果:**

- ドラッグ中、他のパネルは完全に影響を受けない
- Context への dispatch 回数が劇的に減る（移動中 0 回、完了時 1 回）

**実装の影響:**

- Panel コンポーネントに useState を追加
- useDnd/useResize で local state を操作
- 実装の複雑度が上がる（state の同期が必要）

---

### アイデア 4: React.memo の活用

コンポーネントレベルでの最適化。

**提案:**

```typescript
// Panel コンポーネントを React.memo でラップ
const Panel = React.memo((props) => { ... })

// 比較関数を提供して、自分の座標だけをチェック
(prevProps, nextProps) =>
  prevProps.x === nextProps.x &&
  prevProps.y === nextProps.y &&
  prevProps.w === nextProps.w &&
  prevProps.h === nextProps.h &&
  prevProps.panelId === nextProps.panelId
```

**効果:**

- 自分の座標が変わった時だけ再レンダリング
- 他のパネルの変更を無視できる

**実装の影響:**

- Panel.tsx の export 部分のみ修正
- 比較関数の実装
- children の変更検知に注意

---

### アイデア 5: Refs ベースの実装

React の state を経由せず、DOM を直接操作。

**提案:**

```typescript
// ドラッグ中は ref.current.style を直接更新
- state 更新なし → 再レンダリングなし
- mouseup 時のみ Context に座標を commit
```

**効果:**

- 最も高速（フレームドロップなし）
- ただし React のパラダイムから外れる

**実装の影響:**

- useDnd/useResize の大幅な書き換え
- 既に一部 ref.current.style を使用しているので拡張可能
- デバッグが難しくなる可能性

---

### アイデア 6: useSyncExternalStore の活用

React 18+ の機能で、外部ストアと同期。

**提案:**

```typescript
// Zustand や Jotai のような状態管理ライブラリを使用
- 個別パネルの座標を独立した atom として管理
- 必要なパネルだけが subscribe
```

**効果:**

- Context の再レンダリング問題を根本的に解決
- 細粒度の更新が可能

**実装の影響:**

- 新しい依存関係の追加
- 状態管理の完全な書き換え
- 大規模なリファクタリング

---

### アイデア 7: Ghost Panel の CSS Transform 化

Ghost panel も再レンダリングの原因になっている可能性。

**提案:**

```typescript
// Ghost コンポーネントを position: fixed + transform で実装
- Context の座標を CSS Variables として渡す
- または ref で直接 style 更新
```

**効果:**

- Ghost panel の頻繁な更新が Layout に影響しない
- CSS のみの更新で再レンダリングなし

**実装の影響:**

- Ghost.tsx の実装変更
- CSS Variables の活用
- または useRef + useEffect での DOM 直接操作

---

## 📊 推奨する実装順序

### フェーズ 1: すぐに効果が出る施策（影響小）

1. **アイデア 2: Throttle の導入**
   - 実装コスト: 低
   - 効果: 中〜高
   - リスク: 低
   - 既存の `src/throttle.ts` を活用

2. **アイデア 4: React.memo の活用**
   - 実装コスト: 低
   - 効果: 中
   - リスク: 低
   - Panel コンポーネントのみ修正

### フェーズ 2: 中期的改善（影響中）

3. **アイデア 1: Context の分離**
   - 実装コスト: 中
   - 効果: 高
   - リスク: 中
   - Provider 構造の変更が必要

4. **アイデア 7: Ghost Panel の最適化**
   - 実装コスト: 低〜中
   - 効果: 中
   - リスク: 低
   - Ghost コンポーネントのみ修正

### フェーズ 3: 抜本的改善（影響大）

5. **アイデア 3: 個別 State の分離**
   - 実装コスト: 高
   - 効果: 高
   - リスク: 中〜高
   - 状態管理の設計変更

6. **アイデア 6: 外部ストアの導入**
   - 実装コスト: 高
   - 効果: 高
   - リスク: 中
   - 大規模なリファクタリング

### 検討外

- **アイデア 5: Refs ベース**
  - React のパラダイムから外れるため、最後の手段として検討

---

## 🎯 推奨する最初のステップ

**アイデア 2 (Throttle) + アイデア 4 (React.memo) の組み合わせ**

**理由:**

- 既存コードへの影響が最小限
- 実装が簡単で、すぐに効果を測定できる
- リスクが低い
- これだけで体感できる改善が期待できる

**実装後の測定:**

- React DevTools Profiler で再レンダリング回数を測定
- 効果が不十分な場合、フェーズ 2 に進む

---

## 📝 実装メモ

### Throttle 実装の注意点

- mousemove イベントでの throttle は 16ms (60fps) を目安に
- mouseup 時は必ず最後の値を反映（trailing: true）
- requestAnimationFrame を使う場合、ブラウザの最適化を活用できる

### React.memo の注意点

- children が関数の場合、useCallback でメモ化が必要
- 比較関数で false を返すと再レンダリング（通常の memo と逆なので注意）
- パフォーマンスプロファイルで効果を確認

### Context 分離の設計案

```typescript
// Config (ほぼ不変)
const PanelistConfigContext = createContext<{
  columnCount: number;
  gap: number;
  baseSize: number;
}>();

// Panels (変更頻度: 低)
const PanelCoordinatesContext = createContext<{
  panels: PanelCoordinate[];
}>();

// Ghost (変更頻度: 高、ドラッグ中のみ)
const GhostPanelContext = createContext<{
  ghostPanel: GhostPanel | null;
}>();
```
