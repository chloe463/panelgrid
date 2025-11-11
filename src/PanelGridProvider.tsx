import { createContext, useContext, useState } from "react";
import type { PanelCoordinate, PanelId, RearrangementFunction } from "./types";
import { usePanelGrid } from "./usePanelGrid";

type PanelGridState = ReturnType<typeof usePanelGrid>;

interface PanelGridContextType {
  panels: PanelGridState["panels"];
  baseSize: number | null;
  columnCount: number;
  gap: number;
  ghostPanelRef: React.RefObject<HTMLDivElement | null>;
}

interface PanelGridControlsContextType {
  setBaseSize: (baseSize: number) => void;
  addPanel: (panel: Partial<PanelCoordinate>) => void;
  removePanel: (id: PanelId) => void;
  exportState: () => PanelCoordinate[];
}

const PanelGridStateContext = createContext<PanelGridContextType | undefined>(undefined);
const PanelGridControlsContext = createContext<PanelGridControlsContextType | undefined>(undefined);

interface PanelGridProviderProps {
  panels: PanelCoordinate[];
  columnCount: number;
  gap: number;
  children: React.ReactNode;
  /**
   * Optional custom rearrangement function to override default collision resolution logic
   * If provided, this function will be called instead of the default rearrangePanels
   */
  rearrangement?: RearrangementFunction;
}

export function PanelGridProvider({
  panels: initialPanels,
  columnCount,
  gap,
  children,
  rearrangement,
}: PanelGridProviderProps) {
  const [baseSize, setBaseSize] = useState<number | null>(null);

  const { panels, addPanel, removePanel, exportState, ghostPanelRef } = usePanelGrid({
    panels: initialPanels,
    columnCount,
    baseSize: baseSize || 256,
    gap,
    rearrangement,
  });

  return (
    <PanelGridStateContext.Provider value={{ panels, columnCount, gap, baseSize, ghostPanelRef }}>
      <PanelGridControlsContext.Provider value={{ setBaseSize, addPanel, removePanel, exportState }}>
        {children}
      </PanelGridControlsContext.Provider>
    </PanelGridStateContext.Provider>
  );
}

export function usePanelGridState() {
  const context = useContext(PanelGridStateContext);
  if (!context) {
    throw new Error("usePanelGridState must be used within a PanelGridProvider");
  }
  return context;
}

export function usePanelGridControls() {
  const context = useContext(PanelGridControlsContext);
  if (!context) {
    throw new Error("usePanelGridControls must be used within a PanelGridProvider");
  }
  return context;
}
