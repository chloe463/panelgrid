import "./App.css";

import type { PanelId } from "../src/types";
import { PanelistProvider } from "../src/PanelistProvider";
import { PanelistRenderer } from "../src/PanelistRenderer";
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
        <PanelistRenderer itemRenderer={PanelContent} />
      </PanelistProvider>
    </div>
  );
}

function PanelContent(id: PanelId) {
  return <div className="panel-content">Panel Content {id}</div>;
}
