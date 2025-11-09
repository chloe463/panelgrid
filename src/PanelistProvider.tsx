import { createContext, useContext, useState } from "react";
import type { PanelCoordinate, PanelId } from "./types";
import { usePanelist } from "./usePanelist";

type PanelistState = ReturnType<typeof usePanelist>;

interface PanelistContextType {
  panelistState: PanelistState;
  columnCount: number;
  gap: number;
}

type NewPanel = Pick<PanelCoordinate, "id" | "w" | "h">;
interface PanelistControlsContextType {
  setBaseSize: (baseSize: number) => void;
  addPanel: (panel: NewPanel) => void;
  removePanel: (id: PanelId) => void;
}

const PanelistStateContext = createContext<PanelistContextType | undefined>(undefined);
const PanelistControlsContext = createContext<PanelistControlsContextType | undefined>(undefined);

interface PanelistProviderProps {
  panels: PanelCoordinate[];
  columnCount: number;
  gap: number;
  children: React.ReactNode;
}

export function PanelistProvider({ panels: initialPanels, columnCount, gap, children }: PanelistProviderProps) {
  const [baseSize, setBaseSize] = useState(80);
  const addPanel = (_panel: NewPanel) => void 0;
  const removePanel = (_id: PanelId) => void 0;

  const panelistState = usePanelist({ panels: initialPanels, columnCount, baseSize, gap });

  return (
    <PanelistStateContext.Provider value={{ panelistState, columnCount, gap }}>
      <PanelistControlsContext.Provider value={{ setBaseSize, addPanel, removePanel }}>
        {children}
      </PanelistControlsContext.Provider>
    </PanelistStateContext.Provider>
  );
}

export function usePanelistState() {
  const context = useContext(PanelistStateContext);
  if (!context) {
    throw new Error("usePanelistState must be used within a PanelistProvider");
  }
  return context;
}

export function usePanelistControls() {
  const context = useContext(PanelistControlsContext);
  if (!context) {
    throw new Error("usePanelistControls must be used within a PanelistProvider");
  }
  return context;
}
