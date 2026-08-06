import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PromiseTracker } from "@/components/shared/promise-tracker";

describe("PromiseTracker", () => {
  const metric = { current: 9, target: 983, label: "Vriksha promises" };

  it("displays the current and target values", () => {
    render(<PromiseTracker metric={metric} />);

    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("of 983")).toBeInTheDocument();
  });

  it("exposes useful accessible text", () => {
    render(<PromiseTracker metric={metric} />);

    expect(
      screen.getByRole("img", {
        name: "9 of 983 Vriksha promises, 1% of the first circle complete",
      }),
    ).toBeInTheDocument();
  });

  it("calculates and displays the rounded completion percentage", () => {
    render(<PromiseTracker metric={metric} />);

    expect(screen.getAllByText("1%")).toHaveLength(1);
    expect(screen.getByText("1% of the first circle complete")).toBeInTheDocument();
  });

  it("shows an honest unavailable state without inventing a count", () => {
    render(<PromiseTracker metric={{ current: null, target: 983, label: "Vriksha promises" }} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Tracker updating")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Campaign tracker updating, target 983 Vriksha promises" })).toBeInTheDocument();
  });
});
