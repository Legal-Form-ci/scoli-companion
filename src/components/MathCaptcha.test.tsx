import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MathCaptcha from "./MathCaptcha";

describe("MathCaptcha component", () => {
  it("renders the security label", () => {
    render(<MathCaptcha onValidChange={vi.fn()} />);
    expect(screen.getByText("Vérification de sécurité")).toBeInTheDocument();
  });

  it("renders a math challenge with input", () => {
    render(<MathCaptcha onValidChange={vi.fn()} />);
    const input = screen.getByPlaceholderText("?");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "number");
  });

  it("calls onValidChange(false) initially", () => {
    const cb = vi.fn();
    render(<MathCaptcha onValidChange={cb} />);
    // Should be called with false on mount
    expect(cb).toHaveBeenCalledWith(false);
  });

  it("validates correct answer", () => {
    const cb = vi.fn();
    // We mock Math.random to produce predictable values
    const originalRandom = Math.random;
    let callCount = 0;
    Math.random = () => {
      callCount++;
      // First call selects operator index (0 = "+"), second and third produce numbers
      if (callCount === 1) return 0; // "+"
      if (callCount === 2) return 0.5; // num1 = floor(0.5*20)+1 = 11
      if (callCount === 3) return 0.2; // num2 = floor(0.2*20)+1 = 5
      return 0.5;
    };

    render(<MathCaptcha onValidChange={cb} />);
    
    Math.random = originalRandom;

    // The correct answer should be 11 + 5 = 16
    const input = screen.getByPlaceholderText("?");
    fireEvent.change(input, { target: { value: "16" } });
    
    expect(cb).toHaveBeenCalledWith(true);
  });

  it("invalidates wrong answer", () => {
    const cb = vi.fn();
    render(<MathCaptcha onValidChange={cb} />);
    
    const input = screen.getByPlaceholderText("?");
    fireEvent.change(input, { target: { value: "99999" } });
    
    // Very unlikely to be correct
    const lastCall = cb.mock.calls[cb.mock.calls.length - 1];
    // It's either true or false depending on the random challenge
    // but 99999 is astronomically unlikely to match
    expect(lastCall[0]).toBe(false);
  });

  it("has a refresh button", () => {
    render(<MathCaptcha onValidChange={vi.fn()} />);
    const refreshBtn = screen.getByTitle("Nouveau calcul");
    expect(refreshBtn).toBeInTheDocument();
  });
});
