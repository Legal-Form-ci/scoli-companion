import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { axe } from "./setup-axe";
import KitsHeroCarousel from "@/components/KitsHeroCarousel";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: () =>
                Promise.resolve({
                  data: [
                    {
                      id: "k1",
                      name: "Kit CP1 officiel",
                      grade_level: "CP1",
                      category: "kit_complet_cl",
                      image_url: null,
                      discount_price: 15000,
                      total_price: 20000,
                      school_id: "s1",
                      schools: { name: "Groupe Scolaire Ikoffi" },
                    },
                    {
                      id: "k2",
                      name: "Kit CE1 officiel",
                      grade_level: "CE1",
                      category: "kit_cahiers",
                      image_url: null,
                      discount_price: null,
                      total_price: 12000,
                      school_id: "s2",
                      schools: { name: "École République" },
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        }),
      }),
    }),
  },
}));

vi.mock("@/components/SmartImage", () => ({
  default: (p: any) => <img {...p} />,
}));

const renderCarousel = () =>
  render(
    <MemoryRouter>
      <KitsHeroCarousel />
    </MemoryRouter>,
  );

describe("KitsHeroCarousel — accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = renderCarousel();
    await screen.findByRole("region", { name: /kits école/i });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("declares carousel role structure", async () => {
    renderCarousel();
    const region = await screen.findByRole("region", { name: /kits école/i });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    expect(region).toHaveAttribute("tabIndex", "0");
  });

  it("marks each slide with role=group and numbered label", async () => {
    renderCarousel();
    const slide = await screen.findByRole("group", { name: /1 sur 2/i });
    expect(slide).toHaveAttribute("aria-roledescription", "slide");
    expect(slide).toHaveAttribute("aria-current", "true");
  });

  it("exposes play/pause and prev/next controls with aria-labels", async () => {
    renderCarousel();
    expect(await screen.findByRole("button", { name: /pause|reprendre/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kit précédent/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kit suivant/i })).toBeInTheDocument();
  });

  it("exposes page indicators as a tablist", async () => {
    renderCarousel();
    const tablist = await screen.findByRole("tablist", { name: /sélectionner un kit/i });
    expect(tablist).toBeInTheDocument();
  });
});
