import { configureAxe, toHaveNoViolations } from "jest-axe";
import { expect } from "vitest";

expect.extend(toHaveNoViolations);

export const axe = configureAxe({
  rules: {
    region: { enabled: false },
  },
});
