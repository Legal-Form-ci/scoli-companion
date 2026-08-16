import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCart } from "./CartContext";

describe("useCart hook", () => {
  it("throws when used outside CartProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useCart());
    }).toThrow("useCart must be used within a CartProvider");
    
    spy.mockRestore();
  });
});
