import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("campaign homepage", () => {
  it("renders the main campaign sections and headings", async () => {
    render(await Home());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Protect the protector.");
    expect(screen.getByRole("heading", { name: "Four steps. One bond that continues." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The First Rakhi Moment" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Every promise carries a story." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ped Ka Paigaam" })).toBeInTheDocument();
  });

  it("uses valid in-page destinations for every hash CTA", async () => {
    const { container } = render(await Home());
    const ids = new Set(Array.from(container.querySelectorAll("[id]")).map((element) => element.id));
    const inPageLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));

    expect(inPageLinks.length).toBeGreaterThan(0);
    for (const link of inPageLinks) {
      expect(ids.has(link.hash.slice(1))).toBe(true);
    }
  });

  it("does not render fabricated empty links", async () => {
    const { container } = render(await Home());
    expect(container.querySelector('a[href=""], a:not([href])')).toBeNull();
  });
});
