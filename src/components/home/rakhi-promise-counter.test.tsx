import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RakhiPromiseCounter } from "@/components/home/rakhi-promise-counter";

describe("RakhiPromiseCounter", () => {
  const metric = { current: 9, target: 983, label: "Vriksha promises" };

  it("displays the real current value and target", () => {
    render(<RakhiPromiseCounter metric={metric} />);

    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("983")).toBeInTheDocument();
  });

  it("exposes a concise accessible progress label", () => {
    render(<RakhiPromiseCounter metric={metric} />);

    expect(screen.getByRole("img", { name: "9 of 983 Vriksha promises completed." })).toBeInTheDocument();
    expect(screen.getByText("1% complete.")).toHaveClass("visually-hidden");
  });

  it("shows an honest unavailable state without inventing a count", () => {
    render(<RakhiPromiseCounter metric={{ current: null, target: 983, label: "Vriksha promises" }} />);

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Live tracker updating.")).toHaveClass("visually-hidden");
    expect(screen.getByRole("img", {
      name: "Campaign promise count is currently unavailable. Target: 983 Vriksha promises.",
    })).toBeInTheDocument();
  });
});
