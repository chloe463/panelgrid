import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { PanelGridProvider } from "../../PanelGridProvider";
import { PanelGridRenderer } from "../../PanelGridRenderer";
import type { PanelCoordinate } from "../../types";
import { PanelContent } from "../PanelContent";
import "./dark-mode.css";

const meta: Meta<typeof PanelGridProvider> = {
  title: "Appendix/Dark Mode",
  component: PanelGridProvider,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Demonstrates how to style PanelGrid for dark mode using CSS. PanelGrid uses non-scoped CSS classes with the `panelgrid-` prefix, making it easy to override styles for different themes.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const panels: PanelCoordinate[] = [
  { id: 1, x: 0, y: 0, w: 2, h: 2 },
  { id: 2, x: 2, y: 0, w: 2, h: 2 },
  { id: 3, x: 4, y: 0, w: 2, h: 1 },
  { id: 4, x: 0, y: 2, w: 1, h: 1 },
  { id: 5, x: 1, y: 2, w: 1, h: 1 },
  { id: 6, x: 2, y: 2, w: 2, h: 1 },
];

export const DarkModeExample: Story = {
  render: () => (
    <div className="dark-mode-container">
      <h1 style={{ marginBottom: "20px", color: "#fff" }}>Dark Mode Grid</h1>
      <p style={{ marginBottom: "20px", color: "#aaa" }}>
        Custom dark theme styling for PanelGrid. All styles are applied via CSS classes and can be easily customized.
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
  ),
};

export const ThemeToggle: Story = {
  render: () => {
    const [isDark, setIsDark] = useState(false);

    return (
      <div className={isDark ? "dark-mode-container" : "light-mode-container"}>
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
          <h1 style={{ margin: 0, color: isDark ? "#fff" : "#000" }}>Theme Toggle Example</h1>
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: isDark ? "#4a5568" : "#e2e8f0",
              color: isDark ? "#fff" : "#000",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {isDark ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
        <p style={{ marginBottom: "20px", color: isDark ? "#aaa" : "#666" }}>
          Click the button above to toggle between light and dark themes. Notice how all panel styling updates
          seamlessly.
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

export const PrefersDarkMode: Story = {
  render: () => (
    <div className="prefers-dark-mode-container">
      <h1 style={{ marginBottom: "20px" }}>System Preference Dark Mode</h1>
      <p style={{ marginBottom: "20px" }}>
        This example uses <code>prefers-color-scheme: dark</code> media query to automatically adapt to your system's
        theme preference. Change your system theme to see it update!
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
  ),
};
