import { createContext, useCallback, useContext, useReducer } from "react";
import type { ReactNode } from "react";
import { rearrangePanels } from "./helpers/rearrangement";

export type PanelId = number | string;

interface PanelCoordinate {
  id: PanelId;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface GhostPanel {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Panelist {
  columnCount: number;
  gap: number;
  baseSize: number;
  panels: PanelCoordinate[];
  ghostPanel: GhostPanel | null;
  activePanelId: PanelId | null;
}

const PanelistStateContext = createContext<Panelist>({
  columnCount: 4,
  gap: 8,
  baseSize: 80,
  panels: [],
  ghostPanel: null,
  activePanelId: null,
});

interface PanelistControls {
  addPanel: () => void;
  resizePanel: (id: PanelId, w: number, h: number) => void;
  movePanel: (id: PanelId, x: number, y: number) => void;
  removePanel: (id: PanelId) => void;
  movingPanel: (id: PanelId, x: number, y: number) => void;
  resizingPanel: (id: PanelId, w: number, h: number) => void;
  setBaseSize: (baseSize: number) => void;
}

const PanelistControlContext = createContext<PanelistControls>({
  addPanel: () => void 0,
  removePanel: (_id: PanelId) => void 0,
  resizePanel: (_id: PanelId, _w: number, _h: number) => void 0,
  movePanel: (_id: PanelId, _x: number, _y: number) => void 0,
  movingPanel: (_id: PanelId, _x: number, _y: number) => void 0,
  resizingPanel: (_id: PanelId, _w: number, _h: number) => void 0,
  setBaseSize: (_baseSize: number) => void 0,
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
      type: "RESIZE_PANEL";
      id: PanelId;
      w: number;
      h: number;
    }
  | {
      type: "MOVE_PANEL";
      id: PanelId;
      x: number;
      y: number;
    }
  | {
      type: "MOVING_PANEL";
      id: PanelId;
      x: number;
      y: number;
    }
  | {
      type: "RESIZING_PANEL";
      id: PanelId;
      w: number;
      h: number;
    }
  | {
      type: "SET_BASE_SIZE";
      baseSize: number;
    };

const INITIAL_STATE: Panelist = {
  columnCount: 4,
  gap: 8,
  baseSize: 80,
  panels: [],
  ghostPanel: null,
  activePanelId: null,
};

function panelistReducer(state: Panelist, action: Action): Panelist {
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
      const rearrangedPanels = rearrangePanels(resizedPanel, state.panels, state.columnCount);

      return {
        ...state,
        panels: rearrangedPanels,
        ghostPanel: null,
        activePanelId: null,
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
      const rearrangedPanels = rearrangePanels(movedPanel, state.panels, state.columnCount);

      return {
        ...state,
        panels: rearrangedPanels,
        ghostPanel: null,
        activePanelId: null,
      };
    }
    case "MOVING_PANEL": {
      const movingPanel = state.panels.find((panel) => panel.id === action.id);
      if (!movingPanel) return state;
      return {
        ...state,
        activePanelId: action.id,
        ghostPanel: {
          x: action.x,
          y: action.y,
          w: movingPanel.w,
          h: movingPanel.h,
        },
      };
    }
    case "RESIZING_PANEL": {
      const movingPanel = state.panels.find((panel) => panel.id === action.id);
      if (!movingPanel) return state;
      return {
        ...state,
        activePanelId: action.id,
        ghostPanel: {
          x: movingPanel.x,
          y: movingPanel.y,
          w: action.w,
          h: action.h,
        },
      };
    }
    case "SET_BASE_SIZE": {
      return {
        ...state,
        baseSize: action.baseSize,
      };
    }
  }
}

interface PanelistProviderProps {
  columnCount: number;
  gap: number;
  panelCoordinates?: PanelCoordinate[];
  children: ReactNode;
}

export function PanelistProvider(props: PanelistProviderProps) {
  const initialState: typeof INITIAL_STATE = {
    ...INITIAL_STATE,
    columnCount: props.columnCount,
    gap: props.gap,
    panels: props.panelCoordinates || [],
  };
  const [state, dispatch] = useReducer(panelistReducer, initialState);

  const addPanel = useCallback(() => dispatch({ type: "ADD_PANEL" }), []);
  const removePanel = useCallback((id: PanelId) => dispatch({ type: "REMOVE_PANEL", id }), []);
  const resizePanel = useCallback(
    (id: PanelId, w: number, h: number) => dispatch({ type: "RESIZE_PANEL", id, w, h }),
    []
  );
  const movePanel = useCallback((id: PanelId, x: number, y: number) => dispatch({ type: "MOVE_PANEL", id, x, y }), []);

  const movingPanel = useCallback(
    (id: PanelId, x: number, y: number) => dispatch({ type: "MOVING_PANEL", id, x, y }),
    []
  );
  const resizingPanel = useCallback(
    (id: PanelId, w: number, h: number) => dispatch({ type: "RESIZING_PANEL", id, w, h }),
    []
  );

  const setBaseSize = useCallback((baseSize: number) => dispatch({ type: "SET_BASE_SIZE", baseSize }), []);

  return (
    <PanelistStateContext.Provider value={state}>
      <PanelistControlContext.Provider
        value={{
          addPanel,
          removePanel,
          resizePanel,
          movePanel,
          movingPanel,
          resizingPanel,
          setBaseSize,
        }}
      >
        {props.children}
      </PanelistControlContext.Provider>
    </PanelistStateContext.Provider>
  );
}

export function usePanelState() {
  const context = useContext(PanelistStateContext);
  if (!context) {
    throw new Error("usePanelState must be used in PanelistProvider");
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
