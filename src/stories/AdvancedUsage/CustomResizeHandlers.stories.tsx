import type { Meta, StoryObj } from "@storybook/react-vite";
import { PanelGridProvider } from "../../PanelGridProvider";
import { PanelGridRenderer } from "../../PanelGridRenderer";
import type { PanelCoordinate } from "../../types";
import { PanelContent } from "../PanelContent";

const meta: Meta<typeof PanelGridProvider> = {
  title: "Advanced Usage/Custom Resize Handlers",
  component: PanelGridProvider,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Customize which resize handles appear on panels. By default, only the bottom-right (se) handle is enabled. You can enable handles on all 8 positions: corners (nw, ne, se, sw) and edges (n, e, s, w).",
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

export const AllCornerHandles: Story = {
  render: () => (
    <div style={{ padding: "20px", height: "100vh" }}>
      <h1 style={{ marginBottom: "20px" }}>All Corner Resize Handles</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        Panels can be resized from any corner. This provides maximum flexibility for resizing in any direction.
      </p>
      <PanelGridProvider
        panels={defaultPanels}
        columnCount={6}
        gap={8}
        resizeHandlePositions={["nw", "ne", "se", "sw"]}
      >
        <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
      </PanelGridProvider>
    </div>
  ),
};

export const AllEdgeHandles: Story = {
  render: () => (
    <div style={{ padding: "20px", height: "100vh" }}>
      <h1 style={{ marginBottom: "20px" }}>All Edge Resize Handles</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        Panels can be resized from the middle of each edge (north, east, south, west). Useful for single-direction
        resizing.
      </p>
      <PanelGridProvider panels={defaultPanels} columnCount={6} gap={8} resizeHandlePositions={["n", "e", "s", "w"]}>
        <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
      </PanelGridProvider>
    </div>
  ),
};

export const AllHandles: Story = {
  render: () => (
    <div style={{ padding: "20px", height: "100vh" }}>
      <h1 style={{ marginBottom: "20px" }}>All Resize Handles (8 Positions)</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        Enable all 8 resize handles - 4 corners and 4 edges. This gives users complete control over panel resizing from
        any direction.
      </p>
      <PanelGridProvider
        panels={defaultPanels}
        columnCount={6}
        gap={8}
        resizeHandlePositions={["n", "ne", "e", "se", "s", "sw", "w", "nw"]}
      >
        <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
      </PanelGridProvider>
    </div>
  ),
};

export const HorizontalResizeOnly: Story = {
  render: () => (
    <div style={{ padding: "20px", height: "100vh" }}>
      <h1 style={{ marginBottom: "20px" }}>Horizontal Resize Only</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        Limit resizing to horizontal direction only using east and west edge handles. Useful when you want to maintain
        consistent row heights.
      </p>
      <PanelGridProvider panels={defaultPanels} columnCount={6} gap={8} resizeHandlePositions={["e", "w"]}>
        <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
      </PanelGridProvider>
    </div>
  ),
};

export const VerticalResizeOnly: Story = {
  render: () => (
    <div style={{ padding: "20px", height: "100vh" }}>
      <h1 style={{ marginBottom: "20px" }}>Vertical Resize Only</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        Limit resizing to vertical direction only using north and south edge handles. Useful when you want to maintain
        consistent column widths.
      </p>
      <PanelGridProvider panels={defaultPanels} columnCount={6} gap={8} resizeHandlePositions={["n", "s"]}>
        <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
      </PanelGridProvider>
    </div>
  ),
};

export const BottomRightOnly: Story = {
  render: () => (
    <div style={{ padding: "20px", height: "100vh" }}>
      <h1 style={{ marginBottom: "20px" }}>Bottom-Right Handle Only (Default)</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        This is the default behavior with only the bottom-right (southeast) corner handle. This is the most common and
        intuitive resize pattern.
      </p>
      <PanelGridProvider panels={defaultPanels} columnCount={6} gap={8} resizeHandlePositions={["se"]}>
        <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
      </PanelGridProvider>
    </div>
  ),
};

export const DiagonalHandles: Story = {
  render: () => (
    <div style={{ padding: "20px", height: "100vh" }}>
      <h1 style={{ marginBottom: "20px" }}>Diagonal Handles (NE & SW)</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        Use only opposite diagonal corners for a unique resize experience. This example shows northeast and southwest
        handles.
      </p>
      <PanelGridProvider panels={defaultPanels} columnCount={6} gap={8} resizeHandlePositions={["ne", "sw"]}>
        <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
      </PanelGridProvider>
    </div>
  ),
};

export const BottomHandles: Story = {
  render: () => (
    <div style={{ padding: "20px", height: "100vh" }}>
      <h1 style={{ marginBottom: "20px" }}>Bottom Handles Only</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        Enable only the bottom edge and corner handles (south, southeast, southwest). Useful for layouts where panels
        should only expand downward.
      </p>
      <PanelGridProvider panels={defaultPanels} columnCount={6} gap={8} resizeHandlePositions={["sw", "s", "se"]}>
        <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
      </PanelGridProvider>
    </div>
  ),
};

export const RightHandles: Story = {
  render: () => (
    <div style={{ padding: "20px", height: "100vh" }}>
      <h1 style={{ marginBottom: "20px" }}>Right Handles Only</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        Enable only the right edge and corner handles (northeast, east, southeast). Useful for left-to-right layouts
        where panels should only expand rightward.
      </p>
      <PanelGridProvider panels={defaultPanels} columnCount={6} gap={8} resizeHandlePositions={["ne", "e", "se"]}>
        <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
      </PanelGridProvider>
    </div>
  ),
};

export const SingleEdgeHandle: Story = {
  render: () => (
    <div style={{ padding: "20px", height: "100vh" }}>
      <h1 style={{ marginBottom: "20px" }}>Single Edge Handle (South)</h1>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        Use a single edge handle for unidirectional resizing. This example shows only the south (bottom) edge handle for
        vertical-only expansion downward.
      </p>
      <PanelGridProvider panels={defaultPanels} columnCount={6} gap={8} resizeHandlePositions={["s"]}>
        <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
      </PanelGridProvider>
    </div>
  ),
};
