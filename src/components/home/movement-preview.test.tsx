import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MovementPreview } from "@/components/home/movement-preview";
import type { PublicMovementEntry } from "@/lib/public-campaign/data";

function entries(count: number): PublicMovementEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    guardian_number: index + 1,
    display_name: `Guardian ${index + 1}`,
    published_at: "2026-08-06T12:00:00.000Z",
    card_path: `card/${index + 1}-v1.webp`, card_width: 640, card_height: 800,
    full_path: `full/${index + 1}-v1.webp`, full_width: 1200, full_height: 1500,
    alt_text: `Approved tree ${index + 1}`, focal_x: .5, focal_y: .5,
    card_url: `https://project.supabase.co/storage/v1/object/public/published-images/card/${index + 1}-v1.webp`,
    full_url: `https://project.supabase.co/storage/v1/object/public/published-images/full/${index + 1}-v1.webp`,
  }));
}

describe("MovementPreview", () => {
  it("keeps curated imagery clearly labelled below the approved-entry threshold", () => {
    render(<MovementPreview entries={entries(5)} />);
    expect(screen.getByText(/curated campaign images, not participant submissions/i)).toBeInTheDocument();
    expect(screen.queryByText("Guardian 1")).not.toBeInTheDocument();
  });

  it("shows only approved entries once six are available", () => {
    render(<MovementPreview entries={entries(6)} />);
    expect(screen.getByText("Guardian 1")).toBeInTheDocument();
    expect(screen.getByText(/approved participant submissions/i)).toBeInTheDocument();
    expect(screen.queryByText(/curated campaign images/i)).not.toBeInTheDocument();
  });
});
