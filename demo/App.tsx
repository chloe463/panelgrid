import "./App.css";

import type { PanelId } from "../src";
import { PanelistProvider, PanelistRenderer, usePanelistControls } from "../src";
import "../src/styles.css";

export default function App() {
  return (
    <div className="App">
      <PanelistProvider
        panels={[
          { id: 1, x: 0, y: 0, w: 2, h: 2 },
          { id: 2, x: 2, y: 0, w: 2, h: 2 },
          { id: 3, x: 4, y: 0, w: 2, h: 1 },
          { id: 4, x: 0, y: 2, w: 1, h: 1 },
        ]}
        columnCount={6}
        gap={8}
      >
        <PanelControls />
        <PanelistRenderer itemRenderer={PanelContent} />
      </PanelistProvider>
    </div>
  );
}

function PanelControls() {
  const { addPanel } = usePanelistControls();
  return (
    <div>
      <button onClick={() => addPanel({ w: 2, h: 2 })}>Add Panel</button>
    </div>
  );
}

function PanelContent(id: PanelId) {
  const { removePanel } = usePanelistControls();
  return (
    <div className="panel-content">
      Panel Content {id}
      <button onClick={() => removePanel(id)}>Remove Panel</button>
    </div>
  );
}
