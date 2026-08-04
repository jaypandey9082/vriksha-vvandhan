import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MobileNavigation } from "@/components/layout/mobile-navigation";

const items = [
  { label: "The Movement", href: "#movement" },
  { label: "How It Works", href: "#how-it-works" },
] as const;

describe("MobileNavigation", () => {
  it("opens, closes with Escape, and restores focus", async () => {
    render(<MobileNavigation items={items} />);
    const trigger = screen.getByRole("button", { name: "Open navigation menu" });

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Site navigation" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Site navigation" })).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(document.body.style.overflow).toBe("");
  });

  it("closes after selecting an in-page destination", () => {
    render(<MobileNavigation items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    fireEvent.click(screen.getByRole("link", { name: "How It Works" }));

    expect(screen.queryByRole("dialog", { name: "Site navigation" })).not.toBeInTheDocument();
  });
});
