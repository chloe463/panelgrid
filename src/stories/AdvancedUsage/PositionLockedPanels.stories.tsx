import type { Meta, StoryObj } from "@storybook/react-vite";
import { PanelGridProvider } from "../../PanelGridProvider";
import { PanelGridRenderer } from "../../PanelGridRenderer";
import type { PanelCoordinate } from "../../types";
import { PanelContent } from "../PanelContent";

const meta: Meta<typeof PanelGridProvider> = {
  title: "Advanced Usage/Position Locked Panels",
  component: PanelGridProvider,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Panels with `lockPosition: true` cannot be moved by users and cannot be pushed by other panels during collision resolution. If a move or resize would cause any panel to overlap a locked panel, the entire operation is rolled back to the positions before it started.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PositionLockedPanels: Story = {
  render: () => {
    const panels: PanelCoordinate[] = [
      { id: 1, x: 0, y: 0, w: 2, h: 2 },
      { id: 2, x: 2, y: 0, w: 2, h: 2, lockPosition: true },
      { id: 3, x: 4, y: 0, w: 2, h: 2 },
    ];

    return (
      <div style={{ padding: "20px", height: "100vh" }}>
        <h1 style={{ marginBottom: "20px" }}>Lock Position Feature</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          Panel 2 (middle) has <code>lockPosition: true</code>. It cannot be dragged and will not be pushed when other
          panels collide with it. Try dragging Panel 1 or Panel 3 into the space occupied by Panel 2 — the move will be
          rolled back.
        </p>
        <PanelGridProvider panels={panels} columnCount={6} gap={8}>
          <PanelGridRenderer>
            {function CustomPanel({ id }: { id: number | string }) {
              return <PanelContent id={id} showPositionLockButton />;
            }}
          </PanelGridRenderer>
        </PanelGridProvider>
      </div>
    );
  },
};

export const RollbackOnCollision: Story = {
  render: () => {
    const panels: PanelCoordinate[] = [
      { id: 1, x: 0, y: 0, w: 2, h: 2 },
      { id: 2, x: 2, y: 0, w: 2, h: 2 },
      { id: 3, x: 4, y: 0, w: 2, h: 2, lockPosition: true },
    ];

    return (
      <div style={{ padding: "20px", height: "100vh" }}>
        <h1 style={{ marginBottom: "20px" }}>Rollback on Collision</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          Panel 3 (right) is position-locked. Try dragging Panel 1 all the way to the right — it will push Panel 2,
          which would then collide with locked Panel 3. The entire cascade is rolled back: all panels snap back to their
          original positions.
        </p>
        <PanelGridProvider panels={panels} columnCount={6} gap={8}>
          <PanelGridRenderer>
            {function CustomPanel({ id }: { id: number | string }) {
              return <PanelContent id={id} showPositionLockButton />;
            }}
          </PanelGridRenderer>
        </PanelGridProvider>
      </div>
    );
  },
};

export const InteractiveToggle: Story = {
  render: () => {
    const panels: PanelCoordinate[] = [
      { id: 1, x: 0, y: 0, w: 2, h: 2 },
      { id: 2, x: 2, y: 0, w: 2, h: 2 },
      { id: 3, x: 4, y: 0, w: 2, h: 2 },
      { id: 4, x: 0, y: 2, w: 3, h: 2 },
      { id: 5, x: 3, y: 2, w: 3, h: 2 },
    ];

    return (
      <div style={{ padding: "20px", height: "100vh" }}>
        <h1 style={{ marginBottom: "20px" }}>Interactive Position Lock Toggle</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          Use the checkbox on each panel to toggle <code>lockPosition</code> on and off at runtime. Lock a panel in
          place, then try to move another panel into it to see the rollback behavior.
        </p>
        <PanelGridProvider panels={panels} columnCount={6} gap={8}>
          <PanelGridRenderer>
            {function CustomPanel({ id }: { id: number | string }) {
              return <PanelContent id={id} showPositionLockButton />;
            }}
          </PanelGridRenderer>
        </PanelGridProvider>
      </div>
    );
  },
};

export const CombinedSizeAndPositionLock: Story = {
  render: () => {
    const panels: PanelCoordinate[] = [
      { id: 1, x: 0, y: 0, w: 2, h: 2 },
      { id: 2, x: 2, y: 0, w: 2, h: 2, lockPosition: true },
      { id: 3, x: 4, y: 0, w: 2, h: 2, lockSize: true },
      { id: 4, x: 0, y: 2, w: 2, h: 2, lockPosition: true, lockSize: true },
      { id: 5, x: 2, y: 2, w: 4, h: 2 },
    ];

    return (
      <div style={{ padding: "20px", height: "100vh" }}>
        <h1 style={{ marginBottom: "20px" }}>Combined Size & Position Locking</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          Demonstrates all combinations: Panel 2 is position-locked only, Panel 3 is size-locked only, Panel 4 has both
          locks (fully immovable and fixed size), and Panel 5 is fully free.
        </p>
        <PanelGridProvider panels={panels} columnCount={6} gap={8}>
          <PanelGridRenderer>
            {function CustomPanel({ id }: { id: number | string }) {
              return <PanelContent id={id} showLockButton showPositionLockButton />;
            }}
          </PanelGridRenderer>
        </PanelGridProvider>
      </div>
    );
  },
};
