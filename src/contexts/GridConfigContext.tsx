import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

interface GridConfig {
  columnCount: number;
  gap: number;
  baseSize: number;
}

interface GridConfigControls {
  setBaseSize: (baseSize: number) => void;
}

const GridConfigContext = createContext<GridConfig | null>(null);
const GridConfigControlContext = createContext<GridConfigControls | null>(null);

interface GridConfigProviderProps {
  columnCount: number;
  gap: number;
  baseSize?: number;
  children: ReactNode;
}

export function GridConfigProvider(props: GridConfigProviderProps) {
  const { columnCount, gap, baseSize: initialBaseSize = 80, children } = props;
  const [baseSize, setBaseSizeState] = useState(initialBaseSize);

  const setBaseSize = useCallback((newBaseSize: number) => {
    setBaseSizeState(newBaseSize);
  }, []);

  return (
    <GridConfigContext.Provider value={{ columnCount, gap, baseSize }}>
      <GridConfigControlContext.Provider value={{ setBaseSize }}>{children}</GridConfigControlContext.Provider>
    </GridConfigContext.Provider>
  );
}

export function useGridConfig() {
  const context = useContext(GridConfigContext);
  if (!context) {
    throw new Error("useGridConfig must be used within GridConfigProvider");
  }
  return context;
}

export function useGridConfigControls() {
  const context = useContext(GridConfigControlContext);
  if (!context) {
    throw new Error("useGridConfigControls must be used within GridConfigProvider");
  }
  return context;
}
