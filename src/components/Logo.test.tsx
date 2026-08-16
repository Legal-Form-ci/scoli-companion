import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Logo from "./Logo";

// Mock the image import
vi.mock("@/assets/logo-scoly.png", () => ({ default: "/test-logo.png" }));

describe("Logo component", () => {
  it("renders the logo image with alt text", () => {
    render(<Logo />);
    const img = screen.getByAltText("Scoly");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/test-logo.png");
  });

  it("applies size classes correctly", () => {
    const { rerender } = render(<Logo size="sm" />);
    expect(screen.getByAltText("Scoly")).toHaveClass("h-8");

    rerender(<Logo size="lg" />);
    expect(screen.getByAltText("Scoly")).toHaveClass("h-14");
  });

  it("shows slogan when showSlogan is true", () => {
    render(<Logo showSlogan />);
    expect(screen.getByText(/Scolaire & Bureautique/)).toBeInTheDocument();
  });

  it("hides slogan by default", () => {
    render(<Logo />);
    expect(screen.queryByText(/Scolaire & Bureautique/)).not.toBeInTheDocument();
  });

  it("applies white variant filter", () => {
    render(<Logo variant="white" />);
    const img = screen.getByAltText("Scoly");
    expect(img).toHaveClass("brightness-0");
    expect(img).toHaveClass("invert");
  });
});
