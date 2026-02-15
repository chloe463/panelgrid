"use client";
import { usePanel, usePanelGridControls } from "../index";
import type { PanelId } from "../types";
import "./styles.css";

interface PanelContentProps {
  id: PanelId;
  showLockButton?: boolean;
  showPositionLockButton?: boolean;
  showRemoveButton?: boolean;
}

export function PanelContent({
  id,
  showLockButton = false,
  showPositionLockButton = false,
  showRemoveButton = true,
}: PanelContentProps) {
  const { removePanel, lockPanelSize, unlockPanelSize, lockPanelPosition, unlockPanelPosition } =
    usePanelGridControls();
  const panel = usePanel({ id });
  const { lockSize, lockPosition } = panel || {};

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
      {(showLockButton || showPositionLockButton) && (
        <div className="panel-lock-status">
          {showLockButton && (
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
          )}
          {showPositionLockButton && (
            <div className="panel-badge panel-badge--position-locked">
              <label>
                <input
                  type="checkbox"
                  checked={lockPosition}
                  className="panel-lock-checkbox"
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (e.currentTarget.checked) {
                      lockPanelPosition(id);
                    } else {
                      unlockPanelPosition(id);
                    }
                  }}
                />
                {lockPosition ? "📌 Position Locked" : "📍 Position Unlocked"}
              </label>
            </div>
          )}
          {!lockSize && !lockPosition && <div className="panel-hint">Drag to move • Resize from corner</div>}
          {lockPosition && <div className="panel-hint">Cannot be moved or pushed</div>}
        </div>
      )}
    </div>
  );
}
