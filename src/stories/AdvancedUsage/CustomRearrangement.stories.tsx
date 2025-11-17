import type { Meta, StoryObj } from "@storybook/react-vite";
import { PanelGridProvider } from "../../PanelGridProvider";
import { PanelGridRenderer } from "../../PanelGridRenderer";
import type { PanelCoordinate } from "../../types";
import { PanelContent } from "../PanelContent";

const meta: Meta<typeof PanelGridProvider> = {
  title: "PanelGrid/Advanced Usage/Custom Rearrangement",
  component: PanelGridProvider,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Demonstrates how to customize the collision resolution algorithm by passing a custom `rearrangement` function to PanelGridProvider. The default algorithm pushes panels horizontally first, then vertically. You can override this behavior to implement vertical-first movement, disable rearrangement entirely, or create your own custom logic.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultAlgorithm: Story = {
  render: () => {
    const panels: PanelCoordinate[] = [
      { id: 1, x: 0, y: 0, w: 2, h: 2 },
      { id: 2, x: 2, y: 0, w: 2, h: 2 },
      { id: 3, x: 4, y: 0, w: 2, h: 2 },
    ];

    return (
      <div style={{ padding: "20px", height: "100vh", backgroundColor: "#fafafa" }}>
        <h1 style={{ marginBottom: "20px" }}>Default Rearrangement Algorithm</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          The default algorithm uses a BFS (Breadth-First Search) approach:
          <br />
          <br />
          1. Detect collision with the moving panel
          <br />
          2. Try to push colliding panel horizontally (to the right)
          <br />
          3. If horizontal push would exceed grid boundary, push vertically (down)
          <br />
          4. Check for locked panels and route around them
          <br />
          5. Recursively handle cascading collisions
          <br />
          <br />
          Try dragging Panel 1 to the right to see Panel 2 and 3 pushed horizontally.
        </p>
        <PanelGridProvider panels={panels} columnCount={6} gap={8}>
          <PanelGridRenderer itemRenderer={({ id }) => <PanelContent id={id} showRemoveButton={false} />} />
        </PanelGridProvider>
      </div>
    );
  },
};

export const VerticalPriorityAlgorithm: Story = {
  render: () => {
    const panels: PanelCoordinate[] = [
      { id: 1, x: 0, y: 0, w: 2, h: 2 },
      { id: 2, x: 2, y: 0, w: 2, h: 2 },
      { id: 3, x: 4, y: 0, w: 2, h: 2 },
    ];

    // Custom rearrangement function that prioritizes vertical movement
    const customRearrangement = (
      movingPanel: PanelCoordinate,
      allPanels: PanelCoordinate[],
      _columnCount: number
    ): PanelCoordinate[] => {
      const result = [...allPanels];
      const movedIndex = result.findIndex((p) => p.id === movingPanel.id);
      if (movedIndex !== -1) {
        result[movedIndex] = movingPanel;
      }

      // Simple vertical-first collision resolution
      const hasCollision = (p1: PanelCoordinate, p2: PanelCoordinate) => {
        return !(p1.x + p1.w <= p2.x || p2.x + p2.w <= p1.x || p1.y + p1.h <= p2.y || p2.y + p2.h <= p1.y);
      };

      // Check for collisions and push down
      for (let i = 0; i < result.length; i++) {
        if (result[i].id === movingPanel.id) continue;

        if (hasCollision(movingPanel, result[i])) {
          // Push down instead of right
          result[i] = {
            ...result[i],
            y: movingPanel.y + movingPanel.h,
          };
        }
      }

      return result;
    };

    return (
      <div style={{ padding: "20px", height: "100vh", backgroundColor: "#fafafa" }}>
        <h1 style={{ marginBottom: "20px" }}>Custom: Vertical-Priority Algorithm</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          This custom algorithm pushes panels down instead of to the right:
          <br />
          <br />
          Try dragging Panel 1 to the right - Panel 2 will move down instead of being pushed horizontally.
          <br />
          <br />
          <strong>Code Example:</strong>
        </p>
        <pre
          style={{
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            fontSize: "12px",
            overflow: "auto",
            marginBottom: "20px",
          }}
        >
          {`const customRearrangement = (movingPanel, allPanels) => {
  // Detect collisions
  for (let panel of allPanels) {
    if (hasCollision(movingPanel, panel)) {
      // Push down instead of right
      panel.y = movingPanel.y + movingPanel.h;
    }
  }
  return allPanels;
};

<PanelGridProvider
  panels={panels}
  rearrangement={customRearrangement}
/>`}
        </pre>
        <PanelGridProvider panels={panels} columnCount={6} gap={8} rearrangement={customRearrangement}>
          <PanelGridRenderer itemRenderer={({ id }) => <PanelContent id={id} showRemoveButton={false} />} />
        </PanelGridProvider>
      </div>
    );
  },
};

export const NoRearrangementAlgorithm: Story = {
  render: () => {
    const panels: PanelCoordinate[] = [
      { id: 1, x: 0, y: 0, w: 2, h: 2 },
      { id: 2, x: 2, y: 0, w: 2, h: 2 },
      { id: 3, x: 4, y: 0, w: 2, h: 2 },
    ];

    // Custom rearrangement that doesn't move other panels
    const noRearrangement = (movingPanel: PanelCoordinate, allPanels: PanelCoordinate[]): PanelCoordinate[] => {
      const result = [...allPanels];
      const movedIndex = result.findIndex((p) => p.id === movingPanel.id);
      if (movedIndex !== -1) {
        result[movedIndex] = movingPanel;
      }
      return result;
    };

    return (
      <div style={{ padding: "20px", height: "100vh", backgroundColor: "#fafafa" }}>
        <h1 style={{ marginBottom: "20px" }}>Custom: No Automatic Rearrangement</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          This custom algorithm disables automatic collision resolution entirely:
          <br />
          <br />
          Panels can overlap - useful for cases where you want manual control or have your own collision handling logic.
          <br />
          <br />
          Try dragging Panel 1 over Panel 2 - they will overlap.
        </p>
        <PanelGridProvider panels={panels} columnCount={6} gap={8} rearrangement={noRearrangement}>
          <PanelGridRenderer itemRenderer={({ id }) => <PanelContent id={id} showRemoveButton={false} />} />
        </PanelGridProvider>
      </div>
    );
  },
};
