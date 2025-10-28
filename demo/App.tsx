import "./App.css";

import { PanelistProvider, PanelRenderer, type PanelId } from "../src";

export default function App() {
  return (
    <div className="App">
      <PanelistProvider
        columnCount={6}
        gap={8}
        panelCoordinates={[
          { id: 1, x: 0, y: 0, w: 2, h: 2 },
          { id: 2, x: 2, y: 0, w: 2, h: 2 },
          { id: 3, x: 4, y: 0, w: 2, h: 1 },
          { id: 4, x: 0, y: 2, w: 1, h: 1 },
        ]}
      >
        <PanelRenderer itemRenderer={PanelContent} />
      </PanelistProvider>
    </div>
  );
}

function PanelContent(id: PanelId) {
  return <div className="panel-content">Panel Content {id}</div>;
}
