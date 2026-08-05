import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CampaignHero } from "@/components/home/campaign-hero";
import { heroPromiseImages } from "@/content/campaign";

describe("CampaignHero", () => {
  it("renders the large campaign masthead and core message", () => {
    render(<CampaignHero />);

    expect(screen.getByRole("img", { name: "Mirchi presents Vriksha Vvandhan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Protect the protector." })).toBeInTheDocument();
  });

  it("renders the tracker and both valid hero actions", () => {
    render(<CampaignHero />);

    expect(screen.getByText("417")).toBeInTheDocument();
    expect(screen.getByText("of 983")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Join the Movement" })).toHaveAttribute(
      "href",
      "#how-it-works",
    );
    expect(screen.getByRole("link", { name: "See the Promises" })).toHaveAttribute(
      "href",
      "#stories",
    );
  });

  it("renders the typed Promise Ribbon without the retired Promise Halo", () => {
    const { container } = render(<CampaignHero />);

    const ribbon = screen.getByRole("region", { name: "Promises already taking root" });
    expect(ribbon.querySelectorAll(".promise-reel__sequence:not([aria-hidden]) figure")).toHaveLength(
      heroPromiseImages.length,
    );
    expect(container.querySelector(".promise-halo")).toBeNull();
  });
});
