import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Sidebar from "./Sidebar";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push }),
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

beforeEach(() => push.mockClear());

describe("Sidebar — Find Jobs", () => {
  it("is a secondary button, not a green fill (white on green measured 3.2:1)", () => {
    render(<Sidebar />);

    const findJobs = screen.getByRole("button", { name: /find jobs/i });
    expect(findJobs).toHaveClass("bg-surface", "text-ink", "border-line");
    expect(findJobs.className).not.toMatch(/green-|emerald-/);
  });

  it("opens job search on the dashboard", () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByRole("button", { name: /find jobs/i }));

    expect(push).toHaveBeenCalledWith("/dashboard?jobSearch=1");
  });

  it("keeps Add New as the one primary action", () => {
    render(<Sidebar />);

    expect(screen.getByRole("button", { name: /add new/i }).className).toMatch(/bg-signal-solid/);
  });
});
