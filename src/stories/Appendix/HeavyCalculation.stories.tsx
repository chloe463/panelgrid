import type { Meta, StoryObj } from "@storybook/react-vite";
import { PanelGridProvider } from "../../PanelGridProvider";
import { PanelGridRenderer } from "../../PanelGridRenderer";
import type { PanelCoordinate } from "../../types";
import { PanelContent } from "./PanelContentWithHeavyCalc";

const meta: Meta<typeof PanelGridProvider> = {
  title: "Appendix/Heavy Calculation Panels",
  component: PanelGridProvider,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "Demonstrates PanelGrid's performance optimization when panels contain expensive computations.",
          "Each panel performs a heavy calculation (summing 1 million numbers) on every render.",
          "Thanks to direct DOM manipulation during drag and resize operations, panels remain responsive without triggering unnecessary re-renders of the expensive calculations.",
        ].join(" "),
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PerformantDragAndDrop: Story = {
  render: () => {
    const panels: PanelCoordinate[] = [
      { id: 1, x: 0, y: 0, w: 2, h: 2 },
      { id: 2, x: 2, y: 0, w: 2, h: 2 },
      { id: 3, x: 4, y: 0, w: 2, h: 2 },
    ];

    return (
      <div style={{ padding: "20px", height: "100vh" }}>
        <h1 style={{ marginBottom: "20px" }}>Performance with Heavy Calculations</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          Each panel performs an expensive calculation (summing 1 million numbers) on every render. Try dragging and
          resizing panels - notice they remain smooth and responsive. This is because PanelGrid uses direct DOM
          manipulation during interactions, avoiding unnecessary re-renders.
        </p>
        <PanelGridProvider panels={panels} columnCount={6} gap={8}>
          <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
        </PanelGridProvider>
      </div>
    );
  },
};

export const ComplexGridPerformance: Story = {
  render: () => {
    const panels: PanelCoordinate[] = [
      { id: 1, x: 0, y: 0, w: 2, h: 2 },
      { id: 2, x: 2, y: 0, w: 2, h: 1 },
      { id: 3, x: 4, y: 0, w: 2, h: 1 },
      { id: 4, x: 0, y: 2, w: 1, h: 1 },
      { id: 5, x: 1, y: 2, w: 1, h: 1 },
      { id: 6, x: 2, y: 1, w: 2, h: 1 },
    ];

    return (
      <div style={{ padding: "20px", height: "100vh" }}>
        <h1 style={{ marginBottom: "20px" }}>Complex Grid with Heavy Calculations</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          A more complex grid layout with 6 panels, each running expensive calculations on every render. The collision
          resolution system still works smoothly, demonstrating PanelGrid's efficient architecture even with
          computationally intensive panel content.
        </p>
        <PanelGridProvider panels={panels} columnCount={6} gap={8}>
          <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
        </PanelGridProvider>
      </div>
    );
  },
};
