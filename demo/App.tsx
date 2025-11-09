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
  const { addPanel, exportState } = usePanelistControls();

  const save = () => {
    const _state = exportState();
  };

  return (
    <div className="controls">
      <button onClick={() => addPanel({ w: 2, h: 2 })}>Add Panel</button>
      <button onClick={save}>Export State</button>
    </div>
  );
}

function PanelContent({ id }: { id: PanelId }) {
  const { removePanel } = usePanelistControls();
  return (
    <div className="panel-content">
      <button className="panel-remove-button" onClick={() => removePanel(id)}>
        x
      </button>
      <div className="panel-content-inner">Panel Content {id}</div>
    </div>
  );
}
