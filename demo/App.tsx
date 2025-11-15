import "./App.css";

import type { PanelId } from "../src";
import { PanelGridProvider, PanelGridRenderer, usePanelGridControls } from "../src";

export default function App() {
  return (
    <div className="App">
      <PanelGridProvider
        panels={[
          { id: 1, x: 0, y: 0, w: 2, h: 2 },
          { id: 2, x: 2, y: 0, w: 2, h: 2 },
          { id: 3, x: 4, y: 0, w: 2, h: 1 },
          { id: 4, x: 0, y: 2, w: 1, h: 1 },
          { id: 5, x: 1, y: 2, w: 1, h: 1, lockSize: true },
        ]}
        columnCount={6}
        gap={8}
      >
        <PanelControls />
        <PanelGridRenderer itemRenderer={PanelContent} />
      </PanelGridProvider>
    </div>
  );
}

function PanelControls() {
  const { addPanel, exportState } = usePanelGridControls();

  const save = () => {
    const _state = exportState();
    // biome-ignore lint/suspicious/noConsole: for demo purpose
    console.log(_state);
  };

  return (
    <div className="controls">
      <button onClick={() => addPanel({ w: 2, h: 2 })}>Add Panel</button>
      <button onClick={save}>Export State</button>
    </div>
  );
}

function PanelContent({ id }: { id: PanelId }) {
  const { removePanel } = usePanelGridControls();
  const isLocked = id === 5;
  return (
    <div className="panel-content">
      <button className="panel-remove-button" onClick={() => removePanel(id)}>
        x
      </button>
      <div className="panel-content-inner">
        Panel Content {id}
        {isLocked && <span className="locked-badge">🔒 Size Locked</span>}
      </div>
    </div>
  );
}
