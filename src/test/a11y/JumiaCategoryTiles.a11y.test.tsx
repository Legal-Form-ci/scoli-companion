import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "./setup-axe";
import JumiaCategoryTiles from "@/components/JumiaCategoryTiles";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        limit: () =>
          Promise.resolve({
            data: [
              { id: "1", slug: "primaire", name_fr: "Primaire" },
              { id: "2", slug: "secondaire", name_fr: "Secondaire" },
              { id: "3", slug: "universitaire", name_fr: "Universitaire" },
            ],
            error: null,
          }),
      }),
    }),
  },
}));

const renderTiles = () =>
  render(
    <MemoryRouter>
      <JumiaCategoryTiles />
    </MemoryRouter>,
  );

describe("JumiaCategoryTiles — accessibility", () => {
  beforeEach(() => vi.clearAllMocks());

  it("has no axe violations", async () => {
    const { container } = renderTiles();
    await screen.findByRole("navigation", { name: /catégories/i });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("exposes a nav landmark with descriptive label", async () => {
    renderTiles();
    const nav = await screen.findByRole("navigation", { name: /catégories du catalogue/i });
    expect(nav).toBeInTheDocument();
  });

  it("each tile has a descriptive aria-label and is keyboard-reachable", async () => {
    renderTiles();
    const link = await screen.findByRole("link", { name: /voir la catégorie primaire/i });
    expect(link).toHaveAttribute("href");
    expect(link.tabIndex).not.toBe(-1);
  });

  it("uses semantic list structure", async () => {
    renderTiles();
    const nav = await screen.findByRole("navigation", { name: /catégories/i });
    const list = nav.querySelector("ul");
    expect(list).not.toBeNull();
    expect(list!.querySelectorAll("li").length).toBeGreaterThan(0);
  });
});
