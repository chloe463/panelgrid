import type { Meta, StoryObj } from "@storybook/react-vite";
import { PanelGridProvider } from "../PanelGridProvider";
import { PanelGridRenderer } from "../PanelGridRenderer";
import type { PanelCoordinate } from "../types";
import { PanelContent } from "./PanelContent";

const meta: Meta<typeof PanelGridProvider> = {
  title: "PanelGrid/Basic Usage",
  component: PanelGridProvider,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The basic PanelGrid component with drag-and-drop and resize capabilities. Panels can be freely moved and resized within the grid boundaries.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultPanels: PanelCoordinate[] = [
  { id: 1, x: 0, y: 0, w: 2, h: 2 },
  { id: 2, x: 2, y: 0, w: 2, h: 2 },
  { id: 3, x: 4, y: 0, w: 2, h: 1 },
  { id: 4, x: 0, y: 2, w: 1, h: 1 },
  { id: 5, x: 1, y: 2, w: 1, h: 1 },
  { id: 6, x: 2, y: 2, w: 2, h: 1 },
];

export const Default: Story = {
  render: () => (
    <div style={{ padding: "20px", height: "100vh", backgroundColor: "#fafafa" }}>
      <h1 style={{ marginBottom: "20px" }}>PanelGrid - Basic Example</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        Try dragging panels to move them or use the resize handle in the bottom-right corner to resize them. Panels will
        automatically rearrange to avoid collisions.
      </p>
      <PanelGridProvider panels={defaultPanels} columnCount={6} gap={8}>
        <PanelGridRenderer itemRenderer={({ id }) => <PanelContent id={id} />} />
      </PanelGridProvider>
    </div>
  ),
};

export const SixColumnGrid: Story = {
  render: () => (
    <div style={{ padding: "20px", height: "100vh", backgroundColor: "#fafafa" }}>
      <h1 style={{ marginBottom: "20px" }}>6-Column Grid Layout</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        A standard 6-column grid with various panel sizes. This is the recommended configuration for most use cases.
      </p>
      <PanelGridProvider panels={defaultPanels} columnCount={6} gap={8}>
        <PanelGridRenderer itemRenderer={({ id }) => <PanelContent id={id} />} />
      </PanelGridProvider>
    </div>
  ),
};

export const TwelveColumnGrid: Story = {
  render: () => {
    const panels: PanelCoordinate[] = [
      { id: 1, x: 0, y: 0, w: 3, h: 2 },
      { id: 2, x: 3, y: 0, w: 3, h: 2 },
      { id: 3, x: 6, y: 0, w: 3, h: 2 },
      { id: 4, x: 9, y: 0, w: 3, h: 2 },
      { id: 5, x: 0, y: 2, w: 4, h: 1 },
      { id: 6, x: 4, y: 2, w: 4, h: 1 },
      { id: 7, x: 8, y: 2, w: 4, h: 1 },
    ];

    return (
      <div style={{ padding: "20px", height: "100vh", backgroundColor: "#fafafa" }}>
        <h1 style={{ marginBottom: "20px" }}>12-Column Grid Layout</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          A finer 12-column grid allows for more flexible layouts. Useful for complex dashboards.
        </p>
        <PanelGridProvider panels={panels} columnCount={12} gap={8}>
          <PanelGridRenderer itemRenderer={({ id }) => <PanelContent id={id} />} />
        </PanelGridProvider>
      </div>
    );
  },
};

export const CustomGap: Story = {
  render: () => (
    <div style={{ padding: "20px", height: "100vh", backgroundColor: "#fafafa" }}>
      <h1 style={{ marginBottom: "20px" }}>Custom Gap Size</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        Gap between panels can be customized. This example uses a 16px gap instead of the default 8px.
      </p>
      <PanelGridProvider panels={defaultPanels} columnCount={6} gap={16}>
        <PanelGridRenderer itemRenderer={({ id }) => <PanelContent id={id} />} />
      </PanelGridProvider>
    </div>
  ),
};

export const MinimalExample: Story = {
  render: () => {
    const panels: PanelCoordinate[] = [
      { id: 1, x: 0, y: 0, w: 2, h: 2 },
      { id: 2, x: 2, y: 0, w: 2, h: 2 },
    ];

    return (
      <div style={{ padding: "20px", height: "100vh", backgroundColor: "#fafafa" }}>
        <h1 style={{ marginBottom: "20px" }}>Minimal Example</h1>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          The simplest possible grid with just two panels. Perfect for getting started.
        </p>
        <PanelGridProvider panels={panels} columnCount={4} gap={8}>
          <PanelGridRenderer itemRenderer={({ id }) => <PanelContent id={id} />} />
        </PanelGridProvider>
      </div>
    );
  },
};
