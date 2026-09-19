import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Landing from "../pages/Landing";

describe("Landing", () => {
  it("communicates the core product promise", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /healthcare, connected/i })).toBeInTheDocument();
    expect(screen.getByText(/Gemini AI/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toBeInTheDocument();
  });
});
