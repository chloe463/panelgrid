"use client";
import { usePanel, usePanelGridControls } from "../index";
import type { PanelId } from "../types";
import "./styles.css";

interface PanelContentProps {
  id: PanelId;
  showLockButton?: boolean;
  showRemoveButton?: boolean;
}

export function PanelContent({ id, showLockButton = false, showRemoveButton = true }: PanelContentProps) {
  const { removePanel, lockPanelSize, unlockPanelSize } = usePanelGridControls();
  const panel = usePanel({ id });
  const { lockSize } = panel || {};

  return (
    <div className="panel-content">
      <div className="panel-controls">
        {showRemoveButton && (
          <button type="button" onClick={() => removePanel(id)} className="panel-remove-button">
            ×
          </button>
        )}
      </div>
      <div className="panel-title">Panel {id}</div>
      {showLockButton && (
        <>
          <div className="panel-lock-status">
            <div className="panel-badge panel-badge--size-locked">
              <label>
                <input
                  type="checkbox"
                  checked={lockSize}
                  className="panel-lock-checkbox"
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.currentTarget.checked) {
                      lockPanelSize(id);
                    } else {
                      unlockPanelSize(id);
                    }
                  }}
                />
                {lockSize ? "🔒 Size Locked" : "🔓 Size Unlocked"}
              </label>
            </div>
            {!lockSize && <div className="panel-hint">Drag to move • Resize from corner</div>}
          </div>
        </>
      )}
    </div>
  );
}
