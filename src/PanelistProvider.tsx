import { createContext, useContext, useState } from "react";
import type { PanelCoordinate, PanelId } from "./types";
import { usePanelist } from "./usePanelist";

type PanelistState = ReturnType<typeof usePanelist>;

interface PanelistContextType {
  panels: PanelistState["panels"];
  baseSize: number | null;
  columnCount: number;
  gap: number;
  ghostPanelRef: React.RefObject<HTMLDivElement | null>;
}

interface PanelistControlsContextType {
  setBaseSize: (baseSize: number) => void;
  addPanel: (panel: Partial<PanelCoordinate>) => void;
  removePanel: (id: PanelId) => void;
  exportState: () => PanelCoordinate[];
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
  const [baseSize, setBaseSize] = useState<number | null>(null);

  const { panels, addPanel, removePanel, exportState, ghostPanelRef } = usePanelist({
    panels: initialPanels,
    columnCount,
    baseSize: baseSize || 256,
    gap,
  });

  return (
    <PanelistStateContext.Provider value={{ panels, columnCount, gap, baseSize, ghostPanelRef }}>
      <PanelistControlsContext.Provider value={{ setBaseSize, addPanel, removePanel, exportState }}>
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
