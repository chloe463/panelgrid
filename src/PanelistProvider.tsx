import { createContext, useCallback, useContext, useReducer } from "react";
import type { ReactNode } from "react";
import { rearrangePanels } from "./helpers/rearrangement";
import { GridConfigProvider, useGridConfig } from "./contexts/GridConfigContext";
import { DragStateProvider, useDragStateControls } from "./contexts/DragStateContext";

export type PanelId = number | string;

interface PanelCoordinate {
  id: PanelId;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PanelsState {
  panels: PanelCoordinate[];
  activePanelId: PanelId | null;
}

const PanelsStateContext = createContext<PanelsState>({
  panels: [],
  activePanelId: null,
});

interface PanelistControls {
  addPanel: () => void;
  startResizingPanel: (id: PanelId) => void;
  resizePanel: (id: PanelId, w: number, h: number) => void;
  startMovingPanel: (id: PanelId) => void;
  movePanel: (id: PanelId, x: number, y: number) => void;
  removePanel: (id: PanelId) => void;
  movingPanel: (id: PanelId, x: number, y: number) => void;
  resizingPanel: (id: PanelId, w: number, h: number) => void;
}

const PanelistControlContext = createContext<PanelistControls>({
  addPanel: () => void 0,
  removePanel: (_id: PanelId) => void 0,
  startResizingPanel: (_id: PanelId) => void 0,
  resizePanel: (_id: PanelId, _w: number, _h: number) => void 0,
  startMovingPanel: (_id: PanelId) => void 0,
  movePanel: (_id: PanelId, _x: number, _y: number) => void 0,
  movingPanel: (_id: PanelId, _x: number, _y: number) => void 0,
  resizingPanel: (_id: PanelId, _w: number, _h: number) => void 0,
});

type Action =
  | {
      type: "ADD_PANEL";
    }
  | {
      type: "REMOVE_PANEL";
      id: PanelId;
    }
  | {
      type: "START_RESIZING_PANEL";
      id: PanelId;
    }
  | {
      type: "RESIZE_PANEL";
      id: PanelId;
      w: number;
      h: number;
      columnCount: number;
    }
  | {
      type: "START_MOVING_PANEL";
      id: PanelId;
    }
  | {
      type: "MOVE_PANEL";
      id: PanelId;
      x: number;
      y: number;
      columnCount: number;
    };

function panelsReducer(state: PanelsState, action: Action): PanelsState {
  switch (action.type) {
    case "ADD_PANEL": {
      // TODO: 追加するパネルのポジションを計算する
      return {
        ...state,
        panels: [
          ...state.panels,
          {
            id: "panelist-" + Math.random().toString(16).substring(2, 15),
            x: 0,
            y: 0,
            w: 1,
            h: 2,
          },
        ],
      };
    }
    case "REMOVE_PANEL": {
      return {
        ...state,
        panels: state.panels.filter((panel) => panel.id !== action.id),
      };
    }
    case "START_RESIZING_PANEL": {
      return {
        ...state,
        activePanelId: action.id,
      };
    }
    case "RESIZE_PANEL": {
      const index = state.panels.findIndex((panel) => panel.id === action.id);
      if (index === -1) return state;

      // Create the resized panel
      const resizedPanel = {
        ...state.panels[index],
        w: action.w,
        h: action.h,
      };

      // Rearrange panels to resolve any collisions
      const rearrangedPanels = rearrangePanels(resizedPanel, state.panels, action.columnCount);

      return {
        ...state,
        panels: rearrangedPanels,
      };
    }
    case "START_MOVING_PANEL": {
      return {
        ...state,
        activePanelId: action.id,
      };
    }
    case "MOVE_PANEL": {
      const index = state.panels.findIndex((panel) => panel.id === action.id);
      if (index === -1) return state;

      // Create the moved panel
      const movedPanel = {
        ...state.panels[index],
        x: action.x,
        y: action.y,
      };

      // Rearrange panels to resolve any collisions
      const rearrangedPanels = rearrangePanels(movedPanel, state.panels, action.columnCount);

      return {
        ...state,
        panels: rearrangedPanels,
      };
    }
  }
}

interface PanelistProviderProps {
  columnCount: number;
  gap: number;
  baseSize?: number;
  panelCoordinates?: PanelCoordinate[];
  children: ReactNode;
}

function PanelsProvider(props: { panelCoordinates?: PanelCoordinate[]; children: ReactNode }) {
  const initialState: PanelsState = {
    panels: props.panelCoordinates || [],
    activePanelId: null,
  };
  const [state, dispatch] = useReducer(panelsReducer, initialState);
  const { columnCount } = useGridConfig();
  const { setGhostPanel, clearGhostPanel } = useDragStateControls();

  const addPanel = useCallback(() => dispatch({ type: "ADD_PANEL" }), []);
  const removePanel = useCallback((id: PanelId) => dispatch({ type: "REMOVE_PANEL", id }), []);
  const startResizingPanel = useCallback((id: PanelId) => dispatch({ type: "START_RESIZING_PANEL", id }), []);
  const resizePanel = useCallback(
    (id: PanelId, w: number, h: number) => {
      dispatch({ type: "RESIZE_PANEL", id, w, h, columnCount });
      clearGhostPanel();
    },
    [columnCount, clearGhostPanel]
  );
  const movePanel = useCallback(
    (id: PanelId, x: number, y: number) => {
      dispatch({ type: "MOVE_PANEL", id, x, y, columnCount });
      clearGhostPanel();
    },
    [columnCount, clearGhostPanel]
  );

  const startMovingPanel = useCallback((id: PanelId) => dispatch({ type: "START_MOVING_PANEL", id }), []);

  const movingPanel = useCallback(
    (id: PanelId, x: number, y: number) => {
      const panel = state.panels.find((p) => p.id === id);
      if (panel) {
        setGhostPanel(id, x, y, panel.w, panel.h);
      }
    },
    [state.panels, setGhostPanel]
  );

  const resizingPanel = useCallback(
    (id: PanelId, w: number, h: number) => {
      const panel = state.panels.find((p) => p.id === id);
      if (panel) {
        setGhostPanel(id, panel.x, panel.y, w, h);
      }
    },
    [state.panels, setGhostPanel]
  );

  return (
    <PanelsStateContext.Provider value={state}>
      <PanelistControlContext.Provider
        value={{
          addPanel,
          removePanel,
          startResizingPanel,
          resizePanel,
          startMovingPanel,
          movePanel,
          movingPanel,
          resizingPanel,
        }}
      >
        {props.children}
      </PanelistControlContext.Provider>
    </PanelsStateContext.Provider>
  );
}

export function PanelistProvider(props: PanelistProviderProps) {
  return (
    <GridConfigProvider columnCount={props.columnCount} gap={props.gap} baseSize={props.baseSize}>
      <DragStateProvider>
        <PanelsProvider panelCoordinates={props.panelCoordinates}>{props.children}</PanelsProvider>
      </DragStateProvider>
    </GridConfigProvider>
  );
}

export function usePanelsState() {
  const context = useContext(PanelsStateContext);
  if (!context) {
    throw new Error("usePanelsState must be used in PanelistProvider");
  }

  return context;
}

export function usePanelControls() {
  const context = useContext(PanelistControlContext);
  if (!context) {
    throw new Error("usePanelControls must be used in PanelistProvider");
  }

  return context;
}
