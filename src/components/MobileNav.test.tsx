import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import MobileNav from "./MobileNav";

let mockPathname = "/dashboard";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("MobileNav", () => {
  it("marks only the current page with aria-current", () => {
    mockPathname = "/dashboard/stats";
    render(<MobileNav />);

    expect(screen.getByRole("link", { name: "Stats" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("uses theme tokens so it follows dark mode, with Signal for the active item", () => {
    mockPathname = "/dashboard";
    render(<MobileNav />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).toHaveClass("bg-surface", "border-line");
    expect(nav.className).not.toMatch(/bg-white/);
    expect(screen.getByRole("link", { name: "Home" })).toHaveClass("text-signal");
    expect(screen.getByRole("link", { name: "Closed" })).toHaveClass("text-ink-muted");
  });

  it("pads the bottom by the safe-area inset for the installed iOS app", () => {
    render(<MobileNav />);

    expect(screen.getByRole("navigation", { name: "Primary" }).className).toContain(
      "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
    );
  });

  it("marks nothing as current on a page outside the nav", () => {
    mockPathname = "/dashboard/trash";
    render(<MobileNav />);

    expect(screen.queryByRole("link", { current: "page" })).not.toBeInTheDocument();
  });
});
