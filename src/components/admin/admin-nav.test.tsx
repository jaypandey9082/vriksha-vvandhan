import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminNav } from "@/components/admin/admin-nav";

const reviewer = { userId: "1", email: null, displayName: "Reviewer", role: "reviewer" as const };

describe("Campaign Desk navigation", () => {
  it("does not expose Admin-only destinations to Reviewers", () => {
    render(<AdminNav session={reviewer} />);
    expect(screen.queryByRole("link", { name: "Trash" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Team" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Deliveries" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Submissions" })).toBeInTheDocument();
  });

  it("shows Admin controls only to Admins", () => {
    render(<AdminNav session={{ ...reviewer, role: "admin" }} />);
    expect(screen.getByRole("link", { name: "Trash" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Team" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Deliveries" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rejection Review" })).toBeInTheDocument();
  });
});
