import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { PanelId } from "../PanelistProvider";

interface GhostPanel {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DragState {
  ghostPanel: GhostPanel | null;
  activePanelId: PanelId | null;
}

interface DragStateControls {
  setGhostPanel: (panelId: PanelId, x: number, y: number, w: number, h: number) => void;
  clearGhostPanel: () => void;
}

const DragStateContext = createContext<DragState | null>(null);
const DragStateControlContext = createContext<DragStateControls | null>(null);

interface DragStateProviderProps {
  children: ReactNode;
}

export function DragStateProvider(props: DragStateProviderProps) {
  const [ghostPanel, setGhostPanelState] = useState<GhostPanel | null>(null);
  const [activePanelId, setActivePanelId] = useState<PanelId | null>(null);

  const setGhostPanel = useCallback((panelId: PanelId, x: number, y: number, w: number, h: number) => {
    setActivePanelId(panelId);
    setGhostPanelState({ x, y, w, h });
  }, []);

  const clearGhostPanel = useCallback(() => {
    setActivePanelId(null);
    setGhostPanelState(null);
  }, []);

  return (
    <DragStateContext.Provider value={{ ghostPanel, activePanelId }}>
      <DragStateControlContext.Provider value={{ setGhostPanel, clearGhostPanel }}>
        {props.children}
      </DragStateControlContext.Provider>
    </DragStateContext.Provider>
  );
}

export function useDragState() {
  const context = useContext(DragStateContext);
  if (!context) {
    throw new Error("useDragState must be used within DragStateProvider");
  }
  return context;
}

export function useDragStateControls() {
  const context = useContext(DragStateControlContext);
  if (!context) {
    throw new Error("useDragStateControls must be used within DragStateProvider");
  }
  return context;
}
