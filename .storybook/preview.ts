import type { Preview } from "@storybook/react-vite";
import "../src/styles.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          "Introduction",
          "Basic Usage",
          "Advanced Usage",
          ["Size Locked Panels", "Custom Rearrangement"],
          "Appendix",
          ["Heavy Calculation Panels"],
        ],
      },
    },
  },
};

export default preview;
