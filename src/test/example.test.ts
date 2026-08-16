import { describe, it, expect } from "vitest";

describe("Scoly platform sanity checks", () => {
  it("should pass basic assertion", () => {
    expect(true).toBe(true);
  });

  it("environment is jsdom", () => {
    expect(typeof document).toBe("object");
    expect(typeof window).toBe("object");
  });

  it("localStorage mock works", () => {
    localStorage.setItem("test-key", "test-value");
    expect(localStorage.getItem("test-key")).toBe("test-value");
    localStorage.removeItem("test-key");
    expect(localStorage.getItem("test-key")).toBeNull();
  });
});
