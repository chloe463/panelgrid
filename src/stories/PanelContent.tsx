import { usePanelGridControls } from "../index";
import type { PanelId } from "../types";
import "./styles.css";

interface PanelContentProps {
  id: PanelId;
  showRemoveButton?: boolean;
  lockSize?: boolean;
}

export function PanelContent({ id, showRemoveButton = true, lockSize = false }: PanelContentProps) {
  const { removePanel } = usePanelGridControls();

  return (
    <div className="panel-content">
      {showRemoveButton && (
        <button type="button" onClick={() => removePanel(id)} className="panel-remove-button">
          ×
        </button>
      )}
      <div className="panel-title">Panel {id}</div>
      <div className="panel-lock-status">
        {lockSize && <div className="panel-badge panel-badge--size-locked">🔒 Size Locked</div>}
        {!lockSize && <div className="panel-hint">Drag to move • Resize from corner</div>}
      </div>
    </div>
  );
}
