import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { axe } from "./setup-axe";
import Auth from "@/pages/Auth";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ signIn: vi.fn(), signUp: vi.fn(), user: null }),
}));
vi.mock("@/i18n/LanguageContext", () => {
  const makeProxy = (path: string): any =>
    new Proxy(() => path || "label", {
      get: (_t, prop) => (typeof prop === "string" ? makeProxy(path ? `${path}.${prop}` : prop) : undefined),
      apply: () => path || "label",
    });
  return { useLanguage: () => ({ t: makeProxy(""), language: "fr" }) };
});
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: () => Promise.resolve({ data: { user: null } }) }, from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [] }) }) }) },
}));
vi.mock("@/hooks/useRateLimit", () => ({
  useRateLimit: () => ({
    checkRateLimit: () => Promise.resolve({ allowed: true, remainingAttempts: 5, blockedUntil: null }),
    isBlocked: false,
    blockedUntil: null,
    remainingAttempts: 5,
    isChecking: false,
    formatBlockedTime: () => "",
  }),
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/me" element={<Auth />} />
        <Route path="/team" element={<Auth />} />
      </Routes>
    </MemoryRouter>,
  );

describe.each(["/auth", "/me", "/team"])("Auth portal %s — accessibility", (path) => {
  it("has no axe violations", async () => {
    const { container } = renderAt(path);
    // wait for form to render
    await screen.findAllByRole("button");
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("password + email inputs have accessible names", async () => {
    renderAt(path);
    const inputs = await screen.findAllByRole("textbox");
    inputs.forEach((i) => {
      const hasName =
        i.getAttribute("aria-label") ||
        i.getAttribute("aria-labelledby") ||
        (i.id && document.querySelector(`label[for="${i.id}"]`));
      expect(hasName).toBeTruthy();
    });
  });
});
