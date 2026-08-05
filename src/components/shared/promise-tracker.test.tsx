import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PromiseTracker } from "@/components/shared/promise-tracker";

describe("PromiseTracker", () => {
  const metric = { current: 417, target: 983, label: "Vriksha promises" };

  it("displays the current and target values", () => {
    render(<PromiseTracker metric={metric} />);

    expect(screen.getByText("417")).toBeInTheDocument();
    expect(screen.getByText("of 983")).toBeInTheDocument();
  });

  it("exposes useful accessible text", () => {
    render(<PromiseTracker metric={metric} />);

    expect(
      screen.getByRole("img", {
        name: "417 of 983 Vriksha promises, 42% of the first circle complete",
      }),
    ).toBeInTheDocument();
  });

  it("calculates and displays the rounded completion percentage", () => {
    render(<PromiseTracker metric={metric} />);

    expect(screen.getAllByText("42%")).toHaveLength(1);
    expect(screen.getByText("42% of the first circle complete")).toBeInTheDocument();
  });
});
