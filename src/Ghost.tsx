import { usePanelState } from "./PanelistProvider";

export function Ghost() {
  const { ghostPanel, baseSize, gap } = usePanelState();
  if (!ghostPanel) return null;
  return (
    <div
      className="ghost-panel"
      style={{
        position: "absolute",
        left: ghostPanel.x * (baseSize + gap),
        top: ghostPanel.y * (baseSize + gap),
        width: ghostPanel.w * baseSize + (ghostPanel.w - 1) * gap,
        height: ghostPanel.h * baseSize + (ghostPanel.h - 1) * gap,
        pointerEvents: "none",
        borderRadius: "4px",
        outline: "1px dashed rgba(0, 0, 0, 0.2)",
        outlineOffset: "2px",
      }}
    ></div>
  );
}
