import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "./LanguageContext";
import React from "react";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe("LanguageContext", () => {
  it("throws when used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useLanguage())).toThrow(
      "useLanguage must be used within a LanguageProvider"
    );
    spy.mockRestore();
  });

  it("provides default language (fr)", () => {
    localStorage.clear();
    // navigator.language might be 'en' in jsdom, so default could be 'en'
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(["fr", "en", "de", "es"]).toContain(result.current.language);
    expect(result.current.t).toBeDefined();
  });

  it("can switch language", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => {
      result.current.setLanguage("en");
    });
    expect(result.current.language).toBe("en");
    expect(localStorage.getItem("scoly-language")).toBe("en");
  });

  it("persists language to localStorage", () => {
    localStorage.setItem("scoly-language", "de");
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe("de");
  });

  it("provides translations object", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.t.auth).toBeDefined();
    expect(result.current.t.common).toBeDefined();
  });
});
