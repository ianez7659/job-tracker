import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "./NavBar";

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));
jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { name: "Test User", image: null } } }),
  signOut: jest.fn(),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/InstallButton", () => ({
  InstallButton: () => null,
}));

describe("NavBar mobile menu — Find Jobs", () => {
  it("is a secondary link, not a green fill", () => {
    render(<Navbar />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    const findJobs = screen.getByRole("link", { name: /find jobs/i });

    expect(findJobs).toHaveAttribute("href", "/dashboard?jobSearch=1");
    expect(findJobs).toHaveClass("bg-surface", "text-ink", "border-line");
    expect(findJobs.className).not.toMatch(/green-|emerald-/);
  });
});
