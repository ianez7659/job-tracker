import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import CardsSection from "./CardsSection";

// Framer Motion needs matchMedia; Reveal needs IntersectionObserver. jsdom has neither.
beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // @ts-expect-error - assigning a test double
  global.IntersectionObserver = MockIntersectionObserver;
});

function demoCard() {
  return screen.getByRole("button", { name: /^Job card, stage/ });
}

describe("CardsSection — in-app card replica", () => {
  it("mirrors the app card: company headline, level chip, rail, next checkpoint", () => {
    render(<CardsSection />);
    const card = demoCard();
    expect(within(card).getByRole("heading", { level: 3 })).toHaveTextContent("Northwind Studio");
    expect(within(card).getByText("Frontend Developer")).toBeInTheDocument();
    expect(within(card).getByText("Next checkpoint")).toBeInTheDocument();
    expect(card.querySelectorAll("[data-state]")).toHaveLength(5);
    expect(card).toHaveTextContent("Move to Interview 1");
  });

  it("no longer claims stages are advanced from the job detail page", () => {
    render(<CardsSection />);
    expect(screen.queryByText(/advance stages from the job detail page/i)).toBeNull();
    expect(screen.getByText("Advance to the next step in one tap")).toBeInTheDocument();
  });

  it("names the stage in human words, never a raw enum", () => {
    render(<CardsSection />);
    expect(demoCard()).toHaveAccessibleName(
      "Job card, stage Applied. Activate to show the next stage.",
    );
    expect(screen.getByRole("button", { name: "Show Interview 1 stage" })).toBeInTheDocument();
  });

  it("walks the rail one checkpoint per activation and records the outcome at Interview 3", async () => {
    render(<CardsSection />);
    await userEvent.click(demoCard());
    expect(demoCard()).toHaveAccessibleName(/stage Interview 1\./);
    expect(demoCard().querySelector("[data-state=current]")).not.toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Show Interview 3 stage" }));
    // The action swaps with an exit animation (AnimatePresence mode="wait").
    await waitFor(() => expect(demoCard()).toHaveTextContent("Record outcome"));
  });

  it("keeps the replica non-interactive inside its single button", () => {
    render(<CardsSection />);
    const card = demoCard();
    expect(card.querySelector("a, button, [role=button]")).toBeNull();
  });
});
