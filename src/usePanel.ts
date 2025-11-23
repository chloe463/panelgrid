import { usePanelGridState } from "./PanelGridProvider";
import type { PanelId } from "./types";

interface UsePanelOptions {
  id: PanelId;
}

export function usePanel({ id }: UsePanelOptions) {
  const { panelMap } = usePanelGridState();
  return panelMap.get(id);
}
