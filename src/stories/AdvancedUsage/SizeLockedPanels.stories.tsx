import type { Meta, StoryObj } from "@storybook/react-vite";
import { PanelGridProvider } from "../../PanelGridProvider";
import { PanelGridRenderer } from "../../PanelGridRenderer";
import type { PanelCoordinate } from "../../types";
import { PanelContent } from "../PanelContent";

const meta: Meta<typeof PanelGridProvider> = {
  title: "PanelGrid/Advanced Usage/Size Locked Panels",
  component: PanelGridProvider,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Panels with `lockSize: true` cannot be resized by users. They can still be moved, but the resize handle is hidden. This is useful for panels that should maintain a fixed size, such as toolbars, headers, or widgets with specific dimensions.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SizeLockedPanels: Story = {
  render: () => {
    const panels: PanelCoordinate[] = [
      { id: 1, x: 0, y: 0, w: 2, h: 2 },
      { id: 2, x: 2, y: 0, w: 2, h: 2, lockSize: true },
      { id: 3, x: 4, y: 0, w: 2, h: 2 },
    ];

    return (
      <div style={{ padding: "20px", height: "100vh", backgroundColor: "#fafafa" }}>
        <h1 style={{ marginBottom: "20px" }}>Lock Size Feature</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          Panel 2 (middle) has <code>lockSize: true</code>. Notice it has no resize handle and cannot be resized. It can
          still be moved by dragging.
        </p>
        <PanelGridProvider panels={panels} columnCount={6} gap={8}>
          <PanelGridRenderer
            itemRenderer={({ id }) => {
              const panel = panels.find((p) => p.id === id);
              return <PanelContent id={id} lockSize={panel?.lockSize} />;
            }}
          />
        </PanelGridProvider>
      </div>
    );
  },
};

export const MixedSizeLocking: Story = {
  render: () => {
    const panels: PanelCoordinate[] = [
      { id: 1, x: 0, y: 0, w: 2, h: 2 },
      { id: 2, x: 2, y: 0, w: 2, h: 1, lockSize: true },
      { id: 3, x: 4, y: 0, w: 2, h: 1 },
      { id: 4, x: 0, y: 2, w: 1, h: 1, lockSize: true },
      { id: 5, x: 1, y: 2, w: 1, h: 1 },
      { id: 6, x: 2, y: 1, w: 2, h: 1, lockSize: true },
    ];

    return (
      <div style={{ padding: "20px", height: "100vh", backgroundColor: "#fafafa" }}>
        <h1 style={{ marginBottom: "20px" }}>Mixed Size Locking</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          A grid with both size-locked and unlocked panels. Panels 2, 4, and 6 have locked sizes.
        </p>
        <PanelGridProvider panels={panels} columnCount={6} gap={8}>
          <PanelGridRenderer
            itemRenderer={({ id }) => {
              const panel = panels.find((p) => p.id === id);
              return <PanelContent id={id} lockSize={panel?.lockSize} />;
            }}
          />
        </PanelGridProvider>
      </div>
    );
  },
};
